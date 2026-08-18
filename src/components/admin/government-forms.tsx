"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { FileCheck2, Info, Printer, RotateCcw, ShieldAlert } from "lucide-react";
import type { Locale } from "@/config/site";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";

type FormKind = "transaction" | "case-action" | "documents";

type FormData = {
  clientName: string;
  personalNumber: string;
  caseNumber: string;
  caseYear: string;
  court: string;
  opponent: string;
  requestDate: string;
  referenceNumber: string;
  subject: string;
  details: string;
  attachments: string;
  nextAction: string;
  deadline: string;
  preparedBy: string;
  reviewedBy: string;
  status: string;
};

const emptyForm = (): FormData => ({
  clientName: "",
  personalNumber: "",
  caseNumber: "",
  caseYear: String(new Date().getFullYear()),
  court: "",
  opponent: "",
  requestDate: new Date().toISOString().slice(0, 10),
  referenceNumber: "",
  subject: "",
  details: "",
  attachments: "",
  nextAction: "",
  deadline: "",
  preparedBy: "",
  reviewedBy: "",
  status: "draft",
});

const formDefinitions = {
  transaction: {
    number: "LAW-FRM-01",
    titleAr: "متابعة معاملة قضائية إلكترونية",
    titleEn: "E-Justice Transaction Follow-up",
    instructionAr: "استخدمه لتوثيق رقم الطلب وحالة المعاملة والإجراء التالي بعد التقديم الإلكتروني.",
    instructionEn: "Use this to record the request number, transaction status and next action after online submission.",
  },
  "case-action": {
    number: "LAW-FRM-02",
    titleAr: "تكليف بإجراء على قضية",
    titleEn: "Case Action Instruction",
    instructionAr: "استخدمه لإسناد إجراء محدد في ملف قضية مع الموعد والمرفقات والمراجع المطلوبة.",
    instructionEn: "Use this to assign a defined case action with its deadline, attachments and required references.",
  },
  documents: {
    number: "LAW-FRM-03",
    titleAr: "استلام وتسليم مستندات موكل",
    titleEn: "Client Document Handover",
    instructionAr: "استخدمه لتسجيل المستندات المستلمة أو المسلّمة والغرض منها والمسؤول عنها.",
    instructionEn: "Use this to record documents received or returned, their purpose and responsible person.",
  },
} as const;

function displayDate(value: string, ar: boolean) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return ar ? `${year}/${month}/${day}` : `${day}/${month}/${year}`;
}

export function GovernmentForms({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [kind, setKind] = useState<FormKind>("transaction");
  const [data, setData] = useState<FormData>(emptyForm);
  const definition = formDefinitions[kind];
  const issuedDate = "2026/08/18";
  const formTitle = ar ? definition.titleAr : definition.titleEn;
  const statusLabel = useMemo(() => ({ draft: ar ? "مسودة" : "Draft", ready: ar ? "جاهز" : "Ready", submitted: ar ? "تم التقديم" : "Submitted", completed: ar ? "مكتمل" : "Completed" })[data.status] ?? data.status, [ar, data.status]);
  const field = <K extends keyof FormData>(key: K, value: FormData[K]) => setData((current) => ({ ...current, [key]: value }));
  const input = "focus-ring mt-2 min-h-11 w-full border border-[#9b9b9b] bg-white px-3 text-sm text-black placeholder:text-black/30";

  function switchKind(next: FormKind) {
    setKind(next);
    setData(emptyForm());
  }

  return <section className="grid gap-6">
    <div className="border border-white/10 bg-[#102a31] p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div><div className="flex items-center gap-2 text-xs font-bold text-[#ef4b4b]"><FileCheck2 size={17} />{ar ? "نظام الاستمارات الحكومية" : "GOVERNMENT FORM SYSTEM"}</div><h2 className="display mt-2 text-2xl sm:text-3xl">{ar ? "نماذج المكتب القانونية" : "Legal office forms"}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-white/50">{ar ? "قوالب داخلية قابلة للطباعة مبنية على قواعد الصفحات 49–53 من دليل هوية حكومة البحرين: عنوان موجز، رقم إصدار، تعليمات قصيرة، أقسام منطقية، وحقول صندوقية واضحة." : "Printable internal templates based on pages 49–53 of the Bahrain Government identity guide: concise title, issue number, short instructions, logical sections and clear boxed fields."}</p></div>
        <div className="flex items-start gap-3 border border-amber-300/20 bg-amber-300/5 p-4 text-xs leading-6 text-amber-100/70"><ShieldAlert className="mt-0.5 shrink-0 text-amber-300" size={17} /><span>{ar ? "هذه نماذج داخلية للمكتب وليست محررات حكومية. لذلك لا يظهر شعار الدولة داخل النسخة المطبوعة." : "These are internal office forms, not government instruments. The state emblem is therefore not printed on them."}</span></div>
      </div>
    </div>

    <div className="no-print grid gap-3 sm:grid-cols-3">{(Object.keys(formDefinitions) as FormKind[]).map((item) => { const entry = formDefinitions[item]; const active = item === kind; return <LiquidButton key={item} type="button" onClick={() => switchKind(item)} className={`focus-ring min-h-24 border p-4 text-start transition ${active ? "border-[#da291c] bg-[#da291c] text-white" : "border-white/10 bg-white/[.025] text-white/55 hover:border-white/25 hover:text-white"}`}><strong className="block text-sm">{ar ? entry.titleAr : entry.titleEn}</strong><span className={`mt-2 block text-[10px] ${active ? "text-white/70" : "text-white/30"}`} dir="ltr">{entry.number}</span></LiquidButton> })}</div>

    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="no-print h-fit border border-white/10 bg-white/[.025] p-5">
        <h3 className="font-bold">{ar ? "تعبئة النموذج" : "Complete the form"}</h3><p className="mt-2 text-xs leading-6 text-white/40">{ar ? "البيانات تبقى في المتصفح حتى تغادر القسم. استخدم زر الطباعة لحفظ نسخة PDF." : "Data stays in the browser until you leave this section. Use Print to save a PDF copy."}</p>
        <div className="mt-5 grid gap-4">
          <label className="text-xs font-bold text-white/65">{ar ? "اسم الموكل" : "Client name"}<input value={data.clientName} onChange={(event) => field("clientName", event.target.value)} className={input} /></label>
          <label className="text-xs font-bold text-white/65">{ar ? "الرقم الشخصي – اختياري" : "Personal number — optional"}<input value={data.personalNumber} onChange={(event) => field("personalNumber", event.target.value)} className={input} dir="ltr" inputMode="numeric" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-white/65">{ar ? "رقم القضية" : "Case number"}<input value={data.caseNumber} onChange={(event) => field("caseNumber", event.target.value)} className={input} dir="ltr" /></label><label className="text-xs font-bold text-white/65">{ar ? "السنة" : "Year"}<input value={data.caseYear} onChange={(event) => field("caseYear", event.target.value)} className={input} dir="ltr" inputMode="numeric" /></label></div>
          <label className="text-xs font-bold text-white/65">{ar ? "المحكمة / الجهة" : "Court / authority"}<input value={data.court} onChange={(event) => field("court", event.target.value)} className={input} /></label>
          <label className="text-xs font-bold text-white/65">{ar ? "الخصم / الطرف الآخر" : "Opponent / other party"}<input value={data.opponent} onChange={(event) => field("opponent", event.target.value)} className={input} /></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-white/65">{ar ? "تاريخ الطلب" : "Request date"}<input type="date" value={data.requestDate} onChange={(event) => field("requestDate", event.target.value)} className={input} dir="ltr" /></label><label className="text-xs font-bold text-white/65">{ar ? "رقم المرجع" : "Reference"}<input value={data.referenceNumber} onChange={(event) => field("referenceNumber", event.target.value)} className={input} dir="ltr" /></label></div>
          <label className="text-xs font-bold text-white/65">{kind === "documents" ? ar ? "الغرض من المستندات" : "Document purpose" : ar ? "موضوع الطلب / الإجراء" : "Request / action subject"}<input value={data.subject} onChange={(event) => field("subject", event.target.value)} className={input} /></label>
          <label className="text-xs font-bold text-white/65">{kind === "documents" ? ar ? "وصف المستندات وحالتها" : "Documents and condition" : ar ? "تفاصيل الإجراء" : "Action details"}<textarea value={data.details} onChange={(event) => field("details", event.target.value)} className={`${input} min-h-24 py-3`} /></label>
          <label className="text-xs font-bold text-white/65">{ar ? "المرفقات – كل مستند في سطر" : "Attachments — one per line"}<textarea value={data.attachments} onChange={(event) => field("attachments", event.target.value)} className={`${input} min-h-20 py-3`} /></label>
          <label className="text-xs font-bold text-white/65">{ar ? "الإجراء التالي" : "Next action"}<input value={data.nextAction} onChange={(event) => field("nextAction", event.target.value)} className={input} /></label>
          <label className="text-xs font-bold text-white/65">{ar ? "الموعد / المهلة" : "Deadline"}<input type="date" value={data.deadline} onChange={(event) => field("deadline", event.target.value)} className={input} dir="ltr" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-white/65">{ar ? "أعدّه" : "Prepared by"}<input value={data.preparedBy} onChange={(event) => field("preparedBy", event.target.value)} className={input} /></label><label className="text-xs font-bold text-white/65">{ar ? "راجعه" : "Reviewed by"}<input value={data.reviewedBy} onChange={(event) => field("reviewedBy", event.target.value)} className={input} /></label></div>
          <label className="text-xs font-bold text-white/65">{ar ? "الحالة" : "Status"}<select value={data.status} onChange={(event) => field("status", event.target.value)} className={input}><option value="draft">{ar ? "مسودة" : "Draft"}</option><option value="ready">{ar ? "جاهز" : "Ready"}</option><option value="submitted">{ar ? "تم التقديم" : "Submitted"}</option><option value="completed">{ar ? "مكتمل" : "Completed"}</option></select></label>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2"><LiquidButton type="button" onClick={() => window.print()} className="focus-ring flex min-h-12 items-center justify-center gap-2 bg-[#da291c] px-4 text-sm font-bold text-white"><Printer size={17} />{ar ? "طباعة / PDF" : "Print / PDF"}</LiquidButton><LiquidButton type="button" onClick={() => setData(emptyForm())} className="focus-ring flex min-h-12 items-center justify-center gap-2 border border-white/15 px-4 text-sm text-white/65 hover:text-white"><RotateCcw size={16} />{ar ? "تفريغ" : "Reset"}</LiquidButton></div>
      </aside>

      <article className="government-form-print mx-auto w-full max-w-[850px] bg-white text-black shadow-2xl shadow-black/20">
        <div className="h-2 bg-[#da291c]" />
        <div className="p-6 sm:p-9">
          <header className="relative border-b border-black pb-6 text-center"><Image src="/assets/brand/logo-icon.svg" width={64} height={64} alt={ar ? "شعار مكتب عبدالرحمن المودة" : "Abdulrahman Almawdah office mark"} className="mx-auto h-14 w-auto" /><p className="mt-3 text-[10px] font-bold tracking-[.08em] text-[#636466]">{ar ? "مكتب عبدالرحمن المودة للمحاماة والاستشارات القانونية" : "ABDULRAHMAN ALMAWDAH LAW OFFICE"}</p><h1 className="mt-3 text-xl font-bold">{formTitle}</h1><p className="mt-1 text-[10px] text-[#636466]">{ar ? definition.titleEn : definition.titleAr}</p><div className="mt-5 grid grid-cols-2 border border-black text-start text-[10px] sm:absolute sm:start-0 sm:top-0 sm:mt-0 sm:w-44"><span className="border-e border-black p-2">{ar ? "رقم النموذج" : "Form no."}<strong className="mt-1 block" dir="ltr">{definition.number}</strong></span><span className="p-2">{ar ? "الإصدار" : "Issued"}<strong className="mt-1 block" dir="ltr">{issuedDate}</strong></span></div></header>

          <section className="mt-5 border border-[#636466]"><h2 className="bg-[#636466] px-3 py-2 text-xs font-bold text-white">{ar ? "تعليمات الاستخدام" : "Instructions"}</h2><div className="flex gap-2 p-3 text-[10px] leading-5"><Info className="mt-0.5 shrink-0 text-[#da291c]" size={14} /><p>{ar ? definition.instructionAr : definition.instructionEn} {ar ? "تأكد من صحة البيانات، ولا ترفق أصلًا وحيدًا دون تسجيله." : "Verify all data and never attach a sole original without recording it."}</p></div></section>

          <FormSection title={ar ? "بيانات الموكل والقضية" : "Client and case details"}>
            <PrintField label={ar ? "اسم الموكل" : "Client name"} value={data.clientName} wide />
            <PrintField label={ar ? "الرقم الشخصي" : "Personal number"} value={data.personalNumber} ltr />
            <PrintField label={ar ? "رقم القضية / السنة" : "Case no. / year"} value={[data.caseNumber, data.caseYear].filter(Boolean).join(" / ")} ltr />
            <PrintField label={ar ? "المحكمة / الجهة" : "Court / authority"} value={data.court} />
            <PrintField label={ar ? "الخصم / الطرف الآخر" : "Opponent / other party"} value={data.opponent} />
          </FormSection>

          <FormSection title={ar ? "بيانات الطلب" : "Request details"}>
            <PrintField label={ar ? "تاريخ الطلب" : "Request date"} value={displayDate(data.requestDate, ar)} ltr />
            <PrintField label={ar ? "رقم المرجع" : "Reference number"} value={data.referenceNumber} ltr />
            <PrintField label={ar ? "الموضوع" : "Subject"} value={data.subject} wide />
            <PrintField label={kind === "documents" ? ar ? "وصف المستندات وحالتها" : "Documents and condition" : ar ? "تفاصيل الإجراء" : "Action details"} value={data.details} wide multiline />
            <PrintField label={ar ? "المرفقات" : "Attachments"} value={data.attachments} wide multiline />
          </FormSection>

          <FormSection title={ar ? "المتابعة والاعتماد" : "Follow-up and approval"}>
            <PrintField label={ar ? "الإجراء التالي" : "Next action"} value={data.nextAction} wide />
            <PrintField label={ar ? "الموعد / المهلة" : "Deadline"} value={displayDate(data.deadline, ar)} ltr />
            <PrintField label={ar ? "الحالة" : "Status"} value={statusLabel} />
            <PrintField label={ar ? "أعدّه" : "Prepared by"} value={data.preparedBy} />
            <PrintField label={ar ? "راجعه" : "Reviewed by"} value={data.reviewedBy} />
          </FormSection>

          <div className="mt-5 grid grid-cols-2 gap-4"><div className="min-h-20 border border-[#636466] p-3 text-[10px] text-[#636466]">{ar ? "توقيع المُعد" : "Prepared by signature"}</div><div className="min-h-20 border border-[#636466] p-3 text-[10px] text-[#636466]">{ar ? "توقيع المراجع" : "Reviewer signature"}</div></div>
          <footer className="mt-6 flex items-center justify-between border-t border-[#636466] pt-3 text-[8px] text-[#636466]"><span>{ar ? "للاستخدام الداخلي فقط — ليس مستندًا حكوميًا" : "Internal use only — not a government document"}</span><span dir="ltr">{definition.number} · {issuedDate}</span></footer>
        </div>
      </article>
    </div>
  </section>;
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-5 border border-[#636466]"><h2 className="bg-[#636466] px-3 py-2 text-xs font-bold text-white">{title}</h2><div className="grid grid-cols-2">{children}</div></section>;
}

function PrintField({ label, value, wide, ltr, multiline }: { label: string; value: string; wide?: boolean; ltr?: boolean; multiline?: boolean }) {
  return <div className={`border-b border-e border-[#b3b3b3] p-3 ${wide ? "col-span-2" : ""} ${multiline ? "min-h-24" : "min-h-16"}`}><span className="block text-[9px] text-[#636466]">{label}</span><strong className="mt-1 block whitespace-pre-wrap text-[11px] font-normal leading-5" dir={ltr ? "ltr" : undefined}>{value || "—"}</strong></div>;
}
