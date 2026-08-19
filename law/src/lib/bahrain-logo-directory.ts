import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { bahrainLogoFallback } from "@/data/bahrain-logo-fallback";

type BahrainLogo = { name: string; url: string };

let cachedLogos: BahrainLogo[] | null = null;

function decodeEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function parseLogoHtml(html: string): BahrainLogo[] {
  const logos: BahrainLogo[] = [];
  const matcher = /<a\s+[^>]*id="([^"]+)"[^>]*style="[\s\S]*?background-image:\s*url\(&quot;([^&]+(?:&amp;[^&]+)*)&quot;\);[\s\S]*?class="logo-link\s+w-inline-block"/gi;
  for (const match of html.matchAll(matcher)) {
    const name = decodeEntities(match[1] ?? "").trim();
    const url = decodeEntities(match[2] ?? "").trim();
    if (name && /^https:\/\//i.test(url)) logos.push({ name, url });
  }
  return Array.from(new Map(logos.map((logo) => [logo.name.toLowerCase(), logo])).values());
}

export async function getBahrainLogoDirectory() {
  if (cachedLogos) return cachedLogos;
  try {
    const html = await readFile(path.join(process.cwd(), "bahrain-logo.html"), "utf8");
    const parsed = parseLogoHtml(html);
    if (parsed.length) {
      cachedLogos = parsed;
      return cachedLogos;
    }
  } catch {
    // Production bundles may omit the root HTML; the generated fallback keeps the feature working.
  }
  cachedLogos = bahrainLogoFallback.map((logo) => ({ ...logo }));
  return cachedLogos;
}

const aliases: Array<{ patterns: RegExp[]; logo: string }> = [
  { patterns: [/وكالة أنباء البحرين|وكالة البحرين للأنباء|bahrain news agency|\bbna\b/i], logo: "Bahrain News Agency" },
  { patterns: [/وزارة العدل|الشؤون الإسلامية|الأوقاف|المحكمة|المحاكم|القضاء|judicial|court|ministry of justice/i], logo: "Ministry of Justice, Islamic Affairs and Waqf" },
  { patterns: [/وزارة الداخلية|الداخلية|الشرطة|الأمن العام|ministry of interior/i], logo: "Ministry of Interior" },
  { patterns: [/وزارة الإعلام|الإعلام|ministry of information/i], logo: "Ministry of Information" },
  { patterns: [/هيئة المعلومات والحكومة الإلكترونية|الحكومة الإلكترونية|information.*government authority|iga/i], logo: "Information & Government Authority" },
  { patterns: [/مجلس الشورى|الشورى|shura/i], logo: "Shura" },
  { patterns: [/وحدة التحقيق الخاصة|special investigation unit/i], logo: "Special Investigation Unit" },
  { patterns: [/ديوان الرقابة المالية|الرقابة المالية والإدارية|national audit office/i], logo: "National Audit Office" },
  { patterns: [/هيئة تنظيم سوق العقارات|real estate regulatory authority|ريرا|rera/i], logo: "Real Estate Regulatory Authority" },
  { patterns: [/الهيئة الوطنية لتنظيم المهن والخدمات الصحية|national health regulatory authority|نهرا|nhra/i], logo: "National Health Regulatory Authority" },
  { patterns: [/نظام تواصل|تواصل|tawasul/i], logo: "The National Suggestion & Complaint system – Tawasul" },
  { patterns: [/مستشفيات حكومية|government hospitals/i], logo: "Government Hospitals" },
  { patterns: [/وزارة التنمية المستدامة|sustainable development/i], logo: "Ministry of Sustainable Development" },
  { patterns: [/الجهاز الوطني للإيرادات|القيمة المضافة|national bureau for revenue|nbr/i], logo: "National Bureau for Revenue" },
  { patterns: [/جامعة البحرين|university of bahrain/i], logo: "University of Bahrain" },
  { patterns: [/بوليتكنك البحرين|bahrain polytechnic/i], logo: "Bahrain Polytechnic New" },
  { patterns: [/الحكومة البحرينية|حكومة البحرين|مملكة البحرين|government of bahrain/i], logo: "Government of Bahrain" },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[\u064B-\u065F\u0670]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export async function findBahrainLogoForText(text: string, sourceUrl?: string) {
  const logos = await getBahrainLogoDirectory();
  const haystack = `${text} ${sourceUrl ?? ""}`;
  const preferred = aliases.find((entry) => entry.patterns.some((pattern) => pattern.test(haystack)))?.logo;
  if (preferred) {
    const exact = logos.find((logo) => logo.name.toLowerCase() === preferred.toLowerCase());
    if (exact) return exact;
  }

  const normalized = normalize(haystack);
  let best: { logo: BahrainLogo; score: number } | null = null;
  for (const logo of logos) {
    const words = normalize(logo.name).split(" ").filter((word) => word.length >= 4);
    if (!words.length) continue;
    const score = words.reduce((sum, word) => sum + (normalized.includes(word) ? 1 : 0), 0);
    if (score > (best?.score ?? 0)) best = { logo, score };
  }
  if (best && best.score >= 2) return best.logo;

  return logos.find((logo) => logo.name === "Government of Bahrain")
    ?? logos.find((logo) => logo.name === "Ministry of Justice, Islamic Affairs and Waqf")
    ?? null;
}
