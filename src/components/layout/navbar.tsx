"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages, LockKeyhole, Menu } from "lucide-react";
import type { Locale } from "@/config/site";
import { siteConfig } from "@/config/site";
import { getMessages } from "@/messages";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Navbar({ locale }: { locale: Locale }) {
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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#10191b]/85 text-white backdrop-blur">
      <div className="container-site flex h-20 items-center justify-between gap-4">
        <Link
          href={`/${locale}`}
          className="focus-ring flex min-w-0 items-center gap-2 sm:gap-3"
          aria-label={m.nav.home}
        >
          <span className="relative size-14 shrink-0 overflow-hidden sm:size-18">
            <Image
              src="/assets/logos/bahrain-official-logo-no-text.svg"
              alt="bahrain official logo"
              fill
              priority
              sizes="44px"
              className="object-contain"
            />
          </span>
          <span className="relative size-9 shrink-0 overflow-hidden sm:size-11">
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
              className={`focus-ring rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/[.05] hover:text-[#d1b579] ${pathname === `/${locale}${path}` ? "bg-white/[.035] text-[#d1b579]" : "text-white/80"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/admin`}
            className="focus-ring hidden min-h-11 items-center gap-2 rounded-md border border-white/12 px-3 text-xs text-white/65 transition hover:border-[#d1b579]/50 hover:text-[#d1b579] md:flex"
            title={locale === "ar" ? "دخول الإدارة" : "Admin sign-in"}
          >
            <LockKeyhole size={16} />
            {locale === "ar" ? "الإدارة" : "Admin"}
          </Link>
          <Link
            href={switched}
            className="focus-ring flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-white/75 hover:bg-white/[.05] hover:text-white"
          >
            <Languages size={17} />
            {other.toUpperCase()}
          </Link>
          <LiquidButton asChild className="focus-ring hidden min-h-11 items-center bg-[#b89555] px-5 text-sm font-bold text-[#10191b] sm:flex">
            <Link href={`/${locale}/consultation`}>{m.nav.consultation}</Link>
          </LiquidButton>
          <DropdownMenu dir={locale === "ar" ? "rtl" : "ltr"}>
            <DropdownMenuTrigger asChild>
              <LiquidButton
                size="icon"
                type="button"
                className="focus-ring grid size-11 place-items-center lg:hidden"
                aria-label={locale === "ar" ? "فتح القائمة الرئيسية" : "Open main menu"}
              >
                <Menu />
              </LiquidButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="mobile-navbar-menu w-[min(20rem,calc(100vw-1rem))] rounded-md border border-white/10 bg-[#10191b]/98 p-2 text-white shadow-[0_24px_80px_rgba(0,0,0,.48)] backdrop-blur-xl lg:hidden"
            >
              <div className="px-2 pb-2 pt-1">
                <p className="text-[10px] font-bold tracking-wide text-[#d1b579]">{locale === "ar" ? "القائمة الرئيسية" : "MAIN MENU"}</p>
              </div>
              {links.map(([path, label]) => (
                <DropdownMenuItem key={path} asChild className="rounded-md p-0 outline-none">
                  <Link
                    href={`/${locale}${path}`}
                    className={`focus-ring flex min-h-11 w-full items-center rounded-md px-3 text-sm transition-colors ${pathname === `/${locale}${path}` ? "bg-[#b89555]/12 text-[#e8d19b]" : "text-white/75 hover:bg-white/[.05] hover:text-white"}`}
                  >
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <div className="my-1 border-t border-white/8" />
              <DropdownMenuItem asChild className="rounded-md p-0 outline-none">
                <Link href={`/${locale}/consultation`} className="focus-ring flex min-h-11 w-full items-center justify-center rounded-md bg-[#b89555] px-3 text-sm font-bold text-[#10191b] hover:bg-[#c5a365]">
                  {m.nav.consultation}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="mt-1 rounded-md p-0 outline-none">
                <Link href={`/${locale}/admin`} className="focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-white/12 px-3 text-sm text-white/70 hover:bg-white/[.04] hover:text-white">
                  <LockKeyhole size={16} />
                  {locale === "ar" ? "دخول الإدارة" : "Admin sign-in"}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
