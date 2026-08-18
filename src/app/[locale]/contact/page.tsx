import { AtSign, MapPin, MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { OfficeCard } from "@/components/office/office-card";
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
        eyebrow={ar ? "قنوات موثقة" : "Verified channels"}
        title={ar ? "تواصل معنا" : "Contact"}
        text={
          ar
            ? "استخدم القنوات المدرجة أدناه أو أرسل طلب استشارة عبر النموذج."
            : "Use the verified channels below or submit a consultation request."
        }
      />
      <section className="py-20">
        <div className="container-site">
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <a
              href={siteConfig.contact.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="card focus-ring flex items-center gap-5 p-7"
            >
              <MessageCircle className="text-[#25a85a]" />
              <div className="min-w-0">
                <strong className="block">WhatsApp</strong>
                <span className="text-sm text-[#657073]" dir="ltr">
                  {siteConfig.contact.phone}
                </span>
              </div>
            </a>
            <a
              href={siteConfig.contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="card focus-ring flex items-center gap-5 p-7"
            >
              <AtSign className="text-[#9a783f]" />
              <div className="min-w-0">
                <strong className="block">Instagram</strong>
                <span className="text-sm text-[#657073]">
                  @{siteConfig.contact.instagramUsername}
                </span>
              </div>
            </a>
            <a
              href={siteConfig.contact.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="card focus-ring flex items-center gap-5 p-7"
            >
              <MapPin className="text-[#9a783f]" />
              <div className="min-w-0">
                <strong className="block">
                  {ar ? "خرائط Google" : "Google Maps"}
                </strong>
                <span className="text-sm text-[#657073]">
                  {siteConfig.country[locale]}
                </span>
              </div>
            </a>
          </div>
          <OfficeCard locale={locale} />
        </div>
      </section>
    </main>
  );
}
