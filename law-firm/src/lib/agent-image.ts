import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

function signingKey() {
  return process.env.GEMINI_API_KEY || process.env.TAVILY_API_KEY || "";
}

function signature(value: string) {
  return createHmac("sha256", signingKey()).update(value).digest("base64url");
}

export function signedAgentImagePath(url: string, id?: string) {
  const cacheId = id ? `id=${encodeURIComponent(id)}&` : "";
  return `/api/admin/agent-image?${cacheId}url=${encodeURIComponent(url)}&sig=${signature(url)}`;
}

export function verifyAgentImageSignature(url: string, supplied: string) {
  if (!signingKey() || !supplied) return false;
  const expected = Buffer.from(signature(url));
  const actual = Buffer.from(supplied);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
