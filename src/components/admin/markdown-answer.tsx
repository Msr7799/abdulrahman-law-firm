"use client";

import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function safeHttpsUrl(value: string | undefined) {
  if (!value) return "";
  try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : ""; }
  catch { return ""; }
}

function faviconUrl(value: string) {
  try { return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(value).hostname)}&sz=32`; }
  catch { return ""; }
}

export function MarkdownAnswer({ children }: { children: string }) {
  return (
    <div className="admin-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        a: ({ href, children: label }) => { const safeHref = safeHttpsUrl(href); return safeHref ? <a href={safeHref} target="_blank" rel="noreferrer noopener" className="inline-flex items-baseline gap-1"><Image src={faviconUrl(safeHref)} alt="" width={14} height={14} unoptimized className="inline size-3.5 shrink-0 self-center" />{label}</a> : <span>{label}</span>; },
        img: ({ src, alt }) => { const safeSrc = safeHttpsUrl(typeof src === "string" ? src : undefined); return safeSrc ? <a href={safeSrc} target="_blank" rel="noreferrer noopener" className="my-3 block overflow-hidden border border-white/10 bg-black/10"><Image src={safeSrc} alt={alt || "Search image"} width={960} height={640} unoptimized className="max-h-[32rem] w-full object-contain" /></a> : null; },
      }}>{children}</ReactMarkdown>
    </div>
  );
}
