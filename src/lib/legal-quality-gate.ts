import "server-only";

import { GoogleGenAI } from "@google/genai";
import type { ResearchEvidence } from "@/lib/legal-research";
import { validateEvidenceCitations } from "@/lib/legal-research";
import { diagnoseGeminiError, GeminiRequestError, runGeminiRequest, type GeminiAttemptTrace } from "@/lib/gemini-request-manager";
import type { GeminiModelPolicy } from "@/lib/gemini-model-policy";

export type QualityDisposition = "pass" | "warning" | "fail";

export type DeterministicQualityResult = {
  score: number;
  pass: boolean;
  hasOfficialGrounding: boolean;
  validCitations: string[];
  invalidCitations: string[];
  unapprovedUrls: string[];
  uncitedLegalClaims: string[];
  hasAnswerLimits: boolean;
  hardFailures: string[];
  softWarnings: string[];
};

export type SemanticQualityResult = {
  ran: boolean;
  pass?: boolean;
  confidence?: number;
  unsupportedClaims?: string[];
  contradictedClaims?: string[];
  missingIssues?: string[];
  overconfidenceClaims?: string[];
  notes?: string[];
  model?: string;
  attempts?: GeminiAttemptTrace[];
  error?: string;
};

function envBool(name: string, fallback: boolean) {
  const value = process.env[name];
  if (value == null) return fallback;
  return /^(1|true|yes|on)$/i.test(value.trim());
}

function legalClaimLines(answer: string) {
  return answer
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 35)
    .filter((line) => !/^#{1,6}\s/.test(line))
    .filter((line) => !/^>\s*\*\*(?:حدود\s*الإجابة|حدود\s*الاجابة)/i.test(line))
    .filter((line) => !/^(?:يتضمن|يحتوي)\s+المستند\s+المرفق/i.test(line))
    .filter((line) => /(?:المادة|ماده|ينص|نص\s+القانون|وفقاً|وفقا|قضت|حكمت|المحكمة|الدستور|دستوري|غير\s+دستوري|اختصاص|ميعاد|أجل|اجل|بطلان|عقوبة|يلتزم|يجب\s+قانوناً|law|article|court|constitution|statute|judgment)/i.test(line));
}

export function runDeterministicQualityGate(answer: string, evidence: ResearchEvidence[]): DeterministicQualityResult {
  const citation = validateEvidenceCitations(answer, evidence);
  const officialIds = new Set(evidence.filter((item) => item.sourceType === "official").map((item) => item.citationId));
  const hasOfficialGrounding = officialIds.size === 0 || citation.validFound.some((id) => officialIds.has(id));
  const uncitedLegalClaims = legalClaimLines(answer)
    .filter((line) => !/\[(?:O|W|C)\d+\]/.test(line))
    .slice(0, 8);
  const hasAnswerLimits = /حدود\s*الإجابة|حدود\s*الاجابة|answer\s+limits/i.test(answer);

  const hardFailures: string[] = [];
  const softWarnings: string[] = [];
  if (evidence.length && !citation.hasGrounding) hardFailures.push("no-grounding-citation");
  if (!hasOfficialGrounding) hardFailures.push("official-evidence-not-used");
  if (citation.invalid.length) hardFailures.push("invalid-citation-id");
  if (citation.unapprovedUrls.length) hardFailures.push("unapproved-url");
  if (uncitedLegalClaims.length) softWarnings.push("inline-citation-coverage");
  if (!hasAnswerLimits) softWarnings.push("missing-answer-limits");

  let score = 100;
  if (!citation.hasGrounding && evidence.length) score -= 30;
  if (!hasOfficialGrounding) score -= 20;
  score -= Math.min(24, citation.invalid.length * 12);
  score -= Math.min(24, citation.unapprovedUrls.length * 12);
  score -= Math.min(16, uncitedLegalClaims.length * 3);
  if (!hasAnswerLimits) score -= 6;
  score = Math.max(0, score);

  return {
    score,
    pass: hardFailures.length === 0 && score >= 82,
    hasOfficialGrounding,
    validCitations: citation.validFound,
    invalidCitations: citation.invalid,
    unapprovedUrls: citation.unapprovedUrls,
    uncitedLegalClaims,
    hasAnswerLimits,
    hardFailures,
    softWarnings,
  };
}

function parseJsonObject(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>; } catch { return null; }
}

function stringArray(value: unknown, max = 8) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, max) : [];
}

function qualityEvidenceContext(evidence: ResearchEvidence[]) {
  return evidence.slice(0, 8).map((item) => `[${item.citationId}] ${item.title}\nURL: ${item.url}\n${(item.content || item.snippet || "").slice(0, 6500)}`).join("\n\n");
}

export async function maybeRunSemanticQualityGate(args: {
  question: string;
  answer: string;
  evidence: ResearchEvidence[];
  deterministic: DeterministicQualityResult;
  policy: GeminiModelPolicy;
  signal: AbortSignal;
}) : Promise<SemanticQualityResult> {
  const enabled = envBool("LEGAL_QUALITY_SEMANTIC_VERIFY", true);
  const complexEnough = args.policy.workload === "complex" || args.policy.workload === "deep";
  const semanticThreshold = Number(process.env.LEGAL_QUALITY_SEMANTIC_TRIGGER_SCORE ?? 78);
  const severeDeterministicFailure = args.deterministic.score < semanticThreshold
    || args.deterministic.hardFailures.length > 0
    || args.deterministic.uncitedLegalClaims.length > 0;
  const shouldRun = enabled && complexEnough && args.evidence.length > 0 && severeDeterministicFailure;
  if (!shouldRun) return { ran: false };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ran: false, error: "GEMINI_API_KEY_MISSING" };
  const model = process.env.GEMINI_QUALITY_MODEL?.trim() || "gemini-3.5-flash-lite";
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are a strict legal claim-to-evidence verifier, not the answering lawyer.\n\nEvaluate EACH MATERIAL LEGAL CLAIM in the draft against the supplied evidence. A citation label next to a sentence does NOT prove the sentence is supported. Check the actual source text. Pay special attention to:\n- operative disposition / judgment outcome, parties and standing, dates and deadlines;\n- constitutional/statutory effects, retroactivity/prospectivity, jurisdiction and procedural consequences;\n- whether a draft statement is broader than the source;\n- whether the draft claims 100% certainty or \"قطعية\" where only legal analysis/inference is being offered.\n\nDo not introduce external law or facts. Distinguish unsupported claims from claims CONTRADICTED by evidence. Also check whether the question/attachment explicitly requires strengths/weaknesses, missing information, counterarguments, or other issues that the draft omitted.\n\nReturn JSON only:\n{"pass":true,"confidence":0.0,"unsupportedClaims":[],"contradictedClaims":[],"missingIssues":[],"overconfidenceClaims":[],"notes":[]}\n\nUSER QUESTION:\n${args.question.slice(0, 4000)}\n\nEVIDENCE:\n${qualityEvidenceContext(args.evidence)}\n\nDRAFT ANSWER:\n${args.answer.slice(0, 30_000)}`;

  try {
    const managed = await runGeminiRequest({
      model,
      operation: "legal_quality_gate",
      signal: args.signal,
      maxAttempts: 2,
      call: () => ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 1200,
          thinkingConfig: { thinkingLevel: "minimal" } as never,
          abortSignal: args.signal,
        },
      }),
    });
    const parsed = parseJsonObject(managed.value.text ?? "");
    if (!parsed) return { ran: true, model, attempts: managed.attempts, error: "INVALID_QUALITY_JSON" };
    const unsupportedClaims = stringArray(parsed.unsupportedClaims);
    const contradictedClaims = stringArray(parsed.contradictedClaims);
    const missingIssues = stringArray(parsed.missingIssues);
    const overconfidenceClaims = stringArray(parsed.overconfidenceClaims);
    const computedPass = parsed.pass === true && unsupportedClaims.length === 0 && contradictedClaims.length === 0 && missingIssues.length === 0;
    return {
      ran: true,
      model,
      attempts: managed.attempts,
      pass: computedPass,
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : undefined,
      unsupportedClaims,
      contradictedClaims,
      missingIssues,
      overconfidenceClaims,
      notes: stringArray(parsed.notes),
    };
  } catch (error) {
    const diagnosed = error instanceof GeminiRequestError ? error.info : diagnoseGeminiError(error);
    return { ran: true, model, attempts: error instanceof GeminiRequestError ? error.attempts : [], error: `${diagnosed.status ?? "ERR"} ${diagnosed.code ?? ""} ${diagnosed.providerMessage}`.trim().slice(0, 1000) };
  }
}

export function evaluateQualityDisposition(deterministic: DeterministicQualityResult, semantic: SemanticQualityResult): QualityDisposition {
  const semanticContradiction = Boolean(semantic.contradictedClaims?.length);
  const semanticUnsupported = Boolean(semantic.unsupportedClaims?.length);
  const semanticMissing = Boolean(semantic.missingIssues?.length);
  const semanticFailed = semantic.ran && semantic.pass === false && (semanticContradiction || semanticUnsupported || semanticMissing);
  if (deterministic.hardFailures.length || semanticFailed) return "fail";
  if (deterministic.softWarnings.length || semantic.overconfidenceClaims?.length || (semantic.ran && semantic.error)) return "warning";
  return "pass";
}

export function qualityWarning(deterministic: DeterministicQualityResult, semantic: SemanticQualityResult) {
  const disposition = evaluateQualityDisposition(deterministic, semantic);
  if (disposition === "pass") return "";

  const hardPoints = [
    deterministic.invalidCitations.length ? `مراجع غير صالحة: ${deterministic.invalidCitations.join(", ")}` : "",
    deterministic.unapprovedUrls.length ? "روابط غير موجودة ضمن الأدلة المسموح بها" : "",
    !deterministic.hasOfficialGrounding ? "لم يُستخدم مصدر رسمي مباشر رغم توفره" : "",
    semantic.contradictedClaims?.length ? `${semantic.contradictedClaims.length} ادعاء يناقض الدليل` : "",
    semantic.unsupportedClaims?.length ? `${semantic.unsupportedClaims.length} ادعاء غير مدعوم بالدليل` : "",
    semantic.missingIssues?.length ? `${semantic.missingIssues.length} مسألة مطلوبة لم تُغطَّ بما يكفي` : "",
  ].filter(Boolean);

  if (disposition === "fail") {
    return `\n\n> ⚠️ **بوابة الجودة القانونية:** هذه الإجابة تحتاج مراجعة قبل الاعتماد النهائي (${hardPoints.join("؛ ") || "فشل تحقق الإسناد"}).`;
  }

  const softPoints = [
    deterministic.uncitedLegalClaims.length ? `${deterministic.uncitedLegalClaims.length} عبارة قانونية تحتاج موضع إسناد أوضح` : "",
    !deterministic.hasAnswerLimits ? "قسم حدود الإجابة غير موجود" : "",
    semantic.overconfidenceClaims?.length ? `${semantic.overconfidenceClaims.length} صياغة ثقة مبالغ فيها` : "",
    semantic.ran && semantic.error ? "تعذر إكمال التحقق الدلالي الإضافي" : "",
  ].filter(Boolean);
  return softPoints.length
    ? `\n\n> ℹ️ **ملاحظة جودة:** المحتوى لم يفشل التحقق القانوني، لكن توجد ملاحظات تحسين في الإسناد/الصياغة (${softPoints.join("؛ ")}).`
    : "";
}
