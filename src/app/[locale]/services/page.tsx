import { notFound } from "next/navigation";
import { ServicesGrid } from "@/components/home/services-grid";
import { ServicesVisuals } from "@/components/home/services-visuals";
import { MinistryJusticeBanner } from "@/components/home/ministry-justice-banner";
import { ButtonLink } from "@/components/ui/button-link";
import { isLocale } from "@/config/site";
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
      <MinistryJusticeBanner locale={locale} />
      <section className="py-20">
        <div className="container-site">
          <ServicesVisuals locale={locale} />
          <ServicesGrid locale={locale} />
          <div className="mt-14 bg-[#132b32] p-8 text-white sm:p-12">
            <h2 className="display text-3xl">
              {ar
                ? "هل ترغب في مناقشة موضوعك؟"
                : "Would you like to discuss your matter?"}
            </h2>
            <p className="mt-4 mb-7 max-w-2xl text-white/65">
              {ar
                ? "أرسل طلب استشارة أوليًا دون إدراج تفاصيل شديدة السرية."
                : "Send an initial consultation request without including highly confidential details."}
            </p>
            <ButtonLink href={`/${locale}/consultation`}>
              {ar ? "حجز استشارة" : "Book a Consultation"}
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
