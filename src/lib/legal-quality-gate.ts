import "server-only";

import { GoogleGenAI } from "@google/genai";
import type { ResearchEvidence } from "@/lib/legal-research";
import { criticalEvidenceAnchors, hasInlineEvidenceCitation, validateEvidenceCitations } from "@/lib/legal-research";
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
  criticalAnchors: string[];
  evidenceContradictions: string[];
  precisionWarnings: string[];
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

function normalizeArabicLegalText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

function conclusionLikeLines(answer: string) {
  return answer.split(/\n+/).map((line) => line.trim()).filter(Boolean).filter((line) =>
    /(?:النتيج|الخلاص|منطوق|تقضي|قضت|القضاء|نقض|رفض الطعن|قبول الطعن|عدم سماع|عدم قبول|الدفع)/i.test(line),
  );
}

function evidenceConsistencyChecks(answer: string, evidence: ResearchEvidence[]) {
  const officialText = evidence.filter((item) => item.sourceType === "official").map((item) => item.content || item.snippet || "").join("\n");
  const evidenceN = normalizeArabicLegalText(officialText);
  const answerN = normalizeArabicLegalText(answer);
  const conclusionLines = conclusionLikeLines(answer).map((line) => ({ raw: line, n: normalizeArabicLegalText(line) }));
  const contradictions: string[] = [];
  const precisionWarnings: string[] = [];

  const evidenceSaysNoHearing = /عدم سماع الدعوي/.test(evidenceN);
  const evidenceSaysInadmissible = /عدم قبول الدعوي/.test(evidenceN);
  if (evidenceSaysNoHearing) {
    for (const line of conclusionLines) {
      if (/عدم قبول الدعوي/.test(line.n) && !/عدم سماع الدعوي/.test(line.n)) {
        contradictions.push(`operative-disposition: المصدر الرسمي يستخدم \"عدم سماع الدعوى\" بينما صياغة النتيجة استخدمت \"عدم قبول الدعوى\": ${line.raw.slice(0, 260)}`);
      }
    }
  }
  if (evidenceSaysInadmissible && !evidenceSaysNoHearing) {
    for (const line of conclusionLines) {
      if (/عدم سماع الدعوي/.test(line.n) && !/عدم قبول الدعوي/.test(line.n)) {
        contradictions.push(`operative-disposition: المصدر الرسمي يستخدم \"عدم قبول الدعوى\" بينما صياغة النتيجة استخدمت \"عدم سماع الدعوى\": ${line.raw.slice(0, 260)}`);
      }
    }
  }

  if (/رفض الطعن/.test(evidenceN)) {
    for (const line of conclusionLines) if (/قبول الطعن/.test(line.n) && !/رفض الطعن/.test(line.n)) contradictions.push(`operative-disposition: المصدر يثبت رفض الطعن لكن النتيجة تقول قبوله: ${line.raw.slice(0, 260)}`);
  }
  if (/قبول الطعن/.test(evidenceN) && /رفض الطعن/.test(answerN) && !/رفض الطعن/.test(evidenceN)) {
    const line = conclusionLines.find((item) => /رفض الطعن/.test(item.n));
    if (line) contradictions.push(`operative-disposition: المصدر يثبت قبول الطعن لكن النتيجة تقول رفضه: ${line.raw.slice(0, 260)}`);
  }

  // CASE-agnostic temporal-applicability guard for the common Bahrain citation form "22 لسنة 2019".
  // It activates only when the same official evidence contains BOTH the reference and an explicit
  // non-applicability statement, so it does not manufacture a commencement rule from thin air.
  if (/22 لسنه 2019/.test(evidenceN) && /لا ينطبق/.test(evidenceN)) {
    const suspect = answer.split(/\n+/).find((line) => {
      const n = normalizeArabicLegalText(line);
      return /22 لسنه 2019/.test(n) && /(?:تخضع|ينطبق|يسري|بموجب احكام)/.test(n) && !/لا ينطبق/.test(n);
    });
    if (suspect) contradictions.push(`temporal-applicability: المصدر الرسمي ينص على عدم انطباق قانون 22 لسنة 2019 على النزاع، بينما الجواب صاغه كقانون حاكم للواقعة: ${suspect.trim().slice(0, 280)}`);
  }

  if (/وساط|وسيط|تحكيم/.test(evidenceN)) {
    if (/سلطه قضائيه كامله/.test(answerN)) precisionWarnings.push("arbitration-precision: تجنب وصف المحكم بأنه يملك سلطة قضائية كاملة؛ اربط ولايته باتفاق التحكيم ونطاقه.");
    if (/لا تصلح اطلاقا/.test(answerN)) precisionWarnings.push("mediation-precision: عبارة \"لا تصلح إطلاقاً\" أوسع من اللازم؛ اربط عدم قابلية التنفيذ بوقائع القضية وغياب تسوية الصلح اللاحقة.");
  }

  return {
    contradictions: [...new Set(contradictions)].slice(0, 8),
    precisionWarnings: [...new Set(precisionWarnings)].slice(0, 8),
  };
}

export function runDeterministicQualityGate(answer: string, evidence: ResearchEvidence[]): DeterministicQualityResult {
  const citation = validateEvidenceCitations(answer, evidence);
  const officialIds = new Set(evidence.filter((item) => item.sourceType === "official").map((item) => item.citationId));
  const hasOfficialGrounding = officialIds.size === 0 || citation.validFound.some((id) => officialIds.has(id));
  const uncitedLegalClaims = legalClaimLines(answer)
    .filter((line) => !hasInlineEvidenceCitation(line))
    .slice(0, 8);
  const hasAnswerLimits = /حدود\s*الإجابة|حدود\s*الاجابة|answer\s+limits/i.test(answer);
  const criticalAnchors = criticalEvidenceAnchors(evidence, 12);
  const consistency = evidenceConsistencyChecks(answer, evidence);

  const hardFailures: string[] = [];
  const softWarnings: string[] = [];
  if (evidence.length && !citation.hasGrounding) hardFailures.push("no-grounding-citation");
  if (!hasOfficialGrounding) hardFailures.push("official-evidence-not-used");
  if (citation.invalid.length) hardFailures.push("invalid-citation-id");
  if (citation.unapprovedUrls.length) hardFailures.push("unapproved-url");
  if (consistency.contradictions.length) hardFailures.push("official-evidence-contradiction");
  if (uncitedLegalClaims.length) softWarnings.push("inline-citation-coverage");
  if (consistency.precisionWarnings.length) softWarnings.push("legal-precision");
  if (!hasAnswerLimits) softWarnings.push("missing-answer-limits");

  let score = 100;
  if (!citation.hasGrounding && evidence.length) score -= 30;
  if (!hasOfficialGrounding) score -= 20;
  score -= Math.min(24, citation.invalid.length * 12);
  score -= Math.min(24, citation.unapprovedUrls.length * 12);
  score -= Math.min(16, uncitedLegalClaims.length * 3);
  score -= Math.min(36, consistency.contradictions.length * 18);
  score -= Math.min(10, consistency.precisionWarnings.length * 5);
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
    criticalAnchors,
    evidenceContradictions: consistency.contradictions,
    precisionWarnings: consistency.precisionWarnings,
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
  // Deep constitutional/administrative research always receives one cheap Flash-Lite evidence
  // verification pass. Complex requests remain conditional. This catches the dangerous case where
  // every sentence has a syntactically valid [O#] citation but the official source is about the
  // wrong statute/topic.
  const hasCriticalAnchors = args.deterministic.criticalAnchors.length > 0;
  const shouldRun = enabled && complexEnough && args.evidence.length > 0
    && (args.policy.workload === "deep" || severeDeterministicFailure || hasCriticalAnchors);
  if (!shouldRun) return { ran: false };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ran: false, error: "GEMINI_API_KEY_MISSING" };
  const model = process.env.GEMINI_QUALITY_MODEL?.trim() || "gemini-3.5-flash-lite";
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are a strict legal claim-to-evidence verifier, not the answering lawyer.\n\nFIRST perform an exact contradiction pass against the CRITICAL OFFICIAL ANCHORS below. Preserve Arabic negation and procedural disposition terminology literally enough to catch reversals. If an anchor says "لا ينطبق" and the draft says the dispute is governed by/applies that statute, that is a CONTRADICTION. If an anchor/judgment uses "عدم سماع الدعوى" and the draft's operative result says "عدم قبول الدعوى", that is a CONTRADICTION, not a stylistic synonym. Likewise distinguish رفض/قبول الطعن and نقض/إلغاء where the operative result is fixed.\n\nCRITICAL OFFICIAL ANCHORS:\n${args.deterministic.criticalAnchors.join("\n") || "(none extracted)"}\n\nEvaluate EACH MATERIAL LEGAL CLAIM in the draft against the supplied evidence. A citation label next to a sentence does NOT prove the sentence is supported. Check the actual source text. Pay special attention to:\n- operative disposition / judgment outcome, parties and standing, dates and deadlines;\n- constitutional/statutory effects, retroactivity/prospectivity, jurisdiction and procedural consequences;\n- temporal validity of legislation: if the draft says a statute was "in force" at a historical date, the evidence must establish its commencement. If a judgment merely says a later statute corresponds to/replaces an older provision, do NOT treat the later statute as operative at the earlier date;\n- arbitration-enforcement remedy precision: distinguish an order granting enforcement from a judgment refusing enforcement. If the judgment says the grant order is non-grievable/non-appealable, flag any invented ordinary grievance route;\n- mediation/arbitration precision: when the judgment concerns a multi-tier clause, verify (a) mediator vs arbitrator authority, (b) whether "final and binding" was held insufficient to waive arbitration, (c) whether a later settlement was required for executory force, (d) exact law-in-force/applicability language, and (e) the exact operative term such as "عدم سماع الدعوى". Flag categorical phrases like "لا تصلح إطلاقاً" or "سلطة قضائية كاملة" when the source is narrower;\n- Bahrain labour settlements/releases: if the draft discusses a settlement, release, waiver, مخالصة, صلح or إبراء, verify the exact rule actually supported by the Labour Law evidence. In particular, when Article 5 is present in evidence, check the full temporal rule (during the employment contract OR within three months after its termination) and whether the settlement diminishes statutory worker rights contrary to law. Do not treat absence of coercion alone as sufficient to validate a waiver;\n- lawyers + AML/CFT: verify the exact judgment/case number, Decision 64/2017, Decree-Law 4/2001, professional-confidentiality/right-of-defence analysis, equality and forced-labour holdings against the supplied evidence. Flag "absolute confidentiality" or an "AML applies only to financial/commercial services" formulation if the source is narrower/different. If the draft presents a historical ministerial decision as current law after evidence shows repeal/replacement, flag it;\n- source-topic alignment: an official Bahrain source is not enough by itself. If the cited [O#] is about a different statute/topic than the claim (for example Court of Cassation establishment law used to prove AML obligations), mark the claim unsupported and explicitly note the source mismatch;\n- distinguish an actual verified judgment outcome from a merely projected/"مرجحة" result when the official judgment is available;\n- whether a draft statement is broader than the source;\n- whether the draft claims 100% certainty or \"قطعية\" where only legal analysis/inference is being offered.\n\nDo not introduce external law or facts. Distinguish unsupported claims from claims CONTRADICTED by evidence. Also check whether the question/attachment explicitly requires strengths/weaknesses, missing information, counterarguments, or other issues that the draft omitted.\n\nReturn JSON only:\n{"pass":true,"confidence":0.0,"unsupportedClaims":[],"contradictedClaims":[],"missingIssues":[],"overconfidenceClaims":[],"notes":[]}\n\nUSER QUESTION:\n${args.question.slice(0, 4000)}\n\nEVIDENCE:\n${qualityEvidenceContext(args.evidence)}\n\nDRAFT ANSWER:\n${args.answer.slice(0, 30_000)}`;

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
          maxOutputTokens: 1600,
          thinkingConfig: { thinkingLevel: "low" } as never,
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
    deterministic.evidenceContradictions.length ? `${deterministic.evidenceContradictions.length} تعارض مباشر مع صياغة المصدر الرسمي` : "",
  ].filter(Boolean);

  if (disposition === "fail") {
    return `\n\n> ⚠️ **بوابة الجودة القانونية:** هذه الإجابة تحتاج مراجعة قبل الاعتماد النهائي (${hardPoints.join("؛ ") || "فشل تحقق الإسناد"}).`;
  }

  const softPoints = [
    deterministic.uncitedLegalClaims.length ? `${deterministic.uncitedLegalClaims.length} عبارة قانونية تحتاج موضع إسناد أوضح` : "",
    !deterministic.hasAnswerLimits ? "قسم حدود الإجابة غير موجود" : "",
    semantic.overconfidenceClaims?.length ? `${semantic.overconfidenceClaims.length} صياغة ثقة مبالغ فيها` : "",
    semantic.ran && semantic.error ? "تعذر إكمال التحقق الدلالي الإضافي" : "",
    deterministic.precisionWarnings.length ? `${deterministic.precisionWarnings.length} ملاحظة دقة في المصطلح القانوني` : "",
  ].filter(Boolean);
  return softPoints.length
    ? `\n\n> ℹ️ **ملاحظة جودة:** المحتوى لم يفشل التحقق القانوني، لكن توجد ملاحظات تحسين في الإسناد/الصياغة (${softPoints.join("؛ ")}).`
    : "";
}
