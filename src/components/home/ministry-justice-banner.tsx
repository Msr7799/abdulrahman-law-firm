import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Locale } from "@/config/site";

export function MinistryJusticeBanner({
  locale,
  variant = "page",
}: {
  locale: Locale;
  variant?: "page" | "home";
}) {
  const ar = locale === "ar";
  const compact = variant === "home";
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <section
      className={`group relative isolate overflow-hidden border-y border-[#d4caba] bg-[#f4f0e8] ${compact ? "min-h-[340px]" : "min-h-[420px]"}`}
      aria-labelledby={`ministry-banner-${variant}`}
    >
      <Image
        src="/assets/logos/bahrain-ministry4justice-banner.webp"
        alt={ar ? "شعار وزارة العدل والشؤون الإسلامية والأوقاف" : "Ministry of Justice, Islamic Affairs and Waqf emblem"}
        fill
        priority={!compact}
        sizes="100vw"
        className="object-cover object-[62%_20%] transition-transform duration-[1400ms] ease-out group-hover:scale-[1.018]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(249,246,239,.99)_0%,rgba(249,246,239,.96)_30%,rgba(249,246,239,.42)_47%,rgba(249,246,239,.04)_62%)] max-md:bg-[linear-gradient(90deg,rgba(249,246,239,.98)_0%,rgba(249,246,239,.9)_62%,rgba(249,246,239,.45)_100%)]" />
      <div className="absolute inset-y-0 left-0 w-px bg-[#b89555]/50" />
      <div className="container-site relative flex min-h-[inherit] items-center py-12">
        <div className={`w-full max-w-2xl ${ar ? "text-right" : "text-left"}`}>
          <p className="eyebrow flex items-center gap-3 before:h-px before:w-9 before:bg-[#b89555]">
            {ar ? "المنظومة العدلية في مملكة البحرين" : "Bahrain justice system"}
          </p>
          <h2 id={`ministry-banner-${variant}`} className={`display mt-5 max-w-xl text-[#10272d] ${compact ? "text-3xl sm:text-5xl" : "text-4xl sm:text-6xl"}`}>
            {compact
              ? ar ? "خدمات قانونية ضمن الإطار العدلي البحريني" : "Legal services within Bahrain’s justice framework"
              : ar ? "الخدمات القانونية" : "Legal Services"}
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#506064] sm:text-base sm:leading-8">
            {ar
              ? "خدمات مهنية مستقلة تراعي الأنظمة والإجراءات المعمول بها، ويُحدَّد نطاق كل خدمة بعد مراجعة موضوعك بصورة أولية."
              : "Independent professional services informed by applicable laws and procedures, with scope confirmed after an initial review of your matter."}
          </p>
          {compact && (
            <Link href={`/${locale}/services`} className="focus-ring mt-7 inline-flex min-h-12 items-center gap-3 bg-[#132b32] px-6 text-sm font-bold text-white transition hover:bg-[#9e1b25]">
              {ar ? "استكشف خدماتنا" : "Explore our services"}<Arrow size={17} />
            </Link>
          )}
          <p className="mt-6 max-w-xl text-[10px] leading-5 text-[#697679]">
            {ar
              ? "المكتب جهة مهنية مستقلة ولا يمثل الوزارة أو أي جهة حكومية."
              : "The office is an independent professional practice and does not represent the Ministry or any government entity."}
          </p>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#ce1126] via-[#b89555] to-transparent" />
    </section>
  );
}
