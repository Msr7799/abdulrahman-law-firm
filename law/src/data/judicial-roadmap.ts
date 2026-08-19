export type RoadmapStep = {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  checklistAr: string[];
  checklistEn: string[];
};

export type GovernmentService = {
  titleAr: string;
  titleEn: string;
  url: string;
};

export type JudicialRoadmap = {
  id: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  audienceAr: string;
  audienceEn: string;
  steps: RoadmapStep[];
  services: GovernmentService[];
};

const serviceUrl = (id: number) =>
  `https://www.bahrain.bh/wps/portal/ar/BNP/ServicesCatalogue/GSX-UI-PServiceDetails?psID=${id}`;

export const judicialRoadmaps: JudicialRoadmap[] = [
  {
    id: "litigation",
    titleAr: "رفع الدعوى ومتابعتها",
    titleEn: "File and manage a case",
    summaryAr: "المسار التشغيلي العام من تجهيز الملف حتى الحكم، مع فصل الطلبات اللاحقة عن أصل الدعوى.",
    summaryEn: "The general operational path from file preparation to judgment, keeping later requests separate from the original claim.",
    audienceAr: "مدني · تجاري · عمالي · شرعي",
    audienceEn: "Civil · Commercial · Labour · Sharia",
    steps: [
      { titleAr: "تحديد المسار والاختصاص", titleEn: "Identify route and jurisdiction", descriptionAr: "حدّد نوع الدعوى، المحكمة المختصة، صفة الأطراف والطلبات قبل بدء التسجيل.", descriptionEn: "Confirm case type, competent court, party capacity and remedies before filing.", checklistAr: ["مراجعة الاختصاص", "حصر الأطراف والعناوين", "فحص المواعيد الإجرائية"], checklistEn: ["Check jurisdiction", "List parties and addresses", "Check procedural time limits"] },
      { titleAr: "تجهيز ملف الإيداع", titleEn: "Prepare the filing bundle", descriptionAr: "رتّب صحيفة الدعوى، الوكالة، المستندات، الترجمات وأدلة السداد بصيغة قابلة للرفع.", descriptionEn: "Prepare the pleading, power of attorney, exhibits, translations and payment evidence for upload.", checklistAr: ["صحيفة الدعوى", "الوكالة والهوية", "المرفقات المرقمة"], checklistEn: ["Claim form", "POA and ID", "Numbered exhibits"] },
      { titleAr: "التسجيل والدفع", titleEn: "File and pay", descriptionAr: "سجّل الدعوى إلكترونيًا، راجع البيانات قبل الإرسال، واحفظ رقم الطلب وإيصال الرسم.", descriptionEn: "File electronically, review all fields before submission, and retain the request number and receipt.", checklistAr: ["رقم الطلب", "إيصال السداد", "نسخة نهائية من الإيداع"], checklistEn: ["Request number", "Payment receipt", "Final filed copy"] },
      { titleAr: "الإعلان وإدارة الجلسات", titleEn: "Service and hearings", descriptionAr: "تابع الإعلان، مواعيد الجلسات، المذكرات والقرارات، وسجّل كل موعد في ملف القضية.", descriptionEn: "Track service, hearings, submissions and orders, recording every date in the case file.", checklistAr: ["حالة الإعلان", "موعد الجلسة", "المهام المطلوبة قبل الموعد"], checklistEn: ["Service status", "Hearing date", "Pre-hearing tasks"] },
      { titleAr: "الحكم وما بعده", titleEn: "Judgment and next action", descriptionAr: "احفظ نسخة الحكم وتاريخ العلم أو الإعلان، ثم قيّم التصحيح أو التفسير أو الطعن أو التنفيذ.", descriptionEn: "Save the judgment and notification date, then assess correction, interpretation, appeal or enforcement.", checklistAr: ["نسخة الحكم", "تاريخ الإعلان", "قرار الإجراء التالي"], checklistEn: ["Judgment copy", "Notification date", "Next-action decision"] },
    ],
    services: [
      { titleAr: "تسجيل الدعاوى والطعون القضائية", titleEn: "Register cases and judicial appeals", url: serviceUrl(2184) },
      { titleAr: "الاستعلامات العدلية", titleEn: "Judicial inquiries", url: serviceUrl(4316) },
      { titleAr: "تنفيذ طلب تعجيل نظر الدعوى", titleEn: "Request expedited case review", url: serviceUrl(1405) },
      { titleAr: "طلب نسخة من أوراق الدعوى", titleEn: "Request a copy of case papers", url: serviceUrl(1424) },
    ],
  },
  {
    id: "appeal",
    titleAr: "الطعن على الأحكام",
    titleEn: "Appeal a judgment",
    summaryAr: "مسار فرز الحكم، ضبط الميعاد، إعداد أسباب الطعن ثم متابعة القيد والإعلان.",
    summaryEn: "A route for reviewing the judgment, controlling deadlines, drafting grounds and tracking registration and service.",
    audienceAr: "استئناف · تمييز · إعادة نظر · تظلم",
    audienceEn: "Appeal · Cassation · Reconsideration · Grievance",
    steps: [
      { titleAr: "تثبيت تاريخ البداية", titleEn: "Fix the start date", descriptionAr: "وثّق تاريخ صدور الحكم وتاريخ الإعلان أو العلم وأي واقعة تؤثر في بدء الميعاد.", descriptionEn: "Record judgment, service and knowledge dates plus any event affecting the deadline.", checklistAr: ["محضر الجلسة", "إثبات الإعلان", "حساب مستقل للميعاد"], checklistEn: ["Hearing record", "Proof of service", "Independent deadline calculation"] },
      { titleAr: "اختيار طريق الطعن", titleEn: "Select the remedy", descriptionAr: "طابق نوع الحكم والمحكمة والصفة مع طريق الطعن الجائز قبل إعداد اللائحة.", descriptionEn: "Match judgment type, court and standing to the available remedy before drafting.", checklistAr: ["قابلية الطعن", "المحكمة المختصة", "الطلبات الختامية"], checklistEn: ["Appealability", "Competent court", "Final relief sought"] },
      { titleAr: "إعداد وإيداع اللائحة", titleEn: "Draft and file", descriptionAr: "اربط كل سبب بموضعه في الحكم والمستندات، ثم أودع وسدّد واحفظ الإثباتات.", descriptionEn: "Tie every ground to the judgment and record, then file, pay and retain proof.", checklistAr: ["أسباب مرقمة", "مرفقات الطعن", "إيصال ورقم القيد"], checklistEn: ["Numbered grounds", "Appeal exhibits", "Receipt and filing number"] },
      { titleAr: "المتابعة حتى القرار", titleEn: "Track to decision", descriptionAr: "تابع الإعلان والمذكرات والجلسات والقرار النهائي وحدّث ملف القضية فورًا.", descriptionEn: "Track service, briefs, hearings and the final decision, updating the case file immediately.", checklistAr: ["إعلان الخصوم", "جدول المذكرات", "القرار النهائي"], checklistEn: ["Service on parties", "Briefing schedule", "Final decision"] },
    ],
    services: [
      { titleAr: "تسجيل الدعاوى والطعون القضائية", titleEn: "Register cases and judicial appeals", url: serviceUrl(2184) },
      { titleAr: "تسجيل لائحة إعادة النظر في الحكم", titleEn: "Register a reconsideration application", url: serviceUrl(2226) },
      { titleAr: "التقرير بالاستئناف الجنائي", titleEn: "File a criminal appeal", url: serviceUrl(2210) },
      { titleAr: "شهادة عدم حصول تمييز جنائي", titleEn: "Certificate of no criminal cassation", url: serviceUrl(3970) },
    ],
  },
  {
    id: "enforcement",
    titleAr: "تنفيذ الأحكام والسندات",
    titleEn: "Enforce judgments and instruments",
    summaryAr: "تحويل الحكم أو السند إلى ملف تنفيذ، ثم اختيار الطلب التنفيذي ومراقبة التحصيل والإقفال.",
    summaryEn: "Turn a judgment or instrument into an enforcement file, choose measures, and track recovery and closure.",
    audienceAr: "محكوم له · دائن · منفذ ضده",
    audienceEn: "Judgment creditor · Creditor · Debtor",
    steps: [
      { titleAr: "فحص السند التنفيذي", titleEn: "Validate the instrument", descriptionAr: "تحقق من النسخة التنفيذية، أطراف السند، المبالغ، الصفة وأي متطلبات سابقة.", descriptionEn: "Verify the enforceable copy, parties, sums, standing and prerequisites.", checklistAr: ["الصيغة التنفيذية", "بيانات الأطراف", "كشف المبلغ"], checklistEn: ["Enforceable copy", "Party details", "Amount schedule"] },
      { titleAr: "فتح ملف التنفيذ", titleEn: "Open enforcement file", descriptionAr: "اختر خدمة فتح الملف المناسبة للحكم أو السند الموثق، واربطها ببيانات القضية.", descriptionEn: "Choose the correct opening service for a judgment or notarised instrument and link the case data.", checklistAr: ["رقم الحكم أو السند", "طلب الفتح", "الرسوم"], checklistEn: ["Judgment or instrument number", "Opening request", "Fees"] },
      { titleAr: "اختيار الإجراء", titleEn: "Choose enforcement measures", descriptionAr: "قدّم الطلب المناسب فقط بعد مراجعة الملف: إفصاح، حجز، منع سفر، مخاطبة جهة أو غير ذلك.", descriptionEn: "After file review, submit the suitable measure: disclosure, attachment, travel ban, authority letter or other relief.", checklistAr: ["مبرر الطلب", "المستند المؤيد", "حالة الطلب"], checklistEn: ["Grounds", "Supporting document", "Request status"] },
      { titleAr: "التحصيل والإقفال", titleEn: "Recovery and closure", descriptionAr: "طابق المبالغ المصروفة والمودعة، حدّث الرصيد، ثم اطلب الإقفال أو الإجراء التالي.", descriptionEn: "Reconcile paid and deposited sums, update the balance, then seek closure or the next measure.", checklistAr: ["كشف التحصيل", "الرصيد المتبقي", "قرار الإقفال"], checklistEn: ["Recovery statement", "Balance", "Closure decision"] },
    ],
    services: [
      { titleAr: "فتح ملف تنفيذ بموجب حكم قضائي", titleEn: "Open enforcement file for a judgment", url: serviceUrl(1516) },
      { titleAr: "فتح ملف تنفيذ بموجب سند موثق", titleEn: "Open enforcement file for a notarised instrument", url: serviceUrl(1517) },
      { titleAr: "تقديم طلبات في ملفات التنفيذ", titleEn: "Submit requests in enforcement files", url: serviceUrl(2222) },
      { titleAr: "الاستعلام عن ملف التنفيذ", titleEn: "Check an enforcement file", url: serviceUrl(1345) },
    ],
  },
  {
    id: "notary",
    titleAr: "التوثيق والوكالات",
    titleEn: "Notary and powers of attorney",
    summaryAr: "اختيار المحرر الصحيح، تجهيز الأطراف والصلاحيات، ثم التوثيق وحفظ النسخة المعتمدة.",
    summaryEn: "Choose the correct instrument, prepare parties and powers, then notarise and retain the approved copy.",
    audienceAr: "وكالات · إقرارات · عقود شركات",
    audienceEn: "POAs · Declarations · Company deeds",
    steps: [
      { titleAr: "تحديد نوع المحرر", titleEn: "Choose instrument type", descriptionAr: "حدّد إن كان المطلوب وكالة خاصة أو عامة أو إقرارًا أو تصديق توقيع أو عقدًا.", descriptionEn: "Identify whether the request is a special/general POA, declaration, signature certification or deed.", checklistAr: ["الغرض", "نطاق الصلاحيات", "مدة المحرر"], checklistEn: ["Purpose", "Scope of powers", "Duration"] },
      { titleAr: "تدقيق الأطراف والمستندات", titleEn: "Verify parties and documents", descriptionAr: "راجع الهوية والصفة والسجل والترجمة والموافقات اللازمة بحسب نوع المحرر.", descriptionEn: "Check identity, capacity, register, translations and approvals required for the instrument.", checklistAr: ["هوية سارية", "مستند الصفة", "نص نهائي للمحرر"], checklistEn: ["Valid ID", "Capacity evidence", "Final instrument text"] },
      { titleAr: "الحجز والتوثيق", titleEn: "Book and notarise", descriptionAr: "قدّم الطلب الإلكتروني واتبع متطلبات الحضور أو الاتصال المرئي، ثم سدّد الرسم.", descriptionEn: "Submit online, follow attendance or video-call requirements, then pay the fee.", checklistAr: ["رقم الطلب", "موعد التوثيق", "إيصال الرسم"], checklistEn: ["Request number", "Notary appointment", "Fee receipt"] },
      { titleAr: "الحفظ والاستخدام", titleEn: "Retain and use", descriptionAr: "احفظ النسخة الموثقة وتحقق من قبولها لدى الجهة المقصودة قبل إغلاق المهمة.", descriptionEn: "Store the notarised copy and confirm acceptance by the target authority before closing the task.", checklistAr: ["نسخة موثقة", "رقم المحرر", "تأكيد القبول"], checklistEn: ["Notarised copy", "Instrument number", "Acceptance confirmation"] },
    ],
    services: [
      { titleAr: "توكيل رسمي خاص", titleEn: "Special official power of attorney", url: serviceUrl(1453) },
      { titleAr: "اعتماد الوكالات", titleEn: "Authenticate powers of attorney", url: serviceUrl(1336) },
      { titleAr: "إلغاء الوكالات", titleEn: "Cancel powers of attorney", url: serviceUrl(1333) },
      { titleAr: "التصديق على التوقيعات في المحررات العرفية", titleEn: "Certify signatures on private instruments", url: serviceUrl(2206) },
    ],
  },
  {
    id: "lawyer",
    titleAr: "خدمات المحامي المهنية",
    titleEn: "Lawyer professional services",
    summaryAr: "إدارة القيد والبطاقة والإفادات والشركة المهنية والطلبات المرتبطة بمزاولة المحاماة.",
    summaryEn: "Manage registration, cards, certificates, professional companies and practice-related requests.",
    audienceAr: "محامون · شركات محاماة · متدربون",
    audienceEn: "Lawyers · Law firms · Trainees",
    steps: [
      { titleAr: "فحص حالة القيد", titleEn: "Check registration status", descriptionAr: "راجع الفئة وتاريخ الانتهاء والبيانات المسجلة قبل تقديم أي طلب مهني.", descriptionEn: "Review category, expiry and recorded details before any professional request.", checklistAr: ["رقم القيد", "تاريخ الانتهاء", "البيانات المهنية"], checklistEn: ["Registration number", "Expiry date", "Professional details"] },
      { titleAr: "تجهيز الطلب", titleEn: "Prepare the request", descriptionAr: "اختر بين قيد جديد أو تجديد أو إفادة أو شركة محاماة، واجمع المتطلبات الخاصة به.", descriptionEn: "Choose new registration, renewal, certificate or law firm approval and gather its requirements.", checklistAr: ["نوع الطلب", "المرفقات", "الرسوم"], checklistEn: ["Request type", "Attachments", "Fees"] },
      { titleAr: "التقديم والمتابعة", titleEn: "Submit and track", descriptionAr: "قدّم إلكترونيًا واحفظ رقم الطلب، ثم تابع النواقص والقرار حتى اكتماله.", descriptionEn: "Submit online, retain the request number, and track deficiencies and the decision.", checklistAr: ["رقم الطلب", "حالة المعاملة", "نسخة القرار"], checklistEn: ["Request number", "Status", "Decision copy"] },
    ],
    services: [
      { titleAr: "طلب قيد في جدول المحامين", titleEn: "Apply for lawyer registration", url: serviceUrl(2261) },
      { titleAr: "تجديد القيد وإصدار بطاقة القيد", titleEn: "Renew registration and issue card", url: serviceUrl(2218) },
      { titleAr: "طلب إفادة القيد", titleEn: "Request registration certificate", url: serviceUrl(2240) },
      { titleAr: "طلب اعتماد شركات المحاماة", titleEn: "Apply for law firm approval", url: serviceUrl(2243) },
    ],
  },
];

export const dashboardGuide = [
  { id: "integrations", titleAr: "التكاملات الحكومية", titleEn: "Government integrations", descriptionAr: "اعرف ما هو API متاح وما هو رابط رسمي وما يحتاج اعتماداً قبل الربط، مع مسارات الدفع في البحرين.", descriptionEn: "See what has API access, what is an official link, and what needs approval before integration, including Bahrain payment routes." },
  { id: "roadmap", titleAr: "خارطة القضاء", titleEn: "Judicial roadmap", descriptionAr: "ابدأ منها لاختيار مسار المعاملة، ثم افتح الخدمة الحكومية المرتبطة بكل مرحلة.", descriptionEn: "Start here to choose a transaction path, then open the government service linked to each stage." },
  { id: "forms", titleAr: "النماذج", titleEn: "Forms", descriptionAr: "أنشئ نموذج متابعة أو تكليف أو استلام مستندات بنسق مستلهم من دليل الهوية الحكومية.", descriptionEn: "Create follow-up, instruction or document handover forms based on the government identity guide." },
  { id: "cases", titleAr: "القضايا", titleEn: "Cases", descriptionAr: "أضف ملفات القضايا وابحث فيها وحدّث الجلسة والحكم والحالة التشغيلية.", descriptionEn: "Add and search case files, then update hearings, judgments and operating status." },
  { id: "directory", titleAr: "دليل المحامي", titleEn: "Lawyer directory", descriptionAr: "احفظ جهات الاتصال الرسمية والمهنية مع المصدر وتاريخ التحقق.", descriptionEn: "Keep official and professional contacts with source and verification date." },
  { id: "agent", titleAr: "الوكيل القانوني", titleEn: "Legal agent", descriptionAr: "اسأل عن قضية مسجلة أو اطلب شرح مسار حكومي؛ فعّل البحث الرسمي للمعلومات المتغيرة.", descriptionEn: "Ask about a stored case or government route; enable official search for changing information." },
] as const;

export const importantLawyerContacts = [
  { nameAr: "الطوارئ الموحدة", nameEn: "Unified emergency", phone: "999", noteAr: "شرطة وإسعاف ودفاع مدني", noteEn: "Police, ambulance and civil defence" },
  { nameAr: "النيابة العامة", nameEn: "Public Prosecution", phone: "+973 17570000", noteAr: "مركز خدمة المتقاضين", noteEn: "Litigants Service Centre" },
  { nameAr: "مجمع محاكم الأسرة", nameEn: "Family Courts Complex", phone: "17513737", noteAr: "خدمات المحاكم الأسرية", noteEn: "Family court services" },
  { nameAr: "مركز اتصال الخدمات الحكومية", nameEn: "Government Services Contact Centre", phone: "80008001", noteAr: "دعم الخدمات الحكومية على مدار الساعة", noteEn: "24/7 government services support" },
  { nameAr: "الشرطة – الخط الساخن", nameEn: "Police hotline", phone: "80008008", noteAr: "البلاغات والاستفسارات الشرطية", noteEn: "Police reports and inquiries" },
  { nameAr: "الحوادث المرورية", nameEn: "Traffic accidents", phone: "199", noteAr: "الإبلاغ عن الحوادث المرورية", noteEn: "Traffic accident reporting" },
] as const;

export function roadmapKnowledgeForAgent() {
  return judicialRoadmaps.map((roadmap) => {
    const steps = roadmap.steps.map((step, index) => `${index + 1}. ${step.titleAr}: ${step.descriptionAr}`).join("\n");
    const services = roadmap.services.map((service) => `- ${service.titleAr}: ${service.url}`).join("\n");
    return `## ${roadmap.titleAr}\n${roadmap.summaryAr}\n${steps}\nالخدمات الحكومية المرتبطة:\n${services}`;
  }).join("\n\n");
}
