export type MinistryFormCategory =
  | "realEstate"
  | "execution"
  | "accounts"
  | "notary"
  | "minors"
  | "sharia"
  | "marriage"
  | "courts";

export type MinistryForm = {
  id: string;
  category: MinistryFormCategory;
  titleAr: string;
  titleEn: string;
  size?: string;
  kind?: "form" | "guide" | "checklist";
};

export const ministryFormCategories: Record<
  MinistryFormCategory,
  { ar: string; en: string }
> = {
  realEstate: { ar: "لجنة تسوية مشاريع التطوير العقارية", en: "Real Estate Development Projects Settlement Committee" },
  execution: { ar: "استمارات التنفيذ", en: "Execution forms" },
  accounts: { ar: "قسم الحسابات", en: "Accounts forms" },
  notary: { ar: "استمارات التوثيق", en: "Notarisation forms" },
  minors: { ar: "شؤون وأموال القاصرين", en: "Minors Affairs and Funds" },
  sharia: { ar: "المحاكم الشرعية", en: "Sharia courts" },
  marriage: { ar: "الزواج والتوثيقات الشرعية", en: "Marriage and Sharia documentation" },
  courts: { ar: "المحاكم والدعاوى", en: "Courts and claims" },
};

export const ministryForms: MinistryForm[] = [
  { id: "real-estate-claim", category: "realEstate", titleAr: "استمارة تقديم مطالبة في المشاريع المتعثرة", titleEn: "Claim in a stalled real-estate project", size: "206 KB" },

  { id: "execution-notice", category: "execution", titleAr: "إخطار المنفذ ضده بالوفاء بمحل السند التنفيذي", titleEn: "Notice to the enforcement debtor to satisfy the instrument", size: "436 KB" },
  { id: "private-enforcer-authorisation", category: "execution", titleAr: "استمارة تخويل المنفذ الخاص", titleEn: "Private enforcement officer authorisation", size: "156 KB" },
  { id: "company-disclosure", category: "execution", titleAr: "استمارة إفصاح للشركات التجارية", titleEn: "Commercial company disclosure", size: "372 KB" },
  { id: "entity-disclosure", category: "execution", titleAr: "استمارة إفصاح للمؤسسات الفردية والأشخاص الاعتبارية من غير الشركات التجارية", titleEn: "Sole establishment and non-company legal person disclosure", size: "366 KB" },
  { id: "individual-disclosure", category: "execution", titleAr: "استمارة إفصاح الأفراد", titleEn: "Individual disclosure", size: "502 KB" },

  { id: "iban-ar", category: "accounts", titleAr: "استمارة التحويلات البنكية (IBAN) — عربي", titleEn: "Transfer to bank account form (IBAN) — Arabic", size: "217 KB" },
  { id: "iban-en", category: "accounts", titleAr: "استمارة التحويلات البنكية (IBAN) — إنجليزي", titleEn: "Transfer to bank account form (IBAN) — English", size: "179 KB" },

  { id: "kyc-standard", category: "notary", titleAr: "اعرف عميلك للعناية الواجبة المبسطة والعادية", titleEn: "Know Your Customer — simplified and standard due diligence", size: "216 KB" },
  { id: "kyc-enhanced", category: "notary", titleAr: "اعرف عميلك للعناية الواجبة المعززة", titleEn: "Know Your Customer — enhanced due diligence", size: "312 KB" },

  { id: "estate-file", category: "minors", titleAr: "استمارة فتح ملف تركة", titleEn: "Estate file opening form", size: "316 KB" },
  { id: "estate-file-steps", category: "minors", titleAr: "خطوات فتح ملف في شؤون وأموال القاصرين", titleEn: "Steps to open a Minors Affairs and Funds file", size: "3.05 MB", kind: "guide" },
  { id: "minors-services-guide", category: "minors", titleAr: "دليل المستخدم لخدمات إدارة أموال القاصرين الإلكترونية", titleEn: "User guide for electronic Minors Funds services", size: "4.32 MB", kind: "guide" },
  { id: "minors-release", category: "minors", titleAr: "إقرار إخلاء مسؤولية إدارة أموال القاصرين", titleEn: "Minors Funds Administration release declaration", size: "247 KB" },
  { id: "minors-update", category: "minors", titleAr: "استمارة تحديث البيانات المعدلة", titleEn: "Updated-data form", size: "305 KB" },
  { id: "zakat-request", category: "minors", titleAr: "استمارة طلب إخراج الزكاة", titleEn: "Zakat payment request", size: "291 KB" },
  { id: "medical-report-request", category: "minors", titleAr: "استمارة طلب تقرير اللجان الطبية", titleEn: "Medical committee report request", size: "262 KB" },

  { id: "inheritance-heirs", category: "sharia", titleAr: "استمارة طلب فريضة شرعية (حصر الورثة)", titleEn: "Sharia inheritance request (identification of heirs)", size: "96 KB" },
  { id: "inheritance-merger", category: "sharia", titleAr: "استمارة طلب مناسخة شرعية (دمج الفرائض والوثائق الشرعية)", titleEn: "Sharia succession consolidation request", size: "612 KB" },
  { id: "gift-deed", category: "sharia", titleAr: "استمارة طلب توثيق هبة", titleEn: "Gift deed request", size: "196 KB" },
  { id: "waiver-deed", category: "sharia", titleAr: "استمارة طلب توثيق تنازل", titleEn: "Waiver deed request", size: "328 KB" },
  { id: "will-deed", category: "sharia", titleAr: "استمارة طلب توثيق وصية", titleEn: "Will deed request", size: "471 KB" },
  { id: "waqf-deed", category: "sharia", titleAr: "استمارة طلب توثيق وقف", titleEn: "Endowment (Waqf) deed request", size: "147 KB" },
  { id: "sharia-copy", category: "sharia", titleAr: "استمارة طلب صورة شرعية", titleEn: "Sharia document copy request", size: "247 KB" },
  { id: "missing-deed-replacement", category: "sharia", titleAr: "استمارة طلب بدل فاقد لوثيقة شرعية", titleEn: "Replacement for a lost Sharia document", size: "1.46 MB" },

  { id: "marriage-sunni", category: "marriage", titleAr: "استمارة بيانات عقد الزواج — المذهب السني", titleEn: "Marriage contract details — Sunni", size: "151 KB" },
  { id: "marriage-jaafari", category: "marriage", titleAr: "استمارة بيانات عقد الزواج — المذهب الجعفري", titleEn: "Marriage contract details — Jaafari", size: "299 KB" },
  { id: "marriage-outside-bahrain", category: "marriage", titleAr: "طلب التصديق على عقد زواج صادر من خارج مملكة البحرين", titleEn: "Attestation of a marriage contract issued outside Bahrain", size: "186 KB" },
  { id: "divorce-certificate", category: "marriage", titleAr: "استمارة طلب شهادة طلاق", titleEn: "Divorce certificate request", size: "220 KB" },
  { id: "marital-status", category: "marriage", titleAr: "استمارة طلب شهادة الحالة الزوجية", titleEn: "Marital status certificate request", size: "136 KB" },

  { id: "case-registration", category: "courts", titleAr: "استمارة بيانات المتقاضين", titleEn: "Litigants information form", size: "190 KB" },
  { id: "administrative-claim", category: "courts", titleAr: "قائمة المستندات الواجب استيفاؤها عند تسجيل دعوى إدارية", titleEn: "Administrative claim filing checklist", size: "97.7 KB", kind: "checklist" },
  { id: "civil-claim", category: "courts", titleAr: "قائمة المستندات الواجب استيفاؤها عند تسجيل دعوى مدنية", titleEn: "Civil claim filing checklist", size: "182 KB", kind: "checklist" },
  { id: "rental-claim", category: "courts", titleAr: "دعوى إيجارية — قائمة المستندات الواجب استيفاؤها", titleEn: "Rental claim filing checklist", size: "194 KB", kind: "checklist" },
  { id: "creditor-bankruptcy", category: "courts", titleAr: "دعوى الدائن لافتتاح إجراءات الإفلاس — المستندات", titleEn: "Creditor petition to commence bankruptcy — documents", size: "170 KB", kind: "checklist" },
  { id: "debtor-bankruptcy", category: "courts", titleAr: "دعوى المدين لافتتاح إجراءات الإفلاس", titleEn: "Debtor petition to commence bankruptcy", size: "183 KB" },
  { id: "foreign-judgment", category: "courts", titleAr: "دعوى تنفيذ حكم أجنبي أو حكم تحكيم والطعن عليه", titleEn: "Enforcement or challenge of a foreign judgment or arbitral award", size: "206 KB" },
  { id: "property-separation", category: "courts", titleAr: "طلب فرز عقار — قائمة المستندات", titleEn: "Property partition request — document checklist", size: "190 KB", kind: "checklist" },
  { id: "lost-property-document", category: "courts", titleAr: "بدل فاقد لوثيقة عقارية — قائمة المستندات", titleEn: "Replacement of a lost property deed — checklist", size: "182 KB", kind: "checklist" },
  { id: "non-muslim-personal-status", category: "courts", titleAr: "أحوال شخصية لغير المسلمين — قائمة المستندات", titleEn: "Non-Muslim personal status claim — checklist", size: "182 KB", kind: "checklist" },
  { id: "appeal-cassation", category: "courts", titleAr: "تقرير بالطعن أمام محكمة التمييز", titleEn: "Court of Cassation appeal report", size: "114 KB" },
];

export type JudicialService = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  href: string;
  logo: string;
};

const portal = "https://services.bahrain.bh/wps/portal/";

export const judicialServices: JudicialService[] = [
  { id: "unified-payment", titleAr: "خدمات الدفع الموحد للمستحقات", titleEn: "Unified dues payment", descriptionAr: "دفع المبالغ المستحقة للخدمات العدلية.", descriptionEn: "Pay amounts due for justice services.", href: `${portal}MOJUnifiedPayment_ar`, logo: "https://www.moj.gov.bh/images/icons/alimony.png" },
  { id: "court-cases", titleAr: "خدمات الدعاوى القضائية", titleEn: "Court case services", descriptionAr: "خدمات الدعاوى المدنية والشرعية والجنائية.", descriptionEn: "Civil, Sharia and criminal case services.", href: `${portal}!ut/p/a1/jc9RC8IgFAXgn-TROWeP6mBuK2SEtHwJn2JQKyKin5_tPdt9u_Ad7rkkkJGEOb6mc3xOtzlevnsQJykbQ5lkHTSVGMAbpYWg6HgCxwRKyYztE3AFL6F4P2jvbAGHdXnTKMurLQAuGdpa27ra7IBWrMvjx6i_9_fxQQ4kLCz3xQJyNReQ6XG_ej--2-kDwLVi3g!!/dl5/d5/L2dBISEvZ0FBIS9nQSEh/`, logo: "https://www.moj.gov.bh/images/icons/court.png" },
  { id: "execution", titleAr: "خدمات التنفيذ", titleEn: "Enforcement services", descriptionAr: "فتح ملفات التنفيذ وتقديم الطلبات ودفع المبالغ المستحقة.", descriptionEn: "Open enforcement files, submit requests and pay dues.", href: `${portal}!ut/p/a1/jc_BDoIwEATQT-rQFliPpSitaAgxIPRiejIkisYY4-eLvYvsbZM32VnmWMfc6F_D2T-H2-gv390lJ6JCR5z4lmy9htq0kVYkgFZMoJ9ATFybcgKVkDGULOusqYxAhWV5XSgj0x0ASRw2z0yervaATZbl8WPU3_sH_2BH5gKb-yKAuZoBzPS4X5ume9vhA8DGQg8!/dl5/d5/L2dBISEvZ0FBIS9nQSEh/`, logo: "https://www.moj.gov.bh/images/icons/execution.png" },
  { id: "travel-ban", titleAr: "خدمات المنع من السفر", titleEn: "Travel-ban services", descriptionAr: "الاستعلام عن أحكام المنع من السفر ودفع المبالغ المستحقة.", descriptionEn: "Check travel-ban judgments and pay amounts due.", href: `${portal}!ut/p/a1/jZBBb4JAEIV_iweOsuOywNrbiqmgtsQ0pLiXZiErYJA1yxb680VuJi11bjP53ps3gzhKEW9EVxXCVKoR9b3n3helm2CBKd7G5P0VWLLEsQu-A8QbgOMAuBQH4e4OOMQFRnaHVRKHDsTwnD7YsJD4ewAgFEO0XoVrf_kGEHnP6eGPYv_u_xAafSI-YlNXjMBUzBGYyLFFvKhVNv70yJrMoQXiWp6kltr-1sO4NObavlhgQd_39kWd7UJ1dlZaILQFspa50aqp8nkrdVflsv3NqVStQemjAbpekiT9ic5u3e0Zm81uRqj72A!!/dl5/d5/L2dBISEvZ0FBIS9nQSEh/`, logo: "https://www.moj.gov.bh/images/icons/services/travel-ban-new.png" },
  { id: "criminal-orders", titleAr: "دفع الأوامر الجنائية", titleEn: "Criminal order payment", descriptionAr: "دفع الأوامر الجنائية إلكترونيًا.", descriptionEn: "Pay criminal orders online.", href: `${portal}!ut/p/a1/jZDNboMwEISfJQeOxcuPidubIVIgAaGqQSW-VAY5QERwZFzo45dwq5TQ7G1X38zOLmIoR6zjQ1Nx3ciOt7eeeV-EbAPLJvYuPRx8oJ4fJxjHFkmsCThOACZ2EO5vgONioO7-3c_S0IEUntMHWxq66xgAXGJDtPHDzfo1AYi85_TwoOi_-z-4Qp-IzdjSFTOwFHMGFnLsEKtaWcw_PdKucEiFmBInoYQyv9U0rrW-9m8GGDCOo3mRZ7OSg1nUBnBlgGhFqZXsmvKlF2poStHfc6plr1H-1wBdL1mW_0Rn3A4xpavVLxLO8UQ!/dl5/d5/L2dBISEvZ0FBIS9nQSEh/`, logo: "https://www.moj.gov.bh/images/icons/electronic-transactions.png" },
  { id: "licences", titleAr: "خدمات التراخيص والوكالات", titleEn: "Licences and powers of attorney", descriptionAr: "طلبات الوكالات والتخويلات ورخص المهنيين القانونيين.", descriptionEn: "Powers of attorney, authorisations and legal-professional licences.", href: `${portal}!ut/p/a1/jc_BDoIwEATQT-rQFliPpSitaAgxKPZiejJNFI0xxs8XexfZ2yZvsrPMsZ65wb_C2T_DbfCX7-6yE1GlE058TbZdQq32iVYkgFSO4DiClLg29QgaIVMoWbdF1xiBBvPyulJG5hsAkjhsWZgyX2wBm83L48eov_d3_sEOzEU29UUEUzUjmOhxv3Zd_7bhA2ZC13o!/dl5/d5/L2dBISEvZ0FBIS9nQSEh/`, logo: "https://www.moj.gov.bh/images/icons/private-notray.png" },
  { id: "notices", titleAr: "خدمات التبليغات والإعلانات بالنشر", titleEn: "Notifications and publication notices", descriptionAr: "خدمات الإعلانات والتبليغات القضائية.", descriptionEn: "Judicial notices and publication services.", href: `${portal}!ut/p/a1/jc_BDoIwEATQT-rQFliPpSitaAgxKPZiejIkisYY4-dbexfZ2yZvsrPMsZ650b-Gs38Ot9FfvrvLTkSVTjjxNdl2CbXaJ1qRADIewDGAlLg2dQCNkCmUrNuia4xAg3l5XSkj8w0ASRy2LEyZL7aAzebl8WPU3_s7_2AH5iKb-iKCqZoRTPS4X7uuf9vhA86uvfw!/dl5/d5/L2dBISEvZ0FBIS9nQSEh/`, logo: "https://www.moj.gov.bh/images/icons/services/megaphone-icon.png" },
  { id: "minors", titleAr: "خدمات إدارة شؤون وأموال القاصرين", titleEn: "Minors Affairs and Funds services", descriptionAr: "تقديم الطلبات والمعاملات ومتابعتها وإدارة ملفات التركات.", descriptionEn: "Submit and track transactions and estate files.", href: `${portal}!ut/p/a1/jc9RC8IgFAXgn-SZummPzsG0NSRCWr6ETyHUiojo57f53tp9u_Ad7rkkkIGEMb7TJb7SfYzXeQ_VWcpWF1TSreuEgOqpFmCsgC0mcJpAKak23QwYL6F4t6-9MwwO6_K6VYaLHQAuKWxTm0ZsesBW6_L4Merv_UN8kiMJmS19kcFSzQwWejxu3g8fm77SWUef/dl5/d5/L2dBISEvZ0FBIS9nQSEh/`, logo: "https://www.moj.gov.bh/images/icons/minors-funds.png" },
];
