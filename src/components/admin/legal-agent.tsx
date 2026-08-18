"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { onValue, ref, remove, set } from "firebase/database";
import { Bot, CheckCircle2, ChevronDown, CircleDashed, ExternalLink, FileText, Files, Globe2, History, ImageIcon, Landmark, LoaderCircle, Mic, MicOff, Paperclip, Search, Send, ShieldAlert, Sparkles, Square, TerminalSquare, Trash2, X } from "lucide-react";
import type { Locale } from "@/config/site";
import { firestore, realtimeDatabase } from "@/lib/firebase/client";
import type { AgentImage, AgentSource } from "@/types/admin";
import { MarkdownAnswer } from "@/components/admin/markdown-answer";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";
import { agentSkills } from "@/data/agent-skills";

type NodeResult = { id: string; label: string; status: "done" | "skipped" | "error"; ms: number; detail?: string };
type CaseMatch = { id: string; caseNumber: string; caseYear: number; caseType: string; clientName: string; accusedName?: string; victimName?: string; court?: string; status?: string; judgment?: string; judgeName?: string; notes?: string; nextHearing?: string; score: number };
type ChatAttachment = { id: string; name: string; type: string; size: number; previewUrl?: string };
type PendingAttachment = ChatAttachment & { file: File };
type ChatMessage = { id: string; role: "user" | "assistant"; content: string; attachments?: ChatAttachment[]; model?: string; nodes?: NodeResult[]; code?: string; codeResult?: string; sources?: AgentSource[]; images?: AgentImage[]; caseMatches?: CaseMatch[] };
type StoredConversation = { id: string; title: string; createdAt: number; updatedAt: number; messages: ChatMessage[] };
type SpeechResultEvent = { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> };
type SpeechRecognitionLike = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((event: SpeechResultEvent) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const maxFiles = 5;
const maxTotalBytes = 50 * 1024 * 1024;
const acceptedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "text/plain", "text/markdown", "text/csv", "application/json"]);

const quickQuestions = {
  ar: [
    { icon: Files, label: "فهم القضايا", question: "استعرض القضايا المسجلة ذات الأولوية، ولخّص حالة كل قضية وموعدها القادم مع الإشارة إلى سجل القضية المستخدم." },
    { icon: Landmark, label: "القانون البحريني", question: "اشرح لي بإيجاز مصادر التشريع في مملكة البحرين وكيف أتحقق من النص القانوني النافذ، مع روابط رسمية حديثة." },
    { icon: Globe2, label: "الحكومة الإلكترونية", question: "اختر معاملة قضائية بحرينية شائعة واشرح خطوات إنجازها إلكترونياً والمستندات المطلوبة، مع رابط الخدمة الحكومية الرسمي." },
    { icon: Search, label: "بحث وروابط", question: "استخدم Tavily للبحث عن أحدث الخدمات القضائية الإلكترونية في البحرين، ثم اعرض خلاصة مرتبة وروابط المصادر الرسمية." },
    { icon: ImageIcon, label: "روابط وصور", question: "ابحث عبر Tavily عن بوابات العدالة والقضاء الرسمية في البحرين، واعرض الروابط مع الصور المتاحة من نتائج البحث وبيّن وظيفة كل بوابة." },
  ],
  en: [
    { icon: Files, label: "Case insight", question: "Review the registered priority cases and summarize each status and next hearing, citing the case record used." },
    { icon: Landmark, label: "Bahrain law", question: "Briefly explain Bahrain's sources of legislation and how to verify the law currently in force, with current official links." },
    { icon: Globe2, label: "eGovernment", question: "Choose a common Bahrain judicial transaction and explain its online steps and required documents, with the official service link." },
    { icon: Search, label: "Research & links", question: "Use Tavily to find the latest Bahrain online judicial services, then provide a structured summary with official-source links." },
    { icon: ImageIcon, label: "Links & images", question: "Use Tavily to find Bahrain's official justice and judiciary portals, show available result images and links, and explain each portal's purpose." },
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

function MessageAttachments({ attachments, ar }: { attachments: ChatAttachment[]; ar: boolean }) {
  return <div className="mb-3 grid gap-2">{attachments.map((attachment) => attachment.previewUrl && attachment.type === "application/pdf" ? (
    <figure key={attachment.id} className="overflow-hidden border border-black/15 bg-black/10">
      <iframe src={`${attachment.previewUrl}#page=1&view=FitH&toolbar=0`} title={attachment.name} className="h-[28rem] max-h-[65dvh] w-full bg-white sm:h-[38rem]" />
      <figcaption className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[10px]"><span className="min-w-0 truncate opacity-70">{attachment.name}</span><a href={attachment.previewUrl} target="_blank" rel="noreferrer" className="font-bold underline">{ar ? "فتح PDF كاملاً" : "Open full PDF"}</a></figcaption>
    </figure>
  ) : attachment.previewUrl ? (
    <figure key={attachment.id} className="overflow-hidden border border-black/10 bg-black/10">
      <Image src={attachment.previewUrl} alt={attachment.name} width={720} height={480} unoptimized className="max-h-72 w-full object-contain" />
      <figcaption className="truncate px-3 py-2 text-[10px] opacity-65">{attachment.name}</figcaption>
    </figure>
  ) : (
    <div key={attachment.id} className="flex min-w-0 items-center gap-3 border border-black/10 bg-black/5 p-3">
      <FileText className="shrink-0" size={21} /><span className="min-w-0"><strong className="block truncate text-xs">{attachment.name}</strong><small className="opacity-60">{formatBytes(attachment.size)} · {attachment.type === "application/pdf" ? "PDF" : ar ? "ملف نصي" : "Text file"}</small></span>
    </div>
  ))}</div>;
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
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [clock, setClock] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setInput(window.localStorage.getItem(`legal-agent-draft:${user.uid}`) ?? "");
      setDraftReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [user.uid]);

  useEffect(() => {
    if (draftReady) window.localStorage.setItem(`legal-agent-draft:${user.uid}`, input);
  }, [draftReady, input, user.uid]);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const timer = window.setInterval(() => setClock(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  useEffect(() => onValue(ref(realtimeDatabase, `agentConversations/${user.uid}`), (snapshot) => {
    const value = snapshot.val() as Record<string, Omit<StoredConversation, "id">> | null;
    const items = value ? Object.entries(value).map(([id, item]) => ({ id, ...item })) : [];
    setConversations(items.sort((a, b) => b.updatedAt - a.updatedAt));
  }), [user.uid]);

  const cooldown = Math.max(0, Math.ceil((cooldownUntil - clock) / 1000));
  const history = useMemo(() => messages.filter((item) => item.id !== "welcome").slice(-8).map(({ role, content }) => ({ role, content: content.slice(0, 5000) })), [messages]);
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
    if (total > maxTotalBytes) { setError(ar ? "إجمالي المرفقات يجب ألا يتجاوز 50MB." : "Attachments must total 50MB or less."); return; }
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
    setAttachments([]); setConversationId(""); setMessages([welcomeMessage]); setInput(""); setError("");
  }

  function openConversation(conversation: StoredConversation) {
    attachments.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
    messages.flatMap((item) => item.attachments ?? []).forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
    setAttachments([]);
    setConversationId(conversation.id); setMessages(conversation.messages?.length ? conversation.messages : [welcomeMessage]); setInput(""); setError("");
  }

  async function deleteConversation(id: string) {
    if (!window.confirm(ar ? "هل تريد حذف هذه المحادثة نهائياً؟" : "Delete this conversation permanently?")) return;
    await remove(ref(realtimeDatabase, `agentConversations/${user.uid}/${id}`));
    if (conversationId === id) newConversation();
  }

  function toggleVoice() {
    if (listening) { speechRef.current?.stop(); return; }
    const speechWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setError(ar ? "الإملاء الصوتي غير مدعوم في هذا المتصفح. استخدم Chrome أو Safari الحديث." : "Voice dictation is not supported in this browser. Try a current Chrome or Safari."); return; }
    const recognition = new Recognition();
    recognition.lang = ar ? "ar-BH" : "en-US"; recognition.continuous = false; recognition.interimResults = false;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) if (event.results[index].isFinal) transcript += event.results[index][0].transcript;
      if (transcript.trim()) setInput((current) => `${current}${current.trim() ? " " : ""}${transcript.trim()}`);
    };
    recognition.onerror = () => setError(ar ? "تعذر التقاط الصوت. تحقق من إذن الميكروفون." : "Could not capture audio. Check microphone permission.");
    recognition.onend = () => setListening(false);
    speechRef.current = recognition; setError(""); setListening(true); recognition.start();
  }

  function stopGeneration() {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setBusy(false);
    setError(ar ? "تم إيقاف توليد الإجابة." : "Answer generation stopped.");
  }

  async function sendQuestion(value: string, requestedAt: number) {
    const selectedAttachments = attachments;
    const question = value.trim() || (selectedAttachments.length ? (ar ? "حلّل جميع المرفقات وقدّم خلاصة دقيقة مع أهم الملاحظات." : "Analyze every attachment and provide an accurate summary with the key observations.") : "");
    if (!question || busy || cooldown > 0) return;
    const displayAttachments = selectedAttachments.map((item) => ({ id: item.id, name: item.name, type: item.type, size: item.size, previewUrl: item.previewUrl }));
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: question, attachments: displayAttachments };
    const nextConversationId = conversationId || crypto.randomUUID();
    const withUserMessage = [...messages, userMessage];
    setConversationId(nextConversationId); setMessages(withUserMessage); setAttachments([]); setInput(""); setBusy(true); setError(""); setCooldownUntil(requestedAt + 10_000); setClock(requestedAt);
    void saveConversation(nextConversationId, withUserMessage, question, requestedAt);
    try {
      const token = await user.getIdToken();
      const controller = new AbortController();
      requestControllerRef.current = controller;
      const form = new FormData();
      form.set("message", question); form.set("webSearch", String(webSearch)); form.set("history", JSON.stringify(history));
      selectedAttachments.forEach(({ file }) => form.append("files", file, file.name));
      if (asksForPastHistory(question)) {
        const pastHistory = conversations.filter((item) => item.id !== nextConversationId).slice(0, 12).map((item) => `Conversation: ${item.title}\n${(item.messages ?? []).slice(-12).map((message) => `${message.role}: ${message.content}`).join("\n")}`).join("\n\n").slice(0, 15000);
        form.set("pastHistory", pastHistory);
      }
      const response = await fetch("/api/admin/agent", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form, signal: controller.signal });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.message || "AI_ERROR");
      const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: body.answer, model: body.model, nodes: body.nodes, code: body.code, codeResult: body.codeResult, sources: body.sources, images: body.images, caseMatches: body.caseMatches };
      const completedMessages = [...withUserMessage, assistantMessage];
      setMessages(completedMessages);
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

  return (
    <section className="grid min-h-[min(680px,calc(100dvh-8rem))] overflow-hidden border border-white/10 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex min-h-[min(680px,calc(100dvh-8rem))] min-w-0 flex-col bg-[#0c1c21]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-5"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center bg-[#b89555]/15 text-[#d0ad69] sm:size-11"><Bot /></span><div className="min-w-0"><h2 className="text-sm font-bold sm:text-base">{ar ? "وكيل القضايا والقانون البحريني" : "Bahrain cases & law agent"}</h2><p className="mt-1 text-xs text-white/40">RAG · Tavily · Gemini Multimodal</p></div></div><LiquidButton onClick={newConversation} className="focus-ring flex min-h-10 items-center gap-2 p-2 text-xs text-white/45 hover:text-white"><Trash2 size={15} />{ar ? "محادثة جديدة" : "New chat"}</LiquidButton></div>
        <div className="flex-1 space-y-5 overflow-y-auto p-3 sm:p-6">
          {messages.map((message) => <article key={message.id} className={message.role === "user" ? "ms-auto w-fit max-w-[min(100%,48rem)] bg-[#b89555] p-4 text-[#10191b]" : "w-full min-w-0 overflow-hidden border border-white/10 bg-white/[.045] p-4 sm:p-6"}>
            {message.attachments && message.attachments.length > 0 && <MessageAttachments attachments={message.attachments} ar={ar} />}
            {message.role === "assistant" ? <MarkdownAnswer images={message.images}>{linkCaseCitations(message.content, message.id, message.caseMatches?.length ?? 0)}</MarkdownAnswer> : <p className="whitespace-pre-wrap leading-7">{message.content}</p>}
            {message.nodes && <div className="mt-5 flex flex-wrap gap-2 border-t border-white/8 pt-4">{message.nodes.map((node) => <span key={node.id} className={`flex items-center gap-1.5 border px-2.5 py-1 text-[10px] ${node.status === "done" ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-200" : node.status === "error" ? "border-red-400/20 bg-red-400/5 text-red-200" : "border-white/10 text-white/35"}`}>{node.status === "done" ? <CheckCircle2 size={12} /> : <CircleDashed size={12} />}{node.label}{node.ms > 0 && ` · ${node.ms}ms`}</span>)}</div>}
            {(message.code || message.codeResult) && <details className="mt-4 border border-violet-300/15 bg-violet-300/5 p-3"><summary className="flex cursor-pointer items-center gap-2 text-xs font-bold text-violet-200"><TerminalSquare size={14} />{ar ? "تنفيذ Python المعزول" : "Sandboxed Python execution"}</summary>{message.code && <pre className="mt-3 max-h-64 overflow-auto bg-black/25 p-3 text-[11px] leading-5 text-violet-100" dir="ltr"><code>{message.code}</code></pre>}{message.codeResult && <pre className="mt-2 max-h-52 overflow-auto border-t border-white/10 p-3 text-[11px] leading-5 text-white/60" dir="ltr">{message.codeResult}</pre>}</details>}
            {message.caseMatches && message.caseMatches.length > 0 && <section className="mt-4 border border-[#b89555]/20 bg-[#b89555]/5 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-bold text-[#e2c98f]">{ar ? `القضايا المشار إليها (${message.caseMatches.length})` : `Referenced cases (${message.caseMatches.length})`}</h3>{onOpenCases && <LiquidButton type="button" onClick={onOpenCases} className="focus-ring min-h-9 border border-[#b89555]/25 px-3 text-[10px] font-bold text-[#e2c98f] hover:bg-[#b89555]/10">{ar ? "فتح قسم القضايا" : "Open cases section"}</LiquidButton>}</div><div className="mt-3 grid gap-2">{message.caseMatches.map((item, index) => <details id={`case-${message.id}-${index + 1}`} key={item.id} className="scroll-mt-24 border border-white/10 bg-black/10 p-3 open:border-[#b89555]/40 open:bg-[#b89555]/5"><summary className="flex cursor-pointer flex-wrap items-center gap-2 text-xs font-bold"><span className="rounded-sm bg-[#b89555]/15 px-1.5 py-0.5 text-[#e2c98f]">[C{index + 1}]</span><span dir="ltr">{item.caseNumber}/{item.caseYear}</span><span className="text-white/45">{item.caseType} · {item.clientName}</span></summary><dl className="mt-3 grid gap-x-5 gap-y-2 border-t border-white/8 pt-3 text-[11px] leading-5 sm:grid-cols-2">{[[ar ? "المحكمة" : "Court", item.court], [ar ? "الحالة" : "Status", item.status], [ar ? "المتهم/الخصم" : "Accused/opponent", item.accusedName], [ar ? "المجني عليه" : "Victim", item.victimName], [ar ? "القاضي/الهيئة" : "Judge/panel", item.judgeName], [ar ? "الجلسة القادمة" : "Next hearing", item.nextHearing], [ar ? "الحكم" : "Judgment", item.judgment], [ar ? "الملاحظات" : "Notes", item.notes]].filter((entry) => entry[1]).map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-white/35">{label}</dt><dd className="break-words text-white/75">{value}</dd></div>)}</dl></details>)}</div></section>}
            {message.sources && message.sources.length > 0 && <div className="mt-5"><h3 className="text-xs font-bold text-[#d0ad69]">{ar ? "مصادر البحث" : "Search sources"}</h3><div className="mt-2 grid gap-2">{message.sources.map((source) => { const favicon = faviconUrl(source.url); return <a key={source.url} href={source.url} target="_blank" rel="noreferrer noopener" className="focus-ring flex items-start gap-2 border border-white/8 p-3 text-xs text-white/65 hover:border-[#b89555]/40 hover:text-white">{favicon ? <Image src={favicon} alt="" width={16} height={16} unoptimized className="mt-0.5 size-4 shrink-0" /> : <ExternalLink className="mt-0.5 shrink-0" size={14} />}<span className="min-w-0 break-words">{source.title}</span><ExternalLink className="ms-auto mt-0.5 shrink-0 opacity-40" size={12} /></a>; })}</div></div>}
            {message.images && message.images.length > 0 && <section className="mt-5"><h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-[#d0ad69]"><ImageIcon size={14} />{ar ? "صور من نتائج البحث" : "Images from search"}</h3><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{message.images.map((image, index) => <a key={image.url} href={image.url} target="_blank" rel="noreferrer noopener" title={image.description} className={`group relative overflow-hidden border border-white/10 bg-black/20 ${index === 0 && message.images!.length > 2 ? "sm:col-span-2" : ""}`}><Image src={image.displayUrl || image.url} alt={image.description || (ar ? "نتيجة بحث مرئية" : "Visual search result")} width={960} height={540} unoptimized className={`w-full object-cover transition duration-300 group-hover:scale-[1.02] ${index === 0 ? "max-h-[28rem]" : "h-52"}`} />{image.description && <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-8 text-[10px] leading-4 text-white/80">{image.description}</span>}<ExternalLink className="absolute end-2 top-2 rounded-full bg-black/65 p-1.5 text-white/75" size={24} /></a>)}</div></section>}
            {message.model && <p className="mt-4 text-[10px] text-white/25" dir="ltr">{message.model}</p>}
          </article>)}
          {busy && <div className="me-auto flex items-center gap-3 border border-white/10 bg-white/[.045] p-4 text-sm text-white/55"><LoaderCircle className="animate-spin text-[#d0ad69]" size={18} />{ar ? "يقرأ المرفقات ويبحث ويرتب الأدلة…" : "Reading attachments, searching and ranking evidence…"}</div>}
          {error && <div className="flex gap-3 border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200"><ShieldAlert className="shrink-0" size={18} />{error}</div>}
        </div>
        <div className="border-t border-cyan-300/15 bg-[#0a252c] px-3 py-3 sm:px-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-cyan-200"><Sparkles size={14} />{ar ? "أسئلة سريعة لاختبار قوة الوكيل" : "Quick questions to test the agent"}</div>
          <div className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] xl:grid xl:grid-cols-5 xl:overflow-visible">
            {quickQuestions[ar ? "ar" : "en"].map((item) => { const Icon = item.icon; return <LiquidButton key={item.label} type="button" disabled={busy || cooldown > 0} onClick={() => void sendQuestion(item.question, Date.now())} title={item.question} className="focus-ring flex min-h-11 min-w-[9.25rem] snap-start items-center justify-center gap-2 border border-cyan-300/25 bg-cyan-300/10 px-3 text-xs font-bold text-cyan-50 transition hover:border-cyan-200/60 hover:bg-cyan-300/20 disabled:opacity-40 xl:min-w-0"><Icon className="shrink-0 text-cyan-300" size={15} /><span>{item.label}</span></LiquidButton>; })}
          </div>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); void sendQuestion(input, Date.now()); }} className="border-t border-white/10 bg-[#101d21] p-3 sm:p-4">
          {recentPrompts.length > 0 && <details className="group mb-3 border border-white/10 bg-black/10"><summary className="focus-ring flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs text-white/55"><span className="flex items-center gap-2"><History size={14} />{ar ? `آخر البرومبتات (${recentPrompts.length}/20)` : `Recent prompts (${recentPrompts.length}/20)`}</span><ChevronDown className="transition group-open:rotate-180" size={14} /></summary><div className="max-h-48 overflow-y-auto border-t border-white/10 p-1">{recentPrompts.map((prompt, index) => <LiquidButton key={`${prompt}-${index}`} type="button" onClick={(event) => { setInput(prompt); event.currentTarget.closest("details")?.removeAttribute("open"); }} className="focus-ring block min-h-10 w-full truncate border-b border-white/5 px-3 text-start text-[11px] text-white/50 hover:bg-white/5 hover:text-white" title={prompt}>{prompt}</LiquidButton>)}</div></details>}
          {attachments.length > 0 && <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{attachments.map((attachment) => <div key={attachment.id} className="relative flex min-w-44 max-w-60 items-center gap-2 border border-white/12 bg-white/[.055] p-2 pe-9">{attachment.previewUrl ? <Image src={attachment.previewUrl} alt="" width={40} height={40} unoptimized className="size-10 shrink-0 object-cover" /> : <FileText className="shrink-0 text-[#d0ad69]" size={20} />}<span className="min-w-0"><strong className="block truncate text-[11px]">{attachment.name}</strong><small className="text-[9px] text-white/35">{formatBytes(attachment.size)}</small></span><LiquidButton type="button" size="icon" onClick={() => removeAttachment(attachment.id)} aria-label={ar ? "إزالة المرفق" : "Remove attachment"} className="focus-ring absolute end-1 top-1 grid size-7 place-items-center text-white/40 hover:text-white"><X size={14} /></LiquidButton></div>)}</div>}
          <div className="border border-white/12 bg-white/[.055] focus-within:border-[#b89555]/60">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={ar ? "اكتب، أرفق صورة أو PDF، أو استخدم الميكروفون…" : "Type, attach an image or PDF, or use the microphone…"} className="min-h-16 w-full resize-none bg-transparent px-4 pt-3 text-sm outline-none placeholder:text-white/30" maxLength={4000} />
            <div className="flex items-center justify-between gap-2 px-2 pb-2"><div className="flex items-center gap-1"><input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/markdown,text/csv,application/json,.txt,.md,.csv,.json,.pdf" onChange={(event) => addAttachments(event.target.files)} className="hidden" /><LiquidButton type="button" size="icon" disabled={busy || attachments.length >= maxFiles} onClick={() => fileInputRef.current?.click()} aria-label={ar ? "إرفاق صور أو ملفات" : "Attach images or files"} title={ar ? "صور، PDF وملفات نصية — حتى 50MB" : "Images, PDF and text — up to 50MB"} className="focus-ring grid size-10 place-items-center text-white/55 hover:bg-white/5 hover:text-white disabled:opacity-30"><Paperclip size={18} /></LiquidButton><LiquidButton type="button" size="icon" disabled={busy} onClick={toggleVoice} aria-label={listening ? (ar ? "إيقاف التسجيل" : "Stop recording") : (ar ? "إملاء صوتي" : "Voice dictation")} className={`focus-ring grid size-10 place-items-center transition ${listening ? "bg-red-500/15 text-red-300" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>{listening ? <MicOff className="animate-pulse" size={18} /> : <Mic size={18} />}</LiquidButton>{listening && <span className="text-[10px] text-red-300">{ar ? "أستمع الآن…" : "Listening…"}</span>}</div>{busy ? <LiquidButton type="button" onClick={stopGeneration} aria-label={ar ? "إيقاف النموذج" : "Stop model"} className="focus-ring flex min-h-11 shrink-0 items-center gap-2 bg-red-500/15 px-3 text-xs font-bold text-red-200 hover:bg-red-500/25"><Square size={14} fill="currentColor" />{ar ? "إيقاف" : "Stop"}</LiquidButton> : <LiquidButton disabled={cooldown > 0 || (input.trim().length < 3 && attachments.length === 0)} aria-label={ar ? "إرسال السؤال" : "Send question"} className="focus-ring grid size-11 shrink-0 place-items-center bg-[#b89555] text-[#10191b] disabled:opacity-40">{cooldown > 0 ? <span className="text-sm font-black">{cooldown}</span> : <Send size={19} />}</LiquidButton>}</div>
          </div>
          <div className="mt-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center"><label className="flex cursor-pointer items-center gap-2 text-xs text-white/55"><input type="checkbox" checked={webSearch} onChange={(event) => setWebSearch(event.target.checked)} className="size-4 shrink-0" /><Globe2 className="shrink-0" size={14} />{ar ? "بحث Tavily في المصادر الرسمية" : "Tavily official-source search"}</label><span className="text-[10px] text-white/25">{ar ? "5 ملفات · 50MB · مهلة 10 ثوانٍ" : "5 files · 50MB · 10-second cooldown"}</span></div>
        </form>
      </div>
      <aside className="border-t border-white/10 bg-white/[.025] p-5 xl:border-s xl:border-t-0">
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><History className="text-[#d0ad69]" size={18} /><h3 className="font-bold">{ar ? "المحادثات السابقة" : "Chat history"}</h3></div><span className="text-[10px] text-white/30">{conversations.length}</span></div>
        <p className="mt-2 text-[10px] leading-5 text-white/35">{ar ? "لا تدخل في سياق محادثة جديدة إلا إذا سألت عنها صراحةً." : "Not used in a new chat unless you explicitly ask about it."}</p>
        <div className="mt-3 max-h-52 space-y-1 overflow-y-auto pe-1">{conversations.length ? conversations.map((conversation) => <div key={conversation.id} className={`group flex items-center border ${conversation.id === conversationId ? "border-[#b89555]/40 bg-[#b89555]/10" : "border-transparent hover:bg-white/[.035]"}`}><LiquidButton type="button" onClick={() => openConversation(conversation)} className="focus-ring min-w-0 flex-1 p-2 text-start"><strong className="block truncate text-[11px] text-white/70">{conversation.title}</strong><small className="mt-1 block text-[9px] text-white/25">{new Intl.DateTimeFormat(ar ? "ar-BH" : "en", { dateStyle: "short", timeStyle: "short" }).format(conversation.updatedAt)}</small></LiquidButton><LiquidButton type="button" size="icon" onClick={() => void deleteConversation(conversation.id)} aria-label={ar ? "حذف المحادثة" : "Delete conversation"} className="focus-ring grid size-8 shrink-0 place-items-center text-white/25 hover:text-red-300"><Trash2 size={13} /></LiquidButton></div>) : <p className="py-4 text-center text-[10px] text-white/25">{ar ? "لا توجد محادثات محفوظة بعد" : "No saved conversations yet"}</p>}</div>
        <details className="mt-4 border border-white/10 bg-white/[.02] p-3"><summary className="cursor-pointer text-[11px] font-bold text-[#d0ad69]">{ar ? `المهارات القضائية الأساسية (${agentSkills.length})` : `Core legal skills (${agentSkills.length})`}</summary><ul className="mt-3 space-y-2 text-[10px] leading-5 text-white/45">{agentSkills.map((skill) => <li key={skill.id} className="border-t border-white/8 pt-2">{skill.title}</li>)}</ul></details>
        <div className="my-5 border-t border-white/10" />
        <div className="flex items-center gap-3 xl:block"><Sparkles className="shrink-0 text-[#d0ad69]" /><h3 className="font-bold xl:mt-4">{ar ? "طريقة عمل الوكيل" : "Agent pipeline"}</h3></div><ol className="mt-5 grid gap-4 text-xs leading-6 text-white/50 sm:grid-cols-2 xl:grid-cols-1"><li><strong className="block text-white/75">01 · Firebase Auth</strong>{ar ? "يتحقق من هوية وبريد الأدمن." : "Verifies administrator identity."}</li><li><strong className="block text-white/75">02 · Case RAG</strong>{ar ? "يرتب القضايا حسب صلتها بالسؤال." : "Ranks cases by relevance."}</li><li><strong className="block text-white/75">03 · Tavily</strong>{ar ? "يجلب مصادر وصورًا بحرينية رسمية." : "Fetches official Bahrain sources and images."}</li><li><strong className="block text-white/75">04 · Attachments</strong>{ar ? "يرفع الملفات الكبيرة ويقرأ PDF كاملًا." : "Uploads large files and reads complete PDFs."}</li><li><strong className="block text-white/75">05 · Python Sandbox</strong>{ar ? "ينفذ الحسابات والتحليل البرمجي في بيئة معزولة." : "Runs calculations and code analysis in an isolated environment."}</li><li><strong className="block text-white/75">06 · Gemini</strong>{ar ? "يطبق المهارات القضائية ويصوغ الإجابة." : "Applies legal skills and drafts the answer."}</li></ol><div className="mt-5 border-s-2 border-amber-400/60 bg-amber-400/5 p-4 text-xs leading-6 text-amber-100/70 xl:mt-7">{ar ? "المرفقات القانونية قد تكون حساسة. راجع النص الرسمي وملف القضية قبل اعتماد أي رأي أو إجراء." : "Legal attachments may be sensitive. Review official law and the full case file before relying on any conclusion or action."}</div>
      </aside>
    </section>
  );
}
