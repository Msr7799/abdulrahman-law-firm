import { NextResponse } from "next/server";
import { bearerToken, verifyFirebaseAdminToken } from "@/lib/firebase/server-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await verifyFirebaseAdminToken(bearerToken(request));
  if (!admin) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, admin });
}
