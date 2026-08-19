import "server-only";

import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import type { AgentSource } from "@/types/admin";
import type { LegalNewsCategory, LegalNewsItem, LegalNewsPeriod } from "@/types/legal-news";

const DEFAULT_CACHE_SECONDS = 1800;
const DEFAULT_MAX_ITEMS = 18;
const legalKeywords = /قانون|تشريع|مرسوم|قرار|محكمة|القضاء|النيابة|وزارة العدل|التنفيذ|المحاماة|الشورى|مجلس النواب|الجريدة الرسمية|هيئة التشريع|التمييز|الاستئناف|constitutional|legislation|law|court|judicial|justice|prosecution|lawyer|advocacy|official gazette/i;

function cacheSeconds() {
  const value = Number(process.env.LEGAL_NEWS_CACHE_SECONDS ?? DEFAULT_CACHE_SECONDS);
  return Number.isFinite(value) && value >= 300 ? Math.round(value) : DEFAULT_CACHE_SECONDS;
}

function maxItems() {
  const value = Number(process.env.LEGAL_NEWS_MAX_ITEMS ?? DEFAULT_MAX_ITEMS);
  return Number.isFinite(value) && value >= 6 ? Math.min(40, Math.round(value)) : DEFAULT_MAX_ITEMS;
}

function cleanText(value: string) {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

function absolutizeUrl(value: string, base: string) {
  try { return new URL(value, base).toString(); } catch { return ""; }
}

function stableId(url: string, title: string) {
  return createHash("sha1").update(`${url}|${title}`).digest("hex").slice(0, 16);
}

function safeDate(value: string | undefined) {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? new Date().toISOString() : parsed.toISOString();
}

function extractTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? cleanText(match[1]) : "";
}

function extractImage(xml: string) {
  const candidates = [
    xml.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1],
    xml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1],
    xml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\//i)?.[1],
    xml.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1],
  ].filter(Boolean) as string[];
  return candidates[0] ?? "";
}

function categoryFor(text: string): LegalNewsCategory {
  if (/محام|lawyer|advocacy/i.test(text)) return "legal-profession";
  if (/نيابة|prosecution/i.test(text)) return "prosecution";
  if (/خدمة|إلكتروني|بوابة|service|digital|online/i.test(text)) return "justice-service";
  if (/قانون|تشريع|مرسوم|الجريدة الرسمية|legislation|law|decree|official gazette/i.test(text)) return "legislation";
  if (/محكمة|قضاء|تمييز|استئناف|court|judicial|appeal/i.test(text)) return "judiciary";
  return "government";
}

function importanceFor(text: string) {
  let score = 2;
  if (/قانون|مرسوم بقانون|الجريدة الرسمية|law|legislation|official gazette/i.test(text)) score += 2;
  if (/محكمة التمييز|المحكمة الدستورية|وزارة العدل|النيابة العامة|cassation|constitutional/i.test(text)) score += 1;
  return Math.min(5, score) as 1 | 2 | 3 | 4 | 5;
}

function inferInstrument(text: string) {
  return text.match(/(?:قانون|مرسوم(?:\s+بقانون)?|قرار)\s+رقم\s*\(?([0-9٠-٩]+)\)?\s+لسنة\s*([0-9٠-٩]{4})/i)?.[0];
}

function inferGazette(text: string) {
  return text.match(/(?:رقم\s+الجريدة\s+الرسمية|الجريدة\s+الرسمية\s+رقم)\s*[:：]?\s*([0-9٠-٩]+)/i)?.[1];
}

function itemFromRaw(raw: {
  title: string;
  summary?: string;
  details?: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: LegalNewsItem["sourceType"];
  publishedAt?: string;
  imageUrl?: string;
}): LegalNewsItem | null {
  const title = cleanText(raw.title);
  const summary = cleanText(raw.summary ?? "");
  const details = cleanText(raw.details ?? summary);
  const combined = `${title} ${summary} ${details}`;
  if (!title || !raw.sourceUrl || !legalKeywords.test(combined)) return null;
  const publishedAt = safeDate(raw.publishedAt);
  const sourceType = raw.sourceType;
  return {
    id: stableId(raw.sourceUrl, title),
    title,
    summary: summary.slice(0, 360) || title,
    details: (details || summary || title).slice(0, 1800),
    sourceName: raw.sourceName,
    sourceUrl: raw.sourceUrl,
    sourceType,
    publishedAt,
    fetchedAt: new Date().toISOString(),
    category: categoryFor(combined),
    verification: sourceType === "official" ? "official" : sourceType === "bna" ? "government" : "reported",
    importance: importanceFor(combined),
    imageUrl: raw.imageUrl || undefined,
    legalInstrumentNumber: inferInstrument(combined),
    gazetteNumber: inferGazette(combined),
  };
}

function parseRss(xml: string, sourceUrl: string) {
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  return items.map((item) => itemFromRaw({
    title: extractTag(item, "title"),
    summary: extractTag(item, "description") || extractTag(item, "content:encoded"),
    details: extractTag(item, "content:encoded") || extractTag(item, "description"),
    sourceName: "وكالة أنباء البحرين",
    sourceUrl: absolutizeUrl(extractTag(item, "link"), sourceUrl),
    sourceType: "bna",
    publishedAt: extractTag(item, "pubDate") || extractTag(item, "dc:date"),
    imageUrl: absolutizeUrl(extractImage(item), sourceUrl),
  })).filter((item): item is LegalNewsItem => Boolean(item));
}

async function fetchText(url: string) {
  if (!url) return "";
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "AbdulrahmanLawLegalNews/1.0 (+https://abdulrahman-law.example)" },
      next: { revalidate: cacheSeconds() },
      signal: AbortSignal.timeout(12_000),
    });
    return response.ok ? await response.text() : "";
  } catch { return ""; }
}

async function discoverBnaFeeds() {
  const configured = (process.env.BNA_RSS_URLS ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  if (configured.length) return configured;
  const indexUrl = process.env.BNA_RSS_INDEX_URL ?? "https://beta.bna.bh/rss";
  const html = await fetchText(indexUrl);
  const discovered = [...html.matchAll(/href=["']([^"']+)["']/gi)]
    .map((match) => absolutizeUrl(match[1], indexUrl))
    .filter((url) => /rss|feed|xml/i.test(url) && url !== indexUrl);
  return Array.from(new Set(discovered)).slice(0, 8);
}

async function bnaItems() {
  const feeds = await discoverBnaFeeds();
  const results = await Promise.all(feeds.map(async (url) => parseRss(await fetchText(url), url)));
  return results.flat();
}

async function legislationItems() {
  const url = process.env.BAHRAIN_LEGAL_AFFAIRS_URL ?? "https://www.legalaffairs.gov.bh/";
  const html = await fetchText(url);
  if (!html) return [];
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']*(?:Legislation|legislation)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  return anchors.map((match) => {
    const href = absolutizeUrl(match[1], url);
    const title = cleanText(match[2]);
    if (!href || title.length < 12 || /ابحث في التشريعات|search legislations?/i.test(title)) return null;
    const start = Math.max(0, (match.index ?? 0) - 500);
    const end = Math.min(html.length, (match.index ?? 0) + match[0].length + 700);
    const context = cleanText(html.slice(start, end));
    return itemFromRaw({
      title,
      summary: context,
      details: context,
      sourceName: "هيئة التشريع والرأي القانوني",
      sourceUrl: href,
      sourceType: "official",
      publishedAt: context.match(/(?:التاريخ|Date)\s*[:：]?\s*([^|]{5,40})/i)?.[1],
    });
  }).filter((item): item is LegalNewsItem => Boolean(item));
}

async function tavilyFallback() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || process.env.LEGAL_NEWS_TAVILY_FALLBACK === "false") return [];
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        query: "البحرين قانون تشريع محكمة وزارة العدل النيابة العامة آخر الأخبار",
        topic: "news",
        search_depth: "basic",
        max_results: 10,
        days: 10,
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        include_domains: ["beta.bna.bh", "bna.bh", "legalaffairs.gov.bh", "moj.gov.bh", "ppb.gov.bh", "akhbar-alkhaleej.com", "albiladpress.com"],
      }),
      signal: AbortSignal.timeout(14_000),
    });
    if (!response.ok) return [];
    const data = await response.json() as { results?: Array<{ title?: string; url?: string; content?: string; published_date?: string }> };
    return (data.results ?? []).map((result) => {
      if (!result.title || !result.url) return null;
      const hostname = (() => { try { return new URL(result.url).hostname; } catch { return ""; } })();
      const official = /legalaffairs\.gov\.bh|moj\.gov\.bh|ppb\.gov\.bh/i.test(hostname);
      const bna = /(?:^|\.)bna\.bh$|beta\.bna\.bh/i.test(hostname);
      return itemFromRaw({
        title: result.title,
        summary: result.content,
        details: result.content,
        sourceName: official ? "مصدر حكومي بحريني" : bna ? "وكالة أنباء البحرين" : hostname.replace(/^www\./, ""),
        sourceUrl: result.url,
        sourceType: official ? "official" : bna ? "bna" : "press",
        publishedAt: result.published_date,
      });
    }).filter((item): item is LegalNewsItem => Boolean(item));
  } catch { return []; }
}

function dedupe(items: LegalNewsItem[]) {
  const map = new Map<string, LegalNewsItem>();
  for (const item of items) {
    const key = item.sourceUrl.toLowerCase().replace(/\?.*$/, "") || item.title.toLowerCase().replace(/\W/g, "").slice(0, 90);
    const existing = map.get(key);
    if (!existing || item.importance > existing.importance) map.set(key, item);
  }
  return [...map.values()]
    .sort((a, b) => b.importance - a.importance || new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf())
    .slice(0, maxItems());
}

async function loadLegalNewsUncached() {
  const [bna, legislation] = await Promise.all([bnaItems(), legislationItems()]);
  let merged = [...bna, ...legislation];
  if (merged.length < 5) merged = [...merged, ...(await tavilyFallback())];
  return dedupe(merged);
}

const getCachedLegalNews = unstable_cache(loadLegalNewsUncached, ["bahrain-legal-news-v1"], {
  revalidate: cacheSeconds(),
  tags: ["legal-news"],
});

function fromPeriod(period: LegalNewsPeriod) {
  const now = new Date();
  const start = new Date(now);
  if (period === "today") start.setHours(0, 0, 0, 0);
  else start.setDate(now.getDate() - (period === "week" ? 7 : 30));
  return start.valueOf();
}

export async function getLegalNews(period: LegalNewsPeriod = "week", limit = 12) {
  const items = await getCachedLegalNews();
  const threshold = fromPeriod(period);
  const filtered = items.filter((item) => new Date(item.publishedAt).valueOf() >= threshold);
  const selected = (filtered.length ? filtered : items).slice(0, Math.max(1, Math.min(limit, 24)));
  return selected;
}

export function isLegalNewsQuery(query: string) {
  return /آخر.*(?:أخبار|مستجدات)|أخبار.*(?:قانون|قضائ|تشريع)|مستجدات.*(?:قانون|قضائ|تشريع)|هذا الأسبوع|الأسبوع اللي طاف|legal news|judicial news|legislative updates/i.test(query);
}

export function periodFromQuery(query: string): LegalNewsPeriod {
  if (/اليوم|today/i.test(query)) return "today";
  if (/30|شهر|month/i.test(query)) return "month";
  return "week";
}

export function legalNewsForAgent(items: LegalNewsItem[]) {
  const context = items.map((item, index) =>
    `[W${index + 1}] ${item.title}\nSource: ${item.sourceName}\nPublished: ${item.publishedAt}\nURL: ${item.sourceUrl}\nVerification: ${item.verification}\nCategory: ${item.category}\nSummary: ${item.summary}`,
  ).join("\n\n");
  const sources: AgentSource[] = items.map((item) => ({ title: item.title, url: item.sourceUrl, snippet: item.summary }));
  return { context, sources };
}
