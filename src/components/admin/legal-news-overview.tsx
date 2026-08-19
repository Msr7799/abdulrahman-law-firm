"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Newspaper, Scale } from "lucide-react";
import type { Locale } from "@/config/site";
import type { LegalNewsItem } from "@/types/legal-news";

function categoryLabel(category: LegalNewsItem["category"], ar: boolean) {
  const labels: Record<LegalNewsItem["category"], [string, string]> = {
    legislation: ["تشريع", "Legislation"], judiciary: ["قضاء", "Judiciary"], prosecution: ["نيابة", "Prosecution"], "justice-service": ["خدمات عدلية", "Justice services"], "legal-profession": ["مهنة قانونية", "Legal profession"], government: ["حكومي", "Government"],
  };
  return labels[category][ar ? 0 : 1];
}

export function LegalNewsOverview({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [items, setItems] = useState<LegalNewsItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/legal-news?period=week&limit=8")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active && data?.items) setItems(data.items); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const current = items[index];
  const legislationCount = items.filter((item) => item.category === "legislation").length;
  const officialCount = items.filter((item) => item.verification === "official" || item.verification === "government").length;

  return (
    <section className="border border-white/10 bg-[#0c1c21]">
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#d0ad69]"><Newspaper size={16} />{ar ? "الموجز القانوني" : "LEGAL BRIEFING"}</div>
          <h2 className="display mt-2 text-2xl">{ar ? "آخر المستجدات في البحرين" : "Latest Bahrain legal updates"}</h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/35"><CalendarDays size={14} />{new Intl.DateTimeFormat(ar ? "ar-BH" : "en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</div>
      </div>
      <div className="grid gap-px bg-white/10 sm:grid-cols-3">
        <div className="bg-[#0c1c21] p-4"><span className="text-[10px] text-white/35">{ar ? "أخبار هذا الأسبوع" : "This week"}</span><strong className="mt-1 block text-2xl text-[#ead39f]">{loading ? "…" : items.length}</strong></div>
        <div className="bg-[#0c1c21] p-4"><span className="text-[10px] text-white/35">{ar ? "تشريعات" : "Legislation"}</span><strong className="mt-1 block text-2xl text-[#ead39f]">{loading ? "…" : legislationCount}</strong></div>
        <div className="bg-[#0c1c21] p-4"><span className="text-[10px] text-white/35">{ar ? "مصادر رسمية/حكومية" : "Official/government"}</span><strong className="mt-1 block text-2xl text-[#ead39f]">{loading ? "…" : officialCount}</strong></div>
      </div>
      {current ? <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold"><span className="border border-[#b89555]/35 bg-[#b89555]/10 px-2 py-1 text-[#e2c98f]">{categoryLabel(current.category, ar)}</span><span className="text-white/35">{current.sourceName}</span></div>
          <h3 className="mt-3 text-lg font-bold leading-7">{current.title}</h3>
          <p className="mt-2 line-clamp-3 max-w-4xl text-xs leading-6 text-white/45">{current.summary}</p>
          {current.importance >= 4 && <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-amber-200"><AlertTriangle size={14} />{ar ? "مستجد مرتفع الأهمية ويستحق مراجعة المحامي" : "High-priority update worth lawyer review"}</div>}
        </div>
        <div className="flex items-center gap-2" dir="ltr"><button type="button" onClick={() => setIndex((value) => (value - 1 + items.length) % items.length)} className="focus-ring grid size-10 place-items-center border border-white/10 text-white/55 hover:bg-white/5"><ChevronLeft size={17} /></button><button type="button" onClick={() => setIndex((value) => (value + 1) % items.length)} className="focus-ring grid size-10 place-items-center border border-white/10 text-white/55 hover:bg-white/5"><ChevronRight size={17} /></button></div>
      </div> : !loading ? <div className="flex items-center gap-3 p-5 text-xs text-white/40"><Scale size={18} />{ar ? "لا توجد مستجدات قانونية متاحة حالياً من المصادر المهيأة." : "No legal updates are currently available from the configured sources."}</div> : <div className="p-5 text-xs text-white/35">{ar ? "جاري تحميل الموجز…" : "Loading briefing…"}</div>}
    </section>
  );
}
