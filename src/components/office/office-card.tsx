import { Clock3, ExternalLink, MapPin } from "lucide-react";
import type { Locale } from "@/config/site";
import { siteConfig } from "@/config/site";
import { businessConfig } from "@/config/business";
import { isOfficeOpen } from "@/lib/open-status";
import { getMessages } from "@/messages";
export function OfficeCard({ locale }: { locale: Locale }) {
  const m = getMessages(locale),
    open = isOfficeOpen();
  return (
    <div className="grid overflow-hidden border border-[#ded8cc] bg-[#fffdf8] lg:grid-cols-[1.1fr_.9fr]">
      <div className="relative min-h-80 overflow-hidden bg-[#d8ddd8]">
        <iframe
          src={siteConfig.contact.googleMapsEmbed}
          title={locale === "ar" ? "خريطة موقع المكتب" : "Office location map"}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="p-8 lg:p-12">
        <p className="eyebrow">{m.hero.location}</p>
        <h2 className="display mt-4 text-3xl">{siteConfig.country[locale]}</h2>
        <div className="mt-5 flex items-start gap-3 text-sm leading-7 text-[#657073]">
          <MapPin className="mt-1 shrink-0 text-[#9a783f]" size={19} />
          <span>{siteConfig.address[locale]}</span>
        </div>
        <div className="mt-7 flex items-center gap-3">
          <span
            className={`size-2.5 rounded-full ${open ? "bg-emerald-600" : "bg-[#9b5b51]"}`}
          />
          <strong>{open ? m.common.open : m.common.closed}</strong>
        </div>
        <div className="mt-5 flex items-start gap-3 text-sm text-[#657073]">
          <Clock3 size={19} />
          <div>
            <strong className="block text-[#10191b]">{m.common.hours}</strong>
            <span dir="ltr">
              {businessConfig.open} — {businessConfig.close}
            </span>
            <span className="mt-1 block">Asia/Bahrain</span>
          </div>
        </div>
        <a
          href={siteConfig.contact.googleMaps}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring mt-8 inline-flex min-h-12 items-center gap-2 border border-[#132b32]/20 px-5 font-bold hover:bg-[#132b32] hover:text-white"
        >
          {m.common.maps}
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}
