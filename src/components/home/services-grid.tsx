import { Building2, Landmark, MessagesSquare, Scale } from "lucide-react";
import type { ComponentType } from "react";
import type { Locale } from "@/config/site";
import { services, serviceLabel } from "@/data/services";

const icons: Record<string, ComponentType<{ size?: number }>> = {
  consultation: MessagesSquare,
  notary: Landmark,
  companies: Building2,
  execution: Scale,
};

export function ServicesGrid({ locale }: { locale: Locale }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {services.map((service, i) => {
        const Icon = icons[service.icon];
        return (
          <article
            key={service.icon}
            className="service-card card group relative overflow-hidden p-7 transition-all duration-300 hover:-translate-y-1.5"
          >
            <span className="absolute end-5 top-4 text-5xl font-black text-[#132b32]/[.035] transition-colors group-hover:text-[#b89555]/10">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="mb-8 grid size-12 place-items-center border border-[#b89555]/45 text-[#9a783f] transition-all duration-300 group-hover:rotate-3 group-hover:border-[#b89555] group-hover:bg-[#b89555] group-hover:text-[#10191b]">
              <Icon size={22} />
            </span>
            <h3 className="text-lg font-bold">
              {serviceLabel(service, locale)}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#657073]">
              {locale === "ar"
                ? "يُحدّد نطاق الخدمة ومدى ملاءمتها بعد الاطلاع الأولي على موضوعك."
                : "Scope and suitability are confirmed after an initial review of your matter."}
            </p>
          </article>
        );
      })}
    </div>
  );
}
