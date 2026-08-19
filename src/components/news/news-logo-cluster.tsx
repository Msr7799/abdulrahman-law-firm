import type { LegalNewsItem, LegalNewsLogo } from "@/types/legal-news";

function uniqueLogos(item: LegalNewsItem) {
  const raw: LegalNewsLogo[] = [];
  if (item.sourceLogo) raw.push(item.sourceLogo);
  else if (item.sourceLogoUrl) raw.push({ name: item.sourceLogoName || item.sourceName, url: item.sourceLogoUrl, role: "source" });
  raw.push(...(item.relatedLogos ?? []));
  const seen = new Set<string>();
  return raw.filter((logo) => {
    const key = logo.url || logo.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 4);
}

export function getLegalNewsLogos(item: LegalNewsItem) {
  return uniqueLogos(item);
}

export function NewsLogoCluster({ item, mode = "panel" }: { item: LegalNewsItem; mode?: "panel" | "overlay" | "compact" }) {
  const logos = uniqueLogos(item);
  if (!logos.length) return null;

  if (mode === "overlay") {
    return (
      <div className="absolute start-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 sm:start-4 sm:top-4">
        {logos.slice(0, 3).map((logo) => (
          <div key={logo.url} title={logo.name} className="grid h-12 min-w-14 place-items-center rounded-md border border-white/75 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur sm:h-14 sm:min-w-16">
            <img src={logo.url} alt={logo.name} className="max-h-8 max-w-16 object-contain sm:max-h-9 sm:max-w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (mode === "compact") {
    return (
      <div className="flex h-full w-full items-center justify-center gap-2 bg-[#fffdf8] p-3">
        {logos.slice(0, 3).map((logo) => (
          <div key={logo.url} title={logo.name} className="grid h-20 min-w-20 flex-1 place-items-center rounded-md border border-[#ded8cc] bg-white p-2 shadow-sm">
            <img src={logo.url} alt={logo.name} className="max-h-14 max-w-full object-contain" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,#fffdf8_0%,#f4efe5_64%,#e9e0d2_100%)] p-6 sm:p-10">
      <div className={`grid w-full max-w-3xl gap-3 ${logos.length === 1 ? "grid-cols-1" : logos.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
        {logos.slice(0, 3).map((logo, index) => (
          <div key={logo.url} title={logo.name} className={`flex min-h-32 items-center justify-center rounded-md border border-[#ded8cc] bg-white/95 p-4 shadow-sm sm:min-h-40 ${logos.length === 1 ? "mx-auto w-full max-w-md" : ""}`}>
            <img src={logo.url} alt={logo.name} className={`${logos.length === 1 ? "max-h-40 max-w-[78%] sm:max-h-52" : "max-h-24 max-w-[90%] sm:max-h-32"} object-contain drop-shadow-sm`} />
            {index === 0 && logo.role === "source" ? <span className="sr-only">Source</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
