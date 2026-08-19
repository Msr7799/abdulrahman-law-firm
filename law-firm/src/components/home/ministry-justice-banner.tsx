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
        src="/assets/logos/bahrain-ministry4justice-nobg.svg"
        alt={ar ? "شعار وزارة العدل والشؤون الإسلامية والأوقاف" : "Ministry of Justice, Islamic Affairs and Waqf emblem"}
        fill
        priority={!compact}
        sizes="100vw"
        className="object-contain object-center opacity-90"
      />
    

    </section>
  );
}
