export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f6f2e9] p-8">
      <div className="container-site animate-pulse">
        <div className="h-24 bg-[#132b32]" />
        <div className="mt-12 h-10 w-2/3 bg-[#ded8cc]" />
        <div className="mt-5 h-5 w-1/2 bg-[#e5dfd4]" />
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-[#e5dfd4]" />
          ))}
        </div>
      </div>
    </div>
  );
}
