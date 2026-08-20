"use client";

import { type ButtonHTMLAttributes, type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import type { User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { onValue, ref, remove, set } from "firebase/database";
import { Bot, Check, CheckCircle2, ChevronDown, CircleDashed, Copy, ExternalLink, FileText, Files, Globe2, History, ImageIcon, Landmark, LoaderCircle, Mic, MicOff, Newspaper, PanelLeftOpen, Paperclip, Pencil, RotateCcw, Search, Send, ShieldAlert, Sparkles, Square, TerminalSquare, Trash2, X } from "lucide-react";
import type { Locale } from "@/config/site";
import { firestore, realtimeDatabase } from "@/lib/firebase/client";
import type { AgentImage, AgentSource } from "@/types/admin";
import { MarkdownAnswer } from "@/components/admin/markdown-answer";
import { agentSkills } from "@/data/agent-skills";
import { cn } from "@/lib/utils";
import { resolveCaseLogos } from "@/lib/bahrain-logo-match";

type NodeResult = { id: string; label: string; status: "done" | "skipped" | "error"; ms: number; detail?: string };
type CaseMatch = { id: string; caseNumber: string; caseYear: number; caseType: string; clientName: string; accusedName?: string; victimName?: string; court?: string; status?: string; judgment?: string; judgeName?: string; notes?: string; nextHearing?: string; score: number };
type ChatAttachment = { id: string; name: string; type: string; size: number; previewUrl?: string };
type PendingAttachment = ChatAttachment & { file: File };
type GenerationInfo = { finishReason?: string; finishMessage?: string; outputTokens?: number; thoughtTokens?: number; thinkingBudget?: number; continuations?: number; truncated?: boolean };
type DebugEvent = { id: string; kind: "thinking" | "tool" | "skill" | "validation" | "quota"; title: string; status: "done" | "skipped" | "error"; ms?: number; summary?: string; input?: unknown; output?: unknown };
type ChatMessage = { id: string; role: "user" | "assistant"; content: string; attachments?: ChatAttachment[]; model?: string; nodes?: NodeResult[]; debugEvents?: DebugEvent[]; code?: string; codeResult?: string; sources?: AgentSource[]; images?: AgentImage[]; caseMatches?: CaseMatch[]; generation?: GenerationInfo };
type StoredConversation = { id: string; title: string; createdAt: number; updatedAt: number; messages: ChatMessage[] };
type SpeechResultEvent = { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> };
type SpeechRecognitionLike = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((event: SpeechResultEvent) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function AgentCaseLogoCluster({ item, ar }: { item: CaseMatch; ar: boolean }) {
  const logos = resolveCaseLogos(item);
  return (
    <span className="flex items-center gap-1">
      {logos.slice(0, 3).map((logo) => (
        <span key={logo.url} title={`${logo.role === "prosecution" ? (ar ? "النيابة العامة" : "Public Prosecution") : (ar ? "الجهة المرتبطة" : "Related entity")}: ${logo.name}`} className="grid h-8 min-w-9 place-items-center rounded-md border border-white/12 bg-white px-1.5 py-1 shadow-sm">
          <img src={logo.url} alt={logo.name} className="max-h-6 max-w-11 object-contain" />
        </span>
      ))}
    </span>
  );
}

const maxFiles = 5;
const maxTotalBytes = 200 * 1024 * 1024;
const pdfCompressionThresholdBytes = 18 * 1024 * 1024;
const pdfDpiOptions = [72, 96, 100, 120, 130, 150, 170, 200] as const;
const acceptedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "text/plain", "text/markdown", "text/csv", "application/json"]);

const quickQuestions = {
  ar: [
    { icon: Files, label: "فهم القضايا", question: "استعرض القضايا المسجلة ذات الأولوية، ولخّص حالة كل قضية وموعدها القادم مع الإشارة إلى سجل القضية المستخدم." },
    { icon: Landmark, label: "القانون البحريني", question: "اشرح لي بإيجاز مصادر التشريع في مملكة البحرين وكيف أتحقق من النص القانوني النافذ، مع روابط رسمية حديثة." },
    { icon: Globe2, label: "الحكومة الإلكترونية", question: "اختر معاملة قضائية بحرينية شائعة واشرح خطوات إنجازها إلكترونياً والمستندات المطلوبة، مع رابط الخدمة الحكومية الرسمي." },
    { icon: Search, label: "بحث وروابط", question: "استخدم Tavily للبحث عن أحدث الخدمات القضائية الإلكترونية في البحرين، ثم اعرض خلاصة مرتبة وروابط المصادر الرسمية." },
    { icon: ImageIcon, label: "روابط وصور", question: "ابحث عبر Tavily عن بوابات العدالة والقضاء الرسمية في البحرين، واعرض الروابط مع الصور المتاحة من نتائج البحث وبيّن وظيفة كل بوابة." },
    { icon: Newspaper, label: "المستجدات القانونية", question: "لخص لي أهم الأخبار والمستجدات القانونية والقضائية والتشريعية في البحرين خلال آخر 7 أيام. فرّق بوضوح بين التشريع الرسمي والخبر الصحفي، واذكر المصدر والتاريخ وأهميته العملية للمكتب." },
  ],
  en: [
    { icon: Files, label: "Case insight", question: "Review the registered priority cases and summarize each status and next hearing, citing the case record used." },
    { icon: Landmark, label: "Bahrain law", question: "Briefly explain Bahrain's sources of legislation and how to verify the law currently in force, with current official links." },
    { icon: Globe2, label: "eGovernment", question: "Choose a common Bahrain judicial transaction and explain its online steps and required documents, with the official service link." },
    { icon: Search, label: "Research & links", question: "Use Tavily to find the latest Bahrain online judicial services, then provide a structured summary with official-source links." },
    { icon: ImageIcon, label: "Links & images", question: "Use Tavily to find Bahrain's official justice and judiciary portals, show available result images and links, and explain each portal's purpose." },
    { icon: Newspaper, label: "Legal updates", question: "Summarize the most important Bahrain legal, judicial and legislative updates from the last 7 days. Clearly distinguish official legislation from press reporting, with source, date and practical relevance to the office." },
  ],
};

function faviconUrl(value: string) {
  try {
    const hostname = new URL(value).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`;
  } catch { return ""; }
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function asksForPastHistory(question: string) {
  return /المحادثات? (السابقة|القديمة)|المحادثة (السابقة|القديمة|اللي طافت)|سجل المحادثات|الهستوري|سألتك قبل|قلت لك قبل|وش قلت|تكلمنا قبل|previous (chat|conversation)|earlier conversation|chat history|what did i ask/i.test(question);
}

function fileMimeType(file: File) {
  if (file.type) return file.type.toLowerCase();
  const extension = file.name.toLowerCase().split(".").pop();
  return ({ pdf: "application/pdf", txt: "text/plain", md: "text/markdown", csv: "text/csv", json: "application/json", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" } as Record<string, string>)[extension ?? ""] ?? "";
}

function storableMessages(messages: ChatMessage[]) {
  return JSON.parse(JSON.stringify(messages.map((message) => ({
    ...message,
    attachments: message.attachments?.map((attachment) => ({ id: attachment.id, name: attachment.name, type: attachment.type, size: attachment.size })),
  })))) as ChatMessage[];
}

function linkCaseCitations(content: string, messageId: string, caseCount: number) {
  return content.replace(/\[C(\d+)\](?!\()/g, (label, rawIndex: string) => {
    const index = Number(rawIndex);
    return index >= 1 && index <= caseCount ? `${label}(#case-${messageId}-${index})` : label;
  });
}


function linkEvidenceCitations(content: string, messageId: string, sources?: AgentSource[]) {
  const ids = new Set((sources ?? []).map((source) => source.citationId).filter(Boolean));
  return content.replace(/\[(O\d+|W\d+|N\d+)\](?!\()/g, (label, citationId: string) => ids.has(citationId) ? `${label}(#source-${messageId}-${citationId})` : label);
}

function prettyDebugValue(value: unknown) {
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function DebugTrace({ events, nodes, ar }: { events?: DebugEvent[]; nodes?: NodeResult[]; ar: boolean }) {
  if ((!events || events.length === 0) && (!nodes || nodes.length === 0)) return null;
  return (
    <section className="mb-5 space-y-2 rounded-md border border-white/10 bg-black/[.08] p-2.5">
      <div className="flex items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-2 text-xs font-bold text-white/70"><Sparkles size={14} className="text-[#d0ad69]" />{ar ? "تتبّع الوكيل" : "Agent trace"}</div>
        <span className="text-[9px] text-white/30">{ar ? "ملخصات تفكير وأدوات، وليست سلسلة التفكير الخام" : "Reasoning summaries and tool traces, not raw chain-of-thought"}</span>
      </div>
      {(events ?? []).map((event) => {
        const label = event.kind === "thinking" ? (ar ? "التفكير" : "Thinking") : event.kind === "tool" ? (ar ? "أداة" : "Tool") : event.kind === "skill" ? (ar ? "مهارة" : "Skill") : event.kind === "quota" ? (ar ? "حماية الكوتا" : "Quota guard") : (ar ? "تحقق" : "Validation");
        const tone = event.status === "error" ? "border-red-400/25" : event.kind === "thinking" ? "border-violet-400/20" : event.kind === "skill" ? "border-[#b89555]/25" : "border-white/10";
        return <details key={event.id} className={`group overflow-hidden rounded-md border ${tone} bg-white/[.018]`}>
          <summary className="focus-ring flex min-h-10 cursor-pointer list-none items-center gap-2 px-3 text-[11px] text-white/65">
            {event.status === "done" ? <CheckCircle2 size={13} className="shrink-0 text-emerald-400" /> : event.status === "error" ? <ShieldAlert size={13} className="shrink-0 text-red-400" /> : <CircleDashed size={13} className="shrink-0 text-white/35" />}
            <span className="rounded-sm border border-white/8 bg-white/[.03] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-white/35">{label}</span>
            <strong className="min-w-0 flex-1 truncate font-medium text-white/70" dir="auto">{event.title}</strong>
            {typeof event.ms === "number" && event.ms > 0 && <span className="shrink-0 text-[9px] text-white/30">{event.ms}ms</span>}
            <ChevronDown size={13} className="shrink-0 transition group-open:rotate-180" />
          </summary>
          <div className="border-t border-white/8 px-3 py-3 text-[11px] leading-5 text-white/55">
            {event.summary && <p className="mb-3 whitespace-pre-wrap" dir="auto">{event.summary}</p>}
            {event.input !== undefined && <div className="mb-3"><div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-white/30">INPUT</div><pre className="max-h-56 overflow-auto rounded-md border border-white/8 bg-black/20 p-2.5 text-[10px] leading-5 text-white/60" dir="ltr">{prettyDebugValue(event.input)}</pre></div>}
            {event.output !== undefined && <div><div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-white/30">OUTPUT</div><pre className="max-h-72 overflow-auto rounded-md border border-white/8 bg-black/20 p-2.5 text-[10px] leading-5 text-white/60" dir="ltr">{prettyDebugValue(event.output)}</pre></div>}
          </div>
        </details>;
      })}
      {nodes && nodes.length > 0 && <details className="group overflow-hidden rounded-md border border-white/10 bg-white/[.018]">
        <summary className="focus-ring flex min-h-10 cursor-pointer list-none items-center gap-2 px-3 text-[11px] text-white/65"><CircleDashed size={13} className="text-[#d0ad69]" /><span className="rounded-sm border border-white/8 bg-white/[.03] px-1.5 py-0.5 text-[9px] uppercase text-white/35">NODES</span><strong className="flex-1 font-medium">{ar ? "مسار التنفيذ" : "Execution pipeline"}</strong><ChevronDown size={13} className="transition group-open:rotate-180" /></summary>
        <div className="flex flex-wrap gap-2 border-t border-white/8 p-3">{nodes.map((node) => <span key={node.id} title={node.detail} className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] ${node.status === "done" ? "border-emerald-600/30 bg-emerald-500/8 text-emerald-300" : node.status === "error" ? "border-red-400/20 bg-red-400/8 text-red-300" : "border-white/10 text-white/35"}`}>{node.status === "done" ? <CheckCircle2 size={11} /> : <CircleDashed size={11} />}{node.label}{node.ms > 0 && ` · ${node.ms}ms`}{node.detail && <span className="opacity-60"> · {node.detail}</span>}</span>)}</div>
      </details>}
    </section>
  );
}

function NewChatIcon({ className = "" }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} width="1em" height="1em" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path d="M7.258 1.856c.333 0 .66.024.979.07-.558.319-.972.86-1.123 1.503A5.254 5.254 0 1 0 9.32 13.513l.275-.127c.334-.17.712-.229 1.08-.17l.158.031.01.003 1.343.36-.359-1.345a1.77 1.77 0 0 1 .137-1.247 5.23 5.23 0 0 0 .538-2.041 2.356 2.356 0 0 0 1.544-1 6.808 6.808 0 0 1-.676 3.742v.001c-.034.066-.031.116-.025.14l.36 1.345a1.572 1.572 0 0 1-1.823 1.945l-.1-.024-1.334-.357a.2.2 0 0 0-.14.018l-.012.005A6.825 6.825 0 1 1 7.259 1.856Zm4.837-1.36c.434 0 .785.352.785.786v1.905h1.9a.785.785 0 0 1 0 1.57h-1.9v1.9a.786.786 0 1 1-1.57 0v-1.9H9.404a.785.785 0 0 1 0-1.57h1.906V1.282c0-.434.352-.787.785-.787Z" fill="currentColor" /></svg>;
}

type AgentButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { size?: "icon" | "default" };

function AgentButton({ className, type = "button", size: _size, ...props }: AgentButtonProps) {
  return <button type={type} className={cn("transition-all duration-200 ease-out active:scale-[0.985] disabled:cursor-not-allowed", className)} {...props} />;
}

function MessageAttachments({ attachments, ar }: { attachments: ChatAttachment[]; ar: boolean }) {
  return <div className="mb-3 grid gap-2">{attachments.map((attachment) => attachment.previewUrl && attachment.type === "application/pdf" ? (
    <figure key={attachment.id} className="overflow-hidden border border-black/15 bg-black/10">
      <iframe src={`${attachment.previewUrl}#page=1&view=FitH&toolbar=0`} title={attachment.name} className="h-[45dvh] max-h-[65dvh] w-full bg-white sm:h-[38rem]" />
      <figcaption className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[10px]"><span className="min-w-0 truncate opacity-70">{attachment.name}</span><a href={attachment.previewUrl} target="_blank" rel="noreferrer" className="font-bold underline">{ar ? "فتح PDF كاملاً" : "Open full PDF"}</a></figcaption>
    </figure>
  ) : attachment.previewUrl ? (
    <figure key={attachment.id} className="overflow-hidden border border-black/10 bg-black/10">
      <Image src={attachment.previewUrl} alt={attachment.name} width={720} height={480} unoptimized className="max-h-56 w-full object-contain sm:max-h-72" />
      <figcaption className="truncate px-3 py-2 text-[10px] opacity-65">{attachment.name}</figcaption>
    </figure>
  ) : (
    <div key={attachment.id} className="flex min-w-0 items-center gap-3 border border-black/10 bg-black/5 p-3">
      <FileText className="shrink-0" size={21} /><span className="min-w-0"><strong className="block truncate text-xs">{attachment.name}</strong><small className="opacity-60">{formatBytes(attachment.size)} · {attachment.type === "application/pdf" ? "PDF" : ar ? "ملف نصي" : "Text file"}</small></span>
    </div>
  ))}</div>;
}

function SearchImageCard({ image, featured, ar }: { image: AgentImage; featured: boolean; ar: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed || !image.displayUrl) return null;
  return <a href={image.url} target="_blank" rel="noreferrer noopener" title={image.description} className={`group relative overflow-hidden border border-white/10 bg-black/20 ${featured ? "sm:col-span-2" : ""}`}><Image src={image.displayUrl} alt={image.description || (ar ? "نتيجة بحث مرئية" : "Visual search result")} width={960} height={540} unoptimized onError={() => setFailed(true)} className={`w-full object-cover transition duration-300 group-hover:scale-[1.02] ${featured ? "max-h-[28rem]" : "h-52"}`} />{image.description && <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-8 text-[10px] leading-4 text-white/80">{image.description}</span>}<ExternalLink className="absolute end-2 top-2 rounded-full bg-black/65 p-1.5 text-white/75" size={24} /></a>;
}

export function LegalAgent({ locale, user, onOpenCases }: { locale: Locale; user: User; onOpenCases?: () => void }) {
  const ar = locale === "ar";
  const welcomeMessage: ChatMessage = { id: "welcome", role: "assistant", content: ar ? "مرحباً. أستطيع البحث في القضايا والمصادر البحرينية الرسمية، وتحليل الصور وملفات PDF والملفات النصية. يمكنك أيضاً إملاء سؤالك صوتياً." : "Hello. I can search cases and official Bahrain sources, analyze images, PDFs and text files, and accept voice-dictated questions." };
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [webSearch, setWebSearch] = useState(true);
  const [autoCompressPdf, setAutoCompressPdf] = useState(true);
  const [pdfDpi, setPdfDpi] = useState(150);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [clock, setClock] = useState(0);
  const [error, setError] = useState("");
  const [editingMessageId, setEditingMessageId] = useState("");
  const [editValue, setEditValue] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState("");
  const [typingMessageId, setTypingMessageId] = useState("");
  const [typingLength, setTypingLength] = useState(0);
  const [stoppedTyping, setStoppedTyping] = useState<{ id: string; length: number } | null>(null);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [historySidebarCollapsed, setHistorySidebarCollapsed] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [quickQuestionsOpen, setQuickQuestionsOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const attachmentFilesRef = useRef(new Map<string, PendingAttachment[]>());
  const imageHydrationRef = useRef(new Set<string>());
  const restoredConversationRef = useRef(false);
  const responseActive = busy || Boolean(typingMessageId);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setInput(window.localStorage.getItem(`legal-agent-draft:${user.uid}`) ?? "");
      setWebSearch(window.localStorage.getItem(`legal-agent-web-search:${user.uid}`) !== "false");
      setAutoCompressPdf(window.localStorage.getItem(`legal-agent-pdf-auto-compress:${user.uid}`) !== "false");
      const savedDpi = Number(window.localStorage.getItem(`legal-agent-pdf-dpi:${user.uid}`) ?? 150);
      setPdfDpi(pdfDpiOptions.includes(savedDpi as (typeof pdfDpiOptions)[number]) ? savedDpi : 150);
      setHistorySidebarCollapsed(window.localStorage.getItem(`legal-agent-sidebar-collapsed:${user.uid}`) === "true");
      setQuickQuestionsOpen(window.localStorage.getItem(`legal-agent-quick-open:${user.uid}`) !== "false");
      setDraftReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [user.uid]);

  useEffect(() => {
    if (draftReady) window.localStorage.setItem(`legal-agent-draft:${user.uid}`, input);
  }, [draftReady, input, user.uid]);

  useEffect(() => {
    if (!draftReady) return;
    window.localStorage.setItem(`legal-agent-web-search:${user.uid}`, String(webSearch));
  }, [draftReady, user.uid, webSearch]);

  useEffect(() => {
    if (!draftReady) return;
    window.localStorage.setItem(`legal-agent-pdf-auto-compress:${user.uid}`, String(autoCompressPdf));
    window.localStorage.setItem(`legal-agent-pdf-dpi:${user.uid}`, String(pdfDpi));
  }, [autoCompressPdf, draftReady, pdfDpi, user.uid]);

  useEffect(() => {
    if (!draftReady) return;
    window.localStorage.setItem(`legal-agent-sidebar-collapsed:${user.uid}`, String(historySidebarCollapsed));
  }, [draftReady, historySidebarCollapsed, user.uid]);

  useEffect(() => {
    if (!draftReady) return;
    window.localStorage.setItem(`legal-agent-quick-open:${user.uid}`, String(quickQuestionsOpen));
  }, [draftReady, quickQuestionsOpen, user.uid]);

  useEffect(() => {
    if (!quickQuestionsOpen) return;
    const timer = window.setTimeout(() => setQuickQuestionsOpen(false), 10_000);
    return () => window.clearTimeout(timer);
  }, [quickQuestionsOpen]);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const timer = window.setInterval(() => setClock(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  useEffect(() => {
    if (!typingMessageId) return;
    const message = messages.find((item) => item.id === typingMessageId && item.role === "assistant");
    if (!message) {
      setTypingMessageId("");
      setTypingLength(0);
      return;
    }
    if (typingLength >= message.content.length) {
      setTypingMessageId("");
      setTypingLength(0);
      return;
    }

    const remaining = message.content.length - typingLength;
    const chunkSize = remaining > 2400 ? 14 : remaining > 1200 ? 10 : remaining > 500 ? 7 : 4;
    const timer = window.setTimeout(() => {
      setTypingLength((current) => Math.min(message.content.length, current + chunkSize));
    }, 16);

    return () => window.clearTimeout(timer);
  }, [messages, typingLength, typingMessageId]);

  useEffect(() => {
    if (!typingMessageId || typingLength === 0 || typingLength % 112 > 14) return;
    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
  }, [typingLength, typingMessageId]);

  useEffect(() => onValue(ref(realtimeDatabase, `agentConversations/${user.uid}`), (snapshot) => {
    const value = snapshot.val() as Record<string, Omit<StoredConversation, "id">> | null;
    const items = value ? Object.entries(value).map(([id, item]) => ({ id, ...item })) : [];
    setConversations(items.sort((a, b) => b.updatedAt - a.updatedAt));
  }), [user.uid]);

  useEffect(() => {
    if (restoredConversationRef.current || conversations.length === 0) return;
    restoredConversationRef.current = true;
    const savedConversationId = window.localStorage.getItem(`legal-agent-active-conversation:${user.uid}`);
    if (!savedConversationId) return;
    const savedConversation = conversations.find((item) => item.id === savedConversationId);
    if (!savedConversation) {
      window.localStorage.removeItem(`legal-agent-active-conversation:${user.uid}`);
      return;
    }
    setConversationId(savedConversation.id);
    setMessages(savedConversation.messages?.length ? savedConversation.messages : [welcomeMessage]);
  }, [conversations, user.uid]);

  useEffect(() => {
    const urls = Array.from(new Set(messages.flatMap((message) => message.images ?? []).filter((image) => !image.displayUrl && !imageHydrationRef.current.has(image.url)).map((image) => image.url)));
    if (!urls.length) return;
    urls.forEach((url) => imageHydrationRef.current.add(url));
    const controller = new AbortController();
    void user.getIdToken().then((token) => fetch("/api/admin/agent-image", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ urls }), signal: controller.signal })).then((response) => response.json()).then((body: { ok?: boolean; images?: AgentImage[] }) => {
      if (!body.ok || !body.images) return;
      const displayUrls = new Map(body.images.map((image) => [image.url, image.displayUrl]));
      setMessages((current) => current.map((message) => ({ ...message, images: message.images?.map((image) => ({ ...image, displayUrl: displayUrls.get(image.url) || image.displayUrl })) })));
    }).catch(() => urls.forEach((url) => imageHydrationRef.current.delete(url)));
    return () => controller.abort();
  }, [messages, user]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 168)}px`;
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: messages.length > 2 ? "smooth" : "auto" });
  }, [messages.length, busy]);


  const cooldown = Math.max(0, Math.ceil((cooldownUntil - clock) / 1000));
  const recentPrompts = useMemo(() => {
    const candidates = [
      ...messages.filter((message) => message.role === "user").slice().reverse().map((message) => message.content),
      ...conversations.flatMap((conversation) => (conversation.messages ?? []).filter((message) => message.role === "user").slice().reverse().map((message) => message.content)),
    ];
    return Array.from(new Set(candidates.map((item) => item.trim()).filter(Boolean))).slice(0, 20);
  }, [conversations, messages]);

  async function saveConversation(id: string, nextMessages: ChatMessage[], question: string, timestamp: number) {
    const existing = conversations.find((item) => item.id === id);
    await set(ref(realtimeDatabase, `agentConversations/${user.uid}/${id}`), {
      title: existing?.title || question.slice(0, 64),
      createdAt: existing?.createdAt || timestamp,
      updatedAt: timestamp,
      messages: storableMessages(nextMessages.slice(-60)),
    });
  }

  function addAttachments(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    if (attachments.length + incoming.length > maxFiles) { setError(ar ? `يمكن إرفاق ${maxFiles} ملفات كحد أقصى.` : `You can attach up to ${maxFiles} files.`); return; }
    const unsupported = incoming.find((file) => !acceptedTypes.has(fileMimeType(file)));
    if (unsupported) { setError(ar ? `نوع الملف غير مدعوم: ${unsupported.name}` : `Unsupported file type: ${unsupported.name}`); return; }
    const total = [...attachments.map((item) => item.size), ...incoming.map((file) => file.size)].reduce((sum, size) => sum + size, 0);
    if (total > maxTotalBytes) { setError(ar ? "إجمالي المرفقات قبل الضغط يجب ألا يتجاوز 200MB." : "Attachments before compression must total 200MB or less."); return; }
    setAttachments((current) => [...current, ...incoming.map((file) => { const type = fileMimeType(file); return { id: crypto.randomUUID(), file, name: file.name, type, size: file.size, previewUrl: type.startsWith("image/") || type === "application/pdf" ? URL.createObjectURL(file) : undefined }; })]);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(id: string) {
    setAttachments((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  function newConversation() {
    attachments.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
    messages.flatMap((item) => item.attachments ?? []).forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
    attachmentFilesRef.current.clear();
    setAttachments([]); setConversationId(""); setMessages([welcomeMessage]); setInput(""); setEditingMessageId(""); setError(""); setTypingMessageId(""); setTypingLength(0); setStoppedTyping(null); setMobileToolsOpen(false);
    window.localStorage.removeItem(`legal-agent-active-conversation:${user.uid}`);
    window.localStorage.setItem(`legal-agent-draft:${user.uid}`, "");
  }

  function openConversation(conversation: StoredConversation) {
    attachments.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
    messages.flatMap((item) => item.attachments ?? []).forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
    setAttachments([]);
    attachmentFilesRef.current.clear();
    setConversationId(conversation.id); setMessages(conversation.messages?.length ? conversation.messages : [welcomeMessage]); setInput(""); setEditingMessageId(""); setError(""); setTypingMessageId(""); setTypingLength(0); setStoppedTyping(null); setMobileToolsOpen(false);
    window.localStorage.setItem(`legal-agent-active-conversation:${user.uid}`, conversation.id);
    window.localStorage.setItem(`legal-agent-draft:${user.uid}`, "");
  }

  async function deleteConversation(id: string) {
    if (!window.confirm(ar ? "هل تريد حذف هذه المحادثة نهائياً؟" : "Delete this conversation permanently?")) return;
    await remove(ref(realtimeDatabase, `agentConversations/${user.uid}/${id}`));
    if (conversationId === id) newConversation();
  }

  async function toggleVoice() {
    if (listening) { speechRef.current?.stop(); return; }

    setError("");

    try {
      if (!window.isSecureContext) {
        setError(ar ? "الوصول إلى الميكروفون يحتاج اتصال HTTPS آمن (أو localhost أثناء التطوير)." : "Microphone access requires a secure HTTPS connection (or localhost during development).");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(ar ? "هذا المتصفح لا يدعم طلب إذن الميكروفون." : "This browser does not support microphone permission requests.");
        return;
      }

      // Request microphone permission explicitly on the user's click so mobile and desktop
      // browsers can show their native permission prompt before speech recognition starts.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      const speechWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
      const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
      if (!Recognition) {
        setError(ar ? "تم السماح بالميكروفون، لكن الإملاء الصوتي غير مدعوم في هذا المتصفح. جرّب Chrome أو Safari الحديث." : "Microphone permission was granted, but voice dictation is not supported in this browser. Try a current Chrome or Safari.");
        return;
      }

      const recognition = new Recognition();
      recognition.lang = ar ? "ar-BH" : "en-US"; recognition.continuous = false; recognition.interimResults = false;
      recognition.onresult = (event) => {
        let transcript = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) if (event.results[index].isFinal) transcript += event.results[index][0].transcript;
        if (transcript.trim()) setInput((current) => `${current}${current.trim() ? " " : ""}${transcript.trim()}`);
      };
      recognition.onerror = () => setError(ar ? "تعذر التقاط الصوت. تحقق من إذن الميكروفون ثم حاول مرة أخرى." : "Could not capture audio. Check microphone permission and try again.");
      recognition.onend = () => setListening(false);
      speechRef.current = recognition;
      setListening(true);
      recognition.start();
    } catch (permissionError) {
      const errorName = permissionError instanceof DOMException ? permissionError.name : "";
      if (errorName === "NotAllowedError" || errorName === "SecurityError") {
        setError(ar ? "لم يتم السماح بالوصول إلى الميكروفون. اسمح للموقع باستخدام الميكروفون من إعدادات المتصفح ثم حاول مرة أخرى." : "Microphone access was not allowed. Allow microphone access for this site in your browser settings, then try again.");
      } else if (errorName === "NotFoundError") {
        setError(ar ? "لم يتم العثور على ميكروفون متاح على هذا الجهاز." : "No available microphone was found on this device.");
      } else {
        setError(ar ? "تعذر تشغيل الميكروفون على هذا الجهاز." : "Unable to start the microphone on this device.");
      }
      setListening(false);
    }
  }

  function stopGeneration() {
    if (typingMessageId) {
      setStoppedTyping({ id: typingMessageId, length: Math.max(1, typingLength) });
      setTypingMessageId("");
      setTypingLength(0);
      setError("");
      return;
    }

    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setBusy(false);
    setError(ar ? "تم إيقاف توليد الإجابة." : "Answer generation stopped.");
  }

  async function sendQuestion(value: string, requestedAt: number, options?: { baseMessages: ChatMessage[]; selectedAttachments: PendingAttachment[] }) {
    const selectedAttachments = options?.selectedAttachments ?? attachments;
    const baseMessages = options?.baseMessages ?? messages;
    const question = value.trim() || (selectedAttachments.length ? (ar ? "حلّل جميع المرفقات وقدّم خلاصة دقيقة مع أهم الملاحظات." : "Analyze every attachment and provide an accurate summary with the key observations.") : "");
    if (!question || responseActive || cooldown > 0) return;
    const displayAttachments = selectedAttachments.map((item) => ({ id: item.id, name: item.name, type: item.type, size: item.size, previewUrl: item.previewUrl }));
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: question, attachments: displayAttachments };
    const nextConversationId = conversationId || crypto.randomUUID();
    const withUserMessage = [...baseMessages, userMessage];
    attachmentFilesRef.current.set(userMessage.id, selectedAttachments);
    setConversationId(nextConversationId); setMessages(withUserMessage); if (!options) { setAttachments([]); setInput(""); window.localStorage.setItem(`legal-agent-draft:${user.uid}`, ""); } setEditingMessageId(""); setStoppedTyping(null); setBusy(true); setError(""); setCooldownUntil(requestedAt + 15_000); setClock(requestedAt);
    window.localStorage.setItem(`legal-agent-active-conversation:${user.uid}`, nextConversationId);
    void saveConversation(nextConversationId, withUserMessage, question, requestedAt);
    try {
      const token = await user.getIdToken();
      const controller = new AbortController();
      requestControllerRef.current = controller;
      const form = new FormData();
      const requestHistory = baseMessages.filter((item) => item.id !== "welcome").slice(-8).map(({ role, content }) => ({ role, content: content.slice(0, 5000) }));
      form.set("message", question); form.set("webSearch", String(webSearch)); form.set("autoCompressPdf", String(autoCompressPdf)); form.set("pdfDpi", String(pdfDpi)); form.set("history", JSON.stringify(requestHistory));
      selectedAttachments.forEach(({ file }) => form.append("files", file, file.name));
      if (asksForPastHistory(question)) {
        const pastHistory = conversations.filter((item) => item.id !== nextConversationId).slice(0, 12).map((item) => `Conversation: ${item.title}\n${(item.messages ?? []).slice(-12).map((message) => `${message.role}: ${message.content}`).join("\n")}`).join("\n\n").slice(0, 15000);
        form.set("pastHistory", pastHistory);
      }
      const response = await fetch("/api/admin/agent", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form, signal: controller.signal });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.message || "AI_ERROR");
      const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: body.answer, model: body.model, nodes: body.nodes, debugEvents: body.debugEvents, code: body.code, codeResult: body.codeResult, sources: body.sources, images: body.images, caseMatches: body.caseMatches, generation: body.generation };
      const completedMessages = [...withUserMessage, assistantMessage];
      setMessages(completedMessages);
      setBusy(false);
      setTypingLength(Math.min(8, assistantMessage.content.length));
      setTypingMessageId(assistantMessage.id);
      setStoppedTyping(null);
      void saveConversation(nextConversationId, completedMessages, question, requestedAt + 1);
      try {
        await addDoc(collection(firestore, "auditLogs"), { action: "ai_query", entityType: "agent", entityId: crypto.randomUUID(), summary: `سؤال للوكيل: ${question.slice(0, 420)} (${selectedAttachments.length} attachments)`, createdBy: user.uid, createdAt: serverTimestamp() });
      } catch {
        // The answer is already available; audit logging is best-effort while
        // Firestore is temporarily unavailable.
      }
    } catch (requestError) { if (!(requestError instanceof DOMException && requestError.name === "AbortError")) setError(requestError instanceof Error ? requestError.message : ar ? "تعذر تشغيل الوكيل." : "Unable to run the agent."); }
    finally { requestControllerRef.current = null; setBusy(false); }
  }

  async function rerunUserMessage(messageId: string, requestedAt: number, replacement?: string) {
    const index = messages.findIndex((message) => message.id === messageId && message.role === "user");
    if (index < 0) return;
    const original = messages[index];
    const selectedAttachments = attachmentFilesRef.current.get(original.id) ?? [];
    if (original.attachments?.length && !selectedAttachments.length) {
      setError(ar ? "لإعادة تحليل هذا السؤال أرفق ملفاته مرة أخرى؛ المتصفح لا يسمح باستعادة الملف المحلي بعد تحديث الصفحة." : "Attach the files again to rerun this question; browsers cannot restore local files after a page refresh.");
      return;
    }
    await sendQuestion(replacement ?? original.content, requestedAt, { baseMessages: messages.slice(0, index), selectedAttachments });
  }

  function retryAssistant(messageId: string, requestedAt: number) {
    const assistantIndex = messages.findIndex((message) => message.id === messageId && message.role === "assistant");
    if (assistantIndex < 0) return;
    for (let index = assistantIndex - 1; index >= 0; index -= 1) {
      if (messages[index].role === "user") { void rerunUserMessage(messages[index].id, requestedAt); return; }
    }
  }

  async function copyAnswer(message: ChatMessage) {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = message.content; textarea.style.position = "fixed"; textarea.style.opacity = "0";
      document.body.appendChild(textarea); textarea.select(); document.execCommand("copy"); textarea.remove();
    }
    setCopiedMessageId(message.id);
    window.setTimeout(() => setCopiedMessageId((current) => current === message.id ? "" : current), 1600);
  }


  const sidebarContent = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><History className="text-[#d0ad69]" size={18} /><h3 className="font-bold">{ar ? "المحادثات السابقة" : "Chat history"}</h3></div>
        <span className="text-[10px] text-white/30">{conversations.length}</span>
      </div>
      <p className="mt-2 text-[10px] leading-5 text-white/35">{ar ? "لا تدخل في سياق محادثة جديدة إلا إذا سألت عنها صراحةً." : "Not used in a new chat unless you explicitly ask about it."}</p>
      <div className="mt-3 max-h-[42dvh] space-y-1 overflow-y-auto pe-1">
        {conversations.length ? conversations.map((conversation) => (
          <div key={conversation.id} className={`group flex items-center rounded-lg border ${conversation.id === conversationId ? "border-[#b89555]/40 bg-[#b89555]/10" : "border-transparent hover:bg-white/[.035]"}`}>
            <AgentButton type="button" onClick={() => { openConversation(conversation); setMobileHistoryOpen(false); }} className="focus-ring min-w-0 flex-1 p-2 text-start">
              <strong className="block truncate text-[11px] text-white/70">{conversation.title}</strong>
              <small className="mt-1 block text-[9px] text-white/25">{new Intl.DateTimeFormat(ar ? "ar-BH" : "en", { dateStyle: "short", timeStyle: "short" }).format(conversation.updatedAt)}</small>
            </AgentButton>
            <AgentButton type="button" size="icon" onClick={() => void deleteConversation(conversation.id)} aria-label={ar ? "حذف المحادثة" : "Delete conversation"} className="focus-ring grid size-8 shrink-0 place-items-center rounded-full text-white/25 hover:text-red-300">
              <Trash2 size={13} />
            </AgentButton>
          </div>
        )) : <p className="py-4 text-center text-[10px] text-white/25">{ar ? "لا توجد محادثات محفوظة بعد" : "No saved conversations yet"}</p>}
      </div>
      <details className="mt-4 rounded-xl border border-white/10 bg-white/[.02] p-3">
        <summary className="cursor-pointer text-[11px] font-bold text-[#d0ad69]">{ar ? `المهارات القضائية الأساسية (${agentSkills.length})` : `Core legal skills (${agentSkills.length})`}</summary>
        <ul className="mt-3 space-y-2 text-[10px] leading-5 text-white/45">
          {agentSkills.map((skill) => <li key={skill.id} className="border-t border-white/8 pt-2">{skill.title}</li>)}
        </ul>
      </details>
      <div className="my-5 border-t border-white/10" />
      <div className="flex items-center gap-3 xl:block">
        <Sparkles className="shrink-0 text-[#d0ad69]" />
        <h3 className="font-bold xl:mt-4">{ar ? "طريقة عمل الوكيل" : "Agent pipeline"}</h3>
      </div>
      <ol className="mt-5 grid gap-4 text-xs leading-6 text-white/50 sm:grid-cols-2 xl:grid-cols-1">
        <li><strong className="block text-white/75">01 · Firebase Auth</strong>{ar ? "يتحقق من هوية وبريد الأدمن." : "Verifies administrator identity."}</li>
        <li><strong className="block text-white/75">02 · Case RAG</strong>{ar ? "يرتب قضايا المكتب حسب الصلة ولا يخلطها بالمصادر العامة." : "Ranks office cases without mixing them with public sources."}</li>
        <li><strong className="block text-white/75">03 · Official Source Router</strong>{ar ? "يستخرج روابط الأحكام والتشريعات الرسمية من السؤال والمرفقات، ويستخدم Flash-Lite فقط عند الحاجة." : "Extracts official judgment/legislation anchors and uses Flash-Lite only when needed."}</li>
        <li><strong className="block text-white/75">04 · Bahrain Official RAG</strong>{ar ? "يفتح المصدر البحريني الرسمي مباشرة ويقرأ النص قبل Tavily." : "Fetches and reads the Bahrain official source before Tavily."}</li>
        <li><strong className="block text-white/75">05 · Tavily + Relevance Gate</strong>{ar ? "يبحث بشكل تكميلي ويرفض النتائج غير المرتبطة حتى لو كانت حكومية." : "Adds supplemental search and rejects irrelevant results even when governmental."}</li>
        <li><strong className="block text-white/75">06 · Legal Skills Router</strong>{ar ? "يفعّل فقط المهارات المناسبة مثل الدستوري، الأحكام، أو التحقق من التشريع." : "Activates only relevant skills such as constitutional, judgments, or legislation verification."}</li>
        <li><strong className="block text-white/75">07 · News + Logo Directory</strong>{ar ? "يقرأ أخبار البحرين المعروضة بالموقع ويجهز الشعارات المناسبة." : "Reads current site news and prepares relevant Bahrain logos."}</li>
        <li><strong className="block text-white/75">08 · Attachments + PDF</strong>{ar ? "يضغط PDF الكبير عند الحاجة ويحافظ على الموقّع رقمياً." : "Compresses large PDFs when needed and preserves signed files."}</li>
        <li><strong className="block text-white/75">09 · Gemini Thinking</strong>{ar ? "يستخدم ميزانية تفكير محدودة ويعرض ملخص التفكير الرسمي من API عند توفره." : "Uses a bounded thinking budget and exposes the API thought summary when available."}</li>
        <li><strong className="block text-white/75">10 · Citation Validation</strong>{ar ? "يتحقق أن مراجع [O#] و[W#] موجودة فعلاً قبل عرض حالة التنفيذ." : "Validates [O#] and [W#] evidence references."}</li>
      </ol>
      <div className="mt-5 border-s-2 border-amber-400/60 bg-amber-400/5 p-4 text-xs leading-6 text-amber-100/70 xl:mt-7">
        {ar ? "المرفقات القانونية قد تكون حساسة. راجع النص الرسمي وملف القضية قبل اعتماد أي رأي أو إجراء." : "Legal attachments may be sensitive. Review official law and the full case file before relying on any conclusion or action."}
      </div>
    </>
  );

  return (
    <section
      data-legal-agent-root="true"
      className="legal-agent-frame legal-agent-layout relative grid h-full min-h-0 w-full min-w-0 max-w-full touch-pan-y overflow-hidden overscroll-none bg-[#0c1c21] xl:border xl:border-white/10"
      style={{ "--legal-agent-sidebar-width": historySidebarCollapsed ? "0px" : "21rem" } as CSSProperties & Record<"--legal-agent-sidebar-width", string>}
    >
      <div className="legal-agent-main flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#0c1c21]">
        <header className="legal-agent-topbar flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#0c1c21]/95 px-3 backdrop-blur sm:px-5">
          <div className="flex min-w-0 items-center gap-1.5">
            <AgentButton type="button" onClick={() => setMobileHistoryOpen(true)} aria-label={ar ? "المحادثات السابقة" : "Chat history"} title={ar ? "المحادثات السابقة" : "Chat history"} className="focus-ring grid size-9 place-items-center rounded-lg text-white/60 hover:bg-white/5 hover:text-white xl:hidden"><PanelLeftOpen size={17} /></AgentButton>
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[.04] text-[#d0ad69]"><Bot size={17} /></span>
            <div className="min-w-0">
              <h2 className="truncate text-[12px] font-bold text-white/85 sm:text-sm">{ar ? "الوكيل القانوني" : "Legal agent"}</h2>
              <p className="hidden truncate text-[9px] text-white/35 sm:block">Official RAG · Tavily · Gemini</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <AgentButton type="button" onClick={() => setHistorySidebarCollapsed((current) => !current)} aria-label={historySidebarCollapsed ? (ar ? "إظهار القائمة الجانبية" : "Show sidebar") : (ar ? "طي القائمة الجانبية" : "Collapse sidebar")} title={historySidebarCollapsed ? (ar ? "إظهار القائمة الجانبية" : "Show sidebar") : (ar ? "طي القائمة الجانبية" : "Collapse sidebar")} className="focus-ring hidden size-9 place-items-center rounded-lg text-white/55 transition hover:bg-white/5 hover:text-white xl:grid"><PanelLeftOpen size={17} className={`transition-transform duration-300 ${historySidebarCollapsed ? "" : ar ? "" : ""}`} /></AgentButton>
            <AgentButton onClick={() => { setMobileHistoryOpen(false); newConversation(); }} aria-label={ar ? "محادثة جديدة" : "New chat"} title={ar ? "محادثة جديدة" : "New chat"} className="focus-ring flex h-9 items-center gap-2 rounded-lg border border-white/10 px-2.5 text-[11px] font-bold text-white/65 hover:bg-white/5 hover:text-white"><NewChatIcon className="text-base" /><span className="hidden sm:inline">{ar ? "محادثة جديدة" : "New chat"}</span></AgentButton>
          </div>
        </header>

        <div className="relative min-h-0 min-w-0 flex-1">
          <div className={`legal-agent-messages h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain px-3 [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable] sm:px-6 lg:px-8 ${messages.length <= 1 ? "flex flex-col" : "space-y-5 py-5"}`}>
            {messages.length <= 1 && (
              <div className="legal-agent-empty mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-3 pb-8 pt-6 text-center sm:pb-12">
                <span className="mb-4 grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[.035] text-[#d0ad69] shadow-sm"><Bot size={21} /></span>
                <h3 className="text-xl font-semibold tracking-[-.02em] text-white sm:text-2xl">{ar ? "بماذا أستطيع مساعدتك؟" : "What can I help with?"}</h3>
                <p className="mt-2 max-w-xl text-xs leading-6 text-white/42 sm:text-sm">{welcomeMessage.content}</p>
              </div>
            )}
            {messages.filter((message) => message.id !== "welcome").map((message) => {
              const isTyping = message.role === "assistant" && typingMessageId === message.id;
              const isStoppedPartial = message.role === "assistant" && stoppedTyping?.id === message.id;
              const visibleContent = isTyping
                ? message.content.slice(0, typingLength)
                : isStoppedPartial
                  ? message.content.slice(0, stoppedTyping.length)
                  : message.content;
              const answerSettled = !isTyping && !isStoppedPartial;

              return (
              <article
                key={message.id}
                dir="auto"
                className={message.role === "user"
                  ? "ms-auto w-fit max-w-[88%] overflow-hidden rounded-2xl rounded-ee-md border border-[#d0ad69]/30 bg-[#b89555] px-4 py-3 !text-white [overflow-wrap:anywhere] sm:max-w-[min(78%,44rem)]"
                  : "mx-auto w-full max-w-4xl min-w-0 overflow-hidden break-words border-0 bg-transparent px-1 py-2 [overflow-wrap:anywhere] sm:px-2 sm:py-4"}
              >
                {message.attachments && message.attachments.length > 0 && <MessageAttachments attachments={message.attachments} ar={ar} />}
                {message.role === "assistant" ? (
                  <div className="min-w-0 break-words [overflow-wrap:anywhere] [&_a]:break-all [&_code]:break-words [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto">
                    <DebugTrace events={message.debugEvents} nodes={message.nodes} ar={ar} />
                    <MarkdownAnswer images={answerSettled ? message.images : undefined}>{linkEvidenceCitations(linkCaseCitations(visibleContent, message.id, answerSettled ? (message.caseMatches?.length ?? 0) : 0), message.id, message.sources)}</MarkdownAnswer>
                    {answerSettled && message.generation?.truncated && (
                      <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-200">
                        {ar ? "وصلت الإجابة إلى حد الإخراج حتى بعد محاولات الإكمال التلقائي. أعد التوليد لإكمالها؛ لن يعرض النظام الرد كأنه مكتمل بصمت." : "The answer reached the output limit even after automatic continuation attempts. Regenerate to complete it; the app will not silently present it as complete."}
                      </div>
                    )}
                    {isTyping && (
                      <motion.span
                        aria-hidden="true"
                        className="ms-1 inline-block h-4 w-[2px] rounded-full bg-[#d0ad69] align-middle shadow-[0_0_10px_rgba(208,173,105,.55)]"
                        animate={{ opacity: [0.25, 1, 0.25] }}
                        transition={{ duration: 0.72, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                    <AnimatePresence initial={false}>
                      {isStoppedPartial && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="mt-3"
                        >
                          <AgentButton
                            type="button"
                            onClick={() => setStoppedTyping((current) => current?.id === message.id ? null : current)}
                            className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-full border border-[#b89555]/25 bg-[#b89555]/8 px-3 text-[11px] font-bold text-[#e2c98f] hover:bg-[#b89555]/14"
                            aria-label={ar ? "عرض الإجابة كاملة" : "Show full answer"}
                          >
                            <ChevronDown size={14} />
                            {ar ? "عرض الإجابة كاملة" : "Show full answer"}
                          </AgentButton>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : editingMessageId === message.id ? (
                  <form onSubmit={(event) => { event.preventDefault(); if (editValue.trim().length >= 1) void rerunUserMessage(message.id, Date.now(), editValue.trim()); }} className="w-full min-w-0 sm:w-[min(78vw,32rem)]">
                    <textarea autoFocus value={editValue} onChange={(event) => setEditValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setEditingMessageId(""); if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} maxLength={4000} className="min-h-28 w-full resize-y rounded-xl border border-[#10191b]/25 bg-[#fffdf8] p-3 text-sm leading-7 outline-none focus:border-[#10191b]/60" />
                    <div className="mt-2 flex justify-end gap-2"><AgentButton type="button" onClick={() => setEditingMessageId("")} className="min-h-9 border border-[#10191b]/20 px-3 text-xs">{ar ? "إلغاء" : "Cancel"}</AgentButton><AgentButton disabled={responseActive || cooldown > 0 || !editValue.trim()} className="min-h-9 bg-[#10191b] px-4 text-xs font-bold text-white disabled:opacity-40">{ar ? "إرسال التعديل" : "Send edit"}</AgentButton></div>
                  </form>
                ) : (
                  <><p className="whitespace-pre-wrap break-words leading-7 [overflow-wrap:anywhere]">{message.content}</p><div className="mt-2 flex justify-end"><AgentButton type="button" disabled={responseActive} onClick={() => { setEditingMessageId(message.id); setEditValue(message.content); }} className="focus-ring flex min-h-8 items-center gap-1.5 rounded-md border border-[#10191b]/20 px-2 text-[11px] text-[#10191b]/65 hover:bg-black/5"><Pencil size={13} />{ar ? "تعديل" : "Edit"}</AgentButton></div></>
                )}
                
                {answerSettled && (message.code || message.codeResult) && <details className="mt-4 border border-violet-300/15 bg-violet-300/5 p-3"><summary className="flex cursor-pointer items-center gap-2 text-xs font-bold text-violet-200"><TerminalSquare size={14} />{ar ? "تنفيذ Python المعزول" : "Sandboxed Python execution"}</summary>{message.code && <pre className="mt-3 max-h-64 max-w-full overflow-auto bg-black/25 p-3 text-[11px] leading-5 text-violet-100" dir="ltr"><code>{message.code}</code></pre>}{message.codeResult && <pre className="mt-2 max-h-52 max-w-full overflow-auto border-t border-white/10 p-3 text-[11px] leading-5 text-white/60" dir="ltr">{message.codeResult}</pre>}</details>}
                {answerSettled && message.caseMatches && message.caseMatches.length > 0 && <section className="mt-4 border border-[#b89555]/20 bg-[#b89555]/5 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-bold text-[#e2c98f]">{ar ? `القضايا المشار إليها (${message.caseMatches.length})` : `Referenced cases (${message.caseMatches.length})`}</h3>{onOpenCases && <AgentButton type="button" onClick={onOpenCases} className="focus-ring min-h-9 border border-[#b89555]/25 px-3 text-[10px] font-bold text-[#e2c98f] hover:bg-[#b89555]/10">{ar ? "فتح قسم القضايا" : "Open cases section"}</AgentButton>}</div><div className="mt-3 grid gap-2">{message.caseMatches.map((item, index) => <details id={`case-${message.id}-${index + 1}`} key={item.id} className="scroll-mt-24 border border-white/10 bg-black/10 p-3 open:border-[#b89555]/40 open:bg-[#b89555]/5"><summary className="flex cursor-pointer flex-wrap items-center gap-2 text-xs font-bold"><AgentCaseLogoCluster item={item} ar={ar} /><span className="rounded-sm bg-[#b89555]/15 px-1.5 py-0.5 text-[#e2c98f]">[C{index + 1}]</span><span dir="ltr">{item.caseNumber}/{item.caseYear}</span><span className="min-w-0 break-words text-white/45">{item.caseType} · {item.clientName}</span></summary><dl className="mt-3 grid gap-x-5 gap-y-2 border-t border-white/8 pt-3 text-[11px] leading-5 sm:grid-cols-2">{[[ar ? "المحكمة" : "Court", item.court], [ar ? "الحالة" : "Status", item.status], [ar ? "المتهم/الخصم" : "Accused/opponent", item.accusedName], [ar ? "المجني عليه" : "Victim", item.victimName], [ar ? "القاضي/الهيئة" : "Judge/panel", item.judgeName], [ar ? "الجلسة القادمة" : "Next hearing", item.nextHearing], [ar ? "الحكم" : "Judgment", item.judgment], [ar ? "الملاحظات" : "Notes", item.notes]].filter((entry) => entry[1]).map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-white/35">{label}</dt><dd className="break-words text-white/75">{value}</dd></div>)}</dl></details>)}</div></section>}
                {answerSettled && message.sources && message.sources.length > 0 && <details className="mt-5 rounded-md border border-white/8 bg-white/[.02] p-3"><summary className="cursor-pointer text-xs font-bold text-[#d0ad69]">{ar ? `مصادر البحث (${message.sources.length})` : `Search sources (${message.sources.length})`}</summary><div className="mt-2 grid gap-2">{message.sources.map((source) => { const favicon = faviconUrl(source.url); return <a id={source.citationId ? `source-${message.id}-${source.citationId}` : undefined} key={`${source.citationId ?? "src"}-${source.url}`} href={source.url} target="_blank" rel="noreferrer noopener" className="focus-ring flex min-w-0 scroll-mt-24 items-start gap-2 rounded-md border border-white/8 p-3 text-xs text-white/65 hover:border-[#b89555]/40 hover:text-white">{source.citationId && <span className={`shrink-0 rounded-sm border px-1.5 py-0.5 text-[9px] font-bold ${source.sourceType === "official" ? "border-emerald-400/25 bg-emerald-400/8 text-emerald-300" : source.sourceType === "tavily" ? "border-violet-400/25 bg-violet-400/8 text-violet-300" : "border-sky-400/20 bg-sky-400/8 text-sky-300"}`}>[{source.citationId}]</span>}{favicon ? <Image src={favicon} alt="" width={16} height={16} unoptimized className="mt-0.5 size-4 shrink-0" /> : <ExternalLink className="mt-0.5 shrink-0" size={14} />}<span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]"><strong className="block font-medium">{source.title}</strong>{typeof source.score === "number" && <small className="mt-1 block text-[9px] opacity-45">relevance {source.score.toFixed(1)}</small>}</span><ExternalLink className="ms-auto mt-0.5 shrink-0 opacity-40" size={12} /></a>; })}</div></details>}
                {answerSettled && message.images && message.images.length > 0 && <details className="mt-5 border border-white/8 bg-white/[.02] p-3"><summary className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[#d0ad69]"><ImageIcon size={14} />{ar ? `صور من نتائج البحث (${message.images.length})` : `Images from search (${message.images.length})`}</summary><div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">{message.images.map((image, index) => <SearchImageCard key={image.url} image={image} featured={index === 0 && message.images!.length > 2} ar={ar} />)}</div></details>}
                {answerSettled && message.model && <p className="mt-4 text-[10px] text-white/25" dir="ltr">{message.model}</p>}
                {answerSettled && message.role === "assistant" && message.id !== "welcome" && <div className="mt-3 flex items-center justify-end gap-1 border-t border-white/8 pt-2"><AgentButton type="button" onClick={() => void copyAnswer(message)} title={ar ? "نسخ الإجابة" : "Copy answer"} aria-label={ar ? "نسخ الإجابة" : "Copy answer"} className="focus-ring grid size-9 place-items-center rounded-md text-white/40 hover:bg-white/5 hover:text-white">{copiedMessageId === message.id ? <Check className="text-emerald-300" size={16} /> : <Copy size={16} />}</AgentButton><AgentButton type="button" disabled={responseActive || cooldown > 0} onClick={() => retryAssistant(message.id, Date.now())} title={ar ? "إعادة توليد الإجابة" : "Regenerate answer"} aria-label={ar ? "إعادة توليد الإجابة" : "Regenerate answer"} className="focus-ring grid size-9 place-items-center rounded-md text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-30"><RotateCcw size={16} /></AgentButton></div>}
              </article>
              );
            })}

            {busy && <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-1 py-2 text-sm text-white/55"><LoaderCircle className="animate-spin text-[#d0ad69]" size={18} />{ar ? "يقرأ المرفقات ويبحث ويرتب الأدلة…" : "Reading attachments, searching and ranking evidence…"}</div>}
            <div ref={messagesEndRef} className="h-px" aria-hidden="true" />
          </div>

          {error && (
            <div className="pointer-events-none absolute inset-x-2 top-2 z-30 flex justify-center sm:inset-x-4">
              <div role="alert" className="pointer-events-auto flex w-full max-w-xl items-start gap-2 rounded-xl border border-red-400/25 bg-[#281417]/95 px-3 py-2.5 text-xs leading-5 text-red-100 shadow-2xl backdrop-blur">
                <ShieldAlert className="mt-0.5 shrink-0" size={16} />
                <span className="min-w-0 flex-1">{error}</span>
                <AgentButton type="button" onClick={() => setError("")} aria-label={ar ? "إغلاق الخطأ" : "Dismiss error"} className="grid size-7 shrink-0 place-items-center rounded-full text-red-100/60 hover:bg-white/5 hover:text-white"><X size={14} /></AgentButton>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(event) => { event.preventDefault(); setMobileToolsOpen(false); void sendQuestion(input, Date.now()); }} className="legal-agent-composer relative shrink-0 border-t border-white/8 bg-[#0c1c21]/98 px-2.5 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:px-5 sm:pb-4">
          {mobileToolsOpen && (
            <div className="mb-2 rounded-2xl border border-white/10 bg-[#101d21] p-2 shadow-2xl xl:hidden">
              {recentPrompts.length > 0 && <details className="group rounded-xl border border-white/8 bg-black/10"><summary className="focus-ring flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs text-white/65"><span className="flex items-center gap-2"><History size={14} />{ar ? `آخر البرومبتات (${recentPrompts.length}/20)` : `Recent prompts (${recentPrompts.length}/20)`}</span><ChevronDown className="transition group-open:rotate-180" size={14} /></summary><div className="max-h-40 overflow-y-auto border-t border-white/8 p-1">{recentPrompts.map((prompt, index) => <AgentButton key={`${prompt}-${index}`} type="button" onClick={() => { setInput(prompt); setMobileToolsOpen(false); }} className="focus-ring block min-h-10 w-full truncate rounded-lg px-3 text-start text-[11px] text-white/55 hover:bg-white/5 hover:text-white" title={prompt}>{prompt}</AgentButton>)}</div></details>}
              <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/8 px-3 text-xs text-white/65"><span className="flex items-center gap-2"><Globe2 size={15} />{ar ? "البحث في المصادر الرسمية" : "Official-source web search"}</span><input type="checkbox" checked={webSearch} onChange={(event) => setWebSearch(event.target.checked)} className="size-4 shrink-0" /></label>
              <div className="mt-2 rounded-xl border border-white/8 p-3 text-xs text-white/65">
                <label className="flex min-h-8 cursor-pointer items-center justify-between gap-3"><span>{ar ? "ضغط PDF الكبير تلقائياً" : "Auto-compress large PDFs"}</span><input type="checkbox" checked={autoCompressPdf} onChange={(event) => setAutoCompressPdf(event.target.checked)} className="size-4 shrink-0" /></label>
                <label className="mt-2 flex items-center justify-between gap-3"><span>{ar ? "دقة الضغط" : "Compression DPI"}</span><select value={pdfDpi} disabled={!autoCompressPdf} onChange={(event) => setPdfDpi(Number(event.target.value))} className="rounded-md border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-white outline-none disabled:opacity-40">{pdfDpiOptions.map((dpi) => <option key={dpi} value={dpi} className="bg-[#101d21]">{dpi} DPI</option>)}</select></label>
                <p className="mt-2 text-[10px] leading-4 text-white/35">{ar ? "يبدأ الضغط تلقائياً للـPDF الأكبر من 18MB. الملفات الموقعة رقمياً تُحفظ بدون تعديل." : "Compression starts automatically above 18MB. Digitally signed PDFs are kept unchanged."}</p>
              </div>
              <p className="px-3 pt-2 text-[10px] text-white/30">{ar ? "حتى 5 ملفات · 200MB قبل المعالجة · مهلة 15 ثانية" : "Up to 5 files · 200MB before processing · 15-second cooldown"}</p>
            </div>
          )}

          {recentPrompts.length > 0 && <div className="mx-auto mb-2 hidden w-full max-w-4xl xl:block"><details className="group rounded-xl border border-white/10 bg-black/10"><summary className="focus-ring flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs text-white/55"><span className="flex items-center gap-2"><History size={14} />{ar ? `آخر البرومبتات (${recentPrompts.length}/20)` : `Recent prompts (${recentPrompts.length}/20)`}</span><ChevronDown className="transition group-open:rotate-180" size={14} /></summary><div className="max-h-48 overflow-y-auto border-t border-white/10 p-1">{recentPrompts.map((prompt, index) => <AgentButton key={`${prompt}-${index}`} type="button" onClick={(event) => { setInput(prompt); event.currentTarget.closest("details")?.removeAttribute("open"); }} className="focus-ring block min-h-10 w-full truncate border-b border-white/5 px-3 text-start text-[11px] text-white/50 hover:bg-white/5 hover:text-white" title={prompt}>{prompt}</AgentButton>)}</div></details></div>}

          {attachments.length > 0 && <div className="mb-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{attachments.map((attachment) => { const willCompress = autoCompressPdf && attachment.type === "application/pdf" && attachment.size > pdfCompressionThresholdBytes; return <div key={attachment.id} className="relative flex min-w-40 max-w-60 items-center gap-2 rounded-xl border border-white/12 bg-white/[.055] p-2 pe-8">{attachment.previewUrl ? <Image src={attachment.previewUrl} alt="" width={40} height={40} unoptimized className="size-9 shrink-0 rounded-lg object-cover" /> : <FileText className="shrink-0 text-[#d0ad69]" size={20} />}<span className="min-w-0"><strong className="block truncate text-[11px]">{attachment.name}</strong><small className="block text-[9px] text-white/35">{formatBytes(attachment.size)}</small>{willCompress && <small className="mt-0.5 block text-[9px] font-bold text-amber-300/80">{ar ? `سيُضغط تلقائياً · ${pdfDpi} DPI` : `Auto-compress · ${pdfDpi} DPI`}</small>}</span><AgentButton type="button" size="icon" onClick={() => removeAttachment(attachment.id)} aria-label={ar ? "إزالة المرفق" : "Remove attachment"} className="focus-ring absolute end-0.5 top-0.5 grid size-7 place-items-center rounded-full text-white/40 hover:text-white"><X size={14} /></AgentButton></div>; })}</div>}

          <div className="mx-auto mb-2 w-full max-w-4xl">
              <button type="button" onClick={() => setQuickQuestionsOpen((current) => !current)} aria-expanded={quickQuestionsOpen} className="focus-ring mb-1.5 flex w-full items-center justify-center gap-1.5 px-0.5 text-[9px] font-bold leading-none text-white/45 transition-colors hover:text-white/75 sm:text-[10px]"><Sparkles size={12} className="sm:size-[14px]" />{ar ? "جرّب سؤالاً سريعاً" : "Try a quick question"}<ChevronDown size={13} className={`transition-transform duration-300 ${quickQuestionsOpen ? "rotate-180" : ""}`} /></button>
              <AnimatePresence initial={false}>
                {quickQuestionsOpen && <motion.div initial={{ height: 0, opacity: 0, y: -6 }} animate={{ height: "auto", opacity: 1, y: 0 }} exit={{ height: 0, opacity: 0, y: -6 }} transition={{ duration: 0.28, ease: "easeOut" }} className="overflow-hidden">
                  <div className="grid grid-cols-2 gap-1.5 pb-1 sm:grid-cols-3 sm:gap-2">
                    {quickQuestions[ar ? "ar" : "en"].map((item, itemIndex) => { const Icon = item.icon; return <motion.div key={item.label} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: itemIndex * 0.035, duration: 0.2 }}><AgentButton type="button" disabled={responseActive || cooldown > 0} onClick={() => { setQuickQuestionsOpen(false); void sendQuestion(item.question, Date.now()); }} title={item.question} className="focus-ring flex min-h-10 w-full min-w-0 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[.025] px-2.5 py-1.5 text-[9px] font-bold leading-none text-white/60 transition hover:border-[#b89555]/35 hover:bg-white/[.05] hover:text-white disabled:opacity-40 sm:min-h-11 sm:px-3 sm:text-[10px]"><Icon className="size-3 shrink-0 text-[#d0ad69] sm:size-[13px]" /><span className="whitespace-nowrap text-center">{item.label}</span></AgentButton></motion.div>; })}
                  </div>
                </motion.div>}
              </AnimatePresence>
            </div>

          <div className="legal-agent-input mx-auto w-full max-w-5xl rounded-[1.5rem] border border-white/12 bg-white/[.045] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,.18)] transition focus-within:border-[#b89555]/45 focus-within:bg-white/[.055]">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(event) => { const value = event.target.value; setInput(value); window.localStorage.setItem(`legal-agent-draft:${user.uid}`, value); }}
              onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}
              enterKeyHint="send"
              placeholder={ar ? "اسأل عن قضية أو قانون…" : "Ask about a case or law…"}
              className="block min-h-12 max-h-[10.5rem] w-full resize-none overflow-y-auto bg-transparent px-3.5 py-2.5 text-[15px] leading-6 text-white/90 outline-none placeholder:text-white/28 sm:text-sm"
              maxLength={4000}
            />
            <div className="flex items-center justify-between gap-1 px-1 pb-0.5">
              <div className="flex min-w-0 items-center gap-0.5">
                <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/markdown,text/csv,application/json,.txt,.md,.csv,.json,.pdf" onChange={(event) => addAttachments(event.target.files)} className="hidden" />
                <AgentButton type="button" size="icon" disabled={responseActive || attachments.length >= maxFiles} onClick={() => fileInputRef.current?.click()} aria-label={ar ? "إرفاق صور أو ملفات" : "Attach images or files"} title={ar ? "صور، PDF وملفات نصية — حتى 200MB قبل المعالجة" : "Images, PDF and text — up to 200MB before processing"} className="focus-ring grid size-10 place-items-center rounded-full text-white/55 hover:bg-white/5 hover:text-white disabled:opacity-30"><Paperclip size={18} /></AgentButton>
                <AgentButton type="button" size="icon" disabled={responseActive} onClick={() => void toggleVoice()} aria-label={listening ? (ar ? "إيقاف التسجيل" : "Stop recording") : (ar ? "إملاء صوتي" : "Voice dictation")} title={ar ? "الإملاء الصوتي" : "Voice dictation"} className={`focus-ring grid size-10 place-items-center rounded-full transition ${listening ? "bg-red-500/15 text-red-300" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>{listening ? <MicOff className="animate-pulse" size={18} /> : <Mic size={18} />}</AgentButton>
                <AgentButton type="button" onClick={() => setMobileToolsOpen((current) => !current)} aria-expanded={mobileToolsOpen} aria-label={ar ? "أدوات إضافية" : "More tools"} className={`focus-ring grid size-10 place-items-center rounded-full xl:hidden ${mobileToolsOpen ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"}`}><Sparkles size={17} /></AgentButton>
                <label className="hidden cursor-pointer items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-[11px] text-white/55 xl:flex"><input type="checkbox" checked={webSearch} onChange={(event) => setWebSearch(event.target.checked)} className="size-3.5 shrink-0" /><Globe2 size={13} />{ar ? "Tavily" : "Tavily"}</label>
                <label className="hidden items-center gap-1.5 rounded-full border border-white/10 px-2 py-1.5 text-[10px] text-white/55 xl:flex" title={ar ? "ضغط ملفات PDF الأكبر من 18MB قبل إرسالها للنموذج" : "Compress PDFs larger than 18MB before sending them to the model"}><input type="checkbox" checked={autoCompressPdf} onChange={(event) => setAutoCompressPdf(event.target.checked)} className="size-3.5 shrink-0" /><FileText size={13} /><span>{ar ? "PDF" : "PDF"}</span><select value={pdfDpi} disabled={!autoCompressPdf} onChange={(event) => setPdfDpi(Number(event.target.value))} className="rounded-md border border-white/10 bg-transparent px-1 py-0.5 text-[10px] text-white outline-none disabled:opacity-40">{pdfDpiOptions.map((dpi) => <option key={dpi} value={dpi} className="bg-[#101d21]">{dpi}</option>)}</select></label>
                {listening && <span className="hidden text-[10px] text-red-300 sm:inline">{ar ? "أستمع الآن…" : "Listening…"}</span>}
              </div>
              {responseActive ? <AgentButton type="button" onClick={stopGeneration} aria-label={ar ? "إيقاف النموذج" : "Stop model"} className="focus-ring grid size-10 shrink-0 place-items-center rounded-full bg-white text-black hover:bg-white/90"><Square size={14} fill="currentColor" /></AgentButton> : <AgentButton disabled={cooldown > 0 || (input.trim().length < 3 && attachments.length === 0)} aria-label={ar ? "إرسال السؤال" : "Send question"} className="focus-ring grid size-10 shrink-0 place-items-center rounded-full bg-[#b89555] text-[#10191b] disabled:opacity-35">{cooldown > 0 ? <span className="text-xs font-black">{cooldown}</span> : <Send size={18} />}</AgentButton>}
            </div>
          </div>
          <p className="mx-auto mt-1.5 hidden max-w-4xl text-center text-[9px] text-white/30 sm:block">{ar ? "تحقق من النصوص الرسمية وملف القضية قبل اعتماد أي إجراء." : "Verify official texts and the case file before relying on any action."}</p>
        </form>
      </div>

      <AnimatePresence>
        {mobileHistoryOpen && (
          <>
            <motion.button
              type="button"
              aria-label={ar ? "إغلاق سجل المحادثات" : "Close chat history"}
              onClick={() => setMobileHistoryOpen(false)}
              className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[3px] xl:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            />
            <motion.aside
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="legal-agent-sidebar fixed inset-y-0 start-0 z-50 w-[min(90vw,21rem)] overflow-y-auto border-e border-white/10 bg-[#0b171b] p-3.5 shadow-2xl xl:hidden"
            >
              <div className="mb-3 flex items-center justify-end">
                <AgentButton type="button" onClick={() => setMobileHistoryOpen(false)} aria-label={ar ? "إغلاق" : "Close"} className="focus-ring grid size-10 place-items-center rounded-full text-white/55 hover:bg-white/5 hover:text-white">
                  <X size={18} />
                </AgentButton>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside className={`legal-agent-sidebar hidden overflow-y-auto border-s border-white/10 bg-white/[.018] p-3.5 shadow-none transition-[width,padding,opacity] duration-300 xl:block ${historySidebarCollapsed ? "xl:pointer-events-none xl:w-0 xl:overflow-hidden xl:border-s-0 xl:p-0 xl:opacity-0" : ""}`}>
        {sidebarContent}
      </aside>
    </section>
  );

}
