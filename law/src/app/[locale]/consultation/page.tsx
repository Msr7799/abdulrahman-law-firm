import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/forms/booking-form";
import { PageHero } from "@/components/ui/page-hero";
import { isLocale } from "@/config/site";
export const metadata: Metadata = { title: "Consultation" };
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  return (
    <main id="main">
      <PageHero
        eyebrow={ar ? "طلب موعد" : "Appointment request"}
        title={ar ? "احجز استشارتك" : "Book a Consultation"}
        text={
          ar
            ? "اختر الموعد المفضل وأرسل معلومات أولية مختصرة. سيتواصل المكتب معك لتأكيد الموعد والتفاصيل."
            : "Choose a preferred time and provide brief initial information. The office will contact you to confirm the appointment."
        }
      />
      <section className="py-16 sm:py-24">
        <div className="container-site max-w-4xl">
          <BookingForm locale={locale} />
          <p className="mt-5 text-center text-xs text-[#657073]">
            {ar
              ? "بعد تسجيل الطلب، تُرسل التفاصيل إلى واتساب المكتب تلقائياً عند تفعيل ربط Meta؛ وإلا سيظهر لك زر إرسال جاهز لإتمام الخطوة بنفسك."
              : "After submission, details are sent automatically when the Meta integration is enabled; otherwise, a ready-to-send WhatsApp button completes the step."}
          </p>
        </div>
      </section>
    </main>
  );
}
