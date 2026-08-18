"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Bot, CheckCircle2, CircleDashed, ExternalLink, Globe2, ImageIcon, LoaderCircle, Send, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import type { Locale } from "@/config/site";
import { firestore } from "@/lib/firebase/client";
import type { AgentImage, AgentSource } from "@/types/admin";
import { MarkdownAnswer } from "@/components/admin/markdown-answer";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";

type NodeResult = { id: string; label: string; status: "done" | "skipped" | "error"; ms: number; detail?: string };
type CaseMatch = { id: string; caseNumber: string; caseYear: number; caseType: string; clientName: string; score: number };
type ChatMessage = { id: string; role: "user" | "assistant"; content: string; model?: string; nodes?: NodeResult[]; sources?: AgentSource[]; images?: AgentImage[]; caseMatches?: CaseMatch[] };

export function LegalAgent({ locale, user }: { locale: Locale; user: User }) {
  const ar = locale === "ar";
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: "welcome", role: "assistant", content: ar ? "مرحباً. أستطيع البحث في القضايا المسجلة، أو البحث في المصادر البحرينية الرسمية عند تفعيل زر الإنترنت. اذكر رقم القضية أو اسم الموكل أو سؤالك القانوني." : "Hello. I can search registered cases or current official Bahrain sources when web search is enabled. Ask by case number, client, or legal issue." }]);
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(true);
  const [busy, setBusy] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [clock, setClock] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const timer = window.setInterval(() => setClock(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const cooldown = Math.max(0, Math.ceil((cooldownUntil - clock) / 1000));
  const history = useMemo(() => messages.filter((item) => item.id !== "welcome").slice(-8).map(({ role, content }) => ({ role, content: content.slice(0, 5000) })), [messages]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy || cooldown > 0) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: question };
    setMessages((current) => [...current, userMessage]); setInput(""); setBusy(true); setError(""); setCooldownUntil(Date.now() + 10_000); setClock(Date.now());
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/agent", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ message: question, webSearch, history }) });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.message || "AI_ERROR");
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: body.answer, model: body.model, nodes: body.nodes, sources: body.sources, images: body.images, caseMatches: body.caseMatches }]);
      try {
        await addDoc(collection(firestore, "auditLogs"), { action: "ai_query", entityType: "agent", entityId: crypto.randomUUID(), summary: `سؤال للوكيل: ${question.slice(0, 420)}`, createdBy: user.uid, createdAt: serverTimestamp() });
      } catch {
        // The answer is already available; audit logging is best-effort while
        // Firestore is temporarily unavailable.
      }
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : ar ? "تعذر تشغيل الوكيل." : "Unable to run the agent."); }
    finally { setBusy(false); }
  }

  return (
    <section className="grid min-h-[680px] overflow-hidden border border-white/10 lg:grid-cols-[1fr_280px]">
      <div className="flex min-h-[680px] flex-col bg-[#0c1c21]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center bg-[#b89555]/15 text-[#d0ad69]"><Bot /></span><div><h2 className="font-bold">{ar ? "وكيل القضايا والقانون البحريني" : "Bahrain cases & law agent"}</h2><p className="mt-1 text-xs text-white/40">RAG · Tavily · Gemini</p></div></div><LiquidButton onClick={() => { setMessages((current) => current.slice(0, 1)); setError(""); }} className="focus-ring flex items-center gap-2 p-2 text-xs text-white/45 hover:text-white"><Trash2 size={15} />{ar ? "محادثة جديدة" : "New chat"}</LiquidButton></div>
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {messages.map((message) => <article key={message.id} className={message.role === "user" ? "ms-auto max-w-2xl bg-[#b89555] p-4 text-[#10191b]" : "me-auto max-w-3xl border border-white/10 bg-white/[.045] p-5"}>
            {message.role === "assistant" ? <MarkdownAnswer>{message.content}</MarkdownAnswer> : <p className="whitespace-pre-wrap leading-7">{message.content}</p>}
            {message.nodes && <div className="mt-5 flex flex-wrap gap-2 border-t border-white/8 pt-4">{message.nodes.map((node) => <span key={node.id} className={`flex items-center gap-1.5 border px-2.5 py-1 text-[10px] ${node.status === "done" ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-200" : node.status === "error" ? "border-red-400/20 bg-red-400/5 text-red-200" : "border-white/10 text-white/35"}`}>{node.status === "done" ? <CheckCircle2 size={12} /> : <CircleDashed size={12} />}{node.label}{node.ms > 0 && ` · ${node.ms}ms`}</span>)}</div>}
            {message.caseMatches && message.caseMatches.length > 0 && <details className="mt-4 border border-[#b89555]/20 bg-[#b89555]/5 p-3"><summary className="cursor-pointer text-xs font-bold text-[#e2c98f]">{ar ? `القضايا المسترجعة (${message.caseMatches.length})` : `Retrieved cases (${message.caseMatches.length})`}</summary><div className="mt-3 grid gap-2">{message.caseMatches.map((item) => <div key={item.id} className="flex flex-wrap justify-between gap-2 border-t border-white/8 pt-2 text-xs"><span dir="ltr">{item.caseNumber}/{item.caseYear}</span><span className="text-white/45">{item.caseType} · {item.clientName}</span></div>)}</div></details>}
            {message.sources && message.sources.length > 0 && <div className="mt-5"><h3 className="text-xs font-bold text-[#d0ad69]">{ar ? "مصادر البحث" : "Search sources"}</h3><div className="mt-2 grid gap-2">{message.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="focus-ring flex items-start gap-2 border border-white/8 p-3 text-xs text-white/65 hover:border-[#b89555]/40 hover:text-white"><ExternalLink className="mt-0.5 shrink-0" size={13} /><span>{source.title}</span></a>)}</div></div>}
            {message.images && message.images.length > 0 && <div className="mt-5"><h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-[#d0ad69]"><ImageIcon size={14} />{ar ? "صور من نتائج البحث" : "Images from search"}</h3><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{message.images.map((image) => <a key={image.url} href={image.url} target="_blank" rel="noreferrer" title={image.description} className="aspect-video overflow-hidden bg-white/5"><Image src={image.url} alt={image.description || (ar ? "نتيجة بحث" : "Search result")} width={600} height={338} unoptimized className="h-full w-full object-cover transition hover:scale-105" /></a>)}</div></div>}
            {message.model && <p className="mt-4 text-[10px] text-white/25" dir="ltr">{message.model}</p>}
          </article>)}
          {busy && <div className="me-auto flex items-center gap-3 border border-white/10 bg-white/[.045] p-4 text-sm text-white/55"><LoaderCircle className="animate-spin text-[#d0ad69]" size={18} />{ar ? "يبحث ويرتب الأدلة…" : "Searching and ranking evidence…"}</div>}
          {error && <div className="flex gap-3 border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200"><ShieldAlert className="shrink-0" size={18} />{error}</div>}
        </div>
        <form onSubmit={sendMessage} className="border-t border-white/10 bg-[#101d21] p-4"><div className="flex gap-2"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={ar ? "اسأل عن قضية أو نص قانوني بحريني…" : "Ask about a case or Bahrain law…"} className="focus-ring min-h-14 flex-1 resize-none border border-white/12 bg-white/[.055] px-4 py-3 text-sm placeholder:text-white/30" maxLength={4000} /><LiquidButton disabled={busy || cooldown > 0 || input.trim().length < 3} className="focus-ring grid size-14 shrink-0 place-items-center bg-[#b89555] text-[#10191b] disabled:opacity-40">{busy ? <LoaderCircle className="animate-spin" size={19} /> : cooldown > 0 ? <span className="text-sm font-black">{cooldown}</span> : <Send size={19} />}</LiquidButton></div><div className="mt-3 flex items-center justify-between gap-3"><label className="flex cursor-pointer items-center gap-2 text-xs text-white/55"><input type="checkbox" checked={webSearch} onChange={(event) => setWebSearch(event.target.checked)} className="size-4" /><Globe2 size={14} />{ar ? "بحث Tavily في المصادر الرسمية" : "Tavily official-source search"}</label><span className="text-[10px] text-white/25">{ar ? "مهلة 10 ثوانٍ بين الطلبات" : "10-second request cooldown"}</span></div></form>
      </div>
      <aside className="border-t border-white/10 bg-white/[.025] p-5 lg:border-s lg:border-t-0"><Sparkles className="text-[#d0ad69]" /><h3 className="mt-4 font-bold">{ar ? "طريقة عمل الوكيل" : "Agent pipeline"}</h3><ol className="mt-5 space-y-4 text-xs leading-6 text-white/50"><li><strong className="block text-white/75">01 · Firebase Auth</strong>{ar ? "يتحقق من هوية وبريد الأدمن." : "Verifies administrator identity."}</li><li><strong className="block text-white/75">02 · Case RAG</strong>{ar ? "يرتب القضايا بخوارزمية حقول موزونة دون استدعاء نموذج إضافي." : "Ranks cases with a weighted-field algorithm without another model call."}</li><li><strong className="block text-white/75">03 · Tavily</strong>{ar ? "يجلب مصادر بحرينية رسمية عند الحاجة." : "Fetches current official Bahrain sources when needed."}</li><li><strong className="block text-white/75">04 · Gemini</strong>{ar ? "يصوغ الإجابة مع الاستشهاد وحدود واضحة." : "Drafts a cited answer with explicit limits."}</li></ol><div className="mt-7 border-s-2 border-amber-400/60 bg-amber-400/5 p-4 text-xs leading-6 text-amber-100/70">{ar ? "هذه أداة مساعدة داخلية. يجب مراجعة النص القانوني الرسمي وملف القضية قبل اعتماد أي رأي أو إجراء." : "Internal assistance only. Review official law and the full case file before relying on any conclusion or action."}</div></aside>
    </section>
  );
}
