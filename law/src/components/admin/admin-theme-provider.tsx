"use client";

import { ThemeProvider } from "next-themes";

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="law-admin-theme" disableTransitionOnChange={false}>{children}</ThemeProvider>;
}
