import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { bahrainLogoCatalog, type BahrainLogoRecord } from "@/data/bahrain-logo-catalog";
import { rankBahrainLogosForText, resolveSourceLogo } from "@/lib/bahrain-logo-match";

let cachedLogos: BahrainLogoRecord[] | null = null;

function decodeEntities(value: string) {
  return value
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
  const candidates = ["bahrain-logos-all-categorized.html", "bahrain-logo.html", "bahrain-logo(1).html"];
  for (const filename of candidates) {
    try {
      const html = await readFile(path.join(process.cwd(), filename), "utf8");
      const parsed = dedupe([...parseCategorizedLogoHtml(html), ...parseOriginalLogoHtml(html)]);
      if (parsed.length >= 50) {
        // Keep the generated 265-logo catalog as a safety net for files that contain only one paginated source page.
        const merged = dedupe([...parsed, ...bahrainLogoCatalog]);
        cachedLogos = merged;
        return cachedLogos;
      }
    } catch {
      // Try the next root file. Production bundles may omit standalone HTML files.
    }
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
