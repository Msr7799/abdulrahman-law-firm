"use client";

import * as React from "react";
import { flushSync } from "react-dom";

export type ThemeSelection = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type ThemeDirection = "btt" | "ttb" | "ltr" | "rtl";

type ThemeTogglerProps = {
  theme: ThemeSelection;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeSelection) => void;
  direction?: ThemeDirection;
  onImmediateChange?: (theme: ThemeSelection) => void;
  children: (state: { effective: ThemeSelection; resolved: ResolvedTheme; toggleTheme: (theme: ThemeSelection) => void }) => React.ReactNode;
};

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function clipFrames(direction: ThemeDirection): [string, string] {
  if (direction === "rtl") return ["inset(0 0 0 100%)", "inset(0 0 0 0)"];
  if (direction === "ttb") return ["inset(0 0 100% 0)", "inset(0 0 0 0)"];
  if (direction === "btt") return ["inset(100% 0 0 0)", "inset(0 0 0 0)"];
  return ["inset(0 100% 0 0)", "inset(0 0 0 0)"];
}

export function ThemeToggler({ theme, resolvedTheme, setTheme, onImmediateChange, direction = "ltr", children }: ThemeTogglerProps) {
  const [current, setCurrent] = React.useState({ effective: theme, resolved: resolvedTheme });
  const [fromClip, toClip] = clipFrames(direction);

  const toggleTheme = React.useCallback(async (nextTheme: ThemeSelection) => {
    const resolved = nextTheme === "system" ? getSystemTheme() : nextTheme;
    setCurrent({ effective: nextTheme, resolved });
    onImmediateChange?.(nextTheme);
    if (!document.startViewTransition) { setTheme(nextTheme); return; }
    await document.startViewTransition(() => {
      flushSync(() => {
        document.documentElement.classList.toggle("dark", resolved === "dark");
        document.documentElement.classList.toggle("light", resolved === "light");
      });
    }).ready;
    document.documentElement.animate({ clipPath: [fromClip, toClip] }, { duration: 700, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }).finished.finally(() => setTheme(nextTheme));
  }, [fromClip, onImmediateChange, setTheme, toClip]);

  return <>{children({ effective: current.effective, resolved: current.resolved, toggleTheme })}<style>{`::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}`}</style></>;
}
