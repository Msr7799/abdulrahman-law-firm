"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { ArrowUpLeft, CheckCircle2, ExternalLink, FileCheck2, Files, Printer, RotateCcw, Search, ShieldCheck } from "lucide-react";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";
import type { Locale } from "@/config/site";
import { judicialServices, ministryFormCategories, ministryForms, type MinistryForm, type MinistryFormCategory } from "@/data/government-forms";

type Field = { id: string; ar: string; en: string; type?: "text" | "date" | "number" | "email" | "tel" | "textarea"; required?: boolean; wide?: boolean };

const commonFields: Field[] = [
  { id: "applicantName", ar: "اسم مقدم الطلب", en: "Applicant name", required: true, wide: true },
  { id: "personalNumber", ar: "الرقم الشخصي / رقم السجل", en: "Personal / CR number", required: true },
  { id: "phone", ar: "رقم الهاتف", en: "Phone number", type: "tel", required: true },
  { id: "email", ar: "البريد الإلكتروني", en: "Email", type: "email" },
  { id: "requestDate", ar: "تاريخ الطلب", en: "Request date", type: "date", required: true },
  { id: "referenceNumber", ar: "رقم المرجع", en: "Reference number" },
];

const categoryFields: Record<MinistryFormCategory, Field[]> = {
  realEstate: [
    { id: "projectName", ar: "اسم المشروع العقاري", en: "Real-estate project", required: true, wide: true },
    { id: "developerName", ar: "اسم المطور", en: "Developer name", required: true },
    { id: "unitNumber", ar: "رقم الوحدة / العقار", en: "Unit / property number" },
    { id: "claimAmount", ar: "قيمة المطالبة (د.ب)", en: "Claim amount (BHD)", type: "number" },
  ],
  execution: [
    { id: "executionFile", ar: "رقم ملف التنفيذ", en: "Enforcement file number", required: true },
    { id: "court", ar: "محكمة التنفيذ", en: "Enforcement court", required: true },
    { id: "debtorName", ar: "اسم المنفذ ضده", en: "Enforcement debtor", required: true },
    { id: "instrument", ar: "بيانات السند التنفيذي", en: "Enforcement instrument", wide: true },
  ],
  accounts: [
    { id: "accountName", ar: "اسم صاحب الحساب", en: "Account holder", required: true, wide: true },
    { id: "bankName", ar: "اسم البنك", en: "Bank name", required: true },
    { id: "iban", ar: "رقم الحساب الدولي IBAN", en: "IBAN", required: true, wide: true },
  ],
  notary: [
    { id: "customerCapacity", ar: "صفة العميل", en: "Customer capacity", required: true },
    { id: "transactionPurpose", ar: "الغرض من المعاملة", en: "Transaction purpose", required: true, wide: true },
    { id: "sourceOfFunds", ar: "مصدر الأموال", en: "Source of funds", wide: true },
  ],
  minors: [
    { id: "fileNumber", ar: "رقم ملف القاصر / التركة", en: "Minor / estate file number" },
    { id: "minorName", ar: "اسم القاصر / صاحب التركة", en: "Minor / estate owner", required: true, wide: true },
    { id: "relationship", ar: "صفة مقدم الطلب / صلة القرابة", en: "Applicant capacity / relationship", required: true },
  ],
  sharia: [
    { id: "documentType", ar: "نوع الوثيقة الشرعية", en: "Sharia document type", required: true },
    { id: "concernedName", ar: "اسم صاحب الشأن / المتوفى", en: "Concerned person / deceased", required: true, wide: true },
    { id: "shariaCourt", ar: "المحكمة الشرعية", en: "Sharia court" },
  ],
  marriage: [
    { id: "firstParty", ar: "اسم الطرف الأول", en: "First party", required: true, wide: true },
    { id: "secondParty", ar: "اسم الطرف الثاني", en: "Second party", required: true, wide: true },
    { id: "nationality", ar: "الجنسية", en: "Nationality" },
    { id: "contractDate", ar: "تاريخ العقد", en: "Contract date", type: "date" },
  ],
  courts: [
    { id: "caseNumber", ar: "رقم الدعوى", en: "Case number" },
    { id: "caseYear", ar: "سنة الدعوى", en: "Case year", type: "number" },
    { id: "court", ar: "المحكمة / الدائرة", en: "Court / circuit", required: true },
    { id: "opponent", ar: "الخصم / الطرف الآخر", en: "Opponent / other party", wide: true },
  ],
};

const closingFields: Field[] = [
  { id: "subject", ar: "موضوع الطلب", en: "Request subject", required: true, wide: true },
  { id: "details", ar: "تفاصيل الطلب والوقائع", en: "Request details and facts", type: "textarea", required: true, wide: true },
  { id: "attachments", ar: "المرفقات — كل مستند في سطر", en: "Attachments — one document per line", type: "textarea", wide: true },
  { id: "notes", ar: "ملاحظات", en: "Notes", type: "textarea", wide: true },
];

function makeInitialValues() { return { requestDate: new Date().toISOString().slice(0, 10) } as Record<string, string> }

export function GovernmentForms({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MinistryFormCategory | "all">("all");
  const [selected, setSelected] = useState<MinistryForm>(ministryForms[0]);
  const [values, setValues] = useState<Record<string, string>>(makeInitialValues);
  const editorRef = useRef<HTMLDivElement>(null);
  const fields = useMemo(() => [...commonFields, ...categoryFields[selected.category], ...closingFields], [selected.category]);
  const filteredForms = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    return ministryForms.filter((form) => {
      if (category !== "all" && form.category !== category) return false;
      if (!needle) return true;
      return `${form.titleAr} ${form.titleEn} ${ministryFormCategories[form.category].ar}`.toLocaleLowerCase(locale).includes(needle);
    });
  }, [category, locale, query]);

  function selectForm(form: MinistryForm) {
    setSelected(form); setValues(makeInitialValues());
    window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  const formTitle = ar ? selected.titleAr : selected.titleEn;
  const categoryTitle = ar ? ministryFormCategories[selected.category].ar : ministryFormCategories[selected.category].en;
  const inputClass = "focus-ring mt-2 min-h-11 w-full border border-[#9b9b9b] bg-white px-3 text-sm text-black placeholder:text-black/35";

  return <section className="grid gap-7">
    <header className="border border-white/10 bg-[#102a31] p-5 sm:p-7"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
      <div><div className="flex items-center gap-2 text-xs font-bold text-[#ef4b4b]"><FileCheck2 size={17} />{ar ? "مكتبة نماذج وزارة العدل" : "MINISTRY OF JUSTICE FORM LIBRARY"}</div><h2 className="display mt-2 text-2xl sm:text-3xl">{ar ? "الاستمارات والخدمات القضائية" : "Judicial forms and services"}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-white/55">{ar ? "اعرض النموذج المطلوب، املأ خاناته المخصصة، ثم اطبع نسخة مرتبة أو احفظها PDF. روابط الخدمات أدناه تفتح بوابة الحكومة الإلكترونية الرسمية." : "Open a form, complete its relevant fields, then print or save a clean PDF. The service links below open the official eGovernment portal."}</p></div>
      <div className="flex items-center gap-3 border border-emerald-300/20 bg-emerald-300/5 p-4 text-xs leading-6 text-emerald-100/75"><ShieldCheck className="shrink-0 text-emerald-300" size={19} />{ar ? "الروابط والشعارات من صفحة خدمات وزارة العدل الرسمية." : "Links and service marks are from the official Ministry of Justice services page."}</div>
    </div></header>

    <section className="no-print"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-bold text-[#d1b579]">{ar ? "الوصول السريع" : "QUICK ACCESS"}</p><h3 className="display mt-1 text-2xl">{ar ? "الخدمات القضائية الإلكترونية" : "Online judicial services"}</h3></div><span className="hidden text-xs text-white/40 sm:block">{ar ? "تفتح في نافذة جديدة" : "Opens in a new tab"}</span></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{judicialServices.map((service) => <a key={service.id} href={service.href} target="_blank" rel="noreferrer" className="focus-ring group flex min-h-44 flex-col border border-white/10 bg-white/[.025] p-4 transition hover:-translate-y-0.5 hover:border-[#d1b579]/50 hover:bg-white/[.05]">
        <div className="flex items-start justify-between gap-3"><span className="grid size-16 place-items-center bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- exact artwork is hosted by the Ministry. */}
          <img src={service.logo} alt="" className="size-12 object-contain" />
        </span><ExternalLink size={16} className="text-white/30 transition group-hover:text-[#d1b579]" /></div>
        <strong className="mt-4 text-sm leading-6">{ar ? service.titleAr : service.titleEn}</strong><p className="mt-1 text-xs leading-5 text-white/45">{ar ? service.descriptionAr : service.descriptionEn}</p>
      </a>)}</div>
    </section>

    <section className="no-print border-t border-white/10 pt-7"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div><p className="text-xs font-bold text-[#d1b579]">{ar ? "مكتبة الوزارة" : "MINISTRY LIBRARY"}</p><h3 className="display mt-1 text-2xl">{ar ? "اختر الاستمارة" : "Choose a form"}</h3><p className="mt-1 text-xs text-white/40">{ar ? `${ministryForms.length} نموذجًا ودليلًا مصنفًا` : `${ministryForms.length} categorised forms and guides`}</p></div>
      <label className="relative block w-full lg:max-w-md"><Search className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-white/35" size={17} /><span className="sr-only">{ar ? "بحث" : "Search"}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "ابحث باسم الاستمارة…" : "Search forms…"} className="focus-ring min-h-12 w-full border border-white/15 bg-black/20 pe-4 ps-11 text-sm text-white placeholder:text-white/35" /></label>
    </div>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2"><FilterButton active={category === "all"} onClick={() => setCategory("all")}>{ar ? "الكل" : "All"}</FilterButton>{(Object.keys(ministryFormCategories) as MinistryFormCategory[]).map((id) => <FilterButton key={id} active={category === id} onClick={() => setCategory(id)}>{ar ? ministryFormCategories[id].ar : ministryFormCategories[id].en}</FilterButton>)}</div>
      {filteredForms.length ? <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filteredForms.map((form) => { const active = selected.id === form.id; return <button key={form.id} type="button" onClick={() => selectForm(form)} className={`focus-ring group flex min-h-32 flex-col items-start border p-4 text-start transition ${active ? "border-[#da291c] bg-[#da291c]/10" : "border-white/10 bg-white/[.025] hover:border-white/30"}`}><span className="flex w-full items-center justify-between gap-3 text-[10px] text-white/35"><span>{ar ? ministryFormCategories[form.category].ar : ministryFormCategories[form.category].en}</span><span dir="ltr">{form.size}</span></span><strong className="mt-3 text-sm leading-6 text-white/85">{ar ? form.titleAr : form.titleEn}</strong><span className={`mt-auto flex items-center gap-1 pt-3 text-xs font-bold ${active ? "text-[#ef4b4b]" : "text-[#d1b579]"}`}>{ar ? "عرض وتعبئة" : "Open and complete"}<ArrowUpLeft size={14} /></span></button> })}</div> : <div className="mt-4 border border-dashed border-white/15 p-8 text-center text-sm text-white/45">{ar ? "لا توجد استمارات مطابقة للبحث." : "No forms match your search."}</div>}
    </section>

    <div ref={editorRef} className="scroll-mt-24 grid gap-6 border-t border-white/10 pt-7 xl:grid-cols-[380px_1fr]">
      <aside className="no-print h-fit border border-white/10 bg-white/[.025] p-5"><div className="flex items-start gap-3"><Files className="mt-1 shrink-0 text-[#d1b579]" size={20} /><div><h3 className="font-bold leading-6">{formTitle}</h3><p className="mt-1 text-xs text-white/40">{categoryTitle}</p></div></div>
        {selected.kind && selected.kind !== "form" && <div className="mt-4 flex gap-2 border border-sky-300/20 bg-sky-300/5 p-3 text-xs leading-5 text-sky-100/70"><CheckCircle2 className="mt-0.5 shrink-0 text-sky-300" size={16} />{ar ? "هذا المستند دليل أو قائمة تحقق؛ استخدم الخانات لتسجيل بيانات الملف والملاحظات قبل طباعته." : "This is a guide or checklist; use the fields to record file details and notes before printing."}</div>}
        <div className="mt-5 grid gap-4">{fields.map((item) => <EditorField key={item.id} field={item} value={values[item.id] ?? ""} label={ar ? item.ar : item.en} inputClass={inputClass} onChange={(value) => setValues((current) => ({ ...current, [item.id]: value }))} />)}</div>
        <div className="mt-6 grid grid-cols-2 gap-2"><LiquidButton type="button" onClick={() => window.print()} className="focus-ring flex min-h-12 items-center justify-center gap-2 bg-[#da291c] px-4 text-sm font-bold text-white"><Printer size={17} />{ar ? "طباعة / PDF" : "Print / PDF"}</LiquidButton><LiquidButton type="button" onClick={() => setValues(makeInitialValues())} className="focus-ring flex min-h-12 items-center justify-center gap-2 border border-white/15 px-4 text-sm text-white/65 hover:text-white"><RotateCcw size={16} />{ar ? "تفريغ" : "Reset"}</LiquidButton></div>
        <p className="mt-4 text-[10px] leading-5 text-white/35">{ar ? "تبقى البيانات داخل هذه الصفحة ولا تُرسل إلى أي جهة. راجع النموذج الحكومي الأصلي قبل التقديم الرسمي." : "Data remains on this page and is not sent anywhere. Check the original government form before formal submission."}</p>
      </aside>
      <FormPreview ar={ar} form={selected} fields={fields} values={values} />
    </div>
  </section>
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`focus-ring min-h-10 shrink-0 border px-4 text-xs font-bold transition ${active ? "border-[#771111] bg-[#771111] text-white" : "border-white/10 text-white/50 hover:border-white/25 hover:text-white"}`}>{children}</button> }

function EditorField({ field, value, label, inputClass, onChange }: { field: Field; value: string; label: string; inputClass: string; onChange: (value: string) => void }) {
  const content = field.type === "textarea" ? <textarea value={value} required={field.required} onChange={(event) => onChange(event.target.value)} className={`${inputClass} min-h-24 py-3`} /> : <input value={value} required={field.required} type={field.type ?? "text"} onChange={(event) => onChange(event.target.value)} className={inputClass} dir={["number", "tel", "email"].includes(field.type ?? "") ? "ltr" : undefined} />;
  return <label className="text-xs font-bold text-white/65">{label}{field.required && <span className="ms-1 text-[#ef4b4b]">*</span>}{content}</label>
}

function FormPreview({ ar, form, fields, values }: { ar: boolean; form: MinistryForm; fields: Field[]; values: Record<string, string> }) {
  return <article className="government-form-print mx-auto w-full max-w-[850px] bg-white text-black shadow-2xl shadow-black/20" dir={ar ? "rtl" : "ltr"}><div className="h-2 bg-[#da291c]" /><div className="p-6 sm:p-9">
    <header className="relative border-b border-black pb-6 text-center"><Image src="/assets/brand/logo-icon.svg" width={64} height={64} alt="" className="mx-auto h-14 w-auto" /><p className="mt-3 text-[10px] font-bold tracking-[.06em] text-[#636466]">{ar ? "مكتب عبدالرحمن المودة للمحاماة والاستشارات القانونية" : "ABDULRAHMAN ALMAWDAH LAW OFFICE"}</p><h1 className="mx-auto mt-3 max-w-xl text-xl font-bold">{ar ? form.titleAr : form.titleEn}</h1><p className="mt-2 text-[10px] text-[#636466]">{ar ? ministryFormCategories[form.category].ar : ministryFormCategories[form.category].en}</p><div className="mt-5 grid grid-cols-2 border border-black text-start text-[10px] sm:absolute sm:start-0 sm:top-0 sm:mt-0 sm:w-48"><span className="border-e border-black p-2">{ar ? "رمز النموذج" : "Form code"}<strong className="mt-1 block" dir="ltr">MOJ-{form.id.toUpperCase().slice(0, 12)}</strong></span><span className="p-2">{ar ? "حجم الأصل" : "Source size"}<strong className="mt-1 block" dir="ltr">{form.size ?? "—"}</strong></span></div></header>
    <div className="mt-5 border border-[#636466] bg-[#f3f3f3] p-3 text-[10px] leading-5 text-[#363636]">{ar ? "نسخة عمل قابلة للتعبئة أعدها المكتب لتجميع البيانات. لا تُعد بديلًا عن النموذج الحكومي الأصلي ولا تحمل صفة محرر رسمي." : "A fillable working copy prepared by the office to collect information. It does not replace the original government form and is not an official instrument."}</div>
    <section className="mt-5 grid grid-cols-2 border-s border-t border-[#636466]">{fields.map((field) => <div key={field.id} className={`${field.wide ? "col-span-2" : ""} min-h-16 border-b border-e border-[#636466] p-3 ${field.type === "textarea" ? "min-h-24" : ""}`}><p className="text-[9px] font-bold text-[#636466]">{ar ? field.ar : field.en}{field.required ? " *" : ""}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5">{values[field.id] || " "}</p></div>)}</section>
    <footer className="mt-6 grid grid-cols-2 gap-4 text-[10px] text-[#636466]"><div className="min-h-20 border border-[#636466] p-3">{ar ? "توقيع مقدم الطلب" : "Applicant signature"}</div><div className="min-h-20 border border-[#636466] p-3">{ar ? "مراجعة المكتب وتاريخها" : "Office review and date"}</div></footer>
  </div></article>
}
