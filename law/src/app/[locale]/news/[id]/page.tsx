import { ArrowLeft, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/config/site";
import { getLegalNews } from "@/lib/legal-news";

export default async function LegalNewsDetail({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const items = await getLegalNews("month", 24);
  const item = items.find((candidate) => candidate.id === id);
  if (!item) notFound();
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const date = new Intl.DateTimeFormat(ar ? "ar-BH" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(item.publishedAt));

  return <main id="main" className="bg-[#f6f2e9] py-12 sm:py-16">
    <article className="container-site max-w-4xl">
      <Link href={`/${locale}`} className="focus-ring inline-flex items-center gap-2 text-xs font-bold text-[#9a783f]"><Arrow size={15} />{ar ? "العودة للرئيسية" : "Back to home"}</Link>
      <div className="mt-6 overflow-hidden border border-[#ded8cc] bg-[#fffdf8] shadow-[0_24px_80px_rgba(16,25,27,.08)]">
        <div className="relative min-h-64 overflow-hidden bg-[#132b32] sm:min-h-80">
          {item.imageUrl ? <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to top,rgba(7,18,22,.82),rgba(7,18,22,.10)),url(${JSON.stringify(item.imageUrl).slice(1,-1)})` }} /> : item.sourceLogoUrl ? <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,#fffdf8_0%,#f4efe5_62%,#e7ddce_100%)] p-10"><img src={item.sourceLogoUrl} alt={item.sourceLogoName || item.sourceName} className="max-h-44 max-w-[68%] object-contain sm:max-h-56" /></div> : <div className="absolute inset-0 grid place-items-center"><img src="/assets/logos/bahrain-official-logo-no-text-gold.svg" alt="" className="h-40 opacity-40" /></div>}
          {item.imageUrl && item.sourceLogoUrl && <div className="absolute start-5 top-5 grid min-h-14 min-w-20 place-items-center rounded-md border border-white/70 bg-white/95 px-3 py-2 shadow-xl"><img src={item.sourceLogoUrl} alt={item.sourceLogoName || item.sourceName} className="max-h-10 max-w-24 object-contain" /></div>}
          <div className={`absolute inset-x-0 bottom-0 p-6 sm:p-8 ${item.imageUrl ? "text-white" : "text-[#132b32]"}`}><span className={`inline-flex rounded-sm border px-2.5 py-1 text-[10px] font-bold backdrop-blur ${item.imageUrl ? "border-white/20 bg-black/35" : "border-[#132b32]/15 bg-white/80"}`}>{item.sourceName}</span><h1 className="display mt-4 max-w-3xl text-3xl leading-tight sm:text-4xl">{item.title}</h1><p className={`mt-3 text-xs ${item.imageUrl ? "text-white/60" : "text-[#657073]"}`}>{date}</p></div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-start gap-3 border border-[#b89555]/25 bg-[#b89555]/8 p-4 text-sm leading-7 text-[#5f5139]"><ShieldCheck className="mt-1 shrink-0 text-[#9a783f]" size={18} /><p>{ar ? "هذه الصفحة تعرض ملخصاً موسعاً داخل موقع المكتب اعتماداً على المادة المتاحة من المصدر، ولا تعيد نشر المقال الصحفي كاملاً. يُرجع للمصدر الأصلي عند الحاجة للتحقق من النص الكامل." : "This page provides an expanded in-site summary based on the source material and does not republish the full original article. Refer to the original source when the full text must be verified."}</p></div>
          <h2 className="display text-2xl">{ar ? "ملخص المستجد" : "Update summary"}</h2>
          <p className="mt-4 whitespace-pre-line text-[15px] leading-8 text-[#4e5b5e]">{item.details || item.summary}</p>
          <div className="mt-8 grid gap-3 border-t border-[#ded8cc] pt-6 text-sm sm:grid-cols-2">
            <div><span className="block text-xs text-[#7a8587]">{ar ? "المصدر" : "Source"}</span><strong className="mt-1 block">{item.sourceName}</strong></div>
            <div><span className="block text-xs text-[#7a8587]">{ar ? "حالة التحقق" : "Verification"}</span><strong className="mt-1 block">{item.verification === "official" ? (ar ? "مصدر رسمي" : "Official") : item.verification === "government" ? (ar ? "مصدر حكومي" : "Government") : (ar ? "مصدر صحفي" : "Press report")}</strong></div>
          </div>
          <a href={item.sourceUrl} target="_blank" rel="noreferrer noopener" className="focus-ring mt-7 inline-flex min-h-11 items-center gap-2 border border-[#132b32] px-5 text-sm font-bold text-[#132b32] transition hover:bg-[#132b32] hover:text-white">{ar ? "عرض المصدر الأصلي" : "View original source"}<ExternalLink size={16} /></a>
        </div>
      </div>
    </article>
  </main>;
}
