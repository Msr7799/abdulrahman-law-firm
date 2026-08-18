import { AtSign, MapPin } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { ButtonLink } from "@/components/ui/button-link";
import { isLocale, siteConfig } from "@/config/site";
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
        eyebrow={ar ? "الملف المهني" : "Professional profile"}
        title={siteConfig.name[locale]}
        text={`${siteConfig.title[locale]} · ${siteConfig.country[locale]}`}
      />
      <section className="py-20">
        <div className="container-site grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div className="relative aspect-[4/3] overflow-hidden bg-[#e4ded1]">
            <Image
              src="/assets/images/professional/oath-ceremony-enhanced.webp"
              alt={ar ? "صورة من مناسبة مهنية رسمية" : "A formal professional occasion"}
              fill
              priority
              sizes="(min-width: 1024px) 600px, 90vw"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="display text-3xl">{ar ? "عن المحامي" : "About"}</h2>
            <p className="mt-6 leading-8 text-[#657073]">
              {ar
                ? "تقدم هذه الصفحة المعلومات المهنية الموثقة والمتاحة حاليًا. لم تتم إضافة مؤهلات أو سنوات خبرة أو نتائج قضايا غير مؤكدة. يمكن تحديث النبذة بسهولة عند توفير المحتوى المعتمد من صاحب المكتب."
                : "This page presents only the professional information currently verified. No unconfirmed qualifications, experience claims, or case outcomes have been added. The profile can be updated when owner-approved content is supplied."}
            </p>
            <p className="mt-5 leading-8 text-[#657073]">
              {ar
                ? "ممارسة قانونية تنطلق من الوضوح، احترام الخصوصية، والعناية بتفاصيل كل موضوع."
                : "A legal practice grounded in clarity, discretion, and careful attention to every matter."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink
                href={siteConfig.contact.instagram}
                external
                variant="light"
              >
                <AtSign size={17} />
                Instagram
              </ButtonLink>
              <ButtonLink
                href={siteConfig.contact.googleMaps}
                external
                variant="light"
              >
                <MapPin size={17} />
                {ar ? "موقع المكتب" : "Office location"}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
