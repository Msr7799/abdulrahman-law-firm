import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import sharp from "sharp";
import { verifyAgentImageSignature } from "@/lib/agent-image";

export const runtime = "nodejs";

function privateAddress(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
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

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const source = requestUrl.searchParams.get("url") ?? "";
    const suppliedSignature = requestUrl.searchParams.get("sig") ?? "";
    if (!verifyAgentImageSignature(source, suppliedSignature)) return new Response("Unauthorized", { status: 401 });
    const imageUrl = await publicImageUrl(source);
    const response = await fetch(imageUrl, {
      redirect: "error",
      headers: { accept: "image/avif,image/webp,image/png,image/jpeg,image/*", "user-agent": "Mozilla/5.0 (compatible; BahrainLegalResearch/1.0)" },
      signal: AbortSignal.timeout(12_000),
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.startsWith("image/")) return new Response("Image unavailable", { status: 502 });
    const input = Buffer.from(await response.arrayBuffer());
    if (input.byteLength > 12 * 1024 * 1024) return new Response("Image too large", { status: 413 });
    const output = await sharp(input).rotate().resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
    return new Response(output, { headers: { "content-type": "image/webp", "cache-control": "public, max-age=86400, stale-while-revalidate=604800", "x-content-type-options": "nosniff" } });
  } catch {
    return new Response("Image unavailable", { status: 502 });
  }
}
