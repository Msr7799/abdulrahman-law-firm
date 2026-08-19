import Link from "next/link";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#132b32] p-6 text-center text-white">
      <div>
        <span className="display text-8xl text-[#b89555]">404</span>
        <h1 className="display mt-6 text-3xl">
          الصفحة غير موجودة · Page not found
        </h1>
        <Link
          href="/ar"
          className="focus-ring mt-8 inline-block bg-[#b89555] px-6 py-4 font-bold text-[#10191b]"
        >
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}
