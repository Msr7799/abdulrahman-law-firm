import "server-only";
import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import sharp from "sharp";

type CachedImage = { buffer: Buffer; expiresAt: number };
type AgentImageCacheGlobal = typeof globalThis & { __agentImageCache?: Map<string, CachedImage> };

const cache = (globalThis as AgentImageCacheGlobal).__agentImageCache ?? new Map<string, CachedImage>();
(globalThis as AgentImageCacheGlobal).__agentImageCache = cache;

function privateAddress(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || /^fe[89ab]/.test(normalized)) return true;
  const ipv4 = normalized.startsWith("::ffff:") ? normalized.slice(7) : normalized;
  if (isIP(ipv4) !== 4) return false;
  const [a, b] = ipv4.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
}

async function publicImageUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("INVALID_URL");
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((item) => privateAddress(item.address))) throw new Error("PRIVATE_ADDRESS");
  return url;
}

async function fetchCandidate(start: URL) {
  let current = start;
  for (let redirect = 0; redirect < 5; redirect += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      headers: {
        accept: "image/avif,image/webp,image/png,image/jpeg,image/*",
        "accept-language": "ar-BH,ar;q=0.9,en;q=0.7",
        referer: `${current.origin}/`,
        "sec-fetch-dest": "image",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136 Safari/537.36",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("INVALID_REDIRECT");
      current = await publicImageUrl(new URL(location, current).toString());
      continue;
    }
    return response;
  }
  throw new Error("TOO_MANY_REDIRECTS");
}

function pruneCache() {
  const now = Date.now();
  for (const [id, item] of cache) if (item.expiresAt <= now) cache.delete(id);
  while (cache.size > 100) cache.delete(cache.keys().next().value!);
}

export async function cacheRemoteAgentImage(source: string) {
  const id = createHash("sha256").update(source).digest("base64url").slice(0, 24);
  const existing = cache.get(id);
  if (existing && existing.expiresAt > Date.now()) return { id, bytes: existing.buffer.byteLength };
  const url = await publicImageUrl(source);
  const response = await fetchCandidate(url);
  if (!response.ok) throw new Error(`IMAGE_HTTP_${response.status}`);
  const input = Buffer.from(await response.arrayBuffer());
  if (input.byteLength < 2_000 || input.byteLength > 12 * 1024 * 1024) throw new Error("INVALID_IMAGE_SIZE");
  const pipeline = sharp(input, { failOn: "error", limitInputPixels: 40_000_000 }).rotate();
  const metadata = await pipeline.metadata();
  if ((metadata.width ?? 0) < 96 || (metadata.height ?? 0) < 72) throw new Error("IMAGE_TOO_SMALL");
  const buffer = await pipeline.resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
  pruneCache();
  cache.set(id, { buffer, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  return { id, bytes: buffer.byteLength };
}

export function getCachedAgentImage(id: string) {
  const item = cache.get(id);
  if (!item || item.expiresAt <= Date.now()) { cache.delete(id); return null; }
  return item.buffer;
}
