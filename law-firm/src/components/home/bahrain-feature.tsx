"use client";

import Image from "next/image";
import { CalendarCheck2, LockKeyhole, MessageCircle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { Locale } from "@/config/site";

export function BahrainFeature({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const reduceMotion = useReducedMotion();
  const features = [
    {
      icon: MessageCircle,
      title: ar ? "تواصل مباشر" : "Direct contact",
      text: ar
        ? "وصول سريع إلى قنوات المكتب المعتمدة."
        : "Fast access to the office's official channels.",
    },
    {
      icon: CalendarCheck2,
      title: ar ? "حجز منظم" : "Guided booking",
      text: ar
        ? "اختر التاريخ والوقت عبر تجربة واضحة."
        : "Choose a date and time through a clear flow.",
    },
    {
      icon: LockKeyhole,
      title: ar ? "خصوصية أولاً" : "Privacy first",
      text: ar
        ? "نطلب فقط المعلومات الأولية اللازمة."
        : "Only essential initial information is requested.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#0d2329] py-20 text-white">
      <motion.div
        aria-hidden="true"
        className="absolute -end-24 -top-36 size-96 rounded-full bg-[#b89555]/10 blur-3xl"
        animate={
          reduceMotion ? undefined : { scale: [1, 1.15, 1], x: [0, -24, 0] }
        }
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="container-site relative grid items-center gap-10 lg:grid-cols-[.72fr_1.28fr]">
        <motion.div
          initial={
            reduceMotion ? false : { opacity: 0, scale: 0.92, rotate: -3 }
          }
          whileInView={
            reduceMotion ? undefined : { opacity: 1, scale: 1, rotate: 0 }
          }
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.65 }}
          className="mx-auto grid aspect-square w-full max-w-64 place-items-center border border-white/10 bg-white/[.035] p-8"
        >
          <Image
            src="/assets/logos/bahrain-official-logo.svg"
            alt={ar ? "شعار مملكة البحرين" : "Kingdom of Bahrain emblem"}
            width={190}
            height={240}
            className="max-h-52 w-auto object-contain"
          />
        </motion.div>
        <div>
          <p className="eyebrow">
            {ar ? "في مملكة البحرين" : "In the Kingdom of Bahrain"}
          </p>
          <h2 className="display mt-4 max-w-2xl text-3xl sm:text-5xl">
            {ar
              ? "تجربة قانونية أقرب، أوضح، وأكثر تنظيماً"
              : "A closer, clearer, more organised legal experience"}
          </h2>
          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                whileHover={reduceMotion ? undefined : { y: -6 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.45, delay: index * 0.09 }}
                className="border border-white/10 bg-white/[.045] p-5"
              >
                <feature.icon className="text-[#d0ad69]" size={23} />
                <h3 className="mt-4 font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  {feature.text}
                </p>
              </motion.article>
            ))}
          </div>
          <p className="mt-6 text-xs leading-6 text-white/45">
            {ar
              ? "المكتب مستقل وليس جهة حكومية؛ يُستخدم شعار المملكة للدلالة على نطاق العمل في البحرين فقط."
              : "This is an independent office, not a government entity. The emblem indicates the Bahrain jurisdiction only."}
          </p>
        </div>
      </div>
    </section>
  );
}
