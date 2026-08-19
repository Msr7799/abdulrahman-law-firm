"use client";

import * as HoverCard from "@radix-ui/react-hover-card";
import { AtSign, ExternalLink, MapPin } from "lucide-react";
import Image from "next/image";
import type { Locale } from "@/config/site";
import { siteConfig } from "@/config/site";

export function InstagramHoverCard({ locale }: { locale: Locale }) {
  const ar = locale === "ar";

  return (
    <HoverCard.Root openDelay={120} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <a
          href={siteConfig.contact.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="social-trigger focus-ring group inline-flex min-h-12 items-center justify-center gap-2 border border-[#132b32]/20 px-6 py-3 text-sm font-bold text-[#132b32]"
        >
          <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white transition-transform group-hover:rotate-6 group-hover:scale-110">
            <AtSign size={15} />
          </span>
          @{siteConfig.contact.instagramUsername}
        </a>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="top"
          align="start"
          sideOffset={12}
          collisionPadding={16}
          className="hover-card-content z-[80] w-[min(360px,calc(100vw-2rem))] overflow-hidden border border-white/10 bg-[#0d1217] text-white shadow-2xl"
        >
          <div className="relative aspect-[2.17/1] overflow-hidden">
            <Image
              src="/assets/images/social/instagram-profile.png"
              alt={ar ? "معاينة حساب المحامي في إنستغرام" : "Lawyer's Instagram profile preview"}
              fill
              sizes="360px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1217] via-transparent to-transparent" />
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <strong className="block text-base">@ar599559</strong>
                <span className="text-xs text-white/50">
                  {ar ? "الحساب المهني الموثق لدينا" : "Verified professional channel"}
                </span>
              </div>
              <span className="grid size-9 place-items-center rounded-full bg-white/10 text-[#d1b579]">
                <AtSign size={17} />
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/65">
              {ar
                ? "تابع تحديثات المكتب، المعلومات القانونية، وقنوات التواصل المعتمدة مع المحامي."
                : "Follow office updates, legal information, and the lawyer's verified contact channels."}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
              <span className="flex items-center gap-1.5 text-white/50">
                <MapPin size={13} /> {siteConfig.country[locale]}
              </span>
              <span className="flex items-center gap-1.5 font-bold text-[#d1b579]">
                {ar ? "فتح الحساب" : "Open profile"} <ExternalLink size={13} />
              </span>
            </div>
          </div>
          <HoverCard.Arrow className="fill-[#0d1217]" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
