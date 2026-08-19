"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Newspaper, Scale } from "lucide-react";
import type { Locale } from "@/config/site";
import type { LegalNewsItem } from "@/types/legal-news";
import { NewsLogoCluster, getLegalNewsLogos } from "@/components/news/news-logo-cluster";

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
  const currentLogos = current ? getLegalNewsLogos(current) : [];

  return (
    <section className="admin-news-overview border border-white/10 bg-[#0c1c21]">
      <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-6 sm:flex-row sm:items-center lg:p-7">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#d0ad69]"><Newspaper size={16} />{ar ? "الموجز القانوني" : "LEGAL BRIEFING"}</div>
          <h2 className="display mt-2 text-2xl sm:text-3xl">{ar ? "آخر المستجدات في البحرين" : "Latest Bahrain legal updates"}</h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/35"><CalendarDays size={14} />{new Intl.DateTimeFormat(ar ? "ar-BH" : "en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</div>
      </div>
      <div className="grid gap-px bg-white/10 sm:grid-cols-3">
        <div className="bg-[#0c1c21] p-5 sm:p-6"><span className="text-[10px] text-white/35">{ar ? "أخبار هذا الأسبوع" : "This week"}</span><strong className="admin-news-stat mt-1 block text-3xl text-[#ead39f]">{loading ? "…" : items.length}</strong></div>
        <div className="bg-[#0c1c21] p-5 sm:p-6"><span className="text-[10px] text-white/35">{ar ? "تشريعات" : "Legislation"}</span><strong className="admin-news-stat mt-1 block text-3xl text-[#ead39f]">{loading ? "…" : legislationCount}</strong></div>
        <div className="bg-[#0c1c21] p-5 sm:p-6"><span className="text-[10px] text-white/35">{ar ? "مصادر رسمية/حكومية" : "Official/government"}</span><strong className="admin-news-stat mt-1 block text-3xl text-[#ead39f]">{loading ? "…" : officialCount}</strong></div>
      </div>
      {current ? <div className="grid min-h-[24rem] gap-6 p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,.85fr)_auto] lg:items-center lg:p-7">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold"><span className="admin-news-category rounded-sm border border-[#b89555]/35 bg-[#b89555]/10 px-2 py-1 text-[#e2c98f]">{categoryLabel(current.category, ar)}</span><span className="text-white/35">{current.sourceName}</span></div>
          <h3 className="mt-4 text-xl font-bold leading-8 sm:text-2xl">{current.title}</h3>
          <p className="mt-3 line-clamp-4 max-w-4xl text-sm leading-7 text-white/45">{current.summary}</p>
          {current.importance >= 4 && <div className="admin-news-priority mt-3 flex items-center gap-2 text-[10px] font-bold text-amber-200"><AlertTriangle size={14} />{ar ? "مستجد مرتفع الأهمية ويستحق مراجعة المحامي" : "High-priority update worth lawyer review"}</div>}
        </div>
        <div className="admin-news-image relative min-h-64 overflow-hidden rounded-md border border-white/10 bg-[#10191b] shadow-sm sm:min-h-72 lg:min-h-80">
          {current.imageUrl ? <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to top,rgba(8,8,8,.35),rgba(8,8,8,.02)),url(${JSON.stringify(current.imageUrl).slice(1,-1)})` }} /> : <NewsLogoCluster item={current} mode="compact" />}
          {current.imageUrl && currentLogos.length > 0 && <NewsLogoCluster item={current} mode="overlay" />}
        </div>
        <div className="flex items-center gap-2" dir="ltr"><button type="button" onClick={() => setIndex((value) => (value - 1 + items.length) % items.length)} className="focus-ring grid size-10 place-items-center rounded-md border border-white/10 text-white/55 hover:bg-white/5"><ChevronLeft size={17} /></button><button type="button" onClick={() => setIndex((value) => (value + 1) % items.length)} className="focus-ring grid size-10 place-items-center rounded-md border border-white/10 text-white/55 hover:bg-white/5"><ChevronRight size={17} /></button></div>
      </div> : !loading ? <div className="flex items-center gap-3 p-5 text-xs text-white/40"><Scale size={18} />{ar ? "لا توجد مستجدات قانونية متاحة حالياً من المصادر المهيأة." : "No legal updates are currently available from the configured sources."}</div> : <div className="p-5 text-xs text-white/35">{ar ? "جاري تحميل الموجز…" : "Loading briefing…"}</div>}
    </section>
  );
}
