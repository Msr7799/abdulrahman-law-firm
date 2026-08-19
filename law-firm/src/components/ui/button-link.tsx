import Link from "next/link";
import { cn } from "@/lib/utils";
export function ButtonLink({
  href,
  children,
  variant = "primary",
  external = false,
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "light";
  external?: boolean;
  className?: string;
}) {
  const styles = {
    primary: "bg-[#b89555] text-[#10191b]",
    secondary: "border border-[#b89555]/60 text-[#f6f2e9] hover:bg-white/10",
    light:
      "border border-[#132b32]/20 hover:bg-[#132b32]/20 rounded-md bg-[#132b32]/30 text-[#f6f2e9] !hover:text-[#b89555]",
  };
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "action-button focus-ring inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden px-6 py-3 text-sm font-bold transition-all duration-300",
        styles[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
