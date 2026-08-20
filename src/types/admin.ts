export type CaseStatus = "new" | "active" | "hearing" | "judgment" | "execution" | "closed";

export type LawCase = {
  id: string;
  caseNumber: string;
  caseYear: number;
  caseType: string;
  clientName: string;
  accusedName: string;
  victimName: string;
  court: string;
  status: CaseStatus;
  judgment: string;
  judgeName: string;
  notes: string;
  nextHearing: string;
  isDemo: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
};

export type CaseDraft = Omit<LawCase, "id" | "createdAt" | "updatedAt" | "createdBy">;

export type DirectoryContact = {
  id: string;
  category: string;
  nameAr: string;
  nameEn: string;
  phone: string;
  notesAr: string;
  notesEn: string;
  sourceUrl: string;
  verifiedAt: string;
  sortOrder: number;
};

export type AgentSource = { title: string; url: string; snippet?: string; citationId?: string; sourceType?: "official" | "tavily" | "news"; score?: number };
export type AgentImage = { url: string; displayUrl?: string; description?: string };
