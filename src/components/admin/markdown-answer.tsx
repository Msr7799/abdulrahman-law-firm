"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownAnswer({ children }: { children: string }) {
  return (
    <div className="admin-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        a: ({ href, children: label }) => <a href={href} target="_blank" rel="noreferrer noopener">{label}</a>,
        img: () => null,
      }}>{children}</ReactMarkdown>
    </div>
  );
}
