"use client";

import { useMemo, useState } from "react";
import { ArrowUpLeft, CheckCircle2, CircleDot, ExternalLink, Landmark, Search, ShieldAlert, Wrench } from "lucide-react";
import type { Locale } from "@/config/site";
import { governmentIntegrations, type IntegrationStatus } from "@/data/government-integrations";

const statusMeta: Record<IntegrationStatus, { ar: string; en: string; className: string }> = {
  available: { ar: "متاح برمجياً", en: "Programmatic access", className: "integration-status integration-status-available border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:border-emerald-400/25 dark:text-emerald-200" },
  "official-link": { ar: "رابط حكومي رسمي", en: "Official government link", className: "integration-status integration-status-official border-sky-600/30 bg-sky-500/10 text-sky-800 dark:border-sky-400/25 dark:text-sky-200" },
  "requires-onboarding": { ar: "يتطلب اعتماد/تسجيل", en: "Onboarding required", className: "integration-status integration-status-onboarding border-amber-600/30 bg-amber-400/12 text-amber-900 dark:border-amber-300/25 dark:text-amber-100" },
  research: { ar: "قيد التحقق", en: "Research only", className: "integration-status border-stone-400/35 bg-stone-500/10 text-stone-700 dark:border-white/15 dark:bg-white/5 dark:text-white/60" },
};

export function GovernmentIntegrationHub({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | IntegrationStatus>("all");
  const items = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    return governmentIntegrations.filter((item) => {
      if (filter !== "all" && item.status !== filter) return false;
      if (!needle) return true;
      return `${item.titleAr} ${item.titleEn} ${item.providerAr} ${item.providerEn}`.toLocaleLowerCase(locale).includes(needle);
    });
  }, [filter, locale, query]);

  const counts = useMemo(() => ({
    verified: governmentIntegrations.filter((item) => item.status === "available" || item.status === "official-link").length,
    onboarding: governmentIntegrations.filter((item) => item.status === "requires-onboarding").length,
  }), []);

  return <section className="grid gap-6">
    <header className="border border-white/10 bg-[#102a31] p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-bold text-[#d1b579]"><Landmark size={17}/>{ar ? "مركز التكاملات الرسمية" : "OFFICIAL INTEGRATION HUB"}</div>
          <h2 className="display mt-2 text-2xl sm:text-3xl">{ar ? "الحكومة الإلكترونية والدفع" : "eGovernment & payments"}</h2>
          <p className="mt-3 text-sm leading-7 text-white/55">{ar ? "مرجع تشغيلي يفرّق بوضوح بين API متاح، رابط حكومي رسمي، وخدمة تحتاج تسجيل أو موافقة قبل الربط. الهدف أن يعرف الموظف ما يمكن تنفيذه فعلاً وما يحتاج مخاطبة الجهة." : "An operational reference that clearly separates available APIs, official links, and services requiring onboarding or approval before integration."}</p>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:min-w-80">
          <div className="admin-integration-stat admin-integration-stat-available border border-emerald-400/20 bg-emerald-400/5 p-4"><CheckCircle2 className="admin-integration-stat-icon mb-3 text-emerald-700 dark:text-emerald-300" size={20}/><strong className="admin-integration-stat-value block text-2xl">{counts.verified}</strong><span className="admin-integration-stat-label text-xs text-white/45">{ar ? "مصادر وصول مباشرة" : "direct-access sources"}</span></div>
          <div className="admin-integration-stat admin-integration-stat-onboarding border border-amber-300/20 bg-amber-300/5 p-4"><Wrench className="admin-integration-stat-icon mb-3 text-amber-800 dark:text-amber-200" size={20}/><strong className="admin-integration-stat-value block text-2xl">{counts.onboarding}</strong><span className="admin-integration-stat-label text-xs text-white/45">{ar ? "تحتاج تسجيل/اعتماد" : "need onboarding"}</span></div>
        </div>
      </div>
    </header>

    <div className="admin-integration-warning border border-amber-500/30 bg-amber-400/10 p-4 text-sm leading-7 text-amber-950 dark:border-amber-300/20 dark:bg-amber-300/5 dark:text-amber-50/80">
      <div className="flex items-start gap-3"><ShieldAlert className="mt-1 shrink-0 text-amber-800 dark:text-amber-200" size={19}/><p>{ar ? "قاعدة أمان: لا ترسل أرقاماً شخصية أو ملفات قضايا أو مستندات سرية إلى أي API أو نموذج ذكاء اصطناعي لم تتم الموافقة عليه تعاقدياً وتقنياً. الروابط الحكومية هنا لا تعني وجود صلاحية لقراءة بيانات العميل تلقائياً." : "Security rule: never send CPRs, case files or confidential documents to any API or AI model without contractual and technical approval. An official link does not imply permission to automatically read client data."}</p></div>
    </div>

    <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
      <label className="relative block"><Search className="absolute start-4 top-1/2 -translate-y-1/2 text-white/35" size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ar ? "ابحث عن وزارة العدل، Benefit، البيانات المفتوحة..." : "Search Justice, BENEFIT, Open Data..."} className="focus-ring min-h-12 w-full border border-white/10 bg-black/20 ps-11 pe-4 text-sm outline-none placeholder:text-white/30" /></label>
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
        {(["all", "available", "official-link", "requires-onboarding"] as const).map((id) => <button key={id} type="button" onClick={() => setFilter(id)} className={`focus-ring min-h-12 shrink-0 border px-3 text-xs font-bold ${filter === id ? "border-[#b89555] bg-[#b89555]/15 text-white" : "border-white/10 bg-black/10 text-white/45 hover:text-white"}`}>{id === "all" ? (ar ? "الكل" : "All") : (ar ? statusMeta[id].ar : statusMeta[id].en)}</button>)}
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const status = statusMeta[item.status];
        const points = ar ? item.useAr : item.useEn;
        return <article key={item.id} className="flex min-w-0 flex-col border border-white/10 bg-[#102a31] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><span className={`inline-flex items-center gap-2 border px-2.5 py-1 text-[11px] font-bold ${status.className}`}><CircleDot size={12}/>{ar ? status.ar : status.en}</span><span className="text-[11px] text-white/35">{ar ? item.providerAr : item.providerEn}</span></div>
          <h3 className="mt-5 text-lg font-bold">{ar ? item.titleAr : item.titleEn}</h3>
          <p className="mt-2 flex-1 text-sm leading-7 text-white/50">{ar ? item.descriptionAr : item.descriptionEn}</p>
          <ul className="mt-4 grid gap-2 border-t border-white/8 pt-4">{points.map((point) => <li key={point} className="flex gap-2 text-xs leading-5 text-white/55"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300" size={14}/><span>{point}</span></li>)}</ul>
          <a href={item.href} target="_blank" rel="noreferrer" className="focus-ring mt-5 flex min-h-11 items-center justify-between border border-white/10 px-3 text-xs font-bold text-white/70 hover:border-[#b89555]/50 hover:text-white"><span>{ar ? "فتح المصدر الرسمي" : "Open official source"}</span>{ar ? <ArrowUpLeft size={16}/> : <ExternalLink size={16}/>}</a>
        </article>;
      })}
    </div>
    {items.length === 0 && <div className="border border-dashed border-white/15 p-8 text-center text-sm text-white/40">{ar ? "لا توجد نتيجة مطابقة." : "No matching integration."}</div>}
  </section>;
}
