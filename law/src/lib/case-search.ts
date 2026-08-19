import type { LawCase } from "@/types/admin";

const diacritics = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;

export function normalizeSearch(value: string) {
  return value
    .replace(diacritics, "")
    .replace(/ـ/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const weightedFields: Array<[keyof LawCase, number]> = [
  ["caseNumber", 12], ["caseYear", 10], ["clientName", 10],
  ["accusedName", 9], ["victimName", 9], ["caseType", 8],
  ["judgment", 7], ["judgeName", 6], ["court", 5],
  ["status", 3], ["notes", 2], ["nextHearing", 2],
];

export function rankCases(cases: LawCase[], query: string, limit = 30) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) {
    return cases
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit)
      .map((lawCase) => ({ lawCase, score: 0, covered: 0 }));
  }
  const terms = [...new Set(normalizedQuery.split(" ").filter((term) => term.length > 0))];

  return cases
    .map((lawCase) => {
      let score = 0;
      let covered = 0;
      for (const term of terms) {
        let termScore = 0;
        for (const [field, weight] of weightedFields) {
          const value = normalizeSearch(String(lawCase[field] ?? ""));
          if (value === term) termScore = Math.max(termScore, weight * 2);
          else if (value.startsWith(term)) termScore = Math.max(termScore, weight * 1.45);
          else if (value.includes(term)) termScore = Math.max(termScore, weight);
        }
        if (termScore > 0) covered += 1;
        score += termScore;
      }
      return { lawCase, score: score * (0.7 + (covered / terms.length) * 0.6), covered };
    })
    .filter((item) => item.covered > 0)
    .sort((a, b) => b.score - a.score || b.lawCase.updatedAt - a.lawCase.updatedAt)
    .slice(0, limit);
}
