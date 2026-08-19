import { NextRequest, NextResponse } from "next/server";
import {
  consultationSchema,
  type ConsultationInput,
} from "@/lib/consultation-schema";
import { sanitizeText } from "@/lib/utils";

export const runtime = "nodejs";

const attempts = new Map<string, { count: number; reset: number }>();
const lawyerWhatsApp = (
  process.env.WHATSAPP_NOTIFICATION_TO || "97335599559"
).replace(/\D/g, "");

function consultationType(
  type: ConsultationInput["type"],
  locale: ConsultationInput["locale"],
) {
  const labels = {
    ar: { office: "في المكتب", phone: "هاتفية", remote: "عن بُعد" },
    en: { office: "In office", phone: "By phone", remote: "Remote" },
  } as const;
  return labels[locale][type];
}

function notificationMessage(data: ConsultationInput, reference: string) {
  if (data.locale === "ar") {
    return [
      "طلب استشارة جديد من الموقع",
      `المرجع: ${reference}`,
      `الاسم: ${data.name}`,
      `رقم العميل: ${data.phone}`,
      `التاريخ: ${data.date}`,
      `الوقت: ${data.time}`,
      `النوع: ${consultationType(data.type, data.locale)}`,
      `الموضوع: ${data.subject}`,
      "يرجى التواصل مع العميل لتأكيد الموعد.",
    ].join("\n");
  }
  return [
    "New consultation request from the website",
    `Reference: ${reference}`,
    `Name: ${data.name}`,
    `Client phone: ${data.phone}`,
    `Date: ${data.date}`,
    `Time: ${data.time}`,
    `Type: ${consultationType(data.type, data.locale)}`,
    `Subject: ${data.subject}`,
    "Please contact the client to confirm the appointment.",
  ].join("\n");
}

async function sendWhatsAppNotification(message: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) return false;

  try {
    const version = process.env.WHATSAPP_GRAPH_API_VERSION || "v23.0";
    const response = await fetch(
      `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: lawyerWhatsApp,
          type: "text",
          text: { preview_url: false, body: message },
        }),
        cache: "no-store",
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json(
      { success: false, message: "Invalid request origin." },
      { status: 403 },
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && entry.reset > now && entry.count >= 5) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }
  attempts.set(
    ip,
    !entry || entry.reset <= now
      ? { count: 1, reset: now + 15 * 60_000 }
      : { ...entry, count: entry.count + 1 },
  );

  try {
    const parsed = consultationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check the submitted information.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    if (parsed.data.website) {
      return NextResponse.json({
        success: true,
        reference: "CONS-RECEIVED",
        whatsappUrl: "",
        notificationSent: false,
      });
    }

    const clean: ConsultationInput = {
      ...parsed.data,
      name: sanitizeText(parsed.data.name),
      subject: sanitizeText(parsed.data.subject),
      description: sanitizeText(parsed.data.description),
    };
    const reference = `CONS-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const message = notificationMessage(clean, reference);
    const notificationSent = await sendWhatsAppNotification(message);
    const whatsappUrl = `https://wa.me/${lawyerWhatsApp}?text=${encodeURIComponent(message)}`;

    return NextResponse.json(
      {
        success: true,
        reference,
        notificationSent,
        whatsappUrl,
        message:
          clean.locale === "ar"
            ? "تم تسجيل الطلب، ويحتاج الموعد إلى تأكيد المكتب."
            : "Request recorded. The appointment requires office confirmation.",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to process the request." },
      { status: 500 },
    );
  }
}
