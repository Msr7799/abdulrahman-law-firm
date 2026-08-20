import type { AgentImage, AgentSource } from "@/types/admin";
import { normalizeSearch } from "@/lib/case-search";
import { cacheRemoteAgentImage } from "@/lib/agent-image-cache";
import { signedAgentImagePath } from "@/lib/agent-image";

export type ResearchDebugEvent = {
  id: string;
  kind: "thinking" | "tool" | "skill" | "validation" | "quota";
  title: string;
  status: "running" | "done" | "skipped" | "error";
  ms?: number;
  summary?: string;
  input?: unknown;
  output?: unknown;
};

export type ResearchEvidence = AgentSource & {
  citationId: string;
  sourceType: "official" | "tavily";
  content?: string;
  score?: number;
};

const AR_STOP = new Set([
  "من", "في", "على", "الى", "إلى", "عن", "ما", "ماذا", "هل", "كيف", "هذا", "هذه", "ذلك", "تلك", "ثم", "او", "أو", "مع", "كل", "بين", "التي", "الذي", "الذين", "كانت", "كان", "يكون", "تكون", "عند", "لدى", "لدي", "لي", "له", "لها", "لهم", "بها", "به", "و", "ف", "ب", "ك", "ل",
  "حلل", "حل", "قضيه", "قضية", "ملف", "المرفق", "المرفقه", "المرفقة", "البحرين", "البحريني", "البحرينيه", "البحرينية",
]);
const EN_STOP = new Set(["the", "a", "an", "of", "in", "on", "to", "for", "and", "or", "with", "this", "that", "from", "case", "file", "bahrain", "bahraini", "analyze", "analyse"]);

function stripTrailingPunctuation(value: string) {
  // Markdown code ticks and sentence punctuation are formatting, never part of a source URL.
  return value.replace(/[`)\]>\]}.,;:'"،؛؟]+$/g, "");
}

export function canonicalEvidenceUrl(value: string) {
  try {
    const cleaned = stripTrailingPunctuation(value.trim().replace(/^[`(<\[{]+/g, ""));
    const url = new URL(cleaned.replace(/\\:/g, ":").replace(/&amp;/gi, "&"));
    url.hash = "";
    if (url.protocol === "http:") url.protocol = "https:";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) url.port = "";
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    // Query-string order is not semantically meaningful. SJC links often arrive as
    // ?i=...&p=1 from the PDF and ?p=1&i=... from Tavily, so sort keys before comparing.
    const sorted = [...url.searchParams.entries()].sort(([ak, av], [bk, bv]) => ak.localeCompare(bk) || av.localeCompare(bv));
    url.search = "";
    for (const [key, value] of sorted) url.searchParams.append(key, value);
    return url.toString();
  } catch {
    return "";
  }
}

export function sameEvidenceUrl(left: string, right: string) {
  const a = canonicalEvidenceUrl(left);
  const b = canonicalEvidenceUrl(right);
  return Boolean(a && b && a === b);
}

export function isOfficialBahrainUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    return hostname.endsWith(".gov.bh") || hostname === "gov.bh" || hostname === "bahrain.bh" || hostname.endsWith(".bahrain.bh") || hostname === "sjc.bh" || hostname.endsWith(".sjc.bh");
  } catch {
    return false;
  }
}

function urlsFromRawText(raw: string) {
  const decoded = raw.replace(/\\\(([^)]*)\\\)/g, "$1").replace(/\\:/g, ":").replace(/&amp;/gi, "&");
  const matches = decoded.match(/https?:\/\/[^\s<>"'`{}\[\]]+/gi) ?? [];
  return matches.map((item) => canonicalEvidenceUrl(stripTrailingPunctuation(item))).filter(Boolean);
}

export async function extractOfficialUrls(message: string, files: File[]) {
  const found = new Set<string>();
  urlsFromRawText(message).forEach((url) => isOfficialBahrainUrl(url) && found.add(url));

  for (const file of files.slice(0, 5)) {
    try {
      if (file.type.startsWith("text/") || file.type === "application/json") {
        const text = (await file.text()).slice(0, 2_000_000);
        urlsFromRawText(text).forEach((url) => isOfficialBahrainUrl(url) && found.add(url));
      } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        // PDF annotations commonly keep external /URI values as literal ASCII even when page text is compressed.
        // Reading the raw bytes lets us recover official source links without spending a second Gemini request.
        const raw = Buffer.from(await file.arrayBuffer()).toString("latin1");
        urlsFromRawText(raw).forEach((url) => isOfficialBahrainUrl(url) && found.add(url));
      }
    } catch {
      // Extraction is best-effort. The final model still receives the attachment.
    }
  }
  return [...found].slice(0, 6);
}

function decodeEntities(value: string) {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => named[name.toLowerCase()] ?? match);
}

function htmlTitle(html: string, fallback: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return decodeEntities((match?.[1] ?? fallback).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()) || fallback;
}

function htmlToText(html: string) {
  return decodeEntities(html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|nav|footer)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim());
}

function queryTerms(value: string) {
  const normalized = normalizeSearch(value);
  const terms = normalized.split(" ").filter((term) => {
    if (!term) return false;
    if (/^\d+$/.test(term)) return term.length >= 2;
    if (term.length < 3) return false;
    return !AR_STOP.has(term) && !EN_STOP.has(term);
  });
  const exactRefs = value.match(/(?:ط\.?\s*ح|رقم|ماده|الماده|المادة|article|case)\s*[\/\-\dأ-ي]+/gi) ?? [];
  return [...new Set([...exactRefs.map(normalizeSearch), ...terms])].slice(0, 18);
}

function compoundLegalReferences(value: string) {
  const normalized = normalizeSearch(value);
  const refs: string[] = [];
  const patterns = [
    /(?:الطعن|الدعوى|القضيه|القضية|طلب|احاله|إحالة)\s*(?:رقم)?\s*(\d+)\s*(?:لسنه|لسنة|\/)\s*(\d{4})/g,
    /(?:قرار|مرسوم(?:\s+بقانون)?|قانون)(?:\s+[أ-يa-z]+){0,5}\s*(?:رقم)?\s*\(?\s*(\d+)\s*\)?\s*(?:لسنه|لسنة)\s*(\d{4})/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(normalized))) refs.push(`${match[1]}:${match[2]}`);
  }
  return [...new Set(refs)];
}

const GENERIC_RESEARCH_TERMS = new Set([
  "قانون", "مرسوم", "قرار", "ماده", "الماده", "تشريع", "حكم", "محكمه", "التمييز", "الدستوريه", "الدستور",
  "وزير", "العدل", "لسنه", "رقم", "تنفيذ", "اختصاص", "بشان", "مملكه", "البحرين", "law", "decree", "decision",
  "court", "judgment", "article", "minister", "justice", "bahrain",
]);

function distinctiveResearchTerms(value: string) {
  return queryTerms(value).filter((term) => !GENERIC_RESEARCH_TERMS.has(term) && !/^\d+$/.test(term)).slice(0, 14);
}

function sourceResearchAlignment(title: string, url: string, body: string, researchText: string, expectedOfficialUrls: string[] = []) {
  if (expectedOfficialUrls.some((expected) => sameEvidenceUrl(expected, url))) return { exactExpected: true, compoundHits: 99, topicHits: 99, aligned: true };
  const haystack = normalizeSearch(`${title} ${url} ${body}`);
  const refs = compoundLegalReferences(researchText);
  const compoundHits = refs.filter((ref) => {
    const [number, year] = ref.split(":");
    return haystack.includes(number) && haystack.includes(year);
  }).length;
  const terms = distinctiveResearchTerms(researchText);
  const topicHits = terms.filter((term) => haystack.includes(term)).length;
  const normalizedResearch = normalizeSearch(researchText);
  const amlLawyerQuery = /غسل\s*الاموال|مكافحه\s*غسل|تمويل\s*الارهاب|محاماه|محامين|aml/.test(normalizedResearch);
  const amlLawyerSource = /غسل\s*الاموال|مكافحه\s*غسل|تمويل\s*الارهاب|محاماه|محامين|aml/.test(haystack);
  const aligned = compoundHits > 0 || (topicHits >= 3 && (!amlLawyerQuery || amlLawyerSource));
  return { exactExpected: false, compoundHits, topicHits, aligned };
}

function expectedJudgmentSearchHint(urls: string[], fallbackQuery: string) {
  for (const raw of urls) {
    try {
      const url = new URL(raw);
      if (!/ahkam\.sjc\.bh$/i.test(url.hostname)) continue;
      const key = url.searchParams.get("i") || "";
      const pieces = key.split(/[+\s]+/).filter(Boolean);
      const first = pieces.find((part) => /^\d+$/.test(part));
      const year = pieces.find((part) => /^(?:19|20)\d{2}$/.test(part));
      if (first && year) return `الطعن ${first} لسنة ${year} محكمة التمييز ${fallbackQuery}`.replace(/\s+/g, " ").trim().slice(0, 420);
    } catch {
      // Ignore malformed expected URL.
    }
  }
  return fallbackQuery.slice(0, 420);
}

function relevantWindows(text: string, terms: string[], maxChars = 22_000) {
  if (text.length <= maxChars) return text;
  const normalized = normalizeSearch(text);
  const locations: number[] = [];
  for (const term of terms.slice(0, 10)) {
    const index = normalized.indexOf(term);
    if (index >= 0) locations.push(index);
  }
  if (!locations.length) return text.slice(0, maxChars);
  const windows = locations.slice(0, 6).map((index) => text.slice(Math.max(0, index - 1800), Math.min(text.length, index + 3000)));
  const merged = [...new Set(windows)].join("\n\n…\n\n");
  return merged.slice(0, maxChars);
}

function extractOfficialLinks(html: string, baseUrl: string) {
  const links: Array<{ url: string; anchor: string }> = [];
  const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    try {
      const url = canonicalEvidenceUrl(new URL(match[1], baseUrl).toString());
      if (!url || !isOfficialBahrainUrl(url)) continue;
      const anchor = decodeEntities(match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
      links.push({ url, anchor });
    } catch {
      // Ignore malformed anchors.
    }
  }
  return links;
}

function linkedSourceScore(item: { url: string; anchor: string }) {
  const text = normalizeSearch(`${item.anchor} ${item.url}`);
  let score = 0;
  if (/دستور|constitution|محكم|court|تشريع|legislation|قانون|law|حكم|ruling/.test(text)) score += 8;
  if (/search|home|contact|privacy|login/.test(text)) score -= 4;
  return score;
}

export async function fetchOfficialEvidence(urls: string[], researchText: string, signal: AbortSignal) {
  const started = Date.now();
  const input = { urls, policy: "Bahrain official domains only; direct attachment URLs first", maxPrimary: 3, maxLinked: 2 };
  if (!urls.length) {
    return { evidence: [] as ResearchEvidence[], event: { id: "official-fetch", kind: "tool", title: "official_source_fetch", status: "skipped", ms: 0, summary: "لم يتم العثور على رابط بحريني رسمي مباشر في السؤال أو المرفقات.", input, output: { fetched: 0 } } satisfies ResearchDebugEvent };
  }

  const terms = queryTerms(researchText);
  const evidence: ResearchEvidence[] = [];
  const linkedCandidates: Array<{ url: string; anchor: string }> = [];
  const errors: Array<{ url: string; error: string }> = [];

  for (const originalUrl of urls.slice(0, 3)) {
    if (!isOfficialBahrainUrl(originalUrl)) continue;
    try {
      const response = await fetch(originalUrl, {
        redirect: "follow",
        cache: "no-store",
        headers: { accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.4", "user-agent": "Abdulrahman-Law-Office-Agent/1.0" },
        signal: AbortSignal.any([signal, AbortSignal.timeout(/ahkam\.sjc\.bh/i.test(originalUrl) ? 5_000 : 12_000)]),
      });
      const finalUrl = canonicalEvidenceUrl(response.url || originalUrl);
      if (!response.ok || !isOfficialBahrainUrl(finalUrl)) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get("content-type") ?? "";
      if (!/text\/(html|plain)|application\/xhtml\+xml/i.test(contentType)) {
        evidence.push({ citationId: "", sourceType: "official", title: finalUrl, url: finalUrl, snippet: `Official source (${contentType || "document"})`, content: "", score: 100 });
        continue;
      }
      const html = await response.text();
      const title = htmlTitle(html, finalUrl);
      const text = htmlToText(html);
      const content = relevantWindows(text, [...terms, ...queryTerms(title)], 24_000);
      evidence.push({ citationId: "", sourceType: "official", title, url: finalUrl, snippet: content.slice(0, 700), content, score: 100 });
      linkedCandidates.push(...extractOfficialLinks(html, finalUrl));
    } catch (error) {
      errors.push({ url: originalUrl, error: error instanceof Error ? error.message : "fetch failed" });
    }
  }

  const seen = new Set(evidence.map((item) => item.url));
  const linked = linkedCandidates
    .filter((item) => !seen.has(item.url))
    .map((item) => ({ ...item, score: linkedSourceScore(item) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  for (const item of linked) {
    try {
      const response = await fetch(item.url, {
        redirect: "follow",
        cache: "no-store",
        headers: { accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.4", "user-agent": "Abdulrahman-Law-Office-Agent/1.0" },
        signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
      });
      if (!response.ok) continue;
      const html = await response.text();
      const title = htmlTitle(html, item.anchor || item.url);
      const text = htmlToText(html);
      const content = relevantWindows(text, [...terms, ...queryTerms(title)], 14_000);
      evidence.push({ citationId: "", sourceType: "official", title, url: canonicalEvidenceUrl(response.url || item.url), snippet: content.slice(0, 700), content, score: 90 + item.score });
    } catch {
      // Linked evidence is optional.
    }
  }

  const deduped = Array.from(new Map(evidence.map((item) => [item.url, item])).values()).slice(0, 5).map((item, index) => ({ ...item, citationId: `O${index + 1}` }));
  return {
    evidence: deduped,
    event: {
      id: "official-fetch",
      kind: "tool",
      title: "official_source_fetch",
      status: deduped.length ? "done" : "skipped",
      ms: Date.now() - started,
      summary: deduped.length ? `تم جلب ${deduped.length} مصدر بحريني رسمي مباشرة قبل البحث العام.` : "المصدر الرسمي لم يسمح بالجلب المباشر من الخادم؛ سيستخدم الوكيل البحث المقيّد لاستعادة نفس الصفحة الرسمية قبل اعتبار ذلك فشلاً.",
      input,
      output: {
        fetched: deduped.map((item) => ({ citationId: item.citationId, title: item.title, url: item.url, chars: item.content?.length ?? 0 })),
        errors,
      },
    } satisfies ResearchDebugEvent,
  };
}

function topicDomains(text: string) {
  const normalized = normalizeSearch(text);
  const domains = new Set(["lloc.gov.bh", "legalaffairs.gov.bh", "sjc.bh", "ahkam.sjc.bh", "moj.gov.bh", "bahrain.bh"]);
  if (/نيابه|نيابة|جنائي|جنايي|تحقيق|متهم|جريمه|جريمة|عقوبات|criminal|prosecution/.test(normalized)) domains.add("ppb.gov.bh");
  if (/عمل|عمال|عامل|موظف|lmra|labor|labour|تأمين|تامين|معاش/.test(normalized)) { domains.add("lmra.gov.bh"); domains.add("sio.gov.bh"); }
  // SLRB is the Survey & Land Registration Bureau. Never include it in generic legal searches.
  if (/عقار|عقاري|ارض|أرض|تسجيل عقاري|ملكيه|ملكية|real estate|land registration|property/.test(normalized)) domains.add("slrb.gov.bh");
  return [...domains];
}

function sourceRelevance(title: string, url: string, snippet: string, terms: string[]) {
  const titleN = normalizeSearch(title);
  const snippetN = normalizeSearch(snippet);
  const urlN = normalizeSearch(url);
  let score = isOfficialBahrainUrl(url) ? 12 : 0;
  let hits = 0;
  for (const term of terms) {
    if (!term) continue;
    let hit = false;
    if (titleN.includes(term)) { score += /^\d+$/.test(term) ? 7 : 5; hit = true; }
    if (snippetN.includes(term)) { score += /^\d+$/.test(term) ? 5 : 2; hit = true; }
    if (urlN.includes(term)) { score += 1; hit = true; }
    if (hit) hits += 1;
  }
  score += Math.min(8, hits * 1.5);
  const mismatch = /real estate|land registration|ownership by non-bahrainis|عقار|تسجيل عقاري|تملك غير البحرينيين/i.test(`${title} ${snippet}`);
  const queryIsProperty = terms.some((term) => /عقار|ارض|ملكيه|property|land|real estate/.test(term));
  if (mismatch && !queryIsProperty) score -= 30;
  return { score, hits };
}

function cleanSearchTitle(title: string, url: string, snippet: string) {
  const compact = title.replace(/[\sـ_\-–—|:]+/g, "").trim();
  if (compact.length >= 4) return title.trim();
  const caseMatch = snippet.match(/(?:الطعن|الدعوى|القضية|إحالة|طلب)\s*(?:رقم)?\s*[\d٠-٩]+[^\n]{0,50}/i)?.[0];
  if (caseMatch) return caseMatch.replace(/\s+/g, " ").trim();
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "مصدر قانوني"; }
}

export async function tavilyLegalSearch(args: { query: string; contextHint?: string; expectedOfficialUrls?: string[]; signal: AbortSignal; visual?: boolean }) {
  const started = Date.now();
  const apiKey = process.env.TAVILY_API_KEY;
  const terms = queryTerms(`${args.query} ${args.contextHint ?? ""}`);
  const domains = topicDomains(`${args.query} ${args.contextHint ?? ""}`);
  const contextHint = args.contextHint && !/^https?:\/\//i.test(args.contextHint.trim()) ? args.contextHint.slice(0, 260) : "";
  const searchQuery = `${contextHint ? `${contextHint} ` : ""}${args.query}`.replace(/\s+/g, " ").trim().slice(0, 500);
  const body: Record<string, unknown> = {
    query: searchQuery,
    topic: "general",
    search_depth: "advanced",
    max_results: args.visual ? 10 : 8,
    include_answer: false,
    include_images: Boolean(args.visual),
    include_image_descriptions: Boolean(args.visual),
    include_raw_content: false,
    include_domains: domains,
  };

  const input = { ...body, apiKey: apiKey ? "configured" : "missing", relevanceTerms: terms, expectedOfficialUrls: args.expectedOfficialUrls ?? [] };
  if (!apiKey) {
    return { evidence: [] as ResearchEvidence[], images: [] as AgentImage[], event: { id: "tavily", kind: "tool", title: "tavily_search", status: "skipped", ms: 0, summary: "Tavily غير مضبوط على الخادم.", input, output: { accepted: 0 } } satisfies ResearchDebugEvent };
  }

  try {
    const runSearch = async (searchBody: Record<string, unknown>, timeoutMs = 14_000) => {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify(searchBody),
        signal: AbortSignal.any([args.signal, AbortSignal.timeout(timeoutMs)]),
      });
      if (!response.ok) throw new Error(`Tavily HTTP ${response.status}`);
      return response.json() as Promise<{ results?: Array<{ title?: string; url?: string; content?: string }>; images?: Array<string | { url?: string; image_url?: string; description?: string }> }>;
    };

    const primaryData = await runSearch(body);
    let allResults = [...(primaryData.results ?? [])];
    let allImages = [...(primaryData.images ?? [])];
    let targetedRetryQuery = "";
    const expectedOfficialUrls = args.expectedOfficialUrls ?? [];
    const primaryHasExpected = allResults.some((item) => item.url && expectedOfficialUrls.some((expected) => sameEvidenceUrl(expected, item.url!)));
    const expectedSjc = expectedOfficialUrls.some((url) => /ahkam\.sjc\.bh/i.test(url));
    if (expectedSjc && !primaryHasExpected) {
      targetedRetryQuery = expectedJudgmentSearchHint(expectedOfficialUrls, args.query);
      const targetedBody: Record<string, unknown> = {
        query: targetedRetryQuery,
        topic: "general",
        search_depth: "advanced",
        max_results: 6,
        include_answer: false,
        include_images: false,
        include_image_descriptions: false,
        include_raw_content: false,
        include_domains: ["ahkam.sjc.bh"],
      };
      try {
        const targeted = await runSearch(targetedBody, 10_000);
        allResults = [...allResults, ...(targeted.results ?? [])];
      } catch {
        // The targeted retry is opportunistic. Keep the primary Tavily result set if it fails.
      }
    }

    const dedupedResults = Array.from(new Map(allResults.filter((item) => item.url?.startsWith("https://")).map((item) => [canonicalEvidenceUrl(item.url!) || item.url!, item])).values());
    const ranked = dedupedResults.map((item) => {
      const snippet = item.content?.slice(0, 3200) ?? "";
      const title = cleanSearchTitle(item.title || item.url || "Source", item.url!, snippet);
      const relevance = sourceRelevance(title, item.url!, snippet, terms);
      const alignment = sourceResearchAlignment(title, item.url!, snippet, args.query, expectedOfficialUrls);
      const exactBoost = alignment.exactExpected ? 120 : alignment.compoundHits * 18 + Math.min(18, alignment.topicHits * 3);
      return { title, url: item.url!, snippet, score: relevance.score + exactBoost, hits: relevance.hits, alignment };
    }).sort((a, b) => b.score - a.score);

    // Require either multiple semantic hits or a strong official-domain score. If an exact
    // high-signal judgment page is present, keep the evidence set tight instead of adding generic
    // court homepages that do not materially support the answer.
    const eligible = ranked.filter((item) => item.alignment.exactExpected || (item.alignment.aligned && item.score >= 24 && (item.hits >= 1 || item.score >= 35)));
    const exactOfficial = eligible.find((item) => isOfficialBahrainUrl(item.url) && item.alignment.exactExpected)
      || eligible.find((item) => isOfficialBahrainUrl(item.url) && item.score >= 55 && item.alignment.compoundHits > 0 && /(?:File\.aspx|Legislation\/HTM|\bCC\d+)/i.test(item.url));
    const accepted = exactOfficial
      ? [
          exactOfficial,
          ...eligible.filter((item) => {
            if (item === exactOfficial || item.score < 35 || item.hits < 2) return false;
            try {
              const url = new URL(item.url);
              // A court/authority homepage does not add evidence once the exact judgment is found.
              return url.pathname !== "/" && url.pathname.length > 2;
            } catch {
              return false;
            }
          }),
        ].slice(0, 3)
      : eligible.slice(0, 5);
    const evidence: ResearchEvidence[] = accepted.map((item, index) => ({ citationId: `W${index + 1}`, sourceType: "tavily", title: item.title, url: canonicalEvidenceUrl(item.url) || item.url, snippet: item.snippet, content: item.snippet, score: item.score }));

    const imageCandidates = Array.from(new Map(allImages
      .map((item) => typeof item === "string" ? { url: item } : { url: item.url ?? item.image_url ?? "", description: item.description })
      .filter((item) => item.url.startsWith("https://"))
      .map((item) => [item.url, item])).values()).slice(0, 8);
    const images = args.visual ? (await Promise.all(imageCandidates.map(async (image) => {
      try { const prepared = await cacheRemoteAgentImage(image.url); return { ...image, displayUrl: signedAgentImagePath(image.url, prepared.id) }; }
      catch { return null; }
    }))).filter((image): image is AgentImage & { displayUrl: string } => Boolean(image)) : [];

    return {
      evidence,
      images,
      event: {
        id: "tavily",
        kind: "tool",
        title: "tavily_search",
        status: evidence.length ? "done" : "skipped",
        ms: Date.now() - started,
        summary: evidence.length ? `قُبل ${evidence.length} مصدر بعد إعادة الترتيب، ورُفضت النتائج غير المرتبطة.` : "لم تتجاوز أي نتيجة بوابة الصلة القانونية.",
        input,
        output: {
          targetedRetryQuery: targetedRetryQuery || undefined,
          accepted: accepted.map((item, index) => ({ citationId: `W${index + 1}`, title: item.title, url: canonicalEvidenceUrl(item.url) || item.url, score: item.score, exactExpected: item.alignment.exactExpected, compoundHits: item.alignment.compoundHits, topicHits: item.alignment.topicHits })),
          rejected: ranked.filter((item) => !accepted.includes(item)).slice(0, 6).map((item) => ({ title: item.title, url: item.url, score: item.score, hits: item.hits, compoundHits: item.alignment.compoundHits, topicHits: item.alignment.topicHits, aligned: item.alignment.aligned })),
        },
      } satisfies ResearchDebugEvent,
    };
  } catch (error) {
    return {
      evidence: [] as ResearchEvidence[],
      images: [] as AgentImage[],
      event: { id: "tavily", kind: "tool", title: "tavily_search", status: "error", ms: Date.now() - started, summary: "فشل طلب Tavily.", input, output: { error: error instanceof Error ? error.message : "unknown" } } satisfies ResearchDebugEvent,
    };
  }
}


export function promoteHighConfidenceOfficialTavilyEvidence(args: {
  items: ResearchEvidence[];
  existingOfficial?: ResearchEvidence[];
  researchText: string;
  expectedOfficialUrls?: string[];
}) {
  const promoted: ResearchEvidence[] = [];
  const existingOfficial = args.existingOfficial ?? [];
  for (const item of args.items) {
    if (!isOfficialBahrainUrl(item.url)) continue;
    if (existingOfficial.some((official) => sameEvidenceUrl(official.url, item.url))) continue;
    const body = item.content || item.snippet || "";
    const score = item.score ?? 0;
    try {
      const url = new URL(item.url);
      if (url.pathname === "/" || /\/(?:search|home|contact|privacy|login)\/?$/i.test(url.pathname)) continue;
    } catch {
      continue;
    }
    const alignment = sourceResearchAlignment(item.title, item.url, body, args.researchText, args.expectedOfficialUrls ?? []);
    const legalPage = /(?:المادة|قانون|مرسوم|تشريع|حكم|الطعن|الدعوى|القضية|محكمة|article|law|legislation|judgment|appeal|cassation)/i.test(`${item.title} ${body}`)
      || /(?:File\.aspx|Legislation\/HTM|\bCC\d+)/i.test(item.url);
    // A government page is not automatically relevant legal evidence. It must either be the exact
    // expected source, contain an exact compound legal reference (case/law + year), or strongly
    // match several distinctive issue terms. This prevents unrelated statutes from becoming [O#].
    if (!legalPage || !alignment.aligned || body.trim().length < 300) continue;
    if (!alignment.exactExpected && alignment.compoundHits === 0 && (score < 50 || alignment.topicHits < 3)) continue;
    promoted.push({
      ...item,
      citationId: "",
      sourceType: "official",
      url: canonicalEvidenceUrl(item.url) || item.url,
      score: Math.max(90, score),
      content: body,
      snippet: item.snippet || body.slice(0, 1200),
    });
  }
  return promoted;
}

export function extractEvidenceCitationIds(text: string) {
  const ids: string[] = [];
  for (const bracket of text.matchAll(/\[([^\]\n]{1,160})\]/g)) {
    for (const match of bracket[1].matchAll(/\b([OWC]\d+)\b/gi)) ids.push(match[1].toUpperCase());
  }
  return [...new Set(ids)];
}

export function hasInlineEvidenceCitation(text: string) {
  return extractEvidenceCitationIds(text).length > 0;
}

export function evidenceContext(items: ResearchEvidence[]) {
  return items.map((item) => `[${item.citationId}] ${item.title}\nURL: ${item.url}\nSource type: ${item.sourceType}\nRelevance score: ${item.score ?? "n/a"}\n${item.content || item.snippet || ""}`).join("\n\n");
}

export function selectLegalSkillIds(text: string, hasAttachments: boolean) {
  const normalized = normalizeSearch(text);
  const ids = new Set<string>(["source-and-citation-discipline"]);
  if (hasAttachments) ids.add("case-file-analysis");
  if (/دستور|دستوري|المحكمه الدستوريه|المحكمة الدستورية|constitutional|constitution|سمو الدستور|فصل السلطات/.test(normalized)) ids.add("constitutional-review-analysis");
  if (/حكم|احكام|أحكام|سابقة|تمييز|استئناف|محكمه|محكمة|قضيه|قضية|judgment|judgement|precedent|appeal|cassation/.test(normalized)) ids.add("bahrain-judgment-research");
  if (/قانون|مرسوم|قرار|لائحه|لائحة|ماده|مادة|تشريع|نفاذ|تعديل|تحكيم|تنفيذ|law|decree|article|legislation|regulation|arbitration|enforcement/.test(normalized)) ids.add("bahrain-legislation-verification");
  if (/(?:عمل|عامل|عمال|عقد العمل|انهاء عقد|إنهاء عقد|labou?r|employment)/.test(normalized) && /(?:تسويه|تسوية|مخالصه|مخالصة|ابراء|إبراء|صلح|تنازل|waiver|release|settlement)/.test(normalized)) ids.add("bahrain-labour-settlement-analysis");
  if (/(?:محام|محاماه|محاماة|lawyer|legal counsel)/.test(normalized) && /(?:غسل الاموال|غسل الأموال|مكافحه غسل|مكافحة غسل|تمويل الارهاب|تمويل الإرهاب|aml|cft)/.test(normalized)) ids.add("bahrain-lawyers-aml-analysis");
  if (/خدمه|خدمة|معامله|معاملة|الكتروني|إلكتروني|service|egovernment/.test(normalized)) ids.add("judicial-egovernment-navigation");
  if (hasAttachments) ids.add("legal-document-review");
  return [...ids];
}

export function researchPlanSummary(args: { directUrls: string[]; officialCount: number; tavilyRequested: boolean; acceptedTavily: number; skillIds: string[] }) {
  const steps = [
    args.directUrls.length ? `استخراج ${args.directUrls.length} رابط رسمي من السؤال/المرفقات وإعطاؤه الأولوية.` : "لم يظهر رابط رسمي مباشر؛ الاعتماد على البحث المقيّد بالمصادر البحرينية الرسمية.",
    args.officialCount ? `إدخال ${args.officialCount} مصدر رسمي مباشر في سياق الإجابة.` : "لا يوجد مصدر مباشر تم جلبه؛ ستظهر حدود الدليل بوضوح.",
    args.tavilyRequested ? `تشغيل Tavily كمصدر تكميلي فقط مع بوابة صلة؛ المقبول ${args.acceptedTavily}.` : "عدم تشغيل Tavily لأن الأدلة الرسمية المباشرة كافية أو البحث الخارجي غير مطلوب.",
    `تفعيل ${args.skillIds.length} مهارة قانونية مناسبة ثم توليد إجابة واحدة grounded بالمراجع المقبولة.`,
  ];
  return steps.join(" ");
}

export function validateEvidenceCitations(answer: string, evidence: ResearchEvidence[]) {
  const valid = new Set(evidence.map((item) => item.citationId));
  // Accept grouped citations regardless of Arabic/English separators, e.g.
  // [O1، O2], [O1, W1], [O1/W1] or separate [O1] [W1].
  const uniqueFound = extractEvidenceCitationIds(answer).filter((id) => /^O\d+$|^W\d+$/.test(id));
  const invalid = uniqueFound.filter((id) => !valid.has(id));
  const validFound = uniqueFound.filter((id) => valid.has(id));
  const rawUrls = [...answer.matchAll(/https?:\/\/[^\s<>"'`{}\[\]]+/g)]
    .map((match) => canonicalEvidenceUrl(match[0]))
    .filter(Boolean);
  const allowedUrls = new Set(evidence.map((item) => canonicalEvidenceUrl(item.url)).filter(Boolean));
  const unapprovedUrls = [...new Set(rawUrls.filter((url) => !allowedUrls.has(url)))];
  return {
    validFound,
    invalid,
    unapprovedUrls,
    hasGrounding: validFound.length > 0 || evidence.length === 0,
  };
}
