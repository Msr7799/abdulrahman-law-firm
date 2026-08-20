import "server-only";

export type GeminiWorkload = "micro" | "standard" | "complex" | "deep";
export type GeminiThinkingLevel = "minimal" | "low" | "medium" | "high";

export type GeminiModelPolicy = {
  workload: GeminiWorkload;
  models: string[];
  preflightModels: string[];
  allowPreflight: boolean;
  thinkingLevel: GeminiThinkingLevel;
  maxOutputTokens: number;
  maxContinuations: number;
  maxGeminiCalls: number;
  reasons: string[];
};

function envList(name: string, fallback: string) {
  return (process.env[name] ?? fallback)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function freeRoleModels(workload: GeminiWorkload) {
  // Defaults are intentionally limited to models that currently expose free input/output
  // in the Gemini Developer API. Role-specific env vars can override them without changing code.
  if (workload === "micro") {
    return envList("GEMINI_MODELS_LITE", "gemini-3.5-flash-lite,gemini-3.1-flash-lite");
  }
  if (workload === "standard") {
    return envList("GEMINI_MODELS_STANDARD", "gemini-3.5-flash,gemini-3.5-flash-lite");
  }
  if (workload === "complex") {
    return envList("GEMINI_MODELS_COMPLEX", "gemini-3.5-flash,gemini-3.6-flash");
  }
  return envList("GEMINI_MODELS_DEEP", "gemini-3.6-flash,gemini-3.5-flash");
}

function preflightModels() {
  return envList("GEMINI_PREFLIGHT_MODELS", "gemini-3.5-flash-lite,gemini-3.1-flash-lite")
    .filter((model) => /flash-lite/i.test(model));
}

export function selectGeminiModelPolicy(input: {
  message: string;
  files: Array<{ name: string; type?: string; size: number }>;
  webSearch: boolean;
  activeSkillIds?: string[];
  officialEvidenceCount?: number;
}) : GeminiModelPolicy {
  const text = input.message.trim();
  const lower = text.toLowerCase();
  const fileCount = input.files.length;
  const totalBytes = input.files.reduce((sum, file) => sum + file.size, 0);
  const pdfCount = input.files.filter((file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name)).length;
  const skillIds = input.activeSkillIds ?? [];
  const reasons: string[] = [];

  const simpleIntent = /^(?:لخص|اختصر|ترجم|صحح|أعد صياغة|اعد صياغة|رتب|نسق|ما معنى|شنو يعني|summarize|translate|rewrite|proofread)\b/i.test(text)
    || /(?:لخص لي|اختصر لي|تلخيص سريع|quick summary|short summary)/i.test(lower);
  const explicitDeep = /بحث\s*(?:عميق|تفصيلي)|تحليل\s*(?:عميق|شامل)|حل\s*القضية|استخرج\s*الثغرات|اكشف\s*الثغرات|بناء\s*مذكرة|مذكرة\s*(?:دفاع|قانونية)|استراتيجية\s*(?:دفاع|قانونية)|deep\s*(?:research|analysis)|loopholes?/i.test(lower);
  const constitutional = /دستور|دستوري|المحكمة\s*الدستورية|constitutional/i.test(lower) || skillIds.includes("constitutional-review-analysis");
  const judgmentResearch = /تمييز|استئناف|سابقة|سوابق|حكم\s*المحكمة|رقم\s*(?:الطعن|القضية)|cassation|precedent|judgment/i.test(lower) || skillIds.includes("bahrain-judgment-research");
  const legalIntent = /قانون|تشريع|مادة|لائحة|محكمة|قضية|حكم|نيابة|دستور|طعن|استئناف|تمييز|حقوق|عقد|تعويض|جنائي|مدني|تنفيذ|legal|law|court|case|judgment|constitution|appeal/i.test(lower);
  const comparison = /قارن|مقارنة|تعارض|يتعارض|أكثر من|عدة قوانين|compare|conflict/i.test(lower);

  let score = 0;
  if (legalIntent) { score += 1; reasons.push("طلب قانوني"); }
  if (input.webSearch) { score += 2; reasons.push("بحث ويب مطلوب"); }
  if (fileCount > 0) { score += 1; reasons.push(`${fileCount} مرفق`); }
  if (pdfCount > 0) { score += 1; reasons.push(`${pdfCount} PDF`); }
  if (fileCount >= 2) { score += 2; reasons.push("عدة مرفقات"); }
  if (totalBytes > 8 * 1024 * 1024) { score += 1; reasons.push("مرفقات كبيرة"); }
  if (comparison) { score += 1; reasons.push("مقارنة/تعارض"); }
  if (judgmentResearch) { score += 2; reasons.push("بحث أحكام/سوابق"); }
  if (constitutional) { score += 3; reasons.push("مسألة دستورية"); }
  if (explicitDeep) { score += 4; reasons.push("طلب تحليل عميق صريح"); }
  if (skillIds.length >= 4) { score += 1; reasons.push(`${skillIds.length} مهارات قانونية فعالة`); }
  if ((input.officialEvidenceCount ?? 0) >= 2) reasons.push("مصادر رسمية متاحة");

  const shortNonLegal = !legalIntent && !input.webSearch && fileCount === 0 && text.length <= 700;

  let workload: GeminiWorkload;
  if ((simpleIntent || shortNonLegal) && !input.webSearch && !explicitDeep && !constitutional && !judgmentResearch && fileCount <= 1) {
    workload = "micro";
    reasons.unshift("مهمة خفيفة/تلخيصية");
  } else if (score >= 7) {
    workload = "deep";
  } else if (score >= 4) {
    workload = "complex";
  } else {
    workload = "standard";
  }

  // Preflight is useful only when attachments need legal anchors. Do not spend a second
  // Gemini call on a simple summary or plain Q&A.
  const allowPreflight = workload !== "micro" && fileCount > 0 && (legalIntent || constitutional || judgmentResearch || explicitDeep);

  const settings: Record<GeminiWorkload, Pick<GeminiModelPolicy, "thinkingLevel" | "maxOutputTokens" | "maxContinuations" | "maxGeminiCalls">> = {
    micro: { thinkingLevel: "minimal", maxOutputTokens: 3072, maxContinuations: 0, maxGeminiCalls: 1 },
    standard: { thinkingLevel: "low", maxOutputTokens: 6144, maxContinuations: 0, maxGeminiCalls: allowPreflight ? 2 : 1 },
    complex: { thinkingLevel: "medium", maxOutputTokens: 8192, maxContinuations: 1, maxGeminiCalls: allowPreflight ? 4 : 3 },
    deep: { thinkingLevel: "high", maxOutputTokens: 12288, maxContinuations: 1, maxGeminiCalls: allowPreflight ? 4 : 3 },
  };

  return {
    workload,
    models: unique(freeRoleModels(workload)).slice(0, 2),
    preflightModels: unique(preflightModels()).slice(0, 2),
    allowPreflight,
    reasons,
    ...settings[workload],
  };
}
