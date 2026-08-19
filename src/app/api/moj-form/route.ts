import { officialFormUrls } from "@/data/government-forms";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const sourceUrl = officialFormUrls[id];

  if (!sourceUrl) {
    return Response.json({ error: "Unknown Ministry of Justice form" }, { status: 404 });
  }

  let pdf: ArrayBuffer | undefined;
  let upstreamHeaders: Headers | undefined;

  for (let attempt = 0; attempt < 2 && !pdf; attempt += 1) {
    try {
      const upstream = await fetch(sourceUrl, {
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
        headers: {
          accept: "application/pdf",
          "user-agent": "Mozilla/5.0 (compatible; AbdulrahmanAlmawdahLawOffice/1.0)",
        },
      });
      const contentType = upstream.headers.get("content-type") ?? "";
      if (!upstream.ok || !contentType.toLowerCase().includes("application/pdf")) continue;
      pdf = await upstream.arrayBuffer();
      upstreamHeaders = upstream.headers;
    } catch {
      // A second request handles transient upstream/serverless connection errors.
    }
  }

  if (!pdf || !upstreamHeaders) {
    return Response.json({ error: "Unable to load the official form" }, { status: 502 });
  }

  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${id}.pdf"`,
    "Content-Length": String(pdf.byteLength),
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    "X-Content-Type-Options": "nosniff",
  });

  for (const name of ["etag", "last-modified"]) {
    const value = upstreamHeaders.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(pdf, { status: 200, headers });
}
