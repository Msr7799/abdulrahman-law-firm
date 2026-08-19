export type MinistryFormCategory =
  | "realEstate"
  | "execution"
  | "accounts"
  | "notary"
  | "minors"
  | "sharia"
  | "marriage"
  | "courts"
  | "criminal"
  | "experts"
  | "registrar"
  | "compliance";

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
  criminal: { ar: "المحاكم الجنائية", en: "Criminal courts" },
  experts: { ar: "استمارات الخبرة", en: "Expert forms" },
  registrar: { ar: "مكتب المسجل العام", en: "General Registrar Office" },
  compliance: { ar: "وحدة المتابعة والالتزام", en: "Monitoring and Compliance Unit" },
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

  { id: "umra-deed", category: "sharia", titleAr: "استمارة طلب عُمْرَى شرعية (هبة حق السكن في العقار)", titleEn: "Sharia Umra deed request", size: "471 KB" },
  { id: "marriage-man-sunni", category: "marriage", titleAr: "استمارة تصريح بالزواج في الخارج للرجل (سنية)", titleEn: "Permission for a man to marry abroad — Sunni", size: "125 KB" },
  { id: "marriage-man-jaafari", category: "marriage", titleAr: "استمارة تصريح بالزواج في الخارج للرجل (جعفرية)", titleEn: "Permission for a man to marry abroad — Jaafari", size: "186 KB" },
  { id: "marriage-woman-sunni", category: "marriage", titleAr: "استمارة تصريح بالزواج في الخارج للمرأة (سنية)", titleEn: "Permission for a woman to marry abroad — Sunni", size: "106 KB" },
  { id: "marriage-woman-jaafari", category: "marriage", titleAr: "استمارة تصريح بالزواج في الخارج للمرأة (جعفرية)", titleEn: "Permission for a woman to marry abroad — Jaafari", size: "146 KB" },
  { id: "divorce-proof-jaafari", category: "marriage", titleAr: "استمارة شهادة إثبات الطلاق (جعفرية)", titleEn: "Divorce proof certificate — Jaafari", size: "220 KB" },
  { id: "new-divorce-sunni", category: "marriage", titleAr: "استمارة طلب إصدار وثيقة طلاق جديدة (سنية)", titleEn: "New divorce document — Sunni", size: "66 KB" },
  { id: "new-divorce-jaafari", category: "marriage", titleAr: "استمارة طلب إصدار وثيقة طلاق جديدة (جعفرية)", titleEn: "New divorce document — Jaafari", size: "84 KB" },
  { id: "lost-contract-sunni", category: "marriage", titleAr: "استمارة طلب وثيقة عقد بدل فاقد (سنية)", titleEn: "Replacement contract document — Sunni", size: "73 KB" },
  { id: "lost-contract-jaafari", category: "marriage", titleAr: "استمارة طلب وثيقة عقد بدل فاقد (جعفرية)", titleEn: "Replacement contract document — Jaafari", size: "88 KB" },
  { id: "foreign-divorce-sunni", category: "marriage", titleAr: "استمارة معادلة طلاق من الخارج (سنية)", titleEn: "Foreign divorce equivalency — Sunni", size: "62 KB" },
  { id: "foreign-divorce-jaafari", category: "marriage", titleAr: "استمارة معادلة طلاق من الخارج (جعفرية)", titleEn: "Foreign divorce equivalency — Jaafari", size: "97 KB" },
  { id: "widowhood-sunni", category: "marriage", titleAr: "استمارة شهادة إثبات الترمل ووفاة الزوجة (سنية)", titleEn: "Widowhood and spouse death certificate — Sunni", size: "136 KB" },
  { id: "widowhood-jaafari", category: "marriage", titleAr: "استمارة شهادة إثبات الترمل ووفاة الزوجة (جعفرية)", titleEn: "Widowhood and spouse death certificate — Jaafari", size: "136 KB" },
  { id: "marriage-proof-jaafari", category: "marriage", titleAr: "استمارة شهادة إثبات الزواج فقط (جعفرية)", titleEn: "Marriage proof certificate — Jaafari", size: "173 KB" },
  { id: "non-bahraini-marriage-jaafari", category: "marriage", titleAr: "استمارة طلب إجراء عقد زواج لغير البحرينيين (جعفرية)", titleEn: "Marriage contract for non-Bahrainis — Jaafari", size: "218 KB" },
  { id: "return-proof-sunni", category: "marriage", titleAr: "استمارة طلب إصدار وثيقة إثبات رجعة (سنية)", titleEn: "Reconciliation proof document — Sunni", size: "140 KB" },
  { id: "return-proof-jaafari", category: "marriage", titleAr: "استمارة طلب إصدار وثيقة إثبات رجعة (جعفرية)", titleEn: "Reconciliation proof document — Jaafari", size: "214 KB" },
  { id: "lost-divorce-sunni", category: "marriage", titleAr: "استمارة طلب وثيقة طلاق بدل فاقد (سنية)", titleEn: "Replacement divorce document — Sunni", size: "86 KB" },
  { id: "lost-divorce-jaafari", category: "marriage", titleAr: "استمارة طلب وثيقة طلاق بدل فاقد (جعفرية)", titleEn: "Replacement divorce document — Jaafari", size: "138 KB" },
  { id: "foreign-marriage-sunni", category: "marriage", titleAr: "استمارة معادلة نكاح من الخارج (سنية)", titleEn: "Foreign marriage equivalency — Sunni", size: "157 KB" },
  { id: "foreign-marriage-jaafari", category: "marriage", titleAr: "استمارة معادلة نكاح من الخارج (جعفرية)", titleEn: "Foreign marriage equivalency — Jaafari", size: "157 KB" },
  { id: "marriage-copy-sunni", category: "marriage", titleAr: "طبق الأصل (سنية)", titleEn: "Certified copy — Sunni", size: "129 KB" },
  { id: "marriage-copy-jaafari", category: "marriage", titleAr: "طبق الأصل (جعفرية)", titleEn: "Certified copy — Jaafari", size: "266 KB" },

  { id: "presence-judgment", category: "criminal", titleAr: "إعلان حكم حضور اعتباري", titleEn: "Constructive presence judgment notice", size: "146 KB" },
  { id: "default-judgment", category: "criminal", titleAr: "إعلان الحكم الغيابي", titleEn: "Default judgment notice", size: "142 KB" },
  { id: "criminal-order", category: "criminal", titleAr: "إعلان بالأمر الجنائي", titleEn: "Criminal order notice", size: "142 KB" },
  { id: "penalty-execution-request", category: "criminal", titleAr: "استمارة طلب لقاضي تنفيذ العقاب", titleEn: "Penalties enforcement judge request", size: "200 KB" },
  { id: "criminal-appeal", category: "criminal", titleAr: "التقرير بالاستئناف / المعارضة", titleEn: "Criminal appeal / objection report", size: "198 KB" },
  { id: "criminal-unified-request", category: "criminal", titleAr: "النموذج الموحد لطلبات المحاكم الجنائية", titleEn: "Unified criminal court request", size: "164 KB" },
  { id: "archive-grievance", category: "criminal", titleAr: "لائحة التظلم من حفظ الأوراق", titleEn: "Grievance against archiving papers", size: "242 KB" },
  { id: "fees-assessment", category: "criminal", titleAr: "استمارة تقدير أتعاب", titleEn: "Fees assessment form", size: "171 KB" },

  { id: "expert-contract", category: "experts", titleAr: "نموذج عقد تقديم الخبرة", titleEn: "Expert service contract", size: "185 KB" },
  { id: "expert-impartiality", category: "experts", titleAr: "استمارة التحقق من الحيدة ونزاهة الخبير", titleEn: "Expert impartiality and integrity check", size: "124 KB" },

  { id: "bailiff-licence", category: "registrar", titleAr: "طلب ترخيص بمزاولة أعمال المنفذ الخاص", titleEn: "Private bailiff licence application", size: "222 KB" },
  { id: "private-notary-licence", category: "registrar", titleAr: "طلب ترخيص لمزاولة أعمال الموثق الخاص", titleEn: "Private notary licence application", size: "117 KB" },
  { id: "circular-update", category: "registrar", titleAr: "تعميم الوزير رقم 4 لسنة 2019 — تحديث البيانات", titleEn: "Ministerial Circular 4/2019 — data update", size: "135 KB" },
  { id: "lawyer-validity", category: "registrar", titleAr: "استمارة صلاحية للمحامين", titleEn: "Lawyer eligibility form", size: "263 KB" },
  { id: "lawyer-registration", category: "registrar", titleAr: "استمارة قيد المحامين", titleEn: "Lawyer registration", size: "172 KB" },
  { id: "civil-mediator-person", category: "registrar", titleAr: "طلب قيد الوساطة في المنازعات المدنية والتجارية للأشخاص الطبيعيين", titleEn: "Civil and commercial mediator registration — natural person", size: "189 KB" },
  { id: "criminal-mediators", category: "registrar", titleAr: "استمارة قيد الوسطاء — المسائل الجنائية", titleEn: "Criminal mediator registration", size: "387 KB" },
  { id: "company-mediators", category: "registrar", titleAr: "طلب قيد الوساطة للأشخاص الاعتبارية", titleEn: "Mediator registration — legal person", size: "209 KB" },
  { id: "sharia-mediator-person", category: "registrar", titleAr: "طلب قيد الوسطاء في المسائل الشرعية — شخص طبيعي", titleEn: "Sharia mediator — natural person", size: "177 KB" },
  { id: "sharia-mediator-company", category: "registrar", titleAr: "طلب قيد الوسطاء في المسائل الشرعية — شخص اعتباري", titleEn: "Sharia mediator — legal person", size: "184 KB" },
  { id: "trustee-person", category: "registrar", titleAr: "طلب القيد بجداول خبراء أمناء التفليسة — شخص طبيعي", titleEn: "Bankruptcy trustee expert — natural person", size: "184 KB" },
  { id: "trustee-company", category: "registrar", titleAr: "طلب القيد بجداول خبراء أمناء التفليسة — شخص اعتباري", titleEn: "Bankruptcy trustee expert — legal person", size: "190 KB" },
  { id: "arbitrator-registration", category: "registrar", titleAr: "استمارة طلب القيد في جدول المحكمين", titleEn: "Arbitrator register application", size: "114 KB" },
  { id: "arbitrator-cases", category: "registrar", titleAr: "نموذج قضايا المحكمين", titleEn: "Arbitrator cases sample", size: "62.7 KB" },

  { id: "unlisted-client-report", category: "compliance", titleAr: "تقرير إخطار وحدة المتابعة عن العملاء غير المدرجين على القوائم", titleEn: "Report on clients not included on lists", size: "169 KB" },
  { id: "suspicious-report", category: "compliance", titleAr: "تقرير الإبلاغ عن العمليات المشبوهة أو غير العادية", titleEn: "Suspicious or unusual transaction report", size: "178 KB" },
  { id: "listed-client-report", category: "compliance", titleAr: "تقرير الإبلاغ عن العميل المدرج على القوائم", titleEn: "Listed client report", size: "215 KB" },
  { id: "follow-up-form", category: "compliance", titleAr: "نموذج متابعة", titleEn: "Follow-up form", kind: "form" },
  { id: "compliance-officer", category: "compliance", titleAr: "استمارة تعيين مسؤول التزام", titleEn: "Compliance officer appointment", size: "220 KB" },
  { id: "law-office-update", category: "compliance", titleAr: "استمارة تحديث مكاتب المحامين", titleEn: "Law office update", size: "138 KB" },
  { id: "disclosure-a", category: "compliance", titleAr: "استمارة الإفصاح — العناية الواجبة العادية (أ)", titleEn: "Disclosure — standard due diligence (A)", size: "193 KB" },
  { id: "disclosure-b", category: "compliance", titleAr: "استمارة الإفصاح — العناية الواجبة المعززة (ب)", titleEn: "Disclosure — enhanced due diligence (B)", size: "204 KB" },
  { id: "bank-approval", category: "compliance", titleAr: "استمارة اعتماد حساب مصرفي", titleEn: "Bank account approval", size: "168 KB" },

  { id: "property-ownership", category: "courts", titleAr: "إثبات ملكية — قائمة المستندات", titleEn: "Proof of ownership — checklist", size: "188 KB", kind: "checklist" },
  { id: "equipment-rental", category: "courts", titleAr: "تأجير معدات وسيارات — قائمة المستندات", titleEn: "Equipment and vehicle rental — checklist", size: "192 KB", kind: "checklist" },
  { id: "appoint-arbitrator", category: "courts", titleAr: "تعيين محكم — قائمة المستندات", titleEn: "Appoint an arbitrator — checklist", size: "190 KB", kind: "checklist" },
  { id: "utilities-claim", category: "courts", titleAr: "اتصالات وكهرباء — قائمة مستندات تسجيل الدعوى", titleEn: "Telecom and electricity claim — checklist", size: "183 KB", kind: "checklist" },
  { id: "surname-addition", category: "courts", titleAr: "إضافة لقب — قائمة مستندات تسجيل الدعوى", titleEn: "Surname addition — checklist", size: "189 KB", kind: "checklist" },
  { id: "social-insurance", category: "courts", titleAr: "تأمينات اجتماعية — قائمة مستندات تسجيل الدعوى", titleEn: "Social insurance claim — checklist", size: "190 KB", kind: "checklist" },
  { id: "injury-compensation", category: "courts", titleAr: "تعويض عن إصابات — قائمة المستندات", titleEn: "Injury compensation — checklist", size: "190 KB", kind: "checklist" },
  { id: "death-compensation", category: "courts", titleAr: "تعويض عن وفاة — قائمة المستندات", titleEn: "Death compensation — checklist", size: "189 KB", kind: "checklist" },
  { id: "inheritance-claim", category: "courts", titleAr: "دعوى تركة — قائمة المستندات", titleEn: "Inheritance claim — checklist", size: "189 KB", kind: "checklist" },
  { id: "birth-certificate-claim", category: "courts", titleAr: "شهادة ميلاد — قائمة المستندات", titleEn: "Birth certificate claim — checklist", size: "189 KB", kind: "checklist" },
  { id: "supply-contract-claim", category: "courts", titleAr: "عقد توريد — قائمة المستندات", titleEn: "Supply contract claim — checklist", size: "191 KB", kind: "checklist" },
  { id: "loan-contract-claim", category: "courts", titleAr: "عقد قرض — قائمة المستندات", titleEn: "Loan contract claim — checklist", size: "191 KB", kind: "checklist" },
];

/** Official Ministry of Justice source files. Kept separate so the URLs can be
 * allow-listed by the PDF proxy without ever accepting an arbitrary remote URL. */
export const officialFormUrls: Record<string, string> = {
  "real-estate-claim": "https://www.moj.gov.bh/images/pdf/form/SCFSRE_Claim_Form.pdf",
  "execution-notice": "https://www.moj.gov.bh/images/pdf/Notify-the-executor-against-him.pdf",
  "private-enforcer-authorisation": "https://www.moj.gov.bh/images/pdf/executor_against_him.pdf",
  "company-disclosure": "https://www.moj.gov.bh/images/pdf/disclosure-company.pdf",
  "entity-disclosure": "https://www.moj.gov.bh/images/pdf/disclosure-individual-org.pdf",
  "individual-disclosure": "https://www.moj.gov.bh/images/pdf/disclosure-individual.pdf",
  "iban-ar": "https://www.moj.gov.bh/images/pdf/transfer_to_bank_account_form_AR.pdf",
  "iban-en": "https://www.moj.gov.bh/images/pdf/Transfer_to_bank_account_form_EN.pdf",
  "kyc-standard": "https://www.moj.gov.bh/images/pdf/know_your_agent_form_normal.pdf",
  "kyc-enhanced": "https://www.moj.gov.bh/images/pdf/know_your_agent_form_normal2.pdf",
  "estate-file": "https://www.moj.gov.bh/images/pdf/open_file_tareeka.pdf",
  "estate-file-steps": "https://www.moj.gov.bh/images/pdf/form/Steps_to_open_a_file_on_the_affairs_and_funds_of_minors.pdf",
  "minors-services-guide": "https://www.moj.gov.bh/images/pdf/user_guide_line.pdf",
  "minors-release": "https://www.moj.gov.bh/images/pdf/Acknowledgment_of_the_release_of_liability.pdf",
  "minors-update": "https://www.moj.gov.bh/images/pdf/Modified_data_update_form.pdf",
  "zakat-request": "https://www.moj.gov.bh/images/pdf/form/Zakat_payment_form.pdf",
  "medical-report-request": "https://www.moj.gov.bh/images/pdf/form/Medical_committee_report_request_form.pdf",
  "inheritance-heirs": "https://www.moj.gov.bh/images/pdf/form/how_to_apply_for_shareeya1pdf.pdf",
  "inheritance-merger": "https://www.moj.gov.bh/images/pdf/form/order_FATETHA2.pdf",
  "gift-deed": "https://www.moj.gov.bh/images/pdf/form/Legal_Donation_Form.pdf",
  "waiver-deed": "https://www.moj.gov.bh/images/pdf/form/202107_Application_form_gift_assignment.pdf",
  "will-deed": "https://www.moj.gov.bh/images/pdf/form/Duplicate_application_form.pdf",
  "waqf-deed": "https://www.moj.gov.bh/images/pdf/form/20231231_WAQF.pdf",
  "sharia-copy": "https://www.moj.gov.bh/images/pdf/form/202105_Duplicate_application_form.pdf",
  "missing-deed-replacement": "https://www.moj.gov.bh/images/pdf/form/202105_Duplicate_application_form.pdf",
  "marriage-sunni": "https://www.moj.gov.bh/images/pdf/marrige_form_outside_suneya4.pdf",
  "marriage-jaafari": "https://www.moj.gov.bh/images/pdf/marrige_form_outside_jaffery5.pdf",
  "marriage-outside-bahrain": "https://www.moj.gov.bh/images/pdf/form_marriage_non-Bahrainis_suney_22.pdf",
  "divorce-certificate": "https://www.moj.gov.bh/images/pdf/prove_devorce_suney_10.pdf",
  "marital-status": "https://www.moj.gov.bh/images/pdf/A_proof_of_marriage_certificate_form_only_suney_20.pdf",
  "case-registration": "https://www.moj.gov.bh/images/pdf/Litigants_data_form.pdf",
  "administrative-claim": "https://www.moj.gov.bh/images/pdf/List_of_doc_to_regist_admin_cases.pdf",
  "civil-claim": "https://www.moj.gov.bh/images/pdf/List_of_doc_when_regist_civil_case.pdf",
  "rental-claim": "https://www.moj.gov.bh/images/pdf/Rental_lawsuit_list_of_doc.pdf",
  "creditor-bankruptcy": "https://www.moj.gov.bh/images/pdf/creadt.pdf",
  "debtor-bankruptcy": "https://www.moj.gov.bh/images/pdf/debtor_lawsuit_to_open_bankr.pdf",
  "foreign-judgment": "https://www.moj.gov.bh/images/pdf/Arbitr_and_Appeal_against_it.pdf",
  "property-separation": "https://www.moj.gov.bh/images/pdf/Req_for_sort_the_real_estate_list_of_doc.pdf",
  "lost-property-document": "https://www.moj.gov.bh/images/pdf/Replacement_of_lost_owner_dawa.pdf",
  "non-muslim-personal-status": "https://www.moj.gov.bh/images/pdf/Personal__non-Muslims_-_List_of_doc.pdf",
  "appeal-cassation": "https://www.moj.gov.bh/images/pdf/report_taaen_tameez.pdf",
  "umra-deed": "https://www.moj.gov.bh/images/pdf/form/order_watheeqa_sharyea3.pdf",
  "marriage-man-sunni": "https://www.moj.gov.bh/images/pdf/permission_marrage_out_side_bh_man_suneya6.pdf",
  "marriage-man-jaafari": "https://www.moj.gov.bh/images/pdf/permission_marrage_out_side_bh_man_jaffery7.pdf",
  "marriage-woman-sunni": "https://www.moj.gov.bh/images/pdf/permission_marrage_out_side_bh_women_suneya8.pdf",
  "marriage-woman-jaafari": "https://www.moj.gov.bh/images/pdf/permission_marrage_out_side_bh_women_suneya9.pdf",
  "divorce-proof-jaafari": "https://www.moj.gov.bh/images/pdf/prove_devorce_jaffary_11.pdf",
  "new-divorce-sunni": "https://www.moj.gov.bh/images/pdf/order_new_devorce_suney_12.pdf",
  "new-divorce-jaafari": "https://www.moj.gov.bh/images/pdf/order_new_devorce_jaffery_13.pdf",
  "lost-contract-sunni": "https://www.moj.gov.bh/images/pdf/new_for_lost_one_suney_14.pdf",
  "lost-contract-jaafari": "https://www.moj.gov.bh/images/pdf/new_for_lost_one_jaffey_15.pdf",
  "foreign-divorce-sunni": "https://www.moj.gov.bh/images/pdf/devorce_paper_out_of_bh_suney_16.pdf",
  "foreign-divorce-jaafari": "https://www.moj.gov.bh/images/pdf/devorce_paper_out_of_bh_jaffry_17.pdf",
  "widowhood-sunni": "https://www.moj.gov.bh/images/pdf/form_for_proof_of_widowhood_and_death.pdf",
  "widowhood-jaafari": "https://www.moj.gov.bh/images/pdf/form_for_proof_of_widowhood_and_death.pdf",
  "marriage-proof-jaafari": "https://www.moj.gov.bh/images/pdf/A_proof_of_marriage_certificate_form_only_jaffry_21.pdf",
  "non-bahraini-marriage-jaafari": "https://www.moj.gov.bh/images/pdf/Application_form_to_conduct_a_marriage_contract_for_non-Bahrainis_jaffry_23.pdf",
  "return-proof-sunni": "https://www.moj.gov.bh/images/pdf/Application_form_for_the_issuance_of_a_returnable_proof_suney_24.pdf",
  "return-proof-jaafari": "https://www.moj.gov.bh/images/pdf/Application_form_for_the_issuance_of_a_returnable_proof_jaffry_25.pdf",
  "lost-divorce-sunni": "https://www.moj.gov.bh/images/pdf/Divorce_document_application_form_for_a_lost_replacement_suney_26.pdf",
  "lost-divorce-jaafari": "https://www.moj.gov.bh/images/pdf/Divorce_document_application_form_for_a_lost__replacement_jaffry_27.pdf",
  "foreign-marriage-sunni": "https://www.moj.gov.bh/images/pdf/A_marriage_equivalency_form_from_abroad_suney_28.pdf",
  "foreign-marriage-jaafari": "https://www.moj.gov.bh/images/pdf/A_marriage_equivalency_form_from_abroad_jaffry_29.pdf",
  "marriage-copy-sunni": "https://www.moj.gov.bh/images/pdf/Replica_suney_30.pdf",
  "marriage-copy-jaafari": "https://www.moj.gov.bh/images/pdf/Replica_jaffry_31.pdf",
  "presence-judgment": "https://www.moj.gov.bh/images/pdf/Announcement_of_a_legal_presence_judgment.pdf",
  "default-judgment": "https://www.moj.gov.bh/images/pdf/Announcement_of_default_judgment.pdf",
  "criminal-order": "https://www.moj.gov.bh/images/pdf/Declaration_of_criminal_order.pdf",
  "penalty-execution-request": "https://www.moj.gov.bh/images/pdf/judge_list.pdf",
  "criminal-appeal": "https://www.moj.gov.bh/images/pdf/leha_istenaf_crim.pdf",
  "criminal-unified-request": "https://www.moj.gov.bh/images/pdf/request_court_list_2.pdf",
  "archive-grievance": "https://www.moj.gov.bh/images/pdf/Grievance_List.pdf",
  "fees-assessment": "https://www.moj.gov.bh/images/pdf/istem_cost_form.pdf",
  "expert-contract": "https://www.moj.gov.bh/images/pdf/ASAMPLE_OF_EXPERINCE.pdf",
  "expert-impartiality": "https://www.moj.gov.bh/images/pdf/Expert_Impartiality.pdf",
  "bailiff-licence": "https://www.moj.gov.bh/images/pdf/Bailiffs_form.pdf",
  "private-notary-licence": "https://www.moj.gov.bh/images/pdf/private_notary_application.pdf",
  "circular-update": "https://www.moj.gov.bh/images/pdf/update_data_number_4_2019.pdf",
  "lawyer-validity": "https://www.moj.gov.bh/images/pdf/laweyr_list.pdf",
  "lawyer-registration": "https://www.moj.gov.bh/images/pdf/Registration_lawyers.pdf",
  "civil-mediator-person": "https://www.moj.gov.bh/images/pdf/madaneya_brokers_normal.pdf",
  "criminal-mediators": "https://www.moj.gov.bh/images/pdf/jenaye_brokers.pdf",
  "company-mediators": "https://www.moj.gov.bh/images/pdf/company_brokers.pdf",
  "sharia-mediator-person": "https://www.moj.gov.bh/images/pdf/shareya_court_form_2.pdf",
  "sharia-mediator-company": "https://www.moj.gov.bh/images/pdf/shareya_court_form_1.pdf",
  "trustee-person": "https://www.moj.gov.bh/images/pdf/personal_bankruptcy_trustees.pdf",
  "trustee-company": "https://www.moj.gov.bh/images/pdf/company_bankruptcy_trustees.pdf",
  "arbitrator-registration": "https://www.moj.gov.bh/images/pdf/couching/form_request_couching.pdf",
  "arbitrator-cases": "https://www.moj.gov.bh/images/pdf/couching/sample_of_couching_cases.pdf",
  "unlisted-client-report": "https://www.moj.gov.bh/images/pdf/Report_form_regarding_the_notification.pdf",
  "suspicious-report": "https://www.moj.gov.bh/images/pdf/Report_form_on_reporting_suspicious.pdf",
  "listed-client-report": "https://www.moj.gov.bh/images/pdf/Report_form_on_reporting_the_listed.pdf",
  "follow-up-form": "https://forms.cloud.microsoft/r/YfGq2TKhjh?origin=lprLink",
  "compliance-officer": "https://www.moj.gov.bh/images/pdf/Compliance_Officer_Appointment_Form.pdf",
  "law-office-update": "https://www.moj.gov.bh/images/pdf/Lawyers_Office_Update_Form.pdf",
  "disclosure-a": "https://www.moj.gov.bh/images/pdf/Disclosure_form_A.pdf",
  "disclosure-b": "https://www.moj.gov.bh/images/pdf/Disclosure_form_B.pdf",
  "bank-approval": "https://www.moj.gov.bh/images/pdf/Bank_account_approval_form.pdf",
  "property-ownership": "https://www.moj.gov.bh/images/pdf/aprof_owner_attach_for_dawa.pdf",
  "equipment-rental": "https://www.moj.gov.bh/images/pdf/Rent_equip_cars_a_lis_of_doc.pdf",
  "appoint-arbitrator": "https://www.moj.gov.bh/images/pdf/an_arbitrator_List_of_doc.pdf",
  "utilities-claim": "https://www.moj.gov.bh/images/pdf/For_com_and_electric_cases.pdf",
  "surname-addition": "https://www.moj.gov.bh/images/pdf/required__registering_claim.pdf",
  "social-insurance": "https://www.moj.gov.bh/images/pdf/cases_-_Social_insurance.pdf",
  "injury-compensation": "https://www.moj.gov.bh/images/pdf/compensation_for_injuries.pdf",
  "death-compensation": "https://www.moj.gov.bh/images/pdf/Compensation_for_death.pdf",
  "inheritance-claim": "https://www.moj.gov.bh/images/pdf/inheritance_lawsuit.pdf",
  "birth-certificate-claim": "https://www.moj.gov.bh/images/pdf/Birth_certificate.pdf",
  "supply-contract-claim": "https://www.moj.gov.bh/images/pdf/Supply_contract.pdf",
  "loan-contract-claim": "https://www.moj.gov.bh/images/pdf/Loan_contract.pdf",
};

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
