import "server-only";

import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import type { AgentSource } from "@/types/admin";
import type { LegalNewsCategory, LegalNewsItem, LegalNewsPeriod } from "@/types/legal-news";
import { resolveNewsLogos } from "@/lib/bahrain-logo-match";

const DEFAULT_CACHE_SECONDS = 1800;
const DEFAULT_MAX_ITEMS = 24;
const legalKeywords = /قانون|تشريع|مرسوم|قرار|محكمة|المحاكم|القضاء|قضية|قضايا|حكم|أحكام|سجن|حبس|براءة|استئناف|تمييز|النيابة|المدعي العام|المحامي العام|وزارة العدل|التنفيذ|المحاماة|الشورى|مجلس النواب|الجريدة الرسمية|هيئة التشريع|constitutional|legislation|law|court|judicial|justice|prosecution|prosecutor|attorney general|lawyer|appeal|sentence|convicted|acquitted|jail|prison/i;

function cacheSeconds() {
  const value = Number(process.env.LEGAL_NEWS_CACHE_SECONDS ?? DEFAULT_CACHE_SECONDS);
  return Number.isFinite(value) && value >= 300 ? Math.round(value) : DEFAULT_CACHE_SECONDS;
}

function maxItems() {
  const value = Number(process.env.LEGAL_NEWS_MAX_ITEMS ?? DEFAULT_MAX_ITEMS);
  return Number.isFinite(value) && value >= 6 ? Math.min(60, Math.round(value)) : DEFAULT_MAX_ITEMS;
}

function splitEnvUrls(name: string, defaults: string[]) {
  const configured = (process.env[name] ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  return configured.length ? configured : defaults;
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
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

function cleanText(value: string) {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absolutizeUrl(value: string, base: string) {
  try { return new URL(decodeHtml(value), base).toString(); } catch { return ""; }
}

function stableId(url: string, title: string) {
  return createHash("sha1").update(`${url}|${title}`).digest("hex").slice(0, 16);
}

function safeDate(value: string | undefined) {
  if (!value) return new Date().toISOString();
  const normalized = value.trim().replace(/^(?:نشرت|نشر|بتاريخ|التاريخ|date)\s*[:：-]?\s*/i, "");
  const parsed = new Date(normalized);
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
    xml.match(/<img[^>]+(?:data-src|data-original|src)=["']([^"']+)["']/i)?.[1],
  ].filter(Boolean) as string[];
  return candidates[0] ?? "";
}

function extractPageImage(html: string, pageUrl: string) {
  const candidates = [
    html.match(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i)?.[1],
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:secure_url["']/i)?.[1],
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1],
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1],
    html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i)?.[1],
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i)?.[1],
    html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)?.[1],
    html.match(/<article[\s\S]{0,18000}?<img[^>]+(?:data-src|data-original|src)=["']([^"']+)["']/i)?.[1],
    html.match(/<main[\s\S]{0,18000}?<img[^>]+(?:data-src|data-original|src)=["']([^"']+)["']/i)?.[1],
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    const cleaned = decodeHtml(candidate).trim();
    if (!cleaned || /^data:/i.test(cleaned) || /(?:favicon|sprite|icon)[^/]*\.(?:svg|png|webp|jpg)/i.test(cleaned)) continue;
    const absolute = absolutizeUrl(cleaned, pageUrl);
    if (absolute) return absolute;
  }
  return "";
}

function categoryFor(text: string): LegalNewsCategory {
  if (/محام|lawyer|advocacy/i.test(text)) return "legal-profession";
  if (/نيابة|prosecution|prosecutor|attorney general/i.test(text)) return "prosecution";
  if (/خدمة|إلكتروني|بوابة|service|digital|online|notary|توثيق/i.test(text)) return "justice-service";
  if (/قانون|تشريع|مرسوم|الجريدة الرسمية|legislation|law|decree|official gazette/i.test(text)) return "legislation";
  if (/محكمة|قضاء|تمييز|استئناف|حكم|سجن|حبس|براءة|court|judicial|appeal|sentence|convicted|acquitted|jail|prison/i.test(text)) return "judiciary";
  return "government";
}

function importanceFor(text: string) {
  let score = 2;
  if (/قانون|مرسوم بقانون|الجريدة الرسمية|law|legislation|official gazette/i.test(text)) score += 2;
  if (/محكمة التمييز|المحكمة الدستورية|وزارة العدل|النيابة العامة|cassation|constitutional|attorney general/i.test(text)) score += 1;
  if (/المؤبد|life sentence|terror|إرهاب/i.test(text)) score += 1;
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
  if (!title || title.length < 8 || !raw.sourceUrl || !legalKeywords.test(combined)) return null;
  const publishedAt = safeDate(raw.publishedAt);
  const sourceType = raw.sourceType;
  return {
    id: stableId(raw.sourceUrl, title),
    title,
    summary: summary.slice(0, 420) || title,
    details: (details || summary || title).slice(0, 2200),
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

type RssSource = {
  sourceName: string;
  sourceType: LegalNewsItem["sourceType"];
  urls: string[];
};

type HtmlSource = {
  sourceName: string;
  sourceType: LegalNewsItem["sourceType"];
  urls: string[];
  articlePath: RegExp;
};

function parseRss(xml: string, sourceUrl: string, sourceName: string, sourceType: LegalNewsItem["sourceType"]) {
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  const entries = items.length ? items : [...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((match) => match[0]);
  return entries.map((item) => {
    const linkTag = item.match(/<link\b[^>]*href=["']([^"']+)["']/i)?.[1] || extractTag(item, "link");
    return itemFromRaw({
      title: extractTag(item, "title"),
      summary: extractTag(item, "description") || extractTag(item, "summary") || extractTag(item, "content:encoded"),
      details: extractTag(item, "content:encoded") || extractTag(item, "content") || extractTag(item, "description") || extractTag(item, "summary"),
      sourceName,
      sourceUrl: absolutizeUrl(linkTag, sourceUrl),
      sourceType,
      publishedAt: extractTag(item, "pubDate") || extractTag(item, "published") || extractTag(item, "updated") || extractTag(item, "dc:date"),
      imageUrl: absolutizeUrl(extractImage(item), sourceUrl),
    });
  }).filter((item): item is LegalNewsItem => Boolean(item));
}

function extractDateFromContext(context: string) {
  const iso = context.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1];
  if (iso) return iso;
  const en = context.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+20\d{2}\b/i)?.[0];
  return en || undefined;
}

function parseHtmlNewsLinks(html: string, pageUrl: string, source: HtmlSource) {
  const results: LegalNewsItem[] = [];
  for (const match of html.matchAll(/<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = absolutizeUrl(match[2], pageUrl);
    if (!href || !source.articlePath.test(new URL(href).pathname)) continue;
    const title = cleanText(match[4]);
    if (title.length < 14) continue;
    const start = Math.max(0, (match.index ?? 0) - 120);
    const end = Math.min(html.length, (match.index ?? 0) + match[0].length + 720);
    const rawContext = html.slice(start, end);
    const context = cleanText(rawContext);
    const item = itemFromRaw({
      title,
      summary: context,
      details: context,
      sourceName: source.sourceName,
      sourceUrl: href,
      sourceType: source.sourceType,
      publishedAt: extractDateFromContext(context),
      imageUrl: absolutizeUrl(extractImage(rawContext), pageUrl),
    });
    if (item) results.push(item);
  }
  return dedupeByUrl(results);
}

async function fetchText(url: string) {
  if (!url) return "";
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; AbdulrahmanLawLegalNews/2.0; +https://abdulrahman-law.example)",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,text/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ar-BH,ar;q=0.9,en;q=0.7",
      },
      next: { revalidate: cacheSeconds() },
      signal: AbortSignal.timeout(12_000),
    });
    return response.ok ? await response.text() : "";
  } catch { return ""; }
}

async function enrichNewsMedia(items: LegalNewsItem[]) {
  return Promise.all(items.map(async (item) => {
    let imageUrl = item.imageUrl ?? "";
    if (!imageUrl) {
      const html = await fetchText(item.sourceUrl);
      imageUrl = html ? extractPageImage(html, item.sourceUrl) : "";
    }
    const logos = resolveNewsLogos({
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      title: item.title,
      summary: item.summary,
      details: item.details,
    });
    const sourceLogo = logos.find((logo) => logo.role === "source") ?? logos[0];
    const relatedLogos = logos
      .filter((logo) => logo.url !== sourceLogo?.url)
      .slice(0, 3)
      .map(({ name, url, role = "entity" }) => ({ name, url, role }));
    return {
      ...item,
      imageUrl: imageUrl || undefined,
      sourceLogoUrl: sourceLogo?.url,
      sourceLogoName: sourceLogo?.name,
      sourceLogo: sourceLogo ? { name: sourceLogo.name, url: sourceLogo.url, role: sourceLogo.role ?? "source" } : undefined,
      relatedLogos,
    };
  }));
}

async function discoverBnaFeeds() {
  const configured = (process.env.BNA_RSS_URLS ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  if (configured.length) return configured;
  const indexUrl = process.env.BNA_RSS_INDEX_URL ?? "https://beta.bna.bh/rss";
  const html = await fetchText(indexUrl);
  const discovered = [...html.matchAll(/href=["']([^"']+)["']/gi)]
    .map((match) => absolutizeUrl(match[1], indexUrl))
    .filter((url) => /rss|feed|xml/i.test(url) && url !== indexUrl);
  return Array.from(new Set(discovered)).slice(0, 10);
}

async function bnaItems() {
  const feeds = await discoverBnaFeeds();
  const results = await Promise.all(feeds.map(async (url) => parseRss(await fetchText(url), url, "وكالة أنباء البحرين", "bna")));
  return results.flat();
}

const rssSources: RssSource[] = [
  {
    sourceName: "صحيفة الوطن",
    sourceType: "press",
    urls: splitEnvUrls("ALWATAN_RSS_URLS", [
      "https://alwatannews.net/rssFeed/0",
      "https://alwatannews.net/rssFeed/100",
      "https://alwatannews.net/rssFeed/135/112",
    ]),
  },
  {
    sourceName: "صحيفة الأيام",
    sourceType: "press",
    urls: splitEnvUrls("ALAYAM_RSS_URLS", [
      "https://feeds.feedburner.com/alayam-news-list-all",
      "https://feeds.feedburner.com/alayam-online-local-news",
      "https://feeds.feedburner.com/alayam-daily-local-news",
    ]),
  },
  {
    sourceName: "صحيفة البلاد",
    sourceType: "press",
    urls: splitEnvUrls("ALBILAD_RSS_URLS", ["https://www.albiladpress.com/rss"]),
  },
];

const htmlSources: HtmlSource[] = [
  {
    sourceName: "أخبار الخليج",
    sourceType: "press",
    urls: splitEnvUrls("AKHBAR_ALKHALEEJ_URLS", [
      "https://akhbar-alkhaleej.com/news/section/EVNT",
      "https://akhbar-alkhaleej.com/news/section/BNEW",
    ]),
    articlePath: /^\/news\/article\/\d+/i,
  },
  {
    sourceName: "صحيفة الأيام",
    sourceType: "press",
    urls: splitEnvUrls("ALAYAM_HTML_URLS", ["https://www.alayam.com/alayam/Courts"]),
    articlePath: /^\/alayam\/Courts\/\d+/i,
  },
  {
    sourceName: "صحيفة البلاد",
    sourceType: "press",
    urls: splitEnvUrls("ALBILAD_HTML_URLS", [
      "https://www.albiladpress.com/latest-news",
      "https://www.albiladpress.com/news/bahrain",
    ]),
    articlePath: /^\/news\/20\d{2}\/\d+\/[^/]+\/\d+\.html/i,
  },
  {
    sourceName: "Gulf Daily News",
    sourceType: "press",
    urls: splitEnvUrls("GDN_URLS", ["https://www.gdnonline.com/Section/1/Bahrain"]),
    articlePath: /^\/Details\/\d+/i,
  },
  {
    sourceName: "Daily Tribune",
    sourceType: "press",
    urls: splitEnvUrls("DAILY_TRIBUNE_URLS", ["https://www.newsofbahrain.com/bahrain/"]),
    articlePath: /^\/bahrain\/\d+\.html/i,
  },
];

async function rssPressItems() {
  const groups = await Promise.all(rssSources.map(async (source) => {
    const results = await Promise.all(source.urls.map(async (url) => parseRss(await fetchText(url), url, source.sourceName, source.sourceType)));
    return results.flat();
  }));
  return groups.flat();
}

async function htmlPressItems() {
  const groups = await Promise.all(htmlSources.map(async (source) => {
    const results = await Promise.all(source.urls.map(async (url) => parseHtmlNewsLinks(await fetchText(url), url, source)));
    return results.flat();
  }));
  return groups.flat();
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
    const start = Math.max(0, (match.index ?? 0) - 600);
    const end = Math.min(html.length, (match.index ?? 0) + match[0].length + 850);
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
        query: "البحرين قانون تشريع محكمة وزارة العدل النيابة العامة أحكام قضايا آخر الأخبار",
        topic: "news",
        search_depth: "basic",
        max_results: 16,
        days: 10,
        include_answer: false,
        include_images: true,
        include_raw_content: false,
        include_domains: [
          "beta.bna.bh", "bna.bh", "legalaffairs.gov.bh", "moj.gov.bh", "ppb.gov.bh",
          "akhbar-alkhaleej.com", "alayam.com", "albiladpress.com", "alwatannews.net",
          "gdnonline.com", "newsofbahrain.com",
        ],
      }),
      signal: AbortSignal.timeout(14_000),
    });
    if (!response.ok) return [];
    const data = await response.json() as { results?: Array<{ title?: string; url?: string; content?: string; published_date?: string; images?: string[] }> };
    return (data.results ?? []).map((result) => {
      if (!result.title || !result.url) return null;
      const hostname = (() => { try { return new URL(result.url).hostname.replace(/^www\./, ""); } catch { return ""; } })();
      const official = /legalaffairs\.gov\.bh|moj\.gov\.bh|ppb\.gov\.bh/i.test(hostname);
      const bna = /(?:^|\.)bna\.bh$|beta\.bna\.bh/i.test(hostname);
      const sourceNames: Record<string, string> = {
        "akhbar-alkhaleej.com": "أخبار الخليج",
        "alayam.com": "صحيفة الأيام",
        "albiladpress.com": "صحيفة البلاد",
        "alwatannews.net": "صحيفة الوطن",
        "gdnonline.com": "Gulf Daily News",
        "newsofbahrain.com": "Daily Tribune",
      };
      return itemFromRaw({
        title: result.title,
        summary: result.content,
        details: result.content,
        sourceName: official ? "مصدر حكومي بحريني" : bna ? "وكالة أنباء البحرين" : sourceNames[hostname] ?? hostname,
        sourceUrl: result.url,
        sourceType: official ? "official" : bna ? "bna" : "press",
        publishedAt: result.published_date,
        imageUrl: result.images?.[0],
      });
    }).filter((item): item is LegalNewsItem => Boolean(item));
  } catch { return []; }
}

function dedupeByUrl(items: LegalNewsItem[]) {
  const map = new Map<string, LegalNewsItem>();
  for (const item of items) {
    const normalizedUrl = item.sourceUrl.toLowerCase().replace(/\?.*$/, "").replace(/\/$/, "");
    const key = normalizedUrl || item.title.toLowerCase().replace(/\W/g, "").slice(0, 100);
    const existing = map.get(key);
    if (!existing || item.importance > existing.importance || item.summary.length > existing.summary.length) map.set(key, item);
  }
  return [...map.values()];
}

function sourceBucket(item: LegalNewsItem) {
  return item.sourceName.toLowerCase().replace(/\s+/g, " ").trim();
}

function diversify(items: LegalNewsItem[], limit: number) {
  const sorted = dedupeByUrl(items).sort((a, b) =>
    b.importance - a.importance || new Date(b.publishedAt).valueOf() - new Date(a.publishedAt).valueOf()
  );
  const buckets = new Map<string, LegalNewsItem[]>();
  for (const item of sorted) {
    const key = sourceBucket(item);
    const bucket = buckets.get(key) ?? [];
    bucket.push(item);
    buckets.set(key, bucket);
  }

  const officialKeys = [...buckets.keys()].filter((key) => /هيئة التشريع|وكالة أنباء البحرين|مصدر حكومي/i.test(key));
  const pressKeys = [...buckets.keys()].filter((key) => !officialKeys.includes(key));
  const sourceOrder = [...officialKeys, ...pressKeys].sort((a, b) => (buckets.get(b)?.[0]?.importance ?? 0) - (buckets.get(a)?.[0]?.importance ?? 0));
  const selected: LegalNewsItem[] = [];
  const perSourceCap = Math.max(2, Math.ceil(limit / Math.max(3, Math.min(sourceOrder.length, 8))));

  for (let round = 0; selected.length < limit; round += 1) {
    let added = false;
    for (const key of sourceOrder) {
      const bucket = buckets.get(key) ?? [];
      if (round >= perSourceCap || !bucket[round]) continue;
      selected.push(bucket[round]);
      added = true;
      if (selected.length >= limit) break;
    }
    if (!added || round > perSourceCap + 2) break;
  }

  if (selected.length < limit) {
    for (const item of sorted) {
      if (!selected.some((picked) => picked.id === item.id)) selected.push(item);
      if (selected.length >= limit) break;
    }
  }
  return selected.slice(0, limit);
}

async function loadLegalNewsUncached() {
  const [bna, legislation, rssPress, htmlPress] = await Promise.all([
    bnaItems(),
    legislationItems(),
    rssPressItems(),
    htmlPressItems(),
  ]);
  let merged = [...bna, ...legislation, ...rssPress, ...htmlPress];
  const distinctSources = new Set(merged.map((item) => sourceBucket(item))).size;
  if (merged.length < 12 || distinctSources < 4) merged = [...merged, ...(await tavilyFallback())];
  const diversified = diversify(merged, maxItems());
  return enrichNewsMedia(diversified);
}

const getCachedLegalNews = unstable_cache(loadLegalNewsUncached, ["bahrain-legal-news-v6-smart-multisource"], {
  revalidate: cacheSeconds(),
  tags: ["legal-news"],
});

function fromPeriod(period: LegalNewsPeriod) {
  const now = new Date();
  if (period === "today") {
    // Bahrain is UTC+3 year-round. Compute midnight in Bahrain, then convert it back to UTC.
    const bahrainNow = new Date(now.valueOf() + 3 * 60 * 60 * 1000);
    return Date.UTC(bahrainNow.getUTCFullYear(), bahrainNow.getUTCMonth(), bahrainNow.getUTCDate()) - 3 * 60 * 60 * 1000;
  }
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - (period === "week" ? 7 : 30));
  return start.valueOf();
}

export async function getLegalNews(period: LegalNewsPeriod = "week", limit = 12) {
  const items = await getCachedLegalNews();
  const threshold = fromPeriod(period);
  const filtered = items.filter((item) => new Date(item.publishedAt).valueOf() >= threshold);
  // Never label older stories as "today" just because today's feed is empty.
  if (period === "today") return diversify(filtered, Math.max(1, Math.min(limit, 30)));
  const base = filtered.length ? filtered : items;
  return diversify(base, Math.max(1, Math.min(limit, 30)));
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
  const sources: AgentSource[] = items.map((item) => ({
    title: item.title,
    url: item.sourceUrl,
    snippet: `${item.sourceName} · ${item.summary}`,
  }));
  return { context, sources };
}

export function legalNewsToAgentSources(items: LegalNewsItem[]): AgentSource[] {
  return items.map((item) => ({
    title: item.title,
    url: item.sourceUrl,
    snippet: `${item.sourceName} · ${item.summary}`,
  }));
}
