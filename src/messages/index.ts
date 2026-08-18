import type { Locale } from "@/config/site";

const ar = {
  nav: {
    home: "الرئيسية",
    about: "عن المحامي",
    services: "الخدمات",
    consultation: "حجز استشارة",
    contact: "تواصل معنا",
    faq: "الأسئلة الشائعة",
  },
  hero: {
    eyebrow: "خدمات قانونية في مملكة البحرين",
    title: "المحامي عبدالرحمن عبدالله المعاودة",
    text: "خدمات واستشارات قانونية تُقدَّم باحترافية وخصوصية، مع اهتمام واضح بطبيعة كل موضوع ومتطلباته.",
    book: "حجز استشارة",
    location: "موقع المكتب",
    services: "تعرّف على الخدمات",
  },
  common: {
    country: "مملكة البحرين",
    title: "محامٍ ومستشار قانوني",
    readMore: "اعرف المزيد",
    open: "مفتوح الآن",
    closed: "مغلق الآن",
    hours: "ساعات العمل",
    maps: "فتح في خرائط Google",
    instagram: "إنستغرام",
    note: "المعلومات الواردة في الموقع عامة ولا تُعد استشارة قانونية.",
  },
};
const en = {
  nav: {
    home: "Home",
    about: "About",
    services: "Services",
    consultation: "Book a Consultation",
    contact: "Contact",
    faq: "FAQ",
  },
  hero: {
    eyebrow: "Legal services in the Kingdom of Bahrain",
    title: "Abdulrahman Almawdah",
    text: "Professional legal consultation delivered with discretion, clarity, and careful attention to each matter.",
    book: "Book a Consultation",
    location: "Office Location",
    services: "Explore Services",
  },
  common: {
    country: "Kingdom of Bahrain",
    title: "Lawyer & Legal Consultant",
    readMore: "Learn more",
    open: "Open now",
    closed: "Closed now",
    hours: "Business hours",
    maps: "Open in Google Maps",
    instagram: "Instagram",
    note: "Website content is general information and does not constitute legal advice.",
  },
};
export const getMessages = (locale: Locale) => (locale === "ar" ? ar : en);
