"use client";

import { useState } from "react";
import type { User } from "firebase/auth";
import { signOut } from "firebase/auth";
import Image from "next/image";
import { Bot, BriefcaseBusiness, ExternalLink, FileCheck2, LayoutDashboard, LogOut, PhoneCall, Route, ShieldCheck } from "lucide-react";
import type { Locale } from "@/config/site";
import { firebaseAuth } from "@/lib/firebase/client";
import { CaseManager } from "@/components/admin/case-manager";
import { DirectoryManager } from "@/components/admin/directory-manager";
import { LegalAgent } from "@/components/admin/legal-agent";
import { DashboardOverview } from "@/components/admin/dashboard-overview";
import { JudicialRoadmap } from "@/components/admin/judicial-roadmap";
import { GovernmentForms } from "@/components/admin/government-forms";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";

type Tab = "overview" | "roadmap" | "forms" | "cases" | "directory" | "agent";
const validTabs = new Set<Tab>(["overview", "roadmap", "forms", "cases", "directory", "agent"]);

export function AdminDashboard({ locale, user, initialTab }: { locale: Locale; user: User; initialTab: string }) {
  const ar = locale === "ar";
  const [tab, setTab] = useState<Tab>(validTabs.has(initialTab as Tab) ? initialTab as Tab : "overview");
  const tabs = [
    { id: "overview" as const, label: ar ? "نظرة عامة" : "Overview", icon: LayoutDashboard },
    { id: "roadmap" as const, label: ar ? "خارطة القضاء" : "Roadmap", icon: Route },
    { id: "forms" as const, label: ar ? "النماذج" : "Forms", icon: FileCheck2 },
    { id: "cases" as const, label: ar ? "القضايا" : "Cases", icon: BriefcaseBusiness },
    { id: "directory" as const, label: ar ? "دليل المحامي" : "Legal directory", icon: PhoneCall },
    { id: "agent" as const, label: ar ? "الوكيل القانوني" : "Legal agent", icon: Bot },
  ];

  function selectTab(nextTab: Tab) {
    setTab(nextTab);
    const url = new URL(window.location.href);
    url.searchParams.set("adminTab", nextTab);
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <main id="main" className="admin-grid-bg min-h-[calc(100vh-5rem)] bg-[#091b21] text-white">
      <div className="container-site py-8 sm:py-12">
        <header className="mb-8 border border-white/10 bg-[#102a31]/90 p-5 shadow-2xl shadow-black/20 sm:p-7">
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
              <span className="flex items-center gap-2 border border-emerald-400/20 bg-emerald-400/8 px-4 py-2 text-xs text-emerald-300">
                <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative size-2 rounded-full bg-emerald-400" /></span>
                {ar ? "متصل لحظياً" : "Realtime connected"}
              </span>
              <a href={`/${locale}`} target="_blank" className="focus-ring flex min-h-11 items-center gap-2 border border-white/15 px-4 text-sm hover:bg-white/5">
                <ExternalLink size={16} />{ar ? "عرض الموقع" : "View site"}
              </a>
              <LiquidButton type="button" onClick={() => void signOut(firebaseAuth)} className="focus-ring flex min-h-11 items-center gap-2 bg-[#b89555] px-4 text-sm font-bold text-[#091b21] hover:bg-[#d1b579]">
                <LogOut size={16} />{ar ? "تسجيل الخروج" : "Sign out"}
              </LiquidButton>
            </div>
          </div>
        </header>

        <nav className="mb-6 grid grid-cols-3 border border-white/10 bg-black/20 p-1 sm:grid-cols-6" aria-label={ar ? "أقسام الإدارة" : "Admin sections"}>
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <LiquidButton key={item.id} type="button" onClick={() => selectTab(item.id)} className={`focus-ring relative flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold leading-tight transition sm:min-h-14 sm:flex-row sm:gap-2 sm:px-2 sm:text-sm ${active ? "bg-[#b89555] text-[#091b21] shadow-lg" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
                <Icon size={18} />{item.label}
              </LiquidButton>
            );
          })}
        </nav>

        <section key={tab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {tab === "overview" && <DashboardOverview locale={locale} onOpen={selectTab} />}
          {tab === "roadmap" && <JudicialRoadmap locale={locale} />}
          {tab === "forms" && <GovernmentForms locale={locale} />}
          {tab === "cases" && <CaseManager locale={locale} user={user} />}
          {tab === "directory" && <DirectoryManager locale={locale} user={user} />}
          {tab === "agent" && <LegalAgent locale={locale} user={user} onOpenCases={() => selectTab("cases")} />}
        </section>
      </div>
    </main>
  );
}
