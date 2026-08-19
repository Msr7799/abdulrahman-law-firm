import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { FAQ } from "@/components/faq";
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
      <PageHero
        eyebrow={ar ? "معلومات عامة" : "General information"}
        title={ar ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
      />
      <section className="py-20">
        <div className="container-site">
          <FAQ locale={locale} />
        </div>
      </section>
    </main>
  );
}
