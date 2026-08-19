import type { Locale } from "@/config/site";
import { PageHero } from "@/components/ui/page-hero";
export function LegalPage({
  locale,
  type,
}: {
  locale: Locale;
  type: "privacy" | "disclaimer";
}) {
  const ar = locale === "ar";
  const privacy = type === "privacy";
  const sections = privacy
    ? ar
      ? [
          [
            "البيانات التي نجمعها",
            "عند إرسال طلب استشارة، نجمع الاسم ورقم الهاتف والبريد الإلكتروني إن أُدخل، والتاريخ والوقت المفضلين، وطريقة التواصل، والوصف المختصر الذي تقدمه.",
          ],
          [
            "الغرض من الاستخدام",
            "تُستخدم البيانات لمراجعة الطلب والتواصل معك بخصوص الموعد. لا يُعد إرسال الطلب إنشاءً تلقائيًا لعلاقة محامٍ وموكل.",
          ],
          [
            "خدمات الطرف الثالث",
            "قد يستخدم الموقع خرائط Google وPlaces لإظهار الموقع ومعلومات النشاط. تخضع هذه الخدمات لسياسات Google. لا توجد تحليلات طرف ثالث مفعلة افتراضيًا.",
          ],
          [
            "الاحتفاظ والأمان",
            "وضع التطوير الحالي لا يحفظ الطلبات بصورة دائمة. عند ربط مزود تخزين، يجب تحديث هذه السياسة لتوضيح مدة الاحتفاظ وضوابط الحماية.",
          ],
          [
            "التواصل والتحديثات",
            "يمكن التواصل عبر القنوات الموثقة المدرجة في صفحة التواصل. تُحدّث هذه السياسة عند تغير طريقة معالجة البيانات.",
          ],
        ]
      : [
          [
            "Data we collect",
            "A consultation request may include your name, phone number, optional email, preferred date and time, contact method, and the brief description you provide.",
          ],
          [
            "How it is used",
            "Information is used to review your request and contact you about scheduling. Submission does not automatically establish a lawyer-client relationship.",
          ],
          [
            "Third-party services",
            "The site may use Google Maps and Places to show location and business information. Those services are governed by Google policies. No third-party analytics are enabled by default.",
          ],
          [
            "Retention and security",
            "The current development adapter does not persist requests. This policy must be updated with retention and security details when a storage provider is connected.",
          ],
          [
            "Contact and updates",
            "Use the verified channels on the contact page for privacy enquiries. This policy will be updated when data handling changes.",
          ],
        ]
    : ar
      ? [
          [
            "معلومات عامة",
            "محتوى هذا الموقع لأغراض التعريف والمعلومات العامة فقط، ولا يشكل استشارة قانونية رسمية بشأن واقعة أو مسألة محددة.",
          ],
          [
            "لا تنشأ علاقة مهنية تلقائيًا",
            "لا يؤدي تصفح الموقع أو إرسال نموذج الاستشارة وحده إلى إنشاء علاقة محامٍ وموكل أو قبول التوكيل.",
          ],
          [
            "السرية",
            "لا ترسل مستندات أو معلومات شديدة السرية عبر النموذج العام أو أي قناة لم يعتمدها المكتب لهذا الغرض.",
          ],
          [
            "ضرورة التقييم المباشر",
            "تختلف المسائل القانونية بحسب الوقائع والمستندات والظروف. اطلب مشورة مناسبة قبل اتخاذ قرار أو الامتناع عن إجراء قانوني.",
          ],
        ]
      : [
          [
            "General information",
            "This website is for introductory and general informational purposes only. It is not formal legal advice about any specific circumstances.",
          ],
          [
            "No automatic professional relationship",
            "Browsing the site or submitting a consultation form alone does not create a lawyer-client relationship or confirm acceptance of instructions.",
          ],
          [
            "Confidentiality",
            "Do not send highly confidential documents or information through the general form or any channel not approved by the office for that purpose.",
          ],
          [
            "Individual assessment",
            "Legal matters vary by facts, documents, and circumstances. Seek appropriate advice before acting or refraining from legal action.",
          ],
        ];
  const title = privacy
    ? ar
      ? "سياسة الخصوصية"
      : "Privacy Policy"
    : ar
      ? "إخلاء المسؤولية القانونية"
      : "Legal Disclaimer";
  return (
    <main id="main">
      <PageHero
        eyebrow={ar ? "معلومات قانونية" : "Legal information"}
        title={title}
      />
      <section className="py-20">
        <div className="container-site max-w-3xl space-y-10">
          {sections.map(([h, p]) => (
            <section key={h}>
              <h2 className="display text-2xl">{h}</h2>
              <p className="mt-4 leading-8 text-[#657073]">{p}</p>
            </section>
          ))}
          <p className="border-t border-[#ded8cc] pt-6 text-xs text-[#657073]">
            {ar ? "آخر تحديث: أغسطس 2026" : "Last updated: August 2026"}
          </p>
        </div>
      </section>
    </main>
  );
}
