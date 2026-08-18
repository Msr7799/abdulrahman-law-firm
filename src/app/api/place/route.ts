import { NextResponse } from "next/server";
import { getBusinessPlace } from "@/lib/google-places";
export const revalidate = 3600;
export async function GET() {
  const place = await getBusinessPlace();
  return NextResponse.json(
    { success: true, place, source: place ? "google" : "configured-fallback" },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
