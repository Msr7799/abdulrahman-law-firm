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
    primary: "bg-[#b89555] text-[#10191b] hover:bg-[#cfb274]",
    secondary: "border border-[#b89555]/60 text-[#f6f2e9] hover:bg-white/10",
    light:
      "border border-[#132b32]/20 text-[#132b32] hover:bg-[#132b32] hover:text-white",
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
