"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, Menu, X } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/config/site";
import { siteConfig } from "@/config/site";
import { getMessages } from "@/messages";

export function Navbar({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const m = getMessages(locale);
  const other = locale === "ar" ? "en" : "ar";
  const links = [
    ["", m.nav.home],
    ["/about", m.nav.about],
    ["/services", m.nav.services],
    ["/contact", m.nav.contact],
  ] as const;
  const switched = pathname.replace(/^\/(ar|en)/, `/${other}`);
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#10191b]/95 text-white backdrop-blur">
      <div className="container-site flex h-20 items-center justify-between gap-4">
        <Link
          href={`/${locale}`}
          className="focus-ring flex items-center gap-3"
          aria-label={m.nav.home}
        >
          <span className="relative size-11 shrink-0 overflow-hidden">
            <Image
              src="/assets/brand/logo-icon.svg"
              alt=""
              fill
              priority
              sizes="44px"
              className="object-contain"
            />
          </span>
          <span className="hidden leading-tight sm:block">
            <strong className="block text-sm">
              {siteConfig.shortName[locale]}
            </strong>
            <span className="text-[11px] text-white/55">
              {siteConfig.title[locale]}
            </span>
          </span>
        </Link>
        <nav
          className="hidden items-center gap-7 lg:flex"
          aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}
        >
          {links.map(([path, label]) => (
            <Link
              key={path}
              href={`/${locale}${path}`}
              className={`focus-ring text-sm transition-colors hover:text-[#d1b579] ${pathname === `/${locale}${path}` ? "text-[#d1b579]" : "text-white/80"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={switched}
            className="focus-ring flex min-h-11 items-center gap-2 px-3 text-sm text-white/75 hover:text-white"
          >
            <Languages size={17} />
            {other.toUpperCase()}
          </Link>
          <Link
            href={`/${locale}/consultation`}
            className="focus-ring hidden min-h-11 items-center bg-[#b89555] px-5 text-sm font-bold text-[#10191b] sm:flex"
          >
            {m.nav.consultation}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="focus-ring grid size-11 place-items-center lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="container-site grid border-t border-white/10 py-4 lg:hidden">
          {links.map(([path, label]) => (
            <Link
              onClick={() => setOpen(false)}
              key={path}
              href={`/${locale}${path}`}
              className="focus-ring border-b border-white/8 px-2 py-4 text-sm"
            >
              {label}
            </Link>
          ))}
          <Link
            onClick={() => setOpen(false)}
            href={`/${locale}/consultation`}
            className="focus-ring mt-4 bg-[#b89555] p-4 text-center font-bold text-[#10191b]"
          >
            {m.nav.consultation}
          </Link>
        </nav>
      )}
    </header>
  );
}
