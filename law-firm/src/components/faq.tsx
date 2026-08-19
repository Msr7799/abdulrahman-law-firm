import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/animate-ui/components/base/accordion";
import type { Locale } from "@/config/site";
const items = {
  ar: [
    [
      "كيف يمكنني حجز استشارة؟",
      "أرسل طلبك عبر نموذج الحجز وحدد الوقت المفضل. سيتواصل المكتب معك لتأكيد التفاصيل.",
    ],
    [
      "ما طرق الاستشارة المتاحة؟",
      "يمكن طلب استشارة في المكتب أو هاتفية أو عن بُعد، ويخضع الموعد والطريقة للتأكيد.",
    ],
    [
      "هل إرسال الطلب يعني تأكيد الموعد؟",
      "لا. يمثل الإرسال طلبًا أوليًا، ولا يصبح الموعد مؤكدًا إلا بعد التواصل معك.",
    ],
    [
      "ما المعلومات التي أجهزها؟",
      "اكتب وصفًا عامًا ومختصرًا للموضوع، وتجنب إرسال مستندات أو بيانات شديدة السرية عبر النموذج العام.",
    ],
  ],
  en: [
    [
      "How can I book a consultation?",
      "Submit the booking form with your preferred time. The office will contact you to confirm the details.",
    ],
    [
      "What consultation formats are available?",
      "You may request an in-office, phone, or remote consultation, subject to confirmation.",
    ],
    [
      "Does submitting a request confirm my appointment?",
      "No. Submission is an initial request; the appointment is only confirmed after the office contacts you.",
    ],
    [
      "What should I prepare?",
      "Provide a short, general description and avoid sending highly confidential documents through the general form.",
    ],
  ],
};
export function FAQ({ locale, limit }: { locale: Locale; limit?: number }) {
  const visibleItems = items[locale].slice(0, limit);
  return (
    <Accordion multiple defaultValue={visibleItems.length ? ["faq-0"] : []} className="mx-auto grid max-w-3xl gap-3">
      {visibleItems.map(([q, a], index) => (
        <AccordionItem
          key={q}
          value={`faq-${index}`}
          className="overflow-hidden border border-[#ded8cc] bg-[#fffdf8] data-[open]:border-[#b89555]"
        >
          <AccordionTrigger className="focus-ring min-h-16 w-full items-center px-6 py-4 text-start font-bold text-[#10191b] hover:no-underline">{q}</AccordionTrigger>
          <AccordionPanel className="border-t border-[#ded8cc] px-6 pb-6 pt-5 text-sm leading-7 text-[#657073]">{a}</AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
