import { officialFormUrls } from "@/data/government-forms";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const sourceUrl = officialFormUrls[id];

  if (!sourceUrl) {
    return Response.json({ error: "Unknown Ministry of Justice form" }, { status: 404 });
  }

  const range = request.headers.get("range");
  const upstream = await fetch(sourceUrl, {
    cache: "no-store",
    headers: {
      accept: "application/pdf",
      "user-agent": "Mozilla/5.0 (compatible; AbdulrahmanAlmawdahLawOffice/1.0)",
      ...(range ? { range } : {}),
    },
  });

  if (!upstream.ok && upstream.status !== 206) {
    return Response.json({ error: "Unable to load the official form" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/pdf")) {
    return Response.json({ error: "The official source did not return a PDF" }, { status: 502 });
  }

  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${id}.pdf"`,
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    "X-Content-Type-Options": "nosniff",
  });

  for (const name of ["accept-ranges", "content-length", "content-range", "etag", "last-modified"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
