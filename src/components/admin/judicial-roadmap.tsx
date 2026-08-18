"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpLeft, Check, ChevronDown, ExternalLink, Landmark, Route } from "lucide-react";
import type { Locale } from "@/config/site";
import { judicialRoadmaps } from "@/data/judicial-roadmap";

export function JudicialRoadmap({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [selected, setSelected] = useState(judicialRoadmaps[0].id);
  const roadmap = judicialRoadmaps.find((item) => item.id === selected) ?? judicialRoadmaps[0];

  return (
    <section className="overflow-hidden border border-white/10 bg-[#0c1c21]">
      <div className="relative overflow-hidden border-b border-white/10 px-5 py-7 sm:px-8">
        <div className="absolute inset-y-0 end-0 w-64 bg-[radial-gradient(circle_at_center,rgba(184,149,85,.16),transparent_65%)]" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center border border-[#d0ad69]/30 bg-[#d0ad69]/10 text-[#d0ad69]"><Route /></span>
            <div><p className="text-xs font-bold tracking-[.16em] text-[#d0ad69]">{ar ? "دليل المعاملات القضائية" : "JUDICIAL TRANSACTION GUIDE"}</p><h2 className="display mt-2 text-2xl sm:text-3xl">{ar ? "خارطة القضاء الإلكتروني" : "E-justice roadmap"}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-white/50">{ar ? "اختر نوع المعاملة لعرض خطوات العمل العملية وروابط الخدمات الرسمية. المدد والمتطلبات النهائية تُراجع في ملف القضية وصفحة الخدمة قبل الإيداع." : "Choose a transaction to see practical steps and official service links. Verify final requirements and time limits against the case file and service page before filing."}</p></div>
          </div>
          <div className="flex shrink-0 items-center gap-3 border border-white/10 bg-white/[.035] p-3"><Image src="/assets/logos/bahrain-official-logo-no-text.svg" width={54} height={54} alt={ar ? "شعار مملكة البحرين" : "Kingdom of Bahrain emblem"} className="h-12 w-auto" /><div className="text-xs leading-5 text-white/45">{ar ? <>مبني على دليل خدمات<br /><strong className="text-white/75">البوابة الوطنية</strong></> : <>Based on the National Portal<br /><strong className="text-white/75">services catalogue</strong></>}</div></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-white/10 bg-black/15 p-3 lg:border-b-0 lg:border-e">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {judicialRoadmaps.map((item, index) => {
              const active = item.id === roadmap.id;
              return <button key={item.id} type="button" onClick={() => setSelected(item.id)} className={`focus-ring group flex min-h-20 items-center gap-3 border p-3 text-start transition ${active ? "border-[#b89555]/50 bg-[#b89555]/12 text-white" : "border-transparent text-white/50 hover:border-white/10 hover:bg-white/[.035] hover:text-white"}`}><span className={`grid size-9 shrink-0 place-items-center text-xs font-black ${active ? "bg-[#b89555] text-[#0c1c21]" : "bg-white/5 text-white/35"}`}>{String(index + 1).padStart(2, "0")}</span><span className="min-w-0"><strong className="block text-sm">{ar ? item.titleAr : item.titleEn}</strong><small className="mt-1 block truncate text-[10px] opacity-55">{ar ? item.audienceAr : item.audienceEn}</small></span><ChevronDown className={`ms-auto shrink-0 transition lg:-rotate-90 ${active ? "text-[#d0ad69]" : "opacity-0 group-hover:opacity-50"}`} size={15} /></button>;
            })}
          </div>
        </aside>

        <div className="p-5 sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end"><div><p className="text-xs text-[#d0ad69]">{ar ? roadmap.audienceAr : roadmap.audienceEn}</p><h3 className="display mt-2 text-2xl">{ar ? roadmap.titleAr : roadmap.titleEn}</h3><p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">{ar ? roadmap.summaryAr : roadmap.summaryEn}</p></div><span className="w-fit border border-white/10 px-3 py-2 text-[10px] text-white/40">{roadmap.steps.length} {ar ? "مراحل" : "STAGES"}</span></div>

          <ol className="relative mt-7 space-y-3 before:absolute before:bottom-6 before:start-[21px] before:top-6 before:w-px before:bg-gradient-to-b before:from-[#b89555] before:to-white/5">
            {roadmap.steps.map((step, index) => <li key={step.titleAr} className="relative grid grid-cols-[44px_1fr] gap-4"><span className="relative z-10 grid size-11 place-items-center border border-[#b89555]/40 bg-[#102a31] text-xs font-black text-[#d0ad69]">{index + 1}</span><details className="group border border-white/10 bg-white/[.025] open:border-[#b89555]/25 open:bg-white/[.045]" open={index === 0}><summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3 p-4"><div><strong className="text-sm">{ar ? step.titleAr : step.titleEn}</strong><p className="mt-1 text-xs leading-6 text-white/45">{ar ? step.descriptionAr : step.descriptionEn}</p></div><ChevronDown className="shrink-0 text-white/30 transition group-open:rotate-180" size={17} /></summary><div className="grid gap-2 border-t border-white/8 px-4 py-3 sm:grid-cols-3">{(ar ? step.checklistAr : step.checklistEn).map((item) => <span key={item} className="flex items-center gap-2 text-xs text-white/55"><Check className="shrink-0 text-emerald-400" size={13} />{item}</span>)}</div></details></li>)}
          </ol>

          <div className="mt-8 border-t border-white/10 pt-6"><div className="mb-4 flex items-center gap-2"><Landmark className="text-[#d0ad69]" size={18} /><h4 className="font-bold">{ar ? "الخدمات الحكومية المرتبطة" : "Related government services"}</h4></div><div className="grid gap-2 sm:grid-cols-2">{roadmap.services.map((service) => <a key={service.url} href={service.url} target="_blank" rel="noreferrer" className="focus-ring group flex min-h-14 items-center justify-between gap-3 border border-white/10 bg-black/10 px-4 py-3 text-xs text-white/65 transition hover:border-[#b89555]/45 hover:bg-[#b89555]/5 hover:text-white"><span>{ar ? service.titleAr : service.titleEn}</span><span className="grid size-8 shrink-0 place-items-center bg-white/5 text-[#d0ad69] group-hover:bg-[#b89555] group-hover:text-[#0c1c21]">{ar ? <ArrowUpLeft size={15} /> : <ExternalLink size={15} />}</span></a>)}</div></div>
        </div>
      </div>
    </section>
  );
}
