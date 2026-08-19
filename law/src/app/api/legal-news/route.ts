import { NextResponse } from "next/server";
import { getLegalNews } from "@/lib/legal-news";
import type { LegalNewsPeriod } from "@/types/legal-news";

export const runtime = "nodejs";

function period(value: string | null): LegalNewsPeriod {
  return value === "today" || value === "month" ? value : "week";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(24, Math.max(1, Number(url.searchParams.get("limit") ?? 12) || 12));
  const selectedPeriod = period(url.searchParams.get("period"));
  const items = await getLegalNews(selectedPeriod, limit);
  return NextResponse.json(
    { ok: true, period: selectedPeriod, generatedAt: new Date().toISOString(), items },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } },
  );
}
