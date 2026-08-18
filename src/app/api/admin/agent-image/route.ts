import { signedAgentImagePath, verifyAgentImageSignature } from "@/lib/agent-image";
import { cacheRemoteAgentImage, getCachedAgentImage } from "@/lib/agent-image-cache";
import { bearerToken, verifyFirebaseAdminToken } from "@/lib/firebase/server-auth";

export const runtime = "nodejs";

function responseBody(buffer: Buffer) {
  return Uint8Array.from(buffer).buffer;
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const requestedId = requestUrl.searchParams.get("id") ?? "";
    const cached = requestedId ? getCachedAgentImage(requestedId) : null;
    if (cached) return new Response(responseBody(cached), { headers: { "content-type": "image/webp", "cache-control": "public, max-age=86400, stale-while-revalidate=604800", "x-content-type-options": "nosniff" } });
    const source = requestUrl.searchParams.get("url") ?? "";
    const suppliedSignature = requestUrl.searchParams.get("sig") ?? "";
    if (!verifyAgentImageSignature(source, suppliedSignature)) return new Response("Unauthorized", { status: 401 });
    const prepared = await cacheRemoteAgentImage(source);
    const output = getCachedAgentImage(prepared.id);
    if (!output) throw new Error("CACHE_MISS");
    return new Response(responseBody(output), { headers: { "content-type": "image/webp", "cache-control": "public, max-age=86400, stale-while-revalidate=604800", "x-content-type-options": "nosniff" } });
  } catch {
    return new Response("Image unavailable", { status: 502 });
  }
}


export async function POST(request: Request) {
  const admin = await verifyFirebaseAdminToken(bearerToken(request));
  if (!admin) return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { urls?: unknown } | null;
  const urls = Array.isArray(body?.urls) ? body.urls.filter((item): item is string => typeof item === "string" && item.startsWith("https://")).slice(0, 10) : [];
  const images = (await Promise.all(urls.map(async (url) => {
    try { const prepared = await cacheRemoteAgentImage(url); return { url, displayUrl: signedAgentImagePath(url, prepared.id) }; }
    catch { return null; }
  }))).filter((item): item is { url: string; displayUrl: string } => Boolean(item));
  return Response.json({ ok: true, images });
}
