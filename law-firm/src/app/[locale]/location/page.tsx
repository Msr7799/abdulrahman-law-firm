import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { OfficeCard } from "@/components/office/office-card";
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
        eyebrow={ar ? "الوصول" : "Directions"}
        title={ar ? "موقع المكتب" : "Office Location"}
      />
      <section className="py-20">
        <div className="container-site">
          <OfficeCard locale={locale} />
        </div>
      </section>
    </main>
  );
}
