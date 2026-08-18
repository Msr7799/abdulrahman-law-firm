export const siteConfig = {
  name: {
    ar: "المحامي عبدالرحمن عبدالله المعاودة",
    en: "Abdulrahman Almawdah",
  },
  shortName: { ar: "عبدالرحمن المعاودة", en: "Abdulrahman Almawdah" },
  title: { ar: "محامٍ وموثق خاص", en: "Lawyer & Private Notary" },
  country: { ar: "مملكة البحرين", en: "Kingdom of Bahrain" },
  address: {
    ar: "برج الرميص، مبنى 283، طريق 1704، مجمع 317، الطابق 17، مكتب 171، المنطقة الدبلوماسية",
    en: "Al Rossais Tower, Building 283, Road 1704, Block 317, 17th floor, Office 171, Diplomatic Area",
  },
  contact: {
    phone: "+97335599559",
    whatsapp: "https://wa.me/97335599559",
    email: null as string | null,
    instagram: "https://www.instagram.com/ar599559/",
    instagramUsername: "ar599559",
    googleMaps: "https://maps.app.goo.gl/y86wWcgerDczwYiN9",
    googleMapsEmbed:
      "https://www.openstreetmap.org/export/embed.html?bbox=50.5811862%2C26.2349807%2C50.5931862%2C26.2469807&layer=mapnik&marker=26.2409807%2C50.5871862",
  },
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export type Locale = "ar" | "en";
export const locales: Locale[] = ["ar", "en"];
export const isLocale = (value: string): value is Locale =>
  locales.includes(value as Locale);
