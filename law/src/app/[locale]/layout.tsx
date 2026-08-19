import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { MobileActions } from "@/components/layout/mobile-actions";
import { Navbar } from "@/components/layout/navbar";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { isLocale, locales, siteConfig } from "@/config/site";
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ar = locale === "ar";
  return {
    metadataBase: new URL(siteConfig.siteUrl),
    title: {
      default: ar
        ? "المحامي عبدالرحمن المعاودة | محامٍ ومستشار قانوني في البحرين"
        : "Abdulrahman Almawdah | Lawyer & Legal Consultant in Bahrain",
      template: `%s | ${siteConfig.shortName[locale]}`,
    },
    description: ar
      ? "خدمات واستشارات قانونية باحترافية وخصوصية في مملكة البحرين."
      : "Professional legal consultation in the Kingdom of Bahrain.",
    alternates: {
      canonical: `/${locale}`,
      languages: { ar: "/ar", en: "/en" },
    },
    openGraph: {
      type: "website",
      locale: ar ? "ar_BH" : "en_BH",
      siteName: siteConfig.name[locale],
    },
    robots: { index: true, follow: true },
  };
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(locale)};document.documentElement.dir=${JSON.stringify(locale === "ar" ? "rtl" : "ltr")}`,
        }}
      />
      <a
        href="#main"
        className="focus-ring fixed start-4 top-2 z-[100] -translate-y-20 bg-white p-3 focus:translate-y-0"
      >
        {locale === "ar" ? "تجاوز إلى المحتوى" : "Skip to content"}
      </a>
      <Navbar locale={locale} />
      {children}
      <Footer locale={locale} />
      <WhatsAppButton locale={locale} />
      <MobileActions locale={locale} />
    </div>
  );
}
