"use client";

import * as HoverCard from "@radix-ui/react-hover-card";
import { Clock3, ExternalLink } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { Locale } from "@/config/site";
import { siteConfig } from "@/config/site";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7 fill-current">
      <path d="M16.04 3A12.9 12.9 0 0 0 5 22.57L3.18 29l6.58-1.73A13 13 0 1 0 16.04 3Zm0 23.76a10.7 10.7 0 0 1-5.45-1.49l-.39-.23-3.9 1.03 1.04-3.8-.25-.4a10.75 10.75 0 1 1 8.95 4.89Zm5.9-8.04c-.33-.16-1.91-.94-2.2-1.05-.3-.11-.51-.16-.73.16-.21.33-.83 1.05-1.02 1.27-.19.21-.38.24-.7.08-.33-.16-1.37-.5-2.61-1.61-.97-.86-1.62-1.92-1.81-2.24-.19-.33-.02-.5.14-.66.15-.14.33-.38.49-.57.16-.19.21-.33.32-.54.11-.22.06-.41-.02-.57-.08-.17-.73-1.76-1-2.41-.26-.63-.53-.54-.73-.55h-.62c-.22 0-.57.08-.86.41-.3.32-1.13 1.1-1.13 2.69 0 1.59 1.16 3.12 1.32 3.34.16.22 2.28 3.48 5.52 4.88.77.33 1.37.53 1.84.68.78.25 1.48.21 2.04.13.62-.09 1.91-.78 2.18-1.54.27-.75.27-1.4.19-1.54-.08-.13-.3-.21-.62-.38Z" />
    </svg>
  );
}

export function WhatsAppButton({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const adminRoute = /^\/(ar|en)\/admin(?:\/|$)/.test(pathname);
  const message =
    locale === "ar"
      ? "مرحباً، أود الاستفسار عن الخدمات القانونية."
      : "Hello, I would like to enquire about your legal services.";
  const href = `${siteConfig.contact.whatsapp}?text=${encodeURIComponent(message)}`;

  if (adminRoute) return null;

  return (
    <HoverCard.Root openDelay={160} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={locale === "ar" ? "تحدث مع المحامي عبر واتساب" : "Chat with the lawyer on WhatsApp"}
          className="whatsapp-float focus-ring fixed bottom-24 end-5 z-50 flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_12px_35px_rgba(0,0,0,.28)] transition hover:scale-105 hover:bg-[#1fbd5a] md:bottom-6 md:end-6 md:size-16"
        >
          <span className="absolute inset-0 -z-10 rounded-full bg-[#25d366]/45" />
          <WhatsAppIcon />
        </a>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="top"
          align="end"
          sideOffset={14}
          collisionPadding={16}
          className="hover-card-content z-[80] hidden w-80 overflow-hidden border border-white/10 bg-[#10191b] text-white shadow-2xl md:block"
        >
          <div className="relative h-32 overflow-hidden">
            <Image
              src="/assets/images/social/whatsapp-business.png"
              alt={locale === "ar" ? "معاينة حساب واتساب التجاري" : "WhatsApp Business profile preview"}
              fill
              sizes="320px"
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#10191b] to-transparent" />
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <strong className="block">
                  {locale === "ar" ? "تواصل مباشر مع المكتب" : "Direct office contact"}
                </strong>
                <span className="mt-1 block text-xs text-white/50" dir="ltr">
                  +973 3559 9559
                </span>
              </div>
              <span className="grid size-9 place-items-center rounded-full bg-[#25d366]/15 text-[#40e27a]">
                <WhatsAppIcon />
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/60">
              {locale === "ar"
                ? "ابدأ برسالة مختصرة وسيتواصل معك المكتب لتأكيد التفاصيل. لا ترسل معلومات شديدة السرية."
                : "Start with a brief message and the office will confirm the details. Avoid highly confidential information."}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
              <span className="flex items-center gap-1.5 text-white/45">
                <Clock3 size={13} /> 09:00 — 18:00
              </span>
              <span className="flex items-center gap-1.5 font-bold text-[#40e27a]">
                {locale === "ar" ? "فتح المحادثة" : "Open chat"} <ExternalLink size={13} />
              </span>
            </div>
          </div>
          <HoverCard.Arrow className="fill-[#10191b]" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
