"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { onValue, push, ref, remove, set, update } from "firebase/database";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Papa from "papaparse";
import { Archive, CalendarDays, ChevronDown, Download, FilePlus2, Import, LoaderCircle, Pencil, Search, Trash2, X } from "lucide-react";
import type { Locale } from "@/config/site";
import { demoCases } from "@/data/admin-seed";
import { rankCases } from "@/lib/case-search";
import { firestore, realtimeDatabase } from "@/lib/firebase/client";
import type { CaseDraft, CaseStatus, LawCase } from "@/types/admin";

const emptyDraft: CaseDraft = { caseNumber: "", caseYear: new Date().getFullYear(), caseType: "مدني", clientName: "", accusedName: "", victimName: "", court: "", status: "new", judgment: "", judgeName: "", notes: "", nextHearing: "", isDemo: false };
const statuses: CaseStatus[] = ["new", "active", "hearing", "judgment", "execution", "closed"];
const statusLabels: Record<CaseStatus, string> = { new: "جديدة", active: "نشطة", hearing: "جلسات", judgment: "صدر حكم", execution: "تنفيذ", closed: "مغلقة" };

async function audit(user: User, action: "create" | "update" | "delete" | "import" | "seed", entityId: string, summary: string) {
  try {
    await addDoc(collection(firestore, "auditLogs"), { action, entityType: "case", entityId, summary: summary.slice(0, 500), createdBy: user.uid, createdAt: serverTimestamp() });
  } catch {
    // The case write is canonical in RTDB; an unavailable audit store must not
    // make a successful case operation look like it failed.
  }
}

function toDraft(row: Record<string, unknown>): CaseDraft | null {
  const value = (keys: string[]) => {
    const found = keys.find((key) => row[key] !== undefined);
    return found ? String(row[found] ?? "").trim() : "";
  };
  const caseNumber = value(["caseNumber", "رقم القضية", "رقم القضيه"]);
  const clientName = value(["clientName", "اسم الموكل"]);
  if (!caseNumber || !clientName) return null;
  const status = value(["status", "الحالة", "الحاله"]) as CaseStatus;
  return {
    caseNumber,
    caseYear: Number(value(["caseYear", "سنة القضية", "سنه القضيه"])) || new Date().getFullYear(),
    caseType: value(["caseType", "نوع القضية", "نوع القضيه"]) || "غير مصنف",
    clientName,
    accusedName: value(["accusedName", "المتهم"]),
    victimName: value(["victimName", "المجني عليه"]),
    court: value(["court", "المحكمة", "المحكمه"]) || "غير محدد",
    status: statuses.includes(status) ? status : "new",
    judgment: value(["judgment", "الحكم"]),
    judgeName: value(["judgeName", "القاضي", "الحاكم"]),
    notes: value(["notes", "ملاحظات"]),
    nextHearing: value(["nextHearing", "الجلسة القادمة", "الجلسه القادمه"]),
    isDemo: false,
  };
}

export function CaseManager({ locale, user }: { locale: Locale; user: User }) {
  const ar = locale === "ar";
  const [cases, setCases] = useState<LawCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LawCase | null>(null);
  const [draft, setDraft] = useState<CaseDraft>(emptyDraft);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => onValue(ref(realtimeDatabase, "cases"), (snapshot) => {
    const value = snapshot.val() as Record<string, Omit<LawCase, "id">> | null;
    setCases(value ? Object.entries(value).map(([id, item]) => ({ id, ...item })) : []);
    setLoading(false);
  }, () => { setMessage(ar ? "تعذر قراءة القضايا. راجع قواعد Realtime Database." : "Unable to read cases. Check Realtime Database rules."); setLoading(false); }), [ar]);

  const results = useMemo(() => {
    const ranked = rankCases(cases, query, 200).map((item) => item.lawCase);
    return statusFilter === "all" ? ranked : ranked.filter((item) => item.status === statusFilter);
  }, [cases, query, statusFilter]);

  function field<K extends keyof CaseDraft>(key: K, value: CaseDraft[K]) { setDraft((current) => ({ ...current, [key]: value })); }
  function openNew() { setEditing(null); setDraft(emptyDraft); setFormOpen(true); setMessage(""); }
  function openEdit(item: LawCase) { const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, createdBy: _createdBy, ...editable } = item; void _id; void _createdAt; void _updatedAt; void _createdBy; setEditing(item); setDraft(editable); setFormOpen(true); }

  async function saveCase(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const now = Date.now();
      if (editing) {
        await update(ref(realtimeDatabase, `cases/${editing.id}`), { ...draft, createdAt: editing.createdAt, updatedAt: now, createdBy: editing.createdBy });
        await audit(user, "update", editing.id, `تحديث القضية ${draft.caseNumber}`);
      } else {
        const target = push(ref(realtimeDatabase, "cases"));
        if (!target.key) throw new Error("CASE_KEY_FAILED");
        await set(target, { ...draft, createdAt: now, updatedAt: now, createdBy: user.uid });
        await audit(user, "create", target.key, `إضافة القضية ${draft.caseNumber}`);
      }
      setFormOpen(false); setEditing(null); setDraft(emptyDraft);
      setMessage(ar ? "تم حفظ القضية." : "Case saved.");
    } catch { setMessage(ar ? "تعذر حفظ القضية. تأكد من نشر قواعد Firebase ومن الحقول." : "Unable to save the case. Verify Firebase rules and fields."); }
    finally { setBusy(false); }
  }

  async function deleteCase(item: LawCase) {
    if (!window.confirm(ar ? `حذف القضية ${item.caseNumber} نهائياً؟` : `Delete case ${item.caseNumber} permanently?`)) return;
    setBusy(true);
    try { await remove(ref(realtimeDatabase, `cases/${item.id}`)); await audit(user, "delete", item.id, `حذف القضية ${item.caseNumber}`); }
    catch { setMessage(ar ? "تعذر حذف القضية." : "Unable to delete case."); }
    finally { setBusy(false); }
  }

  async function seedDemo() {
    if (cases.length && !window.confirm(ar ? "توجد قضايا حالياً. هل تريد إضافة البيانات التجريبية أيضاً؟" : "Cases already exist. Add demo data as well?")) return;
    setBusy(true); setMessage("");
    try {
      const now = Date.now();
      await Promise.all(demoCases.map((item, index) => {
        const target = push(ref(realtimeDatabase, "cases"));
        return set(target, { ...item, createdAt: now + index, updatedAt: now + index, createdBy: user.uid });
      }));
      await audit(user, "seed", "demo-cases", `إضافة ${demoCases.length} قضايا تجريبية`);
      setMessage(ar ? "أضيفت البيانات التجريبية، وهي موسومة بوضوح." : "Clearly labelled demo cases were added.");
    } catch { setMessage(ar ? "تعذر إضافة البيانات التجريبية." : "Unable to add demo data."); }
    finally { setBusy(false); }
  }

  async function importFile(file?: File) {
    if (!file) return;
    setBusy(true); setMessage("");
    try {
      const text = await file.text();
      const rows = file.name.toLowerCase().endsWith(".json") ? JSON.parse(text) as Record<string, unknown>[] : Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true }).data;
      const drafts = rows.map(toDraft).filter((item): item is CaseDraft => Boolean(item));
      if (!drafts.length) throw new Error("NO_VALID_ROWS");
      const now = Date.now();
      await Promise.all(drafts.map((item, index) => set(push(ref(realtimeDatabase, "cases")), { ...item, createdAt: now + index, updatedAt: now + index, createdBy: user.uid })));
      await audit(user, "import", file.name, `استيراد ${drafts.length} قضية من ${file.name}`);
      setMessage(ar ? `تم استيراد ${drafts.length} قضية.` : `${drafts.length} cases imported.`);
    } catch { setMessage(ar ? "تعذر الاستيراد. استخدم CSV أو JSON وتأكد من وجود رقم القضية واسم الموكل." : "Import failed. Use CSV or JSON with case number and client name."); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  function downloadTemplate() {
    const csv = Papa.unparse([{ caseNumber: "2026/0001", caseYear: 2026, caseType: "مدني", clientName: "اسم الموكل", accusedName: "", victimName: "", court: "المحكمة الكبرى المدنية", status: "new", judgment: "", judgeName: "", notes: "", nextHearing: "2026-09-01" }]);
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "cases-import-template.csv"; link.click(); URL.revokeObjectURL(url);
  }

  const input = "focus-ring min-h-11 w-full border border-[#d8d0c2] bg-white px-3 text-sm";
  return (
    <section>
      <div className="grid gap-3 sm:grid-cols-3">
        {[{ label: ar ? "إجمالي القضايا" : "Total cases", value: cases.length }, { label: ar ? "القضايا النشطة" : "Active matters", value: cases.filter((item) => ["new", "active", "hearing"].includes(item.status)).length }, { label: ar ? "جلسات قادمة" : "Upcoming hearings", value: cases.filter((item) => item.nextHearing).length }].map((stat) => <article key={stat.label} className="border border-white/10 bg-white/[.04] p-5"><p className="text-sm text-white/50">{stat.label}</p><p className="mt-2 text-3xl font-black text-[#d0ad69]">{stat.value}</p></article>)}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={openNew} className="focus-ring flex min-h-11 items-center gap-2 bg-[#b89555] px-4 text-sm font-bold text-[#10191b]"><FilePlus2 size={17} />{ar ? "قضية جديدة" : "New case"}</button>
        <button onClick={() => fileRef.current?.click()} className="focus-ring flex min-h-11 items-center gap-2 border border-white/15 px-4 text-sm font-bold hover:border-[#b89555]"><Import size={17} />{ar ? "أمبورت CSV / JSON" : "Import CSV / JSON"}</button>
        <input ref={fileRef} type="file" accept=".csv,.json,text/csv,application/json" className="hidden" onChange={(event) => void importFile(event.target.files?.[0])} />
        <button onClick={downloadTemplate} className="focus-ring flex min-h-11 items-center gap-2 border border-white/15 px-4 text-sm text-white/70 hover:text-white"><Download size={16} />{ar ? "قالب الاستيراد" : "Import template"}</button>
        <button onClick={seedDemo} disabled={busy} className="focus-ring flex min-h-11 items-center gap-2 border border-white/15 px-4 text-sm text-white/70 hover:text-white disabled:opacity-50"><Archive size={16} />{ar ? "إضافة بيانات تجريبية" : "Add demo data"}</button>
      </div>
      {message && <p className="mt-4 border border-[#b89555]/25 bg-[#b89555]/10 p-3 text-sm text-[#e2c98f]">{message}</p>}

      {formOpen && <form onSubmit={saveCase} className="mt-6 grid gap-4 border border-[#b89555]/35 bg-[#fffdf8] p-5 text-[#10191b] sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center justify-between sm:col-span-2 lg:col-span-3"><h3 className="display text-2xl">{editing ? ar ? "تعديل القضية" : "Edit case" : ar ? "إضافة قضية" : "Add case"}</h3><button type="button" onClick={() => setFormOpen(false)} className="focus-ring p-2"><X /></button></div>
        <label className="text-xs font-bold">{ar ? "رقم القضية" : "Case number"}<input required value={draft.caseNumber} onChange={(e) => field("caseNumber", e.target.value)} className={input} /></label>
        <label className="text-xs font-bold">{ar ? "السنة" : "Year"}<input required type="number" min="1900" max="2200" value={draft.caseYear} onChange={(e) => field("caseYear", Number(e.target.value))} className={input} /></label>
        <label className="text-xs font-bold">{ar ? "نوع القضية" : "Case type"}<input required value={draft.caseType} onChange={(e) => field("caseType", e.target.value)} className={input} /></label>
        <label className="text-xs font-bold">{ar ? "اسم الموكل" : "Client"}<input required value={draft.clientName} onChange={(e) => field("clientName", e.target.value)} className={input} /></label>
        <label className="text-xs font-bold">{ar ? "المتهم / الخصم" : "Accused / opponent"}<input value={draft.accusedName} onChange={(e) => field("accusedName", e.target.value)} className={input} /></label>
        <label className="text-xs font-bold">{ar ? "المجني عليه" : "Victim"}<input value={draft.victimName} onChange={(e) => field("victimName", e.target.value)} className={input} /></label>
        <label className="text-xs font-bold">{ar ? "المحكمة" : "Court"}<input required value={draft.court} onChange={(e) => field("court", e.target.value)} className={input} /></label>
        <label className="text-xs font-bold">{ar ? "الحالة" : "Status"}<select value={draft.status} onChange={(e) => field("status", e.target.value as CaseStatus)} className={input}>{statuses.map((status) => <option key={status} value={status}>{ar ? statusLabels[status] : status}</option>)}</select></label>
        <label className="text-xs font-bold">{ar ? "الجلسة القادمة" : "Next hearing"}<input type="date" value={draft.nextHearing} onChange={(e) => field("nextHearing", e.target.value)} className={input} /></label>
        <label className="text-xs font-bold">{ar ? "القاضي / الهيئة" : "Judge / panel"}<input value={draft.judgeName} onChange={(e) => field("judgeName", e.target.value)} className={input} /></label>
        <label className="text-xs font-bold sm:col-span-2">{ar ? "الحكم" : "Judgment"}<textarea value={draft.judgment} onChange={(e) => field("judgment", e.target.value)} className={`${input} min-h-24 py-3`} /></label>
        <label className="text-xs font-bold sm:col-span-2 lg:col-span-3">{ar ? "الملاحظات" : "Notes"}<textarea value={draft.notes} onChange={(e) => field("notes", e.target.value)} className={`${input} min-h-28 py-3`} /></label>
        <button disabled={busy} className="focus-ring flex min-h-12 items-center justify-center gap-2 bg-[#b89555] px-5 font-bold sm:col-span-2 lg:col-span-3">{busy && <LoaderCircle className="animate-spin" size={17} />}{ar ? "حفظ القضية" : "Save case"}</button>
      </form>}

      <div className="mt-7 grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="relative"><Search className="absolute start-4 top-1/2 -translate-y-1/2 text-[#8b9698]" size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ar ? "ابحث بالموكل، النوع، المتهم، المجني عليه، الرقم، السنة، الحكم أو القاضي…" : "Search client, type, accused, victim, number, year, judgment or judge…"} className="focus-ring min-h-13 w-full border border-white/15 bg-white/[.06] px-12 text-sm placeholder:text-white/35" /></label>
        <label className="relative"><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as CaseStatus | "all")} className="focus-ring min-h-13 appearance-none border border-white/15 bg-[#132b32] px-4 pe-11 text-sm"><option value="all">{ar ? "كل الحالات" : "All statuses"}</option>{statuses.map((status) => <option key={status} value={status}>{ar ? statusLabels[status] : status}</option>)}</select><ChevronDown className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2" size={16} /></label>
      </div>

      <div className="mt-5 overflow-x-auto border border-white/10">
        <table className="w-full min-w-[980px] text-start text-sm"><thead className="bg-white/[.06] text-white/55"><tr>{[ar ? "القضية" : "Case", ar ? "الموكل والأطراف" : "Client & parties", ar ? "المحكمة" : "Court", ar ? "الحالة" : "Status", ar ? "الحكم" : "Judgment", ar ? "آخر تحديث" : "Updated", ""].map((label) => <th key={label} className="p-4 text-start font-semibold">{label}</th>)}</tr></thead><tbody>
          {loading ? <tr><td colSpan={7} className="p-12 text-center"><LoaderCircle className="mx-auto animate-spin" /></td></tr> : results.length === 0 ? <tr><td colSpan={7} className="p-12 text-center text-white/45">{ar ? "لا توجد نتائج مطابقة." : "No matching cases."}</td></tr> : results.map((item) => <tr key={item.id} className="border-t border-white/8 align-top hover:bg-white/[.025]"><td className="p-4"><strong dir="ltr" className="block text-[#e0c27f]">{item.caseNumber}</strong><span className="mt-1 block text-xs text-white/45">{item.caseType} · {item.caseYear}</span>{item.isDemo && <span className="mt-2 inline-block bg-amber-400/10 px-2 py-1 text-[10px] text-amber-200">{ar ? "تجريبي" : "DEMO"}</span>}</td><td className="p-4"><strong>{item.clientName}</strong>{item.accusedName && <span className="mt-1 block text-xs text-white/45">{ar ? "المتهم/الخصم:" : "Accused/opponent:"} {item.accusedName}</span>}{item.victimName && <span className="block text-xs text-white/45">{ar ? "المجني عليه:" : "Victim:"} {item.victimName}</span>}</td><td className="max-w-48 p-4 text-white/65">{item.court}</td><td className="p-4"><span className="border border-[#b89555]/30 bg-[#b89555]/10 px-2 py-1 text-xs text-[#e2c98f]">{ar ? statusLabels[item.status] : item.status}</span>{item.nextHearing && <span className="mt-3 flex items-center gap-1 text-xs text-white/45"><CalendarDays size={13} />{item.nextHearing}</span>}</td><td className="max-w-56 p-4 text-xs leading-6 text-white/55">{item.judgment || "—"}</td><td className="p-4 text-xs text-white/40" dir="ltr">{new Date(item.updatedAt).toLocaleDateString(ar ? "ar-BH" : "en-BH")}</td><td className="p-4"><div className="flex gap-1"><button onClick={() => openEdit(item)} className="focus-ring p-2 text-white/60 hover:text-[#d0ad69]" aria-label={ar ? "تعديل" : "Edit"}><Pencil size={16} /></button><button onClick={() => void deleteCase(item)} className="focus-ring p-2 text-white/60 hover:text-red-400" aria-label={ar ? "حذف" : "Delete"}><Trash2 size={16} /></button></div></td></tr>)}
        </tbody></table>
      </div>
    </section>
  );
}
