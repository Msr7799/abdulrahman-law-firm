"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, writeBatch } from "firebase/firestore";
import { ExternalLink, LoaderCircle, Phone, Search, ShieldCheck } from "lucide-react";
import type { Locale } from "@/config/site";
import { verifiedDirectory } from "@/data/admin-seed";
import { normalizeSearch } from "@/lib/case-search";
import { firestore } from "@/lib/firebase/client";
import type { DirectoryContact } from "@/types/admin";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";

const categoryLabels: Record<string, { ar: string; en: string }> = {
  emergency: { ar: "الطوارئ والأمن", en: "Emergency & security" },
  justice: { ar: "العدالة والنيابة", en: "Justice & prosecution" },
  health: { ar: "الصحة والمستشفيات", en: "Health & hospitals" },
  government: { ar: "الجهات الحكومية والمهنية", en: "Government & professional" },
};

export function DirectoryManager({ locale, user }: { locale: Locale; user: User }) {
  const ar = locale === "ar";
  const [contacts, setContacts] = useState<DirectoryContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => onSnapshot(query(collection(firestore, "contacts"), orderBy("sortOrder")), (snapshot) => {
    setContacts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as DirectoryContact));
    setLoading(false);
  }, () => { setLoading(false); setMessage(ar ? "تعذر فتح دليل Firestore. قد تحتاج إلى إنشاء قاعدة Firestore أو نشر القواعد." : "Unable to open the Firestore directory. Create Firestore or deploy the rules."); }), [ar]);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(search);
    if (!needle) return contacts;
    return contacts.filter((item) => normalizeSearch([item.nameAr, item.nameEn, item.phone, item.category, item.notesAr, item.notesEn].join(" ")).includes(needle));
  }, [contacts, search]);

  const grouped = useMemo(() => Object.entries(categoryLabels).map(([category, label]) => ({ category, label, items: filtered.filter((item) => item.category === category) })).filter((group) => group.items.length), [filtered]);

  async function seedDirectory() {
    if (contacts.length) return;
    setBusy(true); setMessage("");
    try {
      const batch = writeBatch(firestore);
      verifiedDirectory.forEach((item) => batch.set(doc(firestore, "contacts", `verified-${item.sortOrder}`), { ...item, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: user.uid }));
      await batch.commit();
      await addDoc(collection(firestore, "auditLogs"), { action: "seed", entityType: "directory", entityId: "verified-contacts", summary: `إضافة ${verifiedDirectory.length} جهة موثقة`, createdBy: user.uid, createdAt: serverTimestamp() });
      setMessage(ar ? "تم نشر الدليل الموثق في Firestore." : "Verified directory published to Firestore.");
    } catch { setMessage(ar ? "تعذر نشر الدليل. تأكد من إنشاء Firestore ونشر القواعد." : "Unable to publish. Ensure Firestore exists and rules are deployed."); }
    finally { setBusy(false); }
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="display text-3xl">{ar ? "دليل اتصالات المحامي" : "Lawyer contact directory"}</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">{ar ? "أرقام مختارة من صفحات حكومية أو مؤسسية رسمية، مع رابط المصدر وتاريخ التحقق. راجع المصدر قبل الاعتماد في حالة عاجلة." : "Numbers selected from official government or institutional pages, with source and verification date. Recheck the source before critical use."}</p></div>
        {!loading && contacts.length === 0 && <LiquidButton onClick={seedDirectory} disabled={busy} className="focus-ring flex min-h-12 items-center gap-2 bg-[#b89555] px-5 font-bold text-[#10191b] disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={18} /> : <ShieldCheck size={18} />}{ar ? "نشر الدليل في Firestore" : "Publish to Firestore"}</LiquidButton>}
      </div>
      {message && <p className="mt-5 border border-[#b89555]/25 bg-[#b89555]/10 p-3 text-sm text-[#e2c98f]">{message}</p>}
      <label className="relative mt-7 block"><Search className="absolute start-4 top-1/2 -translate-y-1/2 text-[#8b9698]" size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={ar ? "ابحث باسم الجهة أو الرقم أو التصنيف…" : "Search organisation, number, or category…"} className="focus-ring min-h-13 w-full border border-white/15 bg-white/[.06] px-12 text-sm placeholder:text-white/35" /></label>
      {loading ? <LoaderCircle className="mx-auto mt-16 animate-spin" /> : <div className="mt-8 grid gap-10">{grouped.map((group) => <div key={group.category}><div className="mb-4 flex items-center gap-3"><span className="size-2 bg-[#b89555]" /><h3 className="font-bold">{ar ? group.label.ar : group.label.en}</h3><span className="text-xs text-white/35">{group.items.length}</span></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{group.items.map((item) => <article key={item.id} className="group border border-white/10 bg-white/[.035] p-5 transition hover:-translate-y-1 hover:border-[#b89555]/45"><div className="flex items-start justify-between gap-3"><div><h4 className="font-bold leading-7">{ar ? item.nameAr : item.nameEn}</h4><p className="mt-1 text-xs text-white/35">{ar ? item.nameEn : item.nameAr}</p></div><span className="grid size-10 shrink-0 place-items-center bg-[#b89555]/10 text-[#d0ad69]"><Phone size={18} /></span></div>{item.phone ? <a href={`tel:${item.phone.replace(/[^+\d]/g, "")}`} dir="ltr" className="focus-ring mt-5 block text-xl font-black text-[#e0c27f] hover:text-white">{item.phone}</a> : <span className="mt-5 block text-sm text-white/35">{ar ? "تواصل إلكتروني عبر المصدر" : "Online contact via source"}</span>}<p className="mt-3 text-xs leading-6 text-white/50">{ar ? item.notesAr : item.notesEn}</p><div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4"><span className="text-[10px] text-white/30">{ar ? "تحقق" : "Verified"} {item.verifiedAt}</span><a href={item.sourceUrl} target="_blank" rel="noreferrer" className="focus-ring flex items-center gap-1 text-xs text-[#d0ad69] hover:text-white">{ar ? "المصدر" : "Source"}<ExternalLink size={13} /></a></div></article>)}</div></div>)}</div>}
      {!loading && contacts.length > 0 && filtered.length === 0 && <p className="mt-14 text-center text-white/40">{ar ? "لا توجد جهة مطابقة." : "No matching contact."}</p>}
    </section>
  );
}
