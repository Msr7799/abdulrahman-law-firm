import Link from "next/link";
import { ArrowLeft, ArrowRight, BellRing } from "lucide-react";
import type { Locale } from "@/config/site";
import { getLegalNews } from "@/lib/legal-news";
import { LegalNewsCarousel } from "@/components/news/legal-news-carousel";

export async function LegalNewsSection({ locale }: { locale: Locale }) {
  const items = await getLegalNews("week", 8);
  if (!items.length) return null;
  const ar = locale === "ar";
  const featured = items[0];
  const Arrow = ar ? ArrowLeft : ArrowRight;
  return <>
    <div className="border-y border-white/10 bg-[#132b32] text-white">
      <div className="container-site flex min-h-12 items-center gap-3 py-2 text-xs sm:text-sm">
        <BellRing size={15} className="shrink-0 text-[#d0ad69]" />
        <span className="shrink-0 font-bold text-[#d0ad69]">{ar ? "آخر المستجدات" : "Latest update"}</span>
        <span className="min-w-0 flex-1 truncate text-white/70">{featured.title}</span>
        <Link href={`/${locale}/news/${featured.id}`} className="focus-ring hidden shrink-0 items-center gap-1 font-bold text-white sm:flex">{ar ? "التفاصيل" : "Details"}<Arrow size={14} /></Link>
      </div>
    </div>
    <LegalNewsCarousel locale={locale} items={items} />
  </>;
}
