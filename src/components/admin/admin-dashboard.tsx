"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { signOut } from "firebase/auth";
import Image from "next/image";
import { Bot, BriefcaseBusiness, ChevronDown, ExternalLink, FileCheck2, GitBranch, Landmark, LayoutDashboard, LogOut, Mail, Menu, MessageCircle, Phone, PhoneCall, Route, ShieldCheck } from "lucide-react";
import type { Locale } from "@/config/site";
import { firebaseAuth } from "@/lib/firebase/client";
import { CaseManager } from "@/components/admin/case-manager";
import { DirectoryManager } from "@/components/admin/directory-manager";
import { LegalAgent } from "@/components/admin/legal-agent";
import { DashboardOverview } from "@/components/admin/dashboard-overview";
import { JudicialRoadmap } from "@/components/admin/judicial-roadmap";
import { GovernmentForms } from "@/components/admin/government-forms";
import { GovernmentIntegrationHub } from "@/components/admin/government-integration-hub";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Tab = "overview" | "integrations" | "roadmap" | "forms" | "cases" | "directory" | "agent";
const validTabs = new Set<Tab>(["overview", "integrations", "roadmap", "forms", "cases", "directory", "agent"]);

export function AdminDashboard({ locale, user, initialTab }: { locale: Locale; user: User; initialTab: string }) {
  const ar = locale === "ar";
  const [tab, setTab] = useState<Tab>(validTabs.has(initialTab as Tab) ? initialTab as Tab : "overview");
  const tabs = [
    { id: "overview" as const, label: ar ? "نظرة عامة" : "Overview", icon: LayoutDashboard },
    { id: "integrations" as const, label: ar ? "التكاملات" : "Integrations", icon: Landmark },
    { id: "roadmap" as const, label: ar ? "خارطة القضاء" : "Roadmap", icon: Route },
    { id: "forms" as const, label: ar ? "النماذج" : "Forms", icon: FileCheck2 },
    { id: "cases" as const, label: ar ? "القضايا" : "Cases", icon: BriefcaseBusiness },
    { id: "directory" as const, label: ar ? "دليل المحامي" : "Legal directory", icon: PhoneCall },
    { id: "agent" as const, label: ar ? "الوكيل القانوني" : "Legal agent", icon: Bot },
  ];

  useEffect(() => {
    const url = new URL(window.location.href);
    const urlTab = url.searchParams.get("adminTab") as Tab | null;
    const savedTab = window.localStorage.getItem("law-admin-active-tab") as Tab | null;
    const restored = urlTab && validTabs.has(urlTab) ? urlTab : savedTab && validTabs.has(savedTab) ? savedTab : null;
    if (restored && restored !== tab) setTab(restored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("law-admin-active-tab", tab);
    const url = new URL(window.location.href);
    if (url.searchParams.get("adminTab") !== tab) {
      url.searchParams.set("adminTab", tab);
      window.history.replaceState(window.history.state, "", url);
    }
  }, [tab]);

  function selectTab(nextTab: Tab) {
    setTab(nextTab);
  }

  const agentMode = tab === "agent";
  const developerWhatsAppMessage = "مرحبا محمد الرميحي لدي مشكله في الادمنداشبورد الخاصه بموقع عبدالرحمن للمحامات :";
  const developerWhatsAppHref = `https://wa.me/97337925259?text=${encodeURIComponent(developerWhatsAppMessage)}`;

  return (
    <main id="main" className={`admin-shell admin-grid-bg bg-[#091b21] text-white ${agentMode ? "h-[calc(100dvh-5rem)] min-h-0 overflow-hidden" : "min-h-[calc(100vh-5rem)]"}`}>
      <div className={agentMode ? "flex h-full min-h-0 w-full max-w-none flex-col px-0 py-0" : "container-site py-8 sm:py-12"}>
        {!agentMode && <header className="mb-8 border border-white/10 bg-[#102a31]/90 p-5 shadow-2xl shadow-black/20 sm:p-7">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <span className="hidden min-w-20 place-items-center sm:grid"><Image src="/assets/logos/bahrain-official-logo-no-text-gold.svg" width={60} height={60} alt={ar ? "شعار مملكة البحرين الذهبي" : "Golden Kingdom of Bahrain emblem"} className="h-14 w-auto" /></span>
              <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[.16em] text-[#d1b579]">
                <ShieldCheck size={17} />
                {ar ? "مساحة إدارة خاصة ومشفّرة" : "PRIVATE ADMIN WORKSPACE"}
              </div>
              <h1 className="display text-3xl sm:text-4xl">{ar ? "مكتب القضايا الذكي" : "Intelligent case office"}</h1>
              <p className="mt-2 text-sm text-white/55">{user.displayName || user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ThemeTogglerButton modes={["dark", "light"]} direction={ar ? "rtl" : "ltr"} aria-label={ar ? "تبديل الوضع الليلي والنهاري" : "Toggle light and dark theme"} title={ar ? "تبديل الوضع الليلي والنهاري" : "Toggle light and dark theme"} className="admin-theme-toggle border-[#771111]/45 bg-[#771111]/15 text-[#b95757] hover:bg-[#771111]/25" />
              <span className="admin-connection-status flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300">
                <span className="relative flex size-2"><span className="admin-status-ping absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="admin-status-dot relative size-2 rounded-full bg-emerald-400" /></span>
                {ar ? "متصل لحظياً" : "Realtime connected"}
              </span>
              <a href={`/${locale}`} target="_blank" className="focus-ring flex min-h-11 items-center gap-2 border border-white/15 px-4 text-sm hover:bg-white/5">
                <ExternalLink size={16} />{ar ? "عرض الموقع" : "View site"}
              </a>
              <LiquidButton type="button" onClick={() => void signOut(firebaseAuth)} className="admin-logout-button focus-ring flex min-h-11 items-center gap-2 bg-[#771111] px-4 text-sm font-bold text-white hover:bg-[#5b0d0d] hover:text-white [--liquid-button-color:#3f0808] [--liquid-button-hover-color:#fff]">
                <LogOut size={16} />{ar ? "تسجيل الخروج" : "Sign out"}
              </LiquidButton>
            </div>
          </div>
        </header>}

        {agentMode && (
          <div className="relative z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#0a171b]/95 px-3 backdrop-blur sm:px-5">
            <div className="flex min-w-0 items-center gap-2 text-xs sm:text-sm">
              <DropdownMenu dir={ar ? "rtl" : "ltr"}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="focus-ring flex min-h-9 shrink-0 items-center gap-2 rounded-md border border-white/10 bg-white/[.035] px-2.5 font-bold text-white/75 transition duration-200 hover:border-[#b89555]/35 hover:bg-white/[.06] hover:text-white sm:px-3"
                  >
                    <Menu size={16} className="lg:hidden" />
                    <LayoutDashboard size={15} className="hidden lg:block" />
                    <span>{ar ? "الإدارة" : "Admin"}</span>
                    <ChevronDown size={14} className="hidden lg:block opacity-55 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={ar ? "start" : "start"}
                  sideOffset={8}
                  className="admin-switcher-menu w-[min(22rem,calc(100vw-1rem))] rounded-md border border-white/10 bg-[#0b171b]/98 p-2 text-white shadow-[0_24px_80px_rgba(0,0,0,.48)] backdrop-blur-xl"
                >
                  <div className="px-2 pb-2 pt-1">
                    <h3 className="text-sm font-bold text-white">{ar ? "أقسام الإدارة" : "Admin sections"}</h3>
                    <p className="mt-0.5 text-[10px] text-white/35">{ar ? "انتقل مباشرةً إلى أي مساحة عمل" : "Jump directly to any workspace"}</p>
                  </div>
                  <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
                    {tabs.map((item) => {
                      const Icon = item.icon;
                      const active = tab === item.id;
                      return (
                        <DropdownMenuItem
                          key={item.id}
                          onSelect={() => selectTab(item.id)}
                          data-active={active ? "true" : "false"}
                          className={`admin-switcher-item flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-2.5 text-start text-xs font-bold outline-none transition-colors duration-150 sm:text-sm ${active ? "border-[#b89555]/40 bg-[#b89555]/12 text-[#ead39f]" : "border-transparent text-white/65 hover:border-white/10 hover:bg-white/[.045] hover:text-white focus:bg-white/[.055] focus:text-white"}`}
                        >
                          <span className={`admin-switcher-icon grid size-8 shrink-0 place-items-center rounded-md transition-colors ${active ? "bg-[#b89555]/15 text-[#d9bb78]" : "bg-white/[.04] text-white/45"}`}><Icon size={16} /></span>
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {active && <span className="size-1.5 shrink-0 rounded-full bg-[#d0ad69]" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeTogglerButton
                modes={["dark", "light"]}
                direction={ar ? "rtl" : "ltr"}
                aria-label={ar ? "تبديل الوضع الليلي والنهاري" : "Toggle light and dark theme"}
                title={ar ? "تبديل الوضع الليلي والنهاري" : "Toggle light and dark theme"}
                className="admin-theme-toggle min-h-9 border-white/10 bg-white/[.035] text-white/70 hover:bg-white/[.07]"
              />
              <span className="hidden text-white/25 sm:inline">/</span>
              <span className="min-w-0 truncate font-bold text-white/80">{ar ? "الوكيل القانوني" : "Legal agent"}</span>
            </div>
            <span className="hidden text-[10px] text-white/30 md:block">{ar ? "تنقّل بين أقسام المكتب بدون مغادرة مساحة العمل" : "Switch sections without leaving the workspace"}</span>
          </div>
        )}

        {!agentMode && <nav className="mb-6 grid grid-cols-2 border border-white/10 bg-black/20 p-1 min-[460px]:grid-cols-4 lg:grid-cols-7" aria-label={ar ? "أقسام الإدارة" : "Admin sections"}>
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button key={item.id} type="button" onClick={() => selectTab(item.id)} className={`focus-ring relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold leading-tight transition sm:min-h-14 sm:flex-row sm:gap-2 sm:px-2 sm:text-sm ${active ? "admin-tab-active bg-[#771111] text-white shadow-lg" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
                <Icon size={18} />{item.label}
              </button>
            );
          })}
        </nav>}

        <section key={tab} className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${agentMode ? "min-h-0 flex-1 overflow-hidden" : ""}`}>
          {tab === "overview" && <DashboardOverview locale={locale} onOpen={selectTab} />}
          {tab === "integrations" && <GovernmentIntegrationHub locale={locale} />}
          {tab === "roadmap" && <JudicialRoadmap locale={locale} />}
          {tab === "forms" && <GovernmentForms locale={locale} />}
          {tab === "cases" && <CaseManager locale={locale} user={user} />}
          {tab === "directory" && <DirectoryManager locale={locale} user={user} />}
          {tab === "agent" && <LegalAgent locale={locale} user={user} onOpenCases={() => selectTab("cases")} />}
        </section>

        {!agentMode && <aside className="mt-8 border border-amber-300/25 bg-amber-300/[.07] p-4 shadow-lg shadow-black/10 sm:p-5" aria-label={ar ? "الدعم والصيانة" : "Maintenance and support"}>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-[#e2c98f]" size={21} />
              <div>
                <h2 className="admin-support-title text-sm font-bold text-[#f0dca9]">{ar ? "للصيانة أو التبليغ عن عطل" : "Maintenance or report a problem"}</h2>
                <p className="mt-1 text-xs leading-6 text-white/55">{ar ? "تواصل مباشرة مع مبرمج الموقع محمد سعود الرميحي." : "Contact the website developer directly: Mohammed Saud Alromaihi."}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2" dir="ltr">
              <a href="tel:+97337925259" className="focus-ring flex min-h-10 items-center gap-2 border border-white/15 px-3 text-xs font-bold text-white/75 transition hover:border-white/35 hover:bg-white/5" aria-label={ar ? "الاتصال بالمبرمج" : "Call the developer"}>
                <Phone size={15} /> <span>+973 3792 5259</span>
              </a>
              <a href={developerWhatsAppHref} target="_blank" rel="noopener noreferrer" className="focus-ring flex min-h-10 items-center gap-2 border border-emerald-300/30 bg-emerald-300/10 px-3 text-xs font-bold text-emerald-100 transition hover:bg-emerald-300/20" aria-label={ar ? "التواصل مع المبرمج عبر واتساب" : "Contact the developer on WhatsApp"}>
                <MessageCircle size={15} /> <span>WhatsApp</span>
              </a>
              <a href="mailto:alromaihi2224@gmail.com" className="focus-ring flex min-h-10 items-center gap-2 border border-sky-300/25 bg-sky-300/10 px-3 text-xs font-bold text-sky-100 transition hover:bg-sky-300/20" aria-label={ar ? "إرسال بريد إلكتروني للمبرمج" : "Email the developer"}>
                <Mail size={15} /> <span>Email</span>
              </a>
              <a href="https://github.com/msr7799" target="_blank" rel="noopener noreferrer" className="focus-ring flex min-h-10 items-center gap-2 border border-white/15 px-3 text-xs font-bold text-white/75 transition hover:border-white/35 hover:bg-white/5" aria-label={ar ? "فتح حساب المبرمج في GitHub" : "Open the developer's GitHub"}>
                <GitBranch size={15} /> <span>GitHub</span>
              </a>
            </div>
          </div>
        </aside>}
      </div>
    </main>
  );
}
