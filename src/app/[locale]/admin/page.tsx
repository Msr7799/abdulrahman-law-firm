import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPortal } from "@/components/admin/admin-portal";
import { isLocale } from "@/config/site";

export const metadata: Metadata = {
  title: "الإدارة | Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <AdminPortal locale={locale} />;
}
