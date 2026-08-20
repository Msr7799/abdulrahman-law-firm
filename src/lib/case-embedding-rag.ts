import "server-only";

import { GoogleGenAI } from "@google/genai";
import type { LawCase } from "@/types/admin";
import { normalizeSearch, rankCases } from "@/lib/case-search";
import { diagnoseGeminiError } from "@/lib/gemini-request-manager";

export type HybridCaseMatch = {
  lawCase: LawCase;
  score: number;
  covered: number;
  lexicalScore: number;
  semanticScore: number;
  retrievalMode: "hybrid" | "lexical-fallback";
};

export type CaseEmbeddingDebug = {
  model: string;
  dimensions: number;
  totalCases: number;
  eligibleCases: number;
  excludedDemoCases: number;
  candidates: number;
  cacheHits: number;
  cacheMisses: number;
  embeddingCalls: number;
  elapsedMs: number;
  queryDomain: string;
  fallback?: string;
  top: Array<{
    caseId: string;
    caseRef: string;
    lexicalScore: number;
    semanticScore: number;
    combinedScore: number;
    domain: string;
    reason?: string;
  }>;
  rejected: Array<{
    caseId: string;
    caseRef: string;
    lexicalScore: number;
    semanticScore: number;
    combinedScore: number;
    domain: string;
    reason: string;
  }>;
};

type CachedEmbedding = { version: string; vector: number[] };
type EmbeddingCacheState = { caseVectors: Map<string, CachedEmbedding>; nextAllowedAt: number };
type GlobalWithCaseRag = typeof globalThis & { __abdulrahmanCaseEmbeddingRagV17?: EmbeddingCacheState };

function state() {
  const root = globalThis as GlobalWithCaseRag;
  root.__abdulrahmanCaseEmbeddingRagV17 ??= { caseVectors: new Map(), nextAllowedAt: 0 };
  return root.__abdulrahmanCaseEmbeddingRagV17;
}

function envInt(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.trunc(value))) : fallback;
}

function envFloat(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function envBool(name: string, fallback: boolean) {
  const value = process.env[name];
  if (value == null) return fallback;
  return /^(1|true|yes|on)$/i.test(value.trim());
}

function sleep(ms: number, signal: AbortSignal) {
  if (ms <= 0) return Promise.resolve();
  if (signal.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"));
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function paceEmbedding(signal: AbortSignal) {
  const current = state();
  const now = Date.now();
  const interval = envInt("GEMINI_EMBEDDING_MIN_INTERVAL_MS", 1200, 0, 60_000);
  const reservedAt = Math.max(now, current.nextAllowedAt);
  current.nextAllowedAt = reservedAt + interval;
  await sleep(Math.max(0, reservedAt - now), signal);
}

function caseVersion(lawCase: LawCase) {
  return `${lawCase.id}:${lawCase.updatedAt}:${lawCase.caseNumber}:${lawCase.caseYear}`;
}

function cacheVersion(lawCase: LawCase, model: string, dimensions: number) {
  return `${model}:${dimensions}:${caseVersion(lawCase)}`;
}

function caseDocument(lawCase: LawCase) {
  return [
    `رقم القضية: ${lawCase.caseNumber}/${lawCase.caseYear}`,
    `نوع القضية: ${lawCase.caseType || "-"}`,
    `المحكمة: ${lawCase.court || "-"}`,
    `الحالة: ${lawCase.status || "-"}`,
    `الموكل: ${lawCase.clientName || "-"}`,
    `الخصم أو المتهم: ${lawCase.accusedName || "-"}`,
    `المجني عليه: ${lawCase.victimName || "-"}`,
    `الحكم: ${lawCase.judgment || "-"}`,
    `القاضي أو الدائرة: ${lawCase.judgeName || "-"}`,
    `الجلسة القادمة: ${lawCase.nextHearing || "-"}`,
    `الملاحظات: ${lawCase.notes || "-"}`,
  ].join("\n").slice(0, 7000);
}

function queryEmbeddingText(query: string) {
  return `task: search result | query: ${query.slice(0, 6000)}`;
}

function documentEmbeddingText(lawCase: LawCase) {
  return `title: قضية ${lawCase.caseNumber}/${lawCase.caseYear} | text: ${caseDocument(lawCase)}`;
}

function cosine(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  if (!length) return 0;
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  if (!aa || !bb) return 0;
  return dot / Math.sqrt(aa * bb);
}

function exactReferenceBoost(query: string, lawCase: LawCase) {
  const compact = normalizeSearch(query).replace(/\s+/g, "");
  const refs = [
    `${lawCase.caseNumber}/${lawCase.caseYear}`,
    `${lawCase.caseNumber}-${lawCase.caseYear}`,
  ].map((ref) => normalizeSearch(ref).replace(/\s+/g, "")).filter(Boolean);
  return refs.some((ref) => ref.length >= 4 && compact.includes(ref)) ? 0.22 : 0;
}

function exactReferenceMatch(query: string, lawCase: LawCase) {
  return exactReferenceBoost(query, lawCase) > 0;
}

type LegalDomain = "constitutional" | "criminal" | "labor" | "family" | "execution" | "commercial" | "civil" | "property" | "general";

function detectQueryDomain(text: string): LegalDomain {
  const value = normalizeSearch(text);
  if (/دستور|دستوري|المحكمه الدستوريه|سمو الدستور|constitutional|constitution/.test(value)) return "constitutional";
  if (/جناي|جنائي|جنحه|جريمه|متهم|عقوبات|criminal|penal|prosecution/.test(value)) return "criminal";
  if (/عمال|عامل|عمل|اجور|نهايه خدمه|labor|labour|employment/.test(value)) return "labor";
  if (/شرعي|اسره|زواج|طلاق|حضانه|نفقه|family|sharia/.test(value)) return "family";
  if (/تنفيذ|منفذ ضده|سند تنفيذي|execution|enforcement/.test(value)) return "execution";
  if (/تجاري|شركه|توريد|تجاره|commercial|company|supply/.test(value)) return "commercial";
  if (/عقار|ملكيه|ارض|تسجيل عقاري|property|real estate|land/.test(value)) return "property";
  if (/مدني|عقد|تعويض|مطالبه|civil|contract|damages/.test(value)) return "civil";
  return "general";
}

function detectCaseDomain(lawCase: LawCase): LegalDomain {
  const value = normalizeSearch(`${lawCase.caseType} ${lawCase.court} ${lawCase.judgment} ${lawCase.notes}`);
  return detectQueryDomain(value);
}

function domainCompatible(queryDomain: LegalDomain, caseDomain: LegalDomain) {
  if (queryDomain === "general" || caseDomain === "general") return true;
  if (queryDomain === caseDomain) return true;
  // Civil/commercial/property can overlap in office matters. Constitutional should never be inferred from them.
  if (queryDomain === "civil" && ["commercial", "property"].includes(caseDomain)) return true;
  if (caseDomain === "civil" && ["commercial", "property"].includes(queryDomain)) return true;
  return false;
}

function shouldIncludeDemo(query: string) {
  return envBool("CASE_RAG_INCLUDE_DEMO", false) || /demo|تجريبي|بيانات التدريب|training/i.test(query);
}

async function embedWithRetry(args: {
  apiKey: string;
  model: string;
  dimensions: number;
  contents: Array<{ parts: Array<{ text: string }> }>;
  signal: AbortSignal;
}) {
  const ai = new GoogleGenAI({ apiKey: args.apiKey });
  const maxAttempts = envInt("GEMINI_EMBEDDING_MAX_ATTEMPTS", 3, 1, 4);
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await paceEmbedding(args.signal);
    try {
      return await ai.models.embedContent({
        model: args.model,
        contents: args.contents,
        config: { outputDimensionality: args.dimensions, abortSignal: args.signal },
      });
    } catch (error) {
      lastError = error;
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      const info = diagnoseGeminiError(error);
      if (!info.retryable || info.dailyQuota || attempt === maxAttempts) throw error;
      const base = envInt("GEMINI_EMBEDDING_RETRY_BASE_MS", 1500, 500, 30_000);
      const maxWait = envInt("GEMINI_EMBEDDING_RETRY_MAX_MS", 12_000, 1000, 60_000);
      const exponential = Math.min(maxWait, base * (2 ** (attempt - 1)));
      const jitter = Math.floor(Math.random() * 500);
      await sleep(Math.max(info.retryAfterMs ?? 0, exponential + jitter), args.signal);
    }
  }
  throw lastError ?? new Error("EMBEDDING_RETRY_EXHAUSTED");
}

function candidateCases(cases: LawCase[], query: string, maxCandidates: number) {
  if (cases.length <= maxCandidates) return cases.slice();
  const lexical = rankCases(cases, query, Math.min(32, maxCandidates));
  const recent = cases.slice().sort((a, b) => b.updatedAt - a.updatedAt).slice(0, Math.min(16, maxCandidates));
  const merged = new Map<string, LawCase>();
  for (const item of lexical) merged.set(item.lawCase.id, item.lawCase);
  for (const lawCase of recent) merged.set(lawCase.id, lawCase);
  return [...merged.values()].slice(0, maxCandidates);
}

export async function rankCasesHybrid(cases: LawCase[], query: string, signal: AbortSignal, limit = 6): Promise<{ ranked: HybridCaseMatch[]; debug: CaseEmbeddingDebug }> {
  const started = Date.now();
  const model = process.env.GEMINI_EMBEDDING_MODEL?.trim() || "gemini-embedding-2";
  const dimensions = envInt("GEMINI_EMBEDDING_DIMENSIONS", 768, 128, 3072);
  const maxCandidates = envInt("CASE_RAG_MAX_EMBED_CANDIDATES", 64, 6, 160);
  const highSemantic = envFloat("CASE_RAG_HIGH_SEMANTIC_SCORE", 0.78, 0, 1);
  const supportedSemantic = envFloat("CASE_RAG_SUPPORTED_SEMANTIC_SCORE", 0.70, 0, 1);
  const minCombined = envFloat("CASE_RAG_MIN_COMBINED_SCORE", 60, 0, 125);
  const minLexicalCovered = envInt("CASE_RAG_MIN_LEXICAL_TERMS", 2, 1, 12);
  const apiKey = process.env.GEMINI_API_KEY;
  const includeDemo = shouldIncludeDemo(query);
  const eligibleCases = cases.filter((lawCase) => includeDemo || !lawCase.isDemo);
  const excludedDemoCases = cases.length - eligibleCases.length;
  const queryDomain = detectQueryDomain(query);
  const emptyDebug = (fallback?: string): CaseEmbeddingDebug => ({
    model,
    dimensions,
    totalCases: cases.length,
    eligibleCases: eligibleCases.length,
    excludedDemoCases,
    candidates: 0,
    cacheHits: 0,
    cacheMisses: 0,
    embeddingCalls: 0,
    elapsedMs: Date.now() - started,
    queryDomain,
    fallback,
    top: [],
    rejected: [],
  });

  if (!eligibleCases.length) {
    return { ranked: [], debug: emptyDebug(excludedDemoCases ? "NO_NON_DEMO_CASES" : "NO_CASES") };
  }

  const lexicalAll = rankCases(eligibleCases, query, Math.max(limit, Math.min(eligibleCases.length, maxCandidates)));
  const lexicalById = new Map(lexicalAll.map((item) => [item.lawCase.id, item]));

  if (!apiKey) {
    const ranked = lexicalAll
      .filter((item) => item.covered >= minLexicalCovered || exactReferenceMatch(query, item.lawCase))
      .slice(0, limit)
      .map((item) => ({ ...item, lexicalScore: item.score, semanticScore: 0, retrievalMode: "lexical-fallback" as const }));
    return {
      ranked,
      debug: {
        ...emptyDebug("GEMINI_API_KEY_MISSING"),
        top: ranked.map((item) => ({ caseId: item.lawCase.id, caseRef: `${item.lawCase.caseNumber}/${item.lawCase.caseYear}`, lexicalScore: item.lexicalScore, semanticScore: 0, combinedScore: item.score, domain: detectCaseDomain(item.lawCase) })),
      },
    };
  }

  const candidates = candidateCases(eligibleCases, query, maxCandidates);
  const cache = state().caseVectors;
  const missing = candidates.filter((lawCase) => {
    const cached = cache.get(lawCase.id);
    return !cached || cached.version !== cacheVersion(lawCase, model, dimensions) || cached.vector.length !== dimensions;
  });
  const cacheHits = candidates.length - missing.length;

  try {
    const contents: Array<{ parts: Array<{ text: string }> }> = [
      { parts: [{ text: queryEmbeddingText(query) }] },
      ...missing.map((lawCase) => ({ parts: [{ text: documentEmbeddingText(lawCase) }] })),
    ];
    const response = await embedWithRetry({ apiKey, model, dimensions, contents, signal });
    const vectors = response.embeddings?.map((embedding) => embedding.values ?? []) ?? [];
    const queryVector = vectors[0] ?? [];
    if (!queryVector.length) throw new Error("EMPTY_QUERY_EMBEDDING");
    missing.forEach((lawCase, index) => {
      const vector = vectors[index + 1] ?? [];
      if (vector.length) cache.set(lawCase.id, { version: cacheVersion(lawCase, model, dimensions), vector });
    });

    const maxLexical = Math.max(1, ...lexicalAll.map((item) => item.score));
    const evaluated = candidates.map((lawCase) => {
      const lexical = lexicalById.get(lawCase.id);
      const lexicalNorm = Math.max(0, Math.min(1, (lexical?.score ?? 0) / maxLexical));
      const vector = cache.get(lawCase.id)?.vector ?? [];
      const semanticRaw = vector.length ? cosine(queryVector, vector) : 0;
      const semantic = Math.max(0, Math.min(1, semanticRaw));
      const exact = exactReferenceMatch(query, lawCase);
      const caseDomain = detectCaseDomain(lawCase);
      const compatible = domainCompatible(queryDomain, caseDomain);
      const combined = Math.min(1.25, semantic * 0.78 + lexicalNorm * 0.22 + (exact ? 0.22 : 0));
      const score = combined * 100;
      const covered = lexical?.covered ?? 0;
      let accepted = false;
      let reason = "";

      if (exact) {
        accepted = true;
        reason = "exact case reference";
      } else if (!compatible) {
        reason = `legal-domain mismatch (${queryDomain} vs ${caseDomain})`;
      } else if (semantic >= highSemantic && score >= minCombined) {
        accepted = true;
        reason = `high semantic similarity >= ${highSemantic}`;
      } else if (semantic >= supportedSemantic && score >= minCombined && covered >= minLexicalCovered) {
        accepted = true;
        reason = `semantic + ${covered} lexical anchors`;
      } else {
        reason = `below gate: semantic=${semanticRaw.toFixed(4)}, lexicalTerms=${covered}, combined=${score.toFixed(2)}`;
      }

      return {
        lawCase,
        score,
        covered,
        lexicalScore: lexical?.score ?? 0,
        semanticScore: semanticRaw,
        retrievalMode: "hybrid" as const,
        caseDomain,
        accepted,
        reason,
      };
    }).sort((a, b) => b.score - a.score || b.lawCase.updatedAt - a.lawCase.updatedAt);

    const accepted = evaluated.filter((item) => item.accepted).slice(0, limit);
    const ranked: HybridCaseMatch[] = accepted.map(({ lawCase, score, covered, lexicalScore, semanticScore, retrievalMode }) => ({ lawCase, score, covered, lexicalScore, semanticScore, retrievalMode }));
    const rejected = evaluated.filter((item) => !item.accepted).slice(0, 8);

    return {
      ranked,
      debug: {
        model,
        dimensions,
        totalCases: cases.length,
        eligibleCases: eligibleCases.length,
        excludedDemoCases,
        candidates: candidates.length,
        cacheHits,
        cacheMisses: missing.length,
        embeddingCalls: 1,
        elapsedMs: Date.now() - started,
        queryDomain,
        top: accepted.map((item) => ({ caseId: item.lawCase.id, caseRef: `${item.lawCase.caseNumber}/${item.lawCase.caseYear}`, lexicalScore: Number(item.lexicalScore.toFixed(2)), semanticScore: Number(item.semanticScore.toFixed(4)), combinedScore: Number(item.score.toFixed(2)), domain: item.caseDomain, reason: item.reason })),
        rejected: rejected.map((item) => ({ caseId: item.lawCase.id, caseRef: `${item.lawCase.caseNumber}/${item.lawCase.caseYear}`, lexicalScore: Number(item.lexicalScore.toFixed(2)), semanticScore: Number(item.semanticScore.toFixed(4)), combinedScore: Number(item.score.toFixed(2)), domain: item.caseDomain, reason: item.reason })),
      },
    };
  } catch (error) {
    const diagnosed = diagnoseGeminiError(error);
    const ranked: HybridCaseMatch[] = lexicalAll
      .filter((item) => item.covered >= minLexicalCovered || exactReferenceMatch(query, item.lawCase))
      .slice(0, limit)
      .map((item) => ({ ...item, lexicalScore: item.score, semanticScore: 0, retrievalMode: "lexical-fallback" as const }));
    return {
      ranked,
      debug: {
        model,
        dimensions,
        totalCases: cases.length,
        eligibleCases: eligibleCases.length,
        excludedDemoCases,
        candidates: candidates.length,
        cacheHits,
        cacheMisses: missing.length,
        embeddingCalls: 1,
        elapsedMs: Date.now() - started,
        queryDomain,
        fallback: `${diagnosed.status ?? "ERR"} ${diagnosed.code ?? "EMBEDDING_ERROR"}: ${diagnosed.providerMessage}`.slice(0, 800),
        top: ranked.map((item) => ({ caseId: item.lawCase.id, caseRef: `${item.lawCase.caseNumber}/${item.lawCase.caseYear}`, lexicalScore: Number(item.lexicalScore.toFixed(2)), semanticScore: 0, combinedScore: Number(item.score.toFixed(2)), domain: detectCaseDomain(item.lawCase), reason: "lexical fallback" })),
        rejected: [],
      },
    };
  }
}
