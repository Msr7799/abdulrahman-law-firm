import Image from "next/image";
import type { LegalNewsItem, LegalNewsLogo } from "@/types/legal-news";
import { bahrainLogoCatalog } from "@/data/bahrain-logo-catalog";

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


const governmentLogo = bahrainLogoCatalog.find((logo) => logo.name === "Government of Bahrain");

export function getLegalNewsLogos(item: LegalNewsItem) {
  return uniqueLogos(item);
}

export function NewsLogoCluster({ item, mode = "panel" }: { item: LegalNewsItem; mode?: "panel" | "overlay" | "compact" }) {
  const logos = uniqueLogos(item);
  const gov = governmentLogo;
  const displayLogos = logos.filter((logo) => logo.url !== gov?.url && logo.name !== gov?.name);

  if (mode === "overlay") {
    if (!displayLogos.length) return null;
    return (
      <div className="absolute start-4 top-4 z-20 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-2 sm:start-5 sm:top-5 sm:gap-2.5">
        {displayLogos.slice(0, 3).map((logo) => (
          <div key={logo.url} title={logo.name} className="grid h-16 min-w-20 place-items-center rounded-md border border-white/80 bg-white/95 px-3 py-2 shadow-xl backdrop-blur sm:h-20 sm:min-w-24">
            <Image src={logo.url} alt={logo.name} width={112} height={56} unoptimized className="h-auto w-auto max-h-11 max-w-24 object-contain sm:max-h-14 sm:max-w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (mode === "compact") {
    return (
      <div className="admin-news-logo-fallback relative flex h-full min-h-60 w-full items-center justify-center overflow-hidden bg-[#fffdf8] p-5">
        {gov && <Image src={gov.url} alt="Government of Bahrain" width={360} height={176} unoptimized className="h-auto w-auto max-h-44 max-w-[58%] object-contain opacity-95" />}
        {!!displayLogos.length && (
          <div className="absolute end-3 top-3 flex max-w-[58%] flex-wrap justify-end gap-2">
            {displayLogos.slice(0, 3).map((logo) => (
              <div key={logo.url} title={logo.name} className="grid h-16 min-w-20 place-items-center rounded-md border border-[#ded8cc] bg-white/95 px-2.5 py-2 shadow-md">
                <Image src={logo.url} alt={logo.name} width={96} height={44} unoptimized className="h-auto w-auto max-h-11 max-w-24 object-contain" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_center,#fffdf8_0%,#f4efe5_64%,#e9e0d2_100%)]">
      <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12">
        {gov ? (
          <Image src={gov.url} alt="Government of Bahrain" width={520} height={280} unoptimized className="h-auto w-auto max-h-[58%] max-w-[70%] object-contain drop-shadow-sm" />
        ) : null}
      </div>
      {!!displayLogos.length && (
        <div className="absolute end-4 top-4 z-10 flex max-w-[70%] flex-wrap justify-end gap-2 sm:end-6 sm:top-6 sm:gap-3">
          {displayLogos.slice(0, 3).map((logo) => (
            <div key={logo.url} title={logo.name} className="grid h-20 min-w-24 place-items-center rounded-md border border-[#ded8cc] bg-white/96 px-3 py-2 shadow-lg sm:h-24 sm:min-w-28">
              <Image src={logo.url} alt={logo.name} width={128} height={64} unoptimized className="h-auto w-auto max-h-14 max-w-28 object-contain sm:max-h-16 sm:max-w-32" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
