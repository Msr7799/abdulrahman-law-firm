import Image from "next/image";
import type { Locale } from "@/config/site";

export function ServicesVisuals({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const visuals = [
    {
      src: "/assets/images/services/lady-justice.jpg",
      alt: ar ? "تمثال العدالة والميزان" : "Lady Justice and scales",
      caption: ar ? "العدالة والوضوح" : "Justice & clarity",
    },
    {
      src: "/assets/images/services/gavel-law-book.jpg",
      alt: ar ? "مطرقة القضاء وكتاب قانوني" : "Gavel and law book",
      caption: ar ? "عناية بالتفاصيل" : "Attention to detail",
    },
  ];
  return (
    <div className="mb-10 grid gap-4 md:grid-cols-2">
      {visuals.map((visual) => (
        <figure
          key={visual.src}
          className="group relative aspect-[3/2] overflow-hidden bg-[#132b32]"
        >
          <Image
            src={visual.src}
            alt={visual.alt}
            fill
            sizes="(min-width: 768px) 50vw, 94vw"
            className="object-cover transition duration-700 group-hover:scale-[1.045] group-hover:brightness-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071316]/65 via-transparent to-transparent" />
          <figcaption className="absolute inset-x-6 bottom-5 font-bold text-white">
            {visual.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
