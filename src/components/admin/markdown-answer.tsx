"use client";

import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentImage } from "@/types/admin";
import { useState } from "react";

function safeHttpsUrl(value: string | undefined) {
  if (!value) return "";
  try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : ""; }
  catch { return ""; }
}

function faviconUrl(value: string) {
  try { return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(value).hostname)}&sz=32`; }
  catch { return ""; }
}

function MarkdownImage({ source, displaySource, alt }: { source: string; displaySource: string; alt?: string }) {
  const [current, setCurrent] = useState(displaySource);
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <a href={source} target="_blank" rel="noreferrer noopener" className="my-4 block overflow-hidden border border-white/10 bg-black/10"><Image src={current} alt={alt || "Search image"} width={960} height={640} unoptimized onError={() => { if (current !== source) setCurrent(source); else setFailed(true); }} className="max-h-[32rem] w-full object-contain" /></a>;
}

export function MarkdownAnswer({ children, images = [] }: { children: string; images?: AgentImage[] }) {
  return (
    <div className="admin-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        a: ({ href, children: label }) => {
          if (href?.startsWith("#case-")) return <a href={href} onClick={() => { const target = document.getElementById(href.slice(1)); if (target instanceof HTMLDetailsElement) target.open = true; }} className="inline-flex rounded-sm border border-[#d0ad69]/30 bg-[#d0ad69]/10 px-1 font-bold text-[#e2c98f] no-underline hover:bg-[#d0ad69]/20">{label}</a>;
          const safeHref = safeHttpsUrl(href);
          return safeHref ? <a href={safeHref} target="_blank" rel="noreferrer noopener" className="inline-flex items-baseline gap-1"><Image src={faviconUrl(safeHref)} alt="" width={14} height={14} unoptimized className="inline size-3.5 shrink-0 self-center" />{label}</a> : <span>{label}</span>;
        },
        table: ({ children: tableChildren }) => <div className="admin-markdown-table" role="region" aria-label="Scrollable table" tabIndex={0}><table>{tableChildren}</table></div>,
        img: ({ src, alt }) => {
          const safeSrc = safeHttpsUrl(typeof src === "string" ? src : undefined);
          const displaySrc = images.find((image) => image.url === safeSrc)?.displayUrl || safeSrc;
          return safeSrc && displaySrc ? <MarkdownImage source={safeSrc} displaySource={displaySrc} alt={alt || undefined} /> : null;
        },
      }}>{children}</ReactMarkdown>
    </div>
  );
}
