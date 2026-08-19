import { bahrainLogoCatalog, type BahrainLogoRecord } from "@/data/bahrain-logo-catalog";

export type BahrainLogoMatch = BahrainLogoRecord & {
  role?: "source" | "entity" | "prosecution";
  reason?: string;
};

type AliasRule = {
  logo: string;
  patterns: RegExp[];
  weight?: number;
};

const aliasRules: AliasRule[] = [
  { logo: "Public Prosecution", patterns: [/النيابة\s*العامة|النيابه\s*العامه|النيابة|public prosecution|ppb\.gov\.bh/i], weight: 120 },
  { logo: "Ministry of Health", patterns: [/وزارة\s*الصحة|وزاره\s*الصحه|ministry of health|health\.gov\.bh/i], weight: 118 },
  { logo: "Government Hospitals", patterns: [/المستشفيات\s*الحكومية|المستشفيات\s*الحكوميه|government hospitals/i], weight: 118 },
  { logo: "King Hamad University Hospital", patterns: [/مستشفى\s*الملك\s*حمد(?:\s*الجامعي)?|king hamad university hospital|khuh/i], weight: 124 },
  { logo: "Bahrain Defence Force Military Hospital", patterns: [/المستشفى\s*العسكري|مستشفى\s*قوة\s*دفاع\s*البحرين|bahrain defence force military hospital|bdf hospital/i], weight: 124 },
  { logo: "University of Bahrain", patterns: [/جامعة\s*البحرين|جامعه\s*البحرين|university of bahrain|uob\.edu\.bh/i], weight: 124 },
  { logo: "Ministry of Education", patterns: [/وزارة\s*(?:التربية\s*والتعليم|التربية|التعليم)|وزاره\s*(?:التربيه\s*والتعليم|التعليم)|ministry of education|moe\.gov\.bh/i], weight: 116 },
  { logo: "Ministry of Interior", patterns: [/وزارة\s*الداخلية|وزاره\s*الداخليه|ministry of interior|interior\.gov\.bh|moi\.gov\.bh/i], weight: 118 },
  { logo: "Ministry of Justice, Islamic Affairs and Waqf", patterns: [/وزارة\s*العدل|وزاره\s*العدل|ministry of justice|moj\.gov\.bh/i], weight: 118 },
  { logo: "Legislation & Legal Opinion Commission", patterns: [/هيئة\s*التشريع\s*والرأي\s*القانوني|هيئه\s*التشريع\s*والراي\s*القانوني|legislation\s*&?\s*legal opinion|legalaffairs\.gov\.bh/i], weight: 125 },
  { logo: "Ministry of Legal Affairs", patterns: [/وزارة\s*الشؤون\s*القانونية|وزاره\s*الشؤون\s*القانونيه|ministry of legal affairs/i], weight: 118 },
  { logo: "Information & Government Authority", patterns: [/هيئة\s*المعلومات\s*والحكومة\s*الإلكترونية|هيئه\s*المعلومات\s*والحكومه\s*الالكترونيه|information\s*&?\s*government authority|iga\.gov\.bh/i], weight: 118 },
  { logo: "Labour Market Regularity Authority", patterns: [/هيئة\s*تنظيم\s*سوق\s*العمل|هيئه\s*تنظيم\s*سوق\s*العمل|labour market reg(?:ulatory|ularity) authority|lmra\.gov\.bh/i], weight: 122 },
  { logo: "Ministry of Labour", patterns: [/وزارة\s*العمل|وزاره\s*العمل|ministry of labour|mol\.gov\.bh/i], weight: 116 },
  { logo: "National Health Regulatory Authority", patterns: [/الهيئة\s*الوطنية\s*لتنظيم\s*المهن\s*والخدمات\s*الصحية|نهرا|nhra|national health regulatory authority/i], weight: 122 },
  { logo: "Real Estate Regulatory Authority", patterns: [/هيئة\s*تنظيم\s*سوق\s*العقارات|ريرا|rera|real estate regulatory authority/i], weight: 122 },
  { logo: "Survey & Land Registration Bureau", patterns: [/جهاز\s*المساحة\s*والتسجيل\s*العقاري|جهاز\s*المساحه\s*والتسجيل\s*العقاري|survey\s*&?\s*land registration bureau|slrb/i], weight: 122 },
  { logo: "Social Insurance Organization", patterns: [/الهيئة\s*العامة\s*للتأمين\s*الاجتماعي|الهيئه\s*العامه\s*للتامين\s*الاجتماعي|social insurance organization|sio\.gov\.bh/i], weight: 120 },
  { logo: "National Bureau for Revenue", patterns: [/الجهاز\s*الوطني\s*للإيرادات|الجهاز\s*الوطني\s*للايرادات|national bureau for revenue|nbr\.gov\.bh/i], weight: 120 },
  { logo: "National Audit Office", patterns: [/ديوان\s*الرقابة\s*المالية\s*والإدارية|ديوان\s*الرقابه\s*الماليه\s*والاداريه|national audit office/i], weight: 120 },
  { logo: "Shura", patterns: [/مجلس\s*الشورى|shura/i], weight: 114 },
  { logo: "Bahrain Chamber", patterns: [/غرفة\s*تجارة\s*وصناعة\s*البحرين|غرفه\s*تجاره\s*وصناعه\s*البحرين|bahrain chamber/i], weight: 116 },
  { logo: "Electricity and Water Authority", patterns: [/هيئة\s*الكهرباء\s*والماء|هيئه\s*الكهرباء\s*والماء|electricity and water authority|ewa\.bh/i], weight: 116 },
  { logo: "Supreme Council for Environment", patterns: [/المجلس\s*الأعلى\s*للبيئة|المجلس\s*الاعلى\s*للبيئه|supreme council for environment/i], weight: 116 },
  { logo: "Ministry of Tourism", patterns: [/وزارة\s*السياحة|وزاره\s*السياحه|ministry of tourism/i], weight: 114 },
  { logo: "Bahrain Tourism and Exhibitions Authority", patterns: [/هيئة\s*البحرين\s*للسياحة\s*والمعارض|هيئه\s*البحرين\s*للسياحه\s*والمعارض|bahrain tourism and exhibitions authority|btea/i], weight: 120 },
  { logo: "Capital Municipality", patterns: [/أمانة\s*العاصمة|امانه\s*العاصمه|capital municipality/i], weight: 114 },
  { logo: "Northern Area Municipality", patterns: [/بلدية\s*المنطقة\s*الشمالية|بلديه\s*المنطقه\s*الشماليه|northern area municipality/i], weight: 114 },
  { logo: "Bahrain Airport Company", patterns: [/شركة\s*مطار\s*البحرين|bahrain airport company/i], weight: 114 },
  { logo: "Civil Service Bureau", patterns: [/جهاز\s*الخدمة\s*المدنية|جهاز\s*الخدمه\s*المدنيه|civil service bureau/i], weight: 114 },
  { logo: "Government of Bahrain", patterns: [/حكومة\s*البحرين|حكومه\s*البحرين|مملكة\s*البحرين|مملكه\s*البحرين|government of bahrain/i], weight: 88 },
];

const sourceRules: Array<{ logo: string; patterns: RegExp[] }> = [
  { logo: "Bahrain News Agency", patterns: [/(?:^|\.)bna\.bh/i, /beta\.bna\.bh/i, /وكالة\s*أنباء\s*البحرين|وكالة\s*البحرين\s*للأنباء|bahrain news agency|\bbna\b/i] },
  { logo: "Gulf News", patterns: [/akhbar-alkhaleej\.com/i, /أخبار\s*الخليج|اخبار\s*الخليج|gulf news/i] },
  { logo: "Alayam Press", patterns: [/(?:^|\.)alayam\.com/i, /alayam|الأيام|الايام/i] },
  { logo: "Al Watan", patterns: [/alwatan(?:news)?/i, /الوطن/i] },
  { logo: "Al Bilad Newspaper", patterns: [/albiladpress\.com/i, /al bilad newspaper|البلاد/i] },
  { logo: "Gulf Daily News", patterns: [/gdnonline\.com/i, /gulf daily news/i] },
  { logo: "Daily Tribune", patterns: [/newsofbahrain\.com/i, /daily tribune/i] },
  { logo: "Legislation & Legal Opinion Commission", patterns: [/legalaffairs\.gov\.bh/i, /هيئة\s*التشريع\s*والرأي\s*القانوني/i] },
  { logo: "Public Prosecution", patterns: [/ppb\.gov\.bh/i, /النيابة\s*العامة/i] },
  { logo: "Ministry of Justice, Islamic Affairs and Waqf", patterns: [/moj\.gov\.bh/i, /وزارة\s*العدل/i] },
  { logo: "Ministry of Health", patterns: [/health\.gov\.bh/i, /وزارة\s*الصحة/i] },
  { logo: "University of Bahrain", patterns: [/uob\.edu\.bh/i, /جامعة\s*البحرين/i] },
  { logo: "Information & Government Authority", patterns: [/iga\.gov\.bh/i, /هيئة\s*المعلومات\s*والحكومة\s*الإلكترونية/i] },
];

const genericStopWords = new Set([
  "bahrain", "البحرين", "kingdom", "مملكة", "مملكه", "ministry", "وزارة", "وزاره", "authority", "هيئة", "هيئه", "national", "company", "group", "center", "centre", "مركز", "government", "حكومة", "حكومه", "organization", "organisation", "المؤسسة", "المؤسسه",
]);

export function normalizeBahrainLogoText(value: string) {
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

function logoNameParts(name: string) {
  return name.split("·").map((part) => part.trim()).filter(Boolean);
}

export function findCatalogLogo(nameOrFragment: string): BahrainLogoRecord | undefined {
  const needle = normalizeBahrainLogoText(nameOrFragment);
  if (!needle) return undefined;
  const exact = bahrainLogoCatalog.find((logo) => logoNameParts(logo.name).some((part) => normalizeBahrainLogoText(part) === needle));
  if (exact) return exact;
  return bahrainLogoCatalog.find((logo) => normalizeBahrainLogoText(logo.name).includes(needle));
}

function addUnique(target: BahrainLogoMatch[], logo: BahrainLogoRecord | undefined, role: BahrainLogoMatch["role"], reason?: string) {
  if (!logo || target.some((item) => item.url === logo.url || normalizeBahrainLogoText(item.name) === normalizeBahrainLogoText(logo.name))) return;
  target.push({ ...logo, role, reason });
}

function explicitLogoMatches(text: string) {
  const scored: Array<{ logo: BahrainLogoRecord; score: number; reason: string }> = [];
  for (const rule of aliasRules) {
    if (!rule.patterns.some((pattern) => pattern.test(text))) continue;
    const logo = findCatalogLogo(rule.logo);
    if (logo) scored.push({ logo, score: rule.weight ?? 100, reason: `alias:${rule.logo}` });
  }
  return scored;
}

function fuzzyLogoMatches(text: string) {
  const normalized = normalizeBahrainLogoText(text);
  const hayWords = new Set(normalized.split(" ").filter(Boolean));
  const scored: Array<{ logo: BahrainLogoRecord; score: number; reason: string }> = [];
  for (const logo of bahrainLogoCatalog) {
    const parts = logoNameParts(logo.name);
    let best = 0;
    for (const part of parts) {
      const normalizedName = normalizeBahrainLogoText(part);
      if (!normalizedName) continue;
      if (normalized.includes(normalizedName) && normalizedName.length >= 5) {
        best = Math.max(best, 82 + Math.min(16, normalizedName.length / 3));
        continue;
      }
      const words = normalizedName.split(" ").filter((word) => word.length >= 4 && !genericStopWords.has(word));
      if (!words.length) continue;
      const hits = words.filter((word) => hayWords.has(word) || normalized.includes(word)).length;
      const ratio = hits / words.length;
      if (hits >= 2 && ratio >= 0.6) best = Math.max(best, 52 + hits * 8 + ratio * 12);
    }
    if (best >= 68) scored.push({ logo, score: best, reason: "fuzzy-name" });
  }
  return scored;
}

export function rankBahrainLogosForText(text: string, limit = 4, excludeNames: string[] = []) {
  const excluded = new Set(excludeNames.map(normalizeBahrainLogoText));
  const candidates = [...explicitLogoMatches(text), ...fuzzyLogoMatches(text)]
    .filter((entry) => !excluded.has(normalizeBahrainLogoText(entry.logo.name)))
    .sort((a, b) => b.score - a.score);
  const result: BahrainLogoMatch[] = [];
  for (const entry of candidates) {
    addUnique(result, entry.logo, "entity", entry.reason);
    if (result.length >= limit) break;
  }
  return result;
}

export function resolveSourceLogo(sourceName: string, sourceUrl?: string) {
  const haystack = `${sourceName} ${sourceUrl ?? ""}`;
  for (const rule of sourceRules) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      const logo = findCatalogLogo(rule.logo);
      if (logo) return { ...logo, role: "source" as const, reason: `source:${rule.logo}` };
    }
  }
  const direct = rankBahrainLogosForText(sourceName, 1)[0];
  return direct ? { ...direct, role: "source" as const, reason: direct.reason ?? "source:fuzzy" } : undefined;
}

export function resolveNewsLogos(input: {
  sourceName: string;
  sourceUrl?: string;
  title: string;
  summary?: string;
  details?: string;
}) {
  const result: BahrainLogoMatch[] = [];
  const source = resolveSourceLogo(input.sourceName, input.sourceUrl);
  addUnique(result, source, "source", source?.reason);

  const text = `${input.title} ${input.summary ?? ""} ${input.details ?? ""}`;
  let related = rankBahrainLogosForText(text, 4, source ? [source.name] : []);
  if (related.some((logo) => !/Government of Bahrain/i.test(logo.name))) {
    related = related.filter((logo) => !/Government of Bahrain/i.test(logo.name));
  }
  for (const match of related) {
    addUnique(result, match, "entity", match.reason);
    if (result.length >= 4) break;
  }
  if (result.length <= (source ? 1 : 0) && /محكم|قضاء|تمييز|استئناف|court|judicial|cassation|appeal/i.test(text)) {
    addUnique(result, findCatalogLogo("Ministry of Justice"), "entity", "judiciary-fallback");
  }
  return result;
}

export function resolveCaseLogos(input: {
  caseNumber?: string;
  caseType?: string;
  clientName?: string;
  accusedName?: string;
  victimName?: string;
  court?: string;
  judgment?: string;
  notes?: string;
}) {
  const result: BahrainLogoMatch[] = [];
  const prosecution = findCatalogLogo("Public Prosecution");
  addUnique(result, prosecution, "prosecution", "case-default-prosecution");

  const text = [input.caseNumber, input.caseType, input.clientName, input.accusedName, input.victimName, input.court, input.judgment, input.notes].filter(Boolean).join(" ");
  const related = rankBahrainLogosForText(text, 4, ["Public Prosecution", "Government of Bahrain"])
    .filter((logo) => !/الإعلام والصحف ووكالات الأنباء/.test(logo.category));

  // A named non-justice institution is more useful than a generic court/justice match.
  const nonJustice = related.filter((logo) => !/Ministry of Justice|Legislation & Legal Opinion|Ministry of Legal Affairs/i.test(logo.name));
  const preferred = nonJustice.length ? nonJustice : related;
  for (const logo of preferred.slice(0, 2)) addUnique(result, logo, "entity", logo.reason);

  if (result.length === 1 && /محكم|قضاء|court|judicial/i.test(text)) {
    addUnique(result, findCatalogLogo("Ministry of Justice"), "entity", "court-fallback");
  }
  return result;
}
