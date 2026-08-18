import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPortal } from "@/components/admin/admin-portal";
import { isLocale } from "@/config/site";

export const metadata: Metadata = {
  title: "الإدارة | Admin",
  robots: { index: false, follow: false, nocache: true },
};

const adminTabs = new Set(["overview", "roadmap", "forms", "cases", "directory", "agent"]);

export default async function AdminPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ adminTab?: string | string[] }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const requestedTab = (await searchParams).adminTab;
  const initialTab = typeof requestedTab === "string" && adminTabs.has(requestedTab) ? requestedTab : "overview";
  return <AdminPortal locale={locale} initialTab={initialTab} />;
}
