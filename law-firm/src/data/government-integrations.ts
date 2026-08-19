export type IntegrationStatus = "available" | "official-link" | "requires-onboarding" | "research";

export type GovernmentIntegration = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  providerAr: string;
  providerEn: string;
  status: IntegrationStatus;
  href: string;
  useAr: string[];
  useEn: string[];
};

export const governmentIntegrations: GovernmentIntegration[] = [
  {
    id: "moj-services",
    titleAr: "خدمات وزارة العدل الإلكترونية",
    titleEn: "Ministry of Justice eServices",
    descriptionAr: "بوابة الخدمات الرسمية للدعاوى والتنفيذ والتراخيص والتوكيلات وغيرها. التعامل الحالي كرابط رسمي موثّق، وليس API عاماً.",
    descriptionEn: "Official portal for cases, enforcement, licences, powers of attorney and more. Treat as a verified official link, not a public API.",
    providerAr: "وزارة العدل والشؤون الإسلامية والأوقاف",
    providerEn: "Ministry of Justice, Islamic Affairs and Waqf",
    status: "official-link",
    href: "https://www.moj.gov.bh/en/ministry-services/eservices",
    useAr: ["روابط مباشرة للخدمات", "فهرسة النماذج الرسمية", "عدم ادعاء مزامنة القضايا بدون اتفاق تكامل رسمي"],
    useEn: ["Direct service links", "Official form indexing", "No case-sync claims without an approved integration"],
  },
  {
    id: "bahrain-open-data",
    titleAr: "بوابة البيانات المفتوحة",
    titleEn: "Bahrain Open Data Portal",
    descriptionAr: "مصدر حكومي للبيانات المفتوحة يدعم الوصول البرمجي ويمكن الاستفادة منه في الإحصاءات والبحث والمراجع العامة.",
    descriptionEn: "Government open-data source with programmatic access for statistics, research and public-reference datasets.",
    providerAr: "هيئة المعلومات والحكومة الإلكترونية",
    providerEn: "Information & eGovernment Authority",
    status: "available",
    href: "https://www.data.gov.bh/",
    useAr: ["إثراء لوحات المعلومات", "مصادر موثقة للوكيل القانوني", "تغذية تقارير غير سرية"],
    useEn: ["Dashboard enrichment", "Verified sources for the legal agent", "Non-confidential reporting datasets"],
  },
  {
    id: "ekey-government-api",
    titleAr: "الهوية الإلكترونية والتكامل الحكومي",
    titleEn: "eKey & government integration",
    descriptionAr: "الاستراتيجية الحكومية تتضمن APIs وأدوات للمطورين تشمل المصادقة ومنصة الدفع، لكن التكامل المؤسسي يحتاج تنسيقاً واعتماداً رسمياً قبل تنفيذه.",
    descriptionEn: "Government strategy includes APIs/toolkits covering authentication and payment, but institutional integration requires official coordination and approval.",
    providerAr: "هيئة المعلومات والحكومة الإلكترونية",
    providerEn: "Information & eGovernment Authority",
    status: "requires-onboarding",
    href: "https://www.iga.gov.bh/en/category/contact",
    useAr: ["استكشاف تسجيل الدخول عبر الهوية الإلكترونية", "طلب وثائق التكامل والبيئة التجريبية", "تحديد متطلبات حماية البيانات"],
    useEn: ["Explore eKey sign-in", "Request integration docs and sandbox access", "Confirm data-protection requirements"],
  },
  {
    id: "tawasul",
    titleAr: "نظام تواصل",
    titleEn: "Tawasul",
    descriptionAr: "القناة الحكومية الرسمية لتقديم الاستفسارات والمقترحات والشكاوى للجهات الحكومية، ومناسبة لطلبات التكامل أو الاستفسار عن الخدمة.",
    descriptionEn: "Official channel for enquiries, suggestions and complaints to government entities, useful for integration and service enquiries.",
    providerAr: "حكومة مملكة البحرين",
    providerEn: "Government of Bahrain",
    status: "official-link",
    href: "https://services.bahrain.bh/wps/portal/tawasul/Home_en",
    useAr: ["طلب جهة الاتصال التقنية", "الاستفسار عن API رسمي", "توثيق الطلبات الحكومية"],
    useEn: ["Request technical contact", "Ask about official API access", "Document government enquiries"],
  },
  {
    id: "benefit-gateway",
    titleAr: "بوابة BENEFIT للدفع",
    titleEn: "BENEFIT Payment Gateway",
    descriptionAr: "بوابة رسمية لمعالجة المدفوعات الإلكترونية ببطاقات الخصم المحلية، وتتطلب حساب تاجر وربطاً تقنياً معتمداً.",
    descriptionEn: "Official gateway for online transactions using locally issued debit cards; requires merchant onboarding and approved technical integration.",
    providerAr: "BENEFIT",
    providerEn: "BENEFIT",
    status: "requires-onboarding",
    href: "https://benefit.bh/business/payment-gateway/",
    useAr: ["دفع أتعاب المحاماة", "مرجع دفع فريد لكل فاتورة", "تأكيد الدفع عبر callback/webhook حسب مواصفات المزود"],
    useEn: ["Legal-fee payments", "Unique payment reference per invoice", "Payment confirmation via provider callback/webhook specification"],
  },
  {
    id: "benefitpay-merchant",
    titleAr: "BenefitPay للتجار",
    titleEn: "BenefitPay for merchants",
    descriptionAr: "خيار مناسب للدفع عبر QR من تطبيق BenefitPay بعد تسجيل المكتب كتاجر. لا ينبغي اختراع deep link قبل الحصول على صيغة رسمية من BENEFIT.",
    descriptionEn: "Suitable for QR payments from BenefitPay after merchant registration. Do not invent an app deep link before BENEFIT provides an official format.",
    providerAr: "BENEFIT",
    providerEn: "BENEFIT",
    status: "requires-onboarding",
    href: "https://benefit.bh/business/benefitpay-business/",
    useAr: ["QR دفع داخل المكتب", "QR على صفحة الفاتورة", "مطابقة المرجع مع إيصال الدفع"],
    useEn: ["In-office payment QR", "Invoice-page QR", "Reconcile payment reference with receipt"],
  },
  {
    id: "fawateer",
    titleAr: "فواتير Fawateer",
    titleEn: "Fawateer",
    descriptionAr: "منصة البحرين الوطنية لعرض ودفع الفواتير. مناسبة مستقبلاً إذا أراد المكتب نموذج biller وتسوية ومطابقة مركزية للفواتير.",
    descriptionEn: "Bahrain's national bill presentment and payment platform. Suitable later for biller-style invoicing and centralized reconciliation.",
    providerAr: "BENEFIT",
    providerEn: "BENEFIT",
    status: "requires-onboarding",
    href: "https://benefit.bh/business/fawateer/",
    useAr: ["فوترة منظمة", "تسوية ومطابقة", "إمكانية استكشاف الخصم المباشر"],
    useEn: ["Structured billing", "Settlement and reconciliation", "Explore direct-debit capabilities"],
  },
];
