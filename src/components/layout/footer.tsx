"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AtSign, MapPin, Phone } from "lucide-react";
import type { Locale } from "@/config/site";
import { siteConfig } from "@/config/site";
import { getMessages } from "@/messages";

const currentYear = new Date().getFullYear();

export function Footer({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const m = getMessages(locale);
  if (/^\/(ar|en)\/admin(?:\/|$)/.test(pathname)) return null;
  return (
    <footer className="bg-[#0d1618] pb-24 pt-16 text-white md:pb-8">
      <div className="container-site grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="relative mb-5 size-16 overflow-hidden">
            <Image
              src="/assets/brand/logo-icon.svg"
              alt=""
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>
          <h2 className="text-lg font-semibold">{siteConfig.name[locale]}</h2>
          <p className="mt-2 text-sm text-white/55">
            {siteConfig.title[locale]} · {siteConfig.country[locale]}
          </p>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-bold text-[#d1b579]">
            {locale === "ar" ? "روابط الموقع" : "Site links"}
          </h3>
          <div className="grid gap-3 text-sm text-white/65">
            <Link href={`/${locale}/about`}>{m.nav.about}</Link>
            <Link href={`/${locale}/services`}>{m.nav.services}</Link>
            <Link href={`/${locale}/privacy`}>
              {locale === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
            <Link href={`/${locale}/legal-disclaimer`}>
              {locale === "ar" ? "إخلاء المسؤولية" : "Legal Disclaimer"}
            </Link>
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-bold text-[#d1b579]">
            {locale === "ar" ? "تواصل" : "Connect"}
          </h3>
          <div className="grid gap-3 text-sm text-white/65">
            <a
              className="flex items-center gap-2"
              href={`tel:${siteConfig.contact.phone}`}
              dir="ltr"
            >
              <Phone size={17} /> {siteConfig.contact.phone}
            </a>
            <a
              className="flex items-center gap-2"
              href={siteConfig.contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              <AtSign size={17} />@{siteConfig.contact.instagramUsername}
            </a>
            <a
              className="flex items-center gap-2"
              href={siteConfig.contact.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin size={17} />
              {m.hero.location}
            </a>
          </div>
        </div>
      </div>
      <div className="container-site mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:justify-between">
        <span>
          © {currentYear} {siteConfig.shortName[locale]}
        </span>
        <span>{m.common.note}</span>
      </div>
    </footer>
  );
}
