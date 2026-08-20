import "server-only";

import { GoogleGenAI } from "@google/genai";
import type { ResearchEvidence } from "@/lib/legal-research";
import { validateEvidenceCitations } from "@/lib/legal-research";
import { diagnoseGeminiError, GeminiRequestError, runGeminiRequest, type GeminiAttemptTrace } from "@/lib/gemini-request-manager";
import type { GeminiModelPolicy } from "@/lib/gemini-model-policy";

export type DeterministicQualityResult = {
  score: number;
  pass: boolean;
  hasOfficialGrounding: boolean;
  validCitations: string[];
  invalidCitations: string[];
  unapprovedUrls: string[];
  uncitedLegalClaims: string[];
  hasAnswerLimits: boolean;
};

export type SemanticQualityResult = {
  ran: boolean;
  pass?: boolean;
  confidence?: number;
  unsupportedClaims?: string[];
  missingIssues?: string[];
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

  let score = 100;
  if (!citation.hasGrounding && evidence.length) score -= 30;
  if (!hasOfficialGrounding) score -= 20;
  score -= Math.min(24, citation.invalid.length * 12);
  score -= Math.min(24, citation.unapprovedUrls.length * 12);
  score -= Math.min(20, uncitedLegalClaims.length * 4);
  if (!hasAnswerLimits) score -= 6;
  score = Math.max(0, score);

  return {
    score,
    pass: score >= 82 && citation.invalid.length === 0 && citation.unapprovedUrls.length === 0 && hasOfficialGrounding,
    hasOfficialGrounding,
    validCitations: citation.validFound,
    invalidCitations: citation.invalid,
    unapprovedUrls: citation.unapprovedUrls,
    uncitedLegalClaims,
    hasAnswerLimits,
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
  return evidence.slice(0, 8).map((item) => `[${item.citationId}] ${item.title}\n${(item.content || item.snippet || "").slice(0, 5000)}`).join("\n\n");
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
  const semanticThreshold = Number(process.env.LEGAL_QUALITY_SEMANTIC_TRIGGER_SCORE ?? 72);
  const severeDeterministicFailure = args.deterministic.score < semanticThreshold
    || args.deterministic.invalidCitations.length > 0
    || args.deterministic.unapprovedUrls.length > 0
    || !args.deterministic.hasOfficialGrounding;
  // Protect the free tier: semantic verification is a conditional rescue/QA call, not a call on every answer.
  const shouldRun = enabled && complexEnough && args.evidence.length > 0 && severeDeterministicFailure;
  if (!shouldRun) return { ran: false };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ran: false, error: "GEMINI_API_KEY_MISSING" };
  const model = process.env.GEMINI_QUALITY_MODEL?.trim() || "gemini-3.5-flash-lite";
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are a legal answer quality verifier, not the answering lawyer.\nCheck ONLY whether the draft is supported by the supplied evidence and whether it misses an issue explicitly required by the user question. Do not introduce external law or facts. Return JSON only:\n{"pass":true,"confidence":0.0,"unsupportedClaims":[],"missingIssues":[],"notes":[]}\n\nUSER QUESTION:\n${args.question.slice(0, 4000)}\n\nEVIDENCE:\n${qualityEvidenceContext(args.evidence)}\n\nDRAFT ANSWER:\n${args.answer.slice(0, 28_000)}`;

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
          maxOutputTokens: 900,
          thinkingConfig: { thinkingLevel: "minimal" } as never,
          abortSignal: args.signal,
        },
      }),
    });
    const parsed = parseJsonObject(managed.value.text ?? "");
    if (!parsed) return { ran: true, model, attempts: managed.attempts, error: "INVALID_QUALITY_JSON" };
    return {
      ran: true,
      model,
      attempts: managed.attempts,
      pass: parsed.pass === true,
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : undefined,
      unsupportedClaims: stringArray(parsed.unsupportedClaims),
      missingIssues: stringArray(parsed.missingIssues),
      notes: stringArray(parsed.notes),
    };
  } catch (error) {
    const diagnosed = error instanceof GeminiRequestError ? error.info : diagnoseGeminiError(error);
    return { ran: true, model, attempts: error instanceof GeminiRequestError ? error.attempts : [], error: `${diagnosed.status ?? "ERR"} ${diagnosed.code ?? ""} ${diagnosed.providerMessage}`.trim().slice(0, 1000) };
  }
}

export function qualityWarning(deterministic: DeterministicQualityResult, semantic: SemanticQualityResult) {
  const semanticFailed = semantic.ran && semantic.pass === false;
  if (deterministic.pass && !semanticFailed) return "";
  const points = [
    deterministic.invalidCitations.length ? `مراجع غير صالحة: ${deterministic.invalidCitations.join(", ")}` : "",
    deterministic.unapprovedUrls.length ? "روابط غير موجودة ضمن الأدلة المسموح بها" : "",
    !deterministic.hasOfficialGrounding ? "لم يُستخدم مصدر رسمي مباشر رغم توفره" : "",
    deterministic.uncitedLegalClaims.length ? `${deterministic.uncitedLegalClaims.length} عبارة قانونية تحتاج إسناداً أوضح` : "",
    semanticFailed && semantic.unsupportedClaims?.length ? `${semantic.unsupportedClaims.length} ادعاء رصدته المراجعة الدلالية كغير مدعوم` : "",
    semanticFailed && semantic.missingIssues?.length ? `${semantic.missingIssues.length} مسألة مطلوبة لم تُغطَّ بما يكفي` : "",
  ].filter(Boolean);
  if (!points.length) return "";
  return `\n\n> ⚠️ **بوابة الجودة القانونية:** هذه الإجابة تحتاج مراجعة قبل الاعتماد النهائي (${points.join("؛ ")}).`;
}
