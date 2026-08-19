"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Newspaper } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/config/site";
import type { LegalNewsItem } from "@/types/legal-news";

function categoryLabel(category: LegalNewsItem["category"], ar: boolean) {
  const arMap = { legislation: "تشريعات", judiciary: "قضاء", prosecution: "النيابة", "justice-service": "خدمات عدلية", "legal-profession": "المهنة القانونية", government: "شأن حكومي" };
  const enMap = { legislation: "Legislation", judiciary: "Judiciary", prosecution: "Prosecution", "justice-service": "Justice services", "legal-profession": "Legal profession", government: "Government" };
  return (ar ? arMap : enMap)[category];
}

function dateLabel(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-BH" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function LegalNewsCarousel({ locale, items }: { locale: Locale; items: LegalNewsItem[] }) {
  const ar = locale === "ar";
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = items[index];
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const today = useMemo(() => new Intl.DateTimeFormat(ar ? "ar-BH" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date()), [ar]);
  const updatedAt = useMemo(() => new Intl.DateTimeFormat(ar ? "ar-BH" : "en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(Math.max(...items.map((item) => new Date(item.fetchedAt).valueOf())))), [ar, items]);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % items.length), 7000);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  if (!current) return null;
  const prev = () => setIndex((value) => (value - 1 + items.length) % items.length);
  const next = () => setIndex((value) => (value + 1) % items.length);

  return (
    <section className="reveal-section border-y border-[#ded8cc] bg-[#f4efe5] py-14 sm:py-16" aria-labelledby="legal-news-title">
      <div className="container-site">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#9a783f]"><Newspaper size={16} />{ar ? "موجز قانوني متجدد" : "LIVE LEGAL BRIEFING"}</div>
            <h2 id="legal-news-title" className="display mt-2 text-2xl sm:text-3xl">{ar ? "آخر المستجدات القانونية والقضائية في البحرين" : "Latest Bahrain legal & judicial updates"}</h2>
          </div>
          <div className="text-xs text-[#657073]"><div className="flex items-center gap-2"><CalendarDays size={15} /><span>{today}</span></div><div className="mt-1 text-[10px] opacity-70">{ar ? `آخر تحديث: ${updatedAt}` : `Updated: ${updatedAt}`}</div></div>
        </div>

        <div className="overflow-hidden border border-[#d9d0c0] bg-[#fffdf8] shadow-[0_18px_60px_rgba(16,25,27,.07)]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.article key={current.id} initial={{ opacity: 0, x: ar ? -22 : 22 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: ar ? 22 : -22 }} transition={{ duration: 0.32, ease: "easeOut" }} className="grid min-h-[31rem] md:min-h-[25rem] md:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
              <div className="relative min-h-64 overflow-hidden bg-[#132b32] md:min-h-full">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#132b32,#071216)]" />
                {current.imageUrl ? (
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to top,rgba(7,18,22,.65),rgba(7,18,22,.05)),url(${JSON.stringify(current.imageUrl).slice(1,-1)})` }} />
                ) : current.sourceLogoUrl ? (
                  <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,#fffdf8_0%,#f4efe5_64%,#e9e0d2_100%)] p-8 sm:p-12">
                    <img src={current.sourceLogoUrl} alt={current.sourceLogoName || current.sourceName} className="max-h-40 max-w-[72%] object-contain drop-shadow-sm sm:max-h-52" />
                  </div>
                ) : (
                  <div className="absolute inset-0 grid place-items-center"><img src="/assets/logos/bahrain-official-logo-no-text-gold.svg" alt="" className="h-36 w-auto opacity-40 sm:h-48" /></div>
                )}
                {current.imageUrl && current.sourceLogoUrl && <div className="absolute start-4 top-4 grid min-h-14 min-w-20 place-items-center rounded-md border border-white/70 bg-white/95 px-3 py-2 shadow-lg backdrop-blur"><img src={current.sourceLogoUrl} alt={current.sourceLogoName || current.sourceName} className="max-h-10 max-w-24 object-contain" /></div>}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4 text-[10px] text-white/70 sm:p-5"><span className="rounded-sm border border-white/20 bg-black/45 px-2.5 py-1 font-bold backdrop-blur">{categoryLabel(current.category, ar)}</span><span className="rounded-sm bg-black/35 px-2 py-1 backdrop-blur">{current.verification === "official" ? (ar ? "مصدر رسمي" : "Official source") : current.verification === "government" ? (ar ? "مصدر حكومي" : "Government source") : (ar ? "صحافة محلية" : "Local press")}</span></div>
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                <div className="text-xs font-bold text-[#9a783f]">{current.sourceName} · {dateLabel(current.publishedAt, locale)}</div>
                <h3 className="display mt-4 text-2xl leading-snug sm:text-3xl">{current.title}</h3>
                <p className="mt-4 line-clamp-4 text-sm leading-7 text-[#657073] sm:text-[15px]">{current.summary}</p>
                <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                  <Link href={`/${locale}/news/${current.id}`} className="focus-ring inline-flex min-h-11 items-center gap-2 bg-[#132b32] px-5 text-sm font-bold !text-white transition hover:bg-[#0d2026]">{ar ? "قراءة التفاصيل" : "Read details"}<Arrow size={16} /></Link>
                  {items.length > 1 && <div className="flex items-center gap-2" dir="ltr"><button type="button" onClick={prev} className="focus-ring grid size-10 place-items-center border border-[#d9d0c0] text-[#132b32] transition hover:bg-[#ece5d8]" aria-label={ar ? "الخبر السابق" : "Previous story"}><ChevronLeft size={18} /></button><button type="button" onClick={next} className="focus-ring grid size-10 place-items-center border border-[#d9d0c0] text-[#132b32] transition hover:bg-[#ece5d8]" aria-label={ar ? "الخبر التالي" : "Next story"}><ChevronRight size={18} /></button></div>}
                </div>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
        {items.length > 1 && <div className="mt-4 flex justify-center gap-1.5">{items.slice(0, 8).map((item, itemIndex) => <button key={item.id} type="button" onClick={() => setIndex(itemIndex)} className={`h-1.5 rounded-full transition-all ${itemIndex === index ? "w-7 bg-[#b89555]" : "w-1.5 bg-[#132b32]/20"}`} />)}</div>}
      </div>
    </section>
  );
}
