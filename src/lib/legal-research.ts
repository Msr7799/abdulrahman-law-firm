import type { AgentImage, AgentSource } from "@/types/admin";
import { normalizeSearch } from "@/lib/case-search";
import { cacheRemoteAgentImage } from "@/lib/agent-image-cache";
import { signedAgentImagePath } from "@/lib/agent-image";

export type ResearchDebugEvent = {
  id: string;
  kind: "thinking" | "tool" | "skill" | "validation" | "quota";
  title: string;
  status: "done" | "skipped" | "error";
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

function canonicalUrl(value: string) {
  try {
    const cleaned = stripTrailingPunctuation(value.trim().replace(/^[`(<\[{]+/g, ""));
    const url = new URL(cleaned.replace(/\\:/g, ":").replace(/&amp;/gi, "&"));
    url.hash = "";
    if (url.protocol === "http:") url.protocol = "https:";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) url.port = "";
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return "";
  }
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
  return matches.map((item) => canonicalUrl(stripTrailingPunctuation(item))).filter(Boolean);
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
      const url = canonicalUrl(new URL(match[1], baseUrl).toString());
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
        signal: AbortSignal.any([signal, AbortSignal.timeout(12_000)]),
      });
      const finalUrl = canonicalUrl(response.url || originalUrl);
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
      evidence.push({ citationId: "", sourceType: "official", title, url: canonicalUrl(response.url || item.url), snippet: content.slice(0, 700), content, score: 90 + item.score });
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
      status: deduped.length ? "done" : "error",
      ms: Date.now() - started,
      summary: deduped.length ? `تم جلب ${deduped.length} مصدر بحريني رسمي مباشرة قبل البحث العام.` : "تعذر جلب المصدر الرسمي المباشر.",
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

export async function tavilyLegalSearch(args: { query: string; contextHint?: string; signal: AbortSignal; visual?: boolean }) {
  const started = Date.now();
  const apiKey = process.env.TAVILY_API_KEY;
  const terms = queryTerms(`${args.query} ${args.contextHint ?? ""}`);
  const domains = topicDomains(`${args.query} ${args.contextHint ?? ""}`);
  const searchQuery = `${args.contextHint ? `${args.contextHint.slice(0, 260)} ` : ""}${args.query}`.replace(/\s+/g, " ").trim().slice(0, 500);
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

  const input = { ...body, apiKey: apiKey ? "configured" : "missing", relevanceTerms: terms };
  if (!apiKey) {
    return { evidence: [] as ResearchEvidence[], images: [] as AgentImage[], event: { id: "tavily", kind: "tool", title: "tavily_search", status: "skipped", ms: 0, summary: "Tavily غير مضبوط على الخادم.", input, output: { accepted: 0 } } satisfies ResearchDebugEvent };
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.any([args.signal, AbortSignal.timeout(14_000)]),
    });
    if (!response.ok) throw new Error(`Tavily HTTP ${response.status}`);
    const data = await response.json() as { results?: Array<{ title?: string; url?: string; content?: string }>; images?: Array<string | { url?: string; image_url?: string; description?: string }> };
    const ranked = (data.results ?? []).filter((item) => item.url?.startsWith("https://")).map((item) => {
      const title = item.title || item.url || "Source";
      const snippet = item.content?.slice(0, 1400) ?? "";
      const relevance = sourceRelevance(title, item.url!, snippet, terms);
      return { title, url: item.url!, snippet, ...relevance };
    }).sort((a, b) => b.score - a.score);

    // Require either multiple semantic hits or a strong official-domain score.
    const accepted = ranked.filter((item) => item.score >= 16 && (item.hits >= 1 || item.score >= 22)).slice(0, 5);
    const evidence: ResearchEvidence[] = accepted.map((item, index) => ({ citationId: `W${index + 1}`, sourceType: "tavily", title: item.title, url: item.url, snippet: item.snippet, content: item.snippet, score: item.score }));

    const imageCandidates = Array.from(new Map((data.images ?? [])
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
          accepted: evidence.map((item) => ({ citationId: item.citationId, title: item.title, url: item.url, score: item.score })),
          rejected: ranked.filter((item) => !accepted.includes(item)).slice(0, 6).map((item) => ({ title: item.title, url: item.url, score: item.score, hits: item.hits })),
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

export function evidenceContext(items: ResearchEvidence[]) {
  return items.map((item) => `[${item.citationId}] ${item.title}\nURL: ${item.url}\nSource type: ${item.sourceType}\nRelevance score: ${item.score ?? "n/a"}\n${item.content || item.snippet || ""}`).join("\n\n");
}

export function selectLegalSkillIds(text: string, hasAttachments: boolean) {
  const normalized = normalizeSearch(text);
  const ids = new Set<string>(["source-and-citation-discipline"]);
  if (hasAttachments) ids.add("case-file-analysis");
  if (/دستور|دستوري|المحكمه الدستوريه|المحكمة الدستورية|constitutional|constitution|سمو الدستور|فصل السلطات/.test(normalized)) ids.add("constitutional-review-analysis");
  if (/حكم|احكام|أحكام|سابقة|تمييز|استئناف|محكمه|محكمة|قضيه|قضية|judgment|judgement|precedent|appeal|cassation/.test(normalized)) ids.add("bahrain-judgment-research");
  if (/قانون|مرسوم|قرار|لائحه|لائحة|ماده|مادة|تشريع|نفاذ|تعديل|law|decree|article|legislation|regulation/.test(normalized)) ids.add("bahrain-legislation-verification");
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
  const found = [...answer.matchAll(/\[(O\d+|W\d+)\]/g)].map((match) => match[1]);
  const uniqueFound = [...new Set(found)];
  const invalid = uniqueFound.filter((id) => !valid.has(id));
  const validFound = uniqueFound.filter((id) => valid.has(id));
  const rawUrls = [...answer.matchAll(/https?:\/\/[^\s<>"'`{}\[\]]+/g)]
    .map((match) => canonicalUrl(match[0]))
    .filter(Boolean);
  const allowedUrls = new Set(evidence.map((item) => canonicalUrl(item.url)).filter(Boolean));
  const unapprovedUrls = [...new Set(rawUrls.filter((url) => !allowedUrls.has(url)))];
  return {
    validFound,
    invalid,
    unapprovedUrls,
    hasGrounding: validFound.length > 0 || evidence.length === 0,
  };
}
