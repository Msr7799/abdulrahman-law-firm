"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { ThemeToggler, type ThemeDirection, type ThemeSelection, type ResolvedTheme } from "@/components/animate-ui/primitives/effects/theme-toggler";
import { cn } from "@/lib/utils";

type ThemeTogglerButtonProps = ComponentProps<"button"> & {
  modes?: ThemeSelection[];
  direction?: ThemeDirection;
  onImmediateChange?: (theme: ThemeSelection) => void;
};

export function ThemeTogglerButton({ modes = ["light", "dark"], direction = "ltr", onImmediateChange, onClick, className, ...props }: ThemeTogglerButtonProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // next-themes resolves localStorage only in the browser. Render a deterministic
  // placeholder on the server and during the first client pass so hydration is identical.
  if (!mounted) {
    return <button {...props} type="button" data-slot="theme-toggler-button" tabIndex={-1} disabled className={cn("focus-ring grid size-11 shrink-0 place-items-center rounded-full border border-current/20 opacity-70", className)}><Moon size={18} /></button>;
  }

  const effective = (theme || "dark") as ThemeSelection;
  const resolved = (resolvedTheme || "dark") as ResolvedTheme;
  return <ThemeToggler theme={effective} resolvedTheme={resolved} setTheme={setTheme} direction={direction} onImmediateChange={onImmediateChange}>{({ effective: active, resolved: activeResolved, toggleTheme }) => {
    const shown = modes.includes("system") ? active : activeResolved;
    const index = modes.indexOf(active);
    const next = modes[index < 0 ? 0 : (index + 1) % modes.length];
    return <button type="button" data-slot="theme-toggler-button" onClick={(event) => { onClick?.(event); toggleTheme(next); }} className={cn("focus-ring grid size-11 shrink-0 place-items-center rounded-full border border-current/20 transition hover:scale-105", className)} {...props}>{shown === "dark" ? <Moon size={18} /> : <Sun size={18} />}</button>;
  }}</ThemeToggler>;
}
