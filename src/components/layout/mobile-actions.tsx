import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { Locale } from "@/config/site";
import { siteConfig } from "@/config/site";
import { getMessages } from "@/messages";
export function MobileActions({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-2 border-t border-black/10 bg-[#fffdf8]/95 p-3 backdrop-blur md:hidden">
      <Link
        className="focus-ring flex min-h-12 items-center justify-center gap-2 bg-[#b89555] text-sm font-bold"
        href={`/${locale}/consultation`}
      >
        <CalendarDays size={17} />
        {m.hero.book}
      </Link>
      <a
        className="focus-ring flex min-h-12 items-center justify-center gap-2 border border-[#132b32]/20 text-sm font-bold"
        href={siteConfig.contact.googleMaps}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MapPin size={17} />
        {m.hero.location}
      </a>
    </div>
  );
}
