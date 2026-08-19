import { ArrowLeft, ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Hero } from "@/components/home/hero";
import { ServicesGrid } from "@/components/home/services-grid";
import { ServicesVisuals } from "@/components/home/services-visuals";
import { MinistryJusticeBanner } from "@/components/home/ministry-justice-banner";
import { BahrainFeature } from "@/components/home/bahrain-feature";
import { OfficeCard } from "@/components/office/office-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { FAQ } from "@/components/faq";
import { InstagramHoverCard } from "@/components/social/instagram-hover-card";
import { isLocale, siteConfig } from "@/config/site";
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar",
    Arrow = ar ? ArrowLeft : ArrowRight;
  return (
    <main id="main">
      <Hero locale={locale} />
      <section className="reveal-section py-24">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#e4ded1]">
              <Image
                src="/assets/images/profile/abdulrahman-almawdah.png"
                alt={siteConfig.name[locale]}
                fill
                sizes="(min-width: 1024px) 448px, 90vw"
                className="object-cover object-top transition-transform duration-700 hover:scale-[1.025]"
              />
              <div className="absolute inset-5 border border-[#b89555]/55" />
            </div>
            <div className="absolute -bottom-3 -start-2 grid size-16 place-items-center bg-[#fffdf8] p-2 shadow-xl sm:-bottom-5 sm:-start-5 sm:size-20 sm:p-3">
              <Image
                src="/assets/brand/logo-icon.svg"
                alt=""
                width={56}
                height={62}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div>
            <SectionHeading
              eyebrow={ar ? "نبذة مهنية" : "Professional profile"}
              title={siteConfig.name[locale]}
              text={
                ar
                  ? "تواصل مباشر للحصول على معلومات حول الخدمات القانونية ومدى ملاءمتها لموضوعك، مع الالتزام بالوضوح والخصوصية في مرحلة التواصل الأولي."
                  : "Get in touch to discuss available legal services and their suitability for your matter, with clarity and discretion from the first contact."
              }
            />
            <p className="font-semibold text-[#9a783f]">
              {siteConfig.title[locale]}
            </p>
            <p className="mt-2 text-sm text-[#657073]">
              {siteConfig.country[locale]}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <InstagramHoverCard locale={locale} />
              <ButtonLink
                href={siteConfig.contact.googleMaps}
                variant="light"
                external
              >
                <MapPin size={17} />
                {ar ? "الموقع" : "Location"}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
      <BahrainFeature locale={locale} />
      <section className="reveal-section bg-[#ece7dc] py-24">
        <div className="container-site">
          <div className="mb-16 -mx-4 sm:mx-0">
            <MinistryJusticeBanner locale={locale} variant="home" />
          </div>
          <SectionHeading
            eyebrow={ar ? "مجالات الخدمة" : "Practice areas"}
            title={ar ? "الخدمات القانونية" : "Legal Services"}
            text={
              ar
                ? "خدمات قانونية قابلة للتخصيص بحسب طبيعة كل موضوع. تُعرض الفئات أدناه بصورة عامة ولا تمثل ادعاءً بتخصص معتمد."
                : "Configurable legal services considered according to each matter. These categories are general and do not claim certified specialisation."
            }
          />
          <ServicesVisuals locale={locale} />
          <ServicesGrid locale={locale} />
          <div className="mt-10">
            <ButtonLink href={`/${locale}/services`} variant="light">
              {ar ? "عرض جميع الخدمات" : "View all services"}
              <Arrow size={17} />
            </ButtonLink>
          </div>
        </div>
      </section>
      <section className="reveal-section bg-[#132b32] py-20 text-white">
        <div className="container-site grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <ShieldCheck className="mb-5 text-[#c8a766]" />
            <h2 className="display text-3xl sm:text-4xl">
              {ar
                ? "اطلب استشارة بخصوصية ووضوح"
                : "Request a consultation with clarity"}
            </h2>
            <p className="mt-4 max-w-2xl leading-8 text-white/65">
              {ar
                ? "أرسل معلومات أولية مختصرة واختر الموعد المناسب. سيتواصل المكتب معك لتأكيد الموعد والتفاصيل."
                : "Share brief initial information and your preferred time. The office will contact you to confirm the appointment and details."}
            </p>
          </div>
          <ButtonLink href={`/${locale}/consultation`}>
            {ar ? "ابدأ طلب الاستشارة" : "Start your request"}
            <Arrow size={17} />
          </ButtonLink>
        </div>
      </section>
      <section className="reveal-section py-24">
        <div className="container-site">
          <SectionHeading
            eyebrow={ar ? "الوصول إلى المكتب" : "Visit the office"}
            title={ar ? "موقع المكتب وساعات العمل" : "Office location & hours"}
          />
          <OfficeCard locale={locale} />
        </div>
      </section>
      <section className="border-t border-[#ded8cc] py-24">
        <div className="container-site">
          <SectionHeading
            center
            eyebrow={ar ? "معلومات مهمة" : "Helpful information"}
            title={ar ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          />
          <FAQ locale={locale} limit={4} />
        </div>
      </section>
    </main>
  );
}
