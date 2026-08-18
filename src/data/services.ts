import type { Locale } from "@/config/site";

// These four services are taken from the office's supplied promotional material.
export const services = [
  {
    icon: "consultation",
    ar: "الاستشارات القانونية",
    en: "Legal Consultation",
  },
  { icon: "notary", ar: "جميع خدمات التوثيق", en: "Documentation Services" },
  { icon: "companies", ar: "تأسيس الشركات", en: "Company Formation" },
  { icon: "execution", ar: "التنفيذ الخاص", en: "Private Execution" },
] as const;

export const serviceLabel = (
  service: (typeof services)[number],
  locale: Locale,
) => service[locale];
