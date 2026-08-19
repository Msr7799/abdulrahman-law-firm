import type { Metadata } from "next";
import { Inter, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
const arFont = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-ar",
  display: "swap",
});
const enFont = Inter({
  subsets: ["latin"],
  variable: "--font-en",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: "Abdulrahman Almawdah",
  description: "Lawyer & Legal Consultant in Bahrain",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${arFont.variable} ${enFont.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
