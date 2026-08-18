"use client";

import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Pause,
  Play,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Locale } from "@/config/site";
import { siteConfig } from "@/config/site";
import { getMessages } from "@/messages";
import { ButtonLink } from "@/components/ui/button-link";

const heroImages = [
  "/assets/images/profile/17-enhanced.webp",
  "/assets/images/professional/oath-ceremony-enhanced.webp",
] as const;

export function Hero({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const reduceMotion = useReducedMotion();
  const [activeImage, setActiveImage] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const timer = window.setInterval(
      () => setActiveImage((current) => (current + 1) % heroImages.length),
      5500,
    );
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion]);

  return (
    <MotionConfig reducedMotion="user">
      <section className="hero-grid relative overflow-hidden bg-[#132b32] text-white">
        <div className="hero-orb absolute -end-24 top-1/4 size-80 rounded-full bg-[#b89555]/10 blur-3xl" />
        <div className="container-site relative grid min-h-[720px] items-center gap-14 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <p className="eyebrow mb-6">{m.hero.eyebrow}</p>
            <div className="gold-rule mb-8" />
            <h1 className="display text-4xl sm:text-5xl lg:text-7xl">
              {m.hero.title}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
              {m.hero.text}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={`/${locale}/consultation`}>
                <CalendarDays size={18} />
                {m.hero.book}
                <Arrow size={17} />
              </ButtonLink>
              <ButtonLink
                href={siteConfig.contact.googleMaps}
                variant="secondary"
                external
              >
                <MapPin size={18} />
                {m.hero.location}
              </ButtonLink>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-xl"
          >
            <div className="absolute -inset-4 border border-[#b89555]/25" />
            <div className="relative aspect-[4/3] overflow-hidden bg-[#0d1f24] shadow-2xl">
              <AnimatePresence initial={false} mode="sync">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.985 }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <Image
                    src={heroImages[activeImage]}
                    alt={
                      locale === "ar"
                        ? "مناسبة مهنية رسمية"
                        : "A formal professional occasion"
                    }
                    fill
                    priority
                    sizes="(min-width: 1024px) 540px, 92vw"
                    className="object-cover object-center"
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-[#071216]/65 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 p-5">
                <div
                  className="flex items-center gap-2"
                  role="tablist"
                  aria-label={locale === "ar" ? "صور مهنية" : "Professional images"}
                >
                  {heroImages.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      role="tab"
                      aria-selected={activeImage === index}
                      aria-label={`${locale === "ar" ? "عرض الصورة" : "Show image"} ${index + 1}`}
                      onClick={() => setActiveImage(index)}
                      className={`focus-ring h-1.5 rounded-full transition-all ${activeImage === index ? "w-9 bg-[#d1b579]" : "w-4 bg-white/45 hover:bg-white/75"}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPaused((value) => !value)}
                  className="focus-ring grid size-10 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/60"
                  aria-label={
                    paused
                      ? locale === "ar"
                        ? "تشغيل عرض الصور"
                        : "Play slideshow"
                      : locale === "ar"
                        ? "إيقاف عرض الصور"
                        : "Pause slideshow"
                  }
                >
                  {paused ? <Play size={15} /> : <Pause size={15} />}
                </button>
              </div>
            </div>
            <div className="absolute -bottom-4 end-5 bg-[#b89555] px-4 py-2 text-[11px] font-bold text-[#10191b] shadow-lg">
              {locale === "ar" ? "من الحضور المهني" : "Professional moments"}
            </div>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}
