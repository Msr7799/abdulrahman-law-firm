export type LegalNewsCategory =
  | "legislation"
  | "judiciary"
  | "prosecution"
  | "justice-service"
  | "legal-profession"
  | "government";

export type LegalNewsVerification = "official" | "government" | "reported";

export type LegalNewsItem = {
  id: string;
  title: string;
  summary: string;
  details: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: "official" | "bna" | "press";
  publishedAt: string;
  fetchedAt: string;
  category: LegalNewsCategory;
  verification: LegalNewsVerification;
  importance: 1 | 2 | 3 | 4 | 5;
  imageUrl?: string;
  legalInstrumentNumber?: string;
  gazetteNumber?: string;
};

export type LegalNewsPeriod = "today" | "week" | "month";
