"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DayPicker } from "react-day-picker";
import { arSA, enUS } from "react-day-picker/locale";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MessageCircle,
} from "lucide-react";
import type { Locale } from "@/config/site";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";
import { businessConfig, consultationSlots } from "@/config/business";
import {
  consultationSchema,
  type ConsultationInput,
} from "@/lib/consultation-schema";

type BookingResult = {
  reference: string;
  whatsappUrl: string;
  notificationSent: boolean;
};

function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function BookingForm({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const reduceMotion = useReducedMotion();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [result, setResult] = useState<BookingResult | null>(null);
  const [serverError, setServerError] = useState("");
  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);
  const endMonth = useMemo(() => {
    const value = new Date(today);
    value.setMonth(value.getMonth() + 3);
    return value;
  }, [today]);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConsultationInput>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      locale,
      contactMethod: "whatsapp",
      consent: undefined,
      website: "",
      date: "",
      time: "",
    },
  });
  const selectedTime = useWatch({ control, name: "time" });
  const slots = consultationSlots();

  function unavailable(date: Date) {
    return (
      !businessConfig.workingDays.includes(date.getDay()) ||
      businessConfig.blockedDates.includes(dateValue(date))
    );
  }

  function chooseDate(date?: Date) {
    setSelectedDate(date);
    setValue("date", date ? dateValue(date) : "", { shouldValidate: true });
    setValue("time", "", { shouldValidate: false });
  }

  async function submit(data: ConsultationInput) {
    setServerError("");
    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message);
      setResult({
        reference: body.reference,
        whatsappUrl: body.whatsappUrl,
        notificationSent: body.notificationSent,
      });
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : ar
            ? "تعذر إرسال الطلب."
            : "Unable to submit request.",
      );
    }
  }

  if (result) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden text-center"
      >
        <div className="bg-[#132b32] px-8 py-10 text-white">
          <CheckCircle2 className="mx-auto text-[#d0ad69]" size={54} />
          <h2 className="display mt-5 text-3xl">
            {ar ? "تم تسجيل طلب الموعد" : "Appointment request recorded"}
          </h2>
          <p className="mt-3 text-white/60" dir="ltr">
            {result.reference}
          </p>
        </div>
        <div className="p-7 sm:p-10">
          <p className="mx-auto max-w-xl leading-8 text-[#657073]">
            {result.notificationSent
              ? ar
                ? "تم إرسال تفاصيل الطلب إلى واتساب المكتب. سيتواصل معك المكتب لتأكيد الموعد."
                : "The request was sent to the office WhatsApp. The office will contact you to confirm."
              : ar
                ? "بقيت خطوة واحدة: اضغط الزر لإرسال تفاصيل الموعد إلى واتساب المكتب. لا يصبح الموعد مؤكداً إلا بعد رد المكتب."
                : "One step remains: send the appointment details to the office on WhatsApp. The appointment is confirmed only after the office replies."}
          </p>
          {!result.notificationSent && (
            <LiquidButton asChild className="focus-ring mx-auto mt-7 min-h-13 bg-[#16a765] px-7 font-bold text-white">
              <a href={result.whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle size={21} />
                {ar ? "إرسال الموعد عبر واتساب" : "Send appointment on WhatsApp"}
              </a>
            </LiquidButton>
          )}
        </div>
      </motion.div>
    );
  }

  const input =
    "focus-ring mt-2 min-h-12 w-full border border-[#cfc8ba] bg-white px-4 text-[#10191b]";
  const fieldError = (key: keyof typeof errors) =>
    errors[key] && (
      <span className="mt-1 block text-xs text-red-700">
        {ar ? "يرجى التحقق من هذا الحقل." : "Please check this field."}
      </span>
    );
  const formattedDate = selectedDate?.toLocaleDateString(
    ar ? "ar-BH" : "en-BH",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  );

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="card overflow-hidden"
      noValidate
    >
      <input {...register("locale")} type="hidden" />
      <input {...register("date")} type="hidden" />
      <input {...register("time")} type="hidden" />
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input {...register("website")} tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="border-b border-[#ded8cc] bg-[#132b32] px-6 py-6 text-white sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#d0ad69]">
              {ar ? "الخطوة 01" : "STEP 01"}
            </p>
            <h2 className="display mt-2 text-2xl">
              {ar ? "اختر الموعد المناسب" : "Choose a suitable time"}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/55">
            <Clock3 size={16} />
            {ar ? "مدة الموعد 30 دقيقة" : "30-minute appointment"}
          </div>
        </div>
      </div>

      <div className="grid border-b border-[#ded8cc] lg:grid-cols-[1.1fr_.9fr]">
        <div className="booking-calendar min-w-0 border-b border-[#ded8cc] p-3 sm:p-8 lg:border-e lg:border-b-0">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={chooseDate}
            locale={ar ? arSA : enUS}
            weekStartsOn={0}
            startMonth={today}
            endMonth={endMonth}
            disabled={[{ before: today }, unavailable]}
            showOutsideDays
            animate
          />
          {fieldError("date")}
        </div>
        <div className="bg-[#f5f1e8] p-6 sm:p-8">
          <h3 className="flex items-center gap-2 font-bold">
            <Clock3 size={18} className="text-[#9a783f]" />
            {ar ? "الأوقات المتاحة" : "Available times"}
          </h3>
          <p className="mt-2 text-sm text-[#657073]">
            {selectedDate
              ? formattedDate
              : ar
                ? "اختر يوماً من التقويم أولاً"
                : "Select a day from the calendar first"}
          </p>
          <div className="mt-5 grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pe-1 sm:grid-cols-4 lg:grid-cols-3">
            {slots.map((slot) => (
              <motion.button
                key={slot}
                type="button"
                disabled={!selectedDate}
                whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                onClick={() => setValue("time", slot, { shouldValidate: true })}
                className={`focus-ring min-h-11 border text-sm font-semibold transition ${selectedTime === slot ? "border-[#132b32] bg-[#132b32] text-white" : "border-[#d5cdbc] bg-white hover:border-[#b89555] disabled:cursor-not-allowed disabled:opacity-35"}`}
              >
                {selectedTime === slot && (
                  <Check className="me-1 inline" size={14} />
                )}
                {slot}
              </motion.button>
            ))}
          </div>
          {fieldError("time")}
          <AnimatePresence>
            {selectedDate && selectedTime && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 border-s-4 border-[#b89555] bg-white p-4"
              >
                <p className="text-xs font-bold text-[#9a783f]">
                  {ar ? "موعدك المختار" : "Your selection"}
                </p>
                <p className="mt-1 text-sm font-bold">
                  {formattedDate} · <span dir="ltr">{selectedTime}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-10">
        <div className="sm:col-span-2">
          <p className="text-xs font-bold text-[#9a783f]">
            {ar ? "الخطوة 02" : "STEP 02"}
          </p>
          <h2 className="display mt-2 text-2xl">
            {ar
              ? "بيانات التواصل وموضوع الاستشارة"
              : "Contact and consultation details"}
          </h2>
        </div>
        <label className="text-sm font-bold">
          {ar ? "الاسم الكامل" : "Full name"}
          <input {...register("name")} className={input} autoComplete="name" />
          {fieldError("name")}
        </label>
        <label className="text-sm font-bold">
          {ar ? "رقم الهاتف" : "Phone number"}
          <input
            {...register("phone")}
            className={input}
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+973"
          />
          {fieldError("phone")}
        </label>
        <label className="text-sm font-bold">
          {ar ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}
          <input
            {...register("email")}
            className={input}
            dir="ltr"
            type="email"
            autoComplete="email"
          />
          {fieldError("email")}
        </label>
        <label className="text-sm font-bold">
          {ar ? "نوع الاستشارة" : "Consultation type"}
          <select {...register("type")} className={input}>
            <option value="">—</option>
            <option value="office">{ar ? "في المكتب" : "In office"}</option>
            <option value="phone">{ar ? "هاتفية" : "By phone"}</option>
            <option value="remote">{ar ? "عن بُعد" : "Remote"}</option>
          </select>
          {fieldError("type")}
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          {ar ? "موضوع الاستشارة" : "Consultation subject"}
          <input {...register("subject")} className={input} />
          {fieldError("subject")}
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          {ar ? "نبذة مختصرة" : "Short description"}
          <textarea
            {...register("description")}
            className={`${input} min-h-32 py-3`}
            maxLength={1200}
          />
          {fieldError("description")}
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-bold">
            {ar ? "طريقة التواصل المفضلة" : "Preferred contact method"}
          </legend>
          <div className="mt-3 flex flex-wrap gap-5">
            {(
              [
                ["whatsapp", ar ? "واتساب" : "WhatsApp"],
                ["phone", ar ? "الهاتف" : "Phone"],
                ["email", ar ? "البريد الإلكتروني" : "Email"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input
                  {...register("contactMethod")}
                  value={value}
                  type="radio"
                />
                {label}
              </label>
            ))}
          </div>
          {fieldError("contactMethod")}
        </fieldset>
        <div className="sm:col-span-2 border-s-4 border-amber-600 bg-amber-50 p-4 text-sm leading-7">
          <AlertTriangle className="mb-2 text-amber-700" size={20} />
          {ar
            ? "لا ترسل مستندات أو معلومات شديدة السرية عبر نموذج الحجز العام."
            : "Do not submit highly confidential documents or details through this general booking form."}
        </div>
        <label className="flex items-start gap-3 text-sm sm:col-span-2">
          <input
            {...register("consent")}
            type="checkbox"
            className="mt-1 size-5"
          />
          <span>
            {ar
              ? "أوافق على استخدام بياناتي للتواصل بخصوص هذا الطلب وفق سياسة الخصوصية."
              : "I consent to the use of my data to respond to this request under the Privacy Policy."}
          </span>
        </label>
        {fieldError("consent")}
        {serverError && (
          <p role="alert" className="text-sm text-red-700 sm:col-span-2">
            {serverError}
          </p>
        )}
        <LiquidButton
          disabled={isSubmitting}
          className="focus-ring flex min-h-14 items-center justify-center gap-2 bg-[#b89555] px-6 font-bold disabled:cursor-wait disabled:opacity-60 sm:col-span-2"
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" size={19} />
          ) : (
            <CalendarDays size={19} />
          )}
          {ar ? "تسجيل طلب الموعد" : "Register appointment request"}
        </LiquidButton>
        <p className="text-center text-xs leading-6 text-[#657073] sm:col-span-2">
          {ar
            ? "الموعد المقترح لا يصبح مؤكداً إلا بعد موافقة المكتب عبر واتساب أو الهاتف."
            : "The proposed time is confirmed only after the office approves it by WhatsApp or phone."}
        </p>
      </div>
    </form>
  );
}
