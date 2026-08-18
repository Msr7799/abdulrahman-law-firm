"use client";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#132b32] p-6 text-center text-white">
      <div>
        <h1 className="display text-3xl">
          تعذر تحميل الصفحة · Something went wrong
        </h1>
        <LiquidButton
          onClick={reset}
          className="focus-ring mt-8 bg-[#b89555] px-6 py-4 font-bold text-[#10191b]"
        >
          المحاولة مرة أخرى · Try again
        </LiquidButton>
      </div>
    </main>
  );
}
