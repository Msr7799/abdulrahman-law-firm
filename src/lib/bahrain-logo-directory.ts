import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { bahrainLogoCatalog, type BahrainLogoRecord } from "@/data/bahrain-logo-catalog";
import { rankBahrainLogosForText, resolveSourceLogo } from "@/lib/bahrain-logo-match";

let cachedLogos: BahrainLogoRecord[] | null = null;

function decodeEntities(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function parseOriginalLogoHtml(html: string): BahrainLogoRecord[] {
  const logos: BahrainLogoRecord[] = [];
  const matcher = /<a\s+[^>]*id="([^"]+)"[^>]*style="[\s\S]*?background-image:\s*url\(&quot;([^&]+(?:&amp;[^&]+)*)&quot;\);[\s\S]*?class="logo-link\s+w-inline-block"/gi;
  for (const match of html.matchAll(matcher)) {
    const name = decodeEntities(match[1] ?? "").trim();
    const url = decodeEntities(match[2] ?? "").trim();
    if (name && /^https:\/\//i.test(url)) logos.push({ name, url, category: "غير مصنف" });
  }
  return logos;
}

function parseCategorizedLogoHtml(html: string): BahrainLogoRecord[] {
  const logos: BahrainLogoRecord[] = [];
  const detailsMatcher = /<details\b[^>]*class="[^"]*group[^"]*"[^>]*>([\s\S]*?)<\/details>/gi;
  for (const detailsMatch of html.matchAll(detailsMatcher)) {
    const block = detailsMatch[1] ?? "";
    const category = decodeEntities(block.match(/<span\s+class="title">([\s\S]*?)<\/span>/i)?.[1] ?? "غير مصنف").replace(/<[^>]+>/g, "").trim();
    const cardMatcher = /<div\s+class="card"\s+data-name="([^"]+)"[\s\S]*?<img\s+[\s\S]*?src="([^"]+)"/gi;
    for (const cardMatch of block.matchAll(cardMatcher)) {
      const name = decodeEntities(cardMatch[1] ?? "").trim();
      const url = decodeEntities(cardMatch[2] ?? "").trim();
      if (name && /^https:\/\//i.test(url)) logos.push({ name, url, category });
    }
  }
  return logos;
}

function dedupe(logos: BahrainLogoRecord[]) {
  return Array.from(new Map(logos.map((logo) => [logo.name.toLowerCase(), logo])).values());
}

export async function getBahrainLogoDirectory() {
  if (cachedLogos) return cachedLogos;

  // Keep each root path statically analyzable. Using a variable filename inside
  // path.join(process.cwd(), filename) makes Turbopack trace the whole project.
  try {
    const html = await readFile(path.join(process.cwd(), "bahrain-logos-all-categorized.html"), "utf8");
    const parsed = dedupe([...parseCategorizedLogoHtml(html), ...parseOriginalLogoHtml(html)]);
    if (parsed.length >= 200) {
      cachedLogos = parsed;
      return cachedLogos;
    }
    if (parsed.length >= 50) {
      cachedLogos = dedupe([...parsed, ...bahrainLogoCatalog]);
      return cachedLogos;
    }
  } catch {
    // Production bundles may omit the standalone curated HTML file.
  }

  try {
    const html = await readFile(path.join(process.cwd(), "bahrain-logo.html"), "utf8");
    const parsed = dedupe([...parseCategorizedLogoHtml(html), ...parseOriginalLogoHtml(html)]);
    if (parsed.length >= 50) {
      cachedLogos = dedupe([...parsed, ...bahrainLogoCatalog]);
      return cachedLogos;
    }
  } catch {
    // Try the remaining legacy capture.
  }

  try {
    const html = await readFile(path.join(process.cwd(), "bahrain-logo(1).html"), "utf8");
    const parsed = dedupe([...parseCategorizedLogoHtml(html), ...parseOriginalLogoHtml(html)]);
    if (parsed.length >= 50) {
      cachedLogos = dedupe([...parsed, ...bahrainLogoCatalog]);
      return cachedLogos;
    }
  } catch {
    // Fall back to the generated in-bundle catalog below.
  }

  cachedLogos = bahrainLogoCatalog.map((logo) => ({ ...logo }));
  return cachedLogos;
}

export async function findBahrainLogoForText(text: string, sourceUrl?: string) {
  // Preserve the original async API while using the shared client/server matcher.
  const source = resolveSourceLogo(text, sourceUrl);
  if (source) return source;
  return rankBahrainLogosForText(`${text} ${sourceUrl ?? ""}`, 1)[0] ?? null;
}


function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function meaningfulWords(value: string) {
  return normalizeSearchText(value).split(" ").filter((word) => word.length >= 3);
}

export type BahrainLogoDirectoryMatch = BahrainLogoRecord & { score: number };

/**
 * Searches the full root bahrain-logos-all-categorized.html directory first.
 * The generated TypeScript catalog is only a deployment safety fallback.
 */
export async function searchBahrainLogoDirectory(text: string, limit = 12): Promise<BahrainLogoDirectoryMatch[]> {
  const directory = await getBahrainLogoDirectory();
  const normalized = normalizeSearchText(text);
  if (!normalized) return [];
  const words = new Set(meaningfulWords(text));

  // Alias rules know Bahrain-specific Arabic/English names (e.g. المرور, النيابة, BNA).
  const aliases = rankBahrainLogosForText(text, Math.max(limit * 2, 12));
  const aliasScore = new Map<string, number>();
  aliases.forEach((logo, index) => {
    aliasScore.set(normalizeSearchText(logo.name), 220 - index * 3);
    aliasScore.set(logo.url, 220 - index * 3);
  });

  const scored = directory.map((logo) => {
    const name = normalizeSearchText(logo.name);
    let score = Math.max(aliasScore.get(name) ?? 0, aliasScore.get(logo.url) ?? 0);
    if (normalized.includes(name) && name.length >= 4) score = Math.max(score, 180 + Math.min(30, name.length / 2));
    for (const part of logo.name.split("·")) {
      const candidate = normalizeSearchText(part);
      if (candidate.length >= 4 && normalized.includes(candidate)) score = Math.max(score, 170 + Math.min(25, candidate.length / 2));
    }
    const nameWords = meaningfulWords(logo.name).filter((word) => word.length >= 4);
    const hits = nameWords.filter((word) => words.has(word) || normalized.includes(word)).length;
    if (hits) score = Math.max(score, 45 + hits * 16 + (hits / Math.max(1, nameWords.length)) * 30);
    const categoryHits = meaningfulWords(logo.category).filter((word) => words.has(word)).length;
    if (categoryHits) score = Math.max(score, 35 + categoryHits * 10);
    return { ...logo, score };
  }).filter((logo) => logo.score >= 55).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return Array.from(new Map(scored.map((logo) => [logo.url, logo])).values()).slice(0, Math.max(1, Math.min(limit, 24)));
}

export async function bahrainLogoDirectorySummary() {
  const directory = await getBahrainLogoDirectory();
  const categories = new Map<string, number>();
  for (const logo of directory) categories.set(logo.category || "غير مصنف", (categories.get(logo.category || "غير مصنف") ?? 0) + 1);
  return {
    total: directory.length,
    categories: Array.from(categories.entries()).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
  };
}
