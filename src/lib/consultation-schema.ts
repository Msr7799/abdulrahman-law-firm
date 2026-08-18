import { z } from "zod";
import { consultationSlots, businessConfig } from "@/config/business";
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export const consultationSchema = z.object({
  locale: z.enum(["ar", "en"]),
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(25)
    .regex(/^[+\d\s()-]+$/),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  date: z
    .string()
    .regex(datePattern)
    .refine((v) => {
      const d = new Date(`${v}T00:00:00Z`);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      return d >= today;
    }, "Date must be today or later")
    .refine((v) => {
      const d = new Date(`${v}T00:00:00Z`);
      return (
        businessConfig.workingDays.includes(d.getUTCDay()) &&
        !businessConfig.blockedDates.includes(v)
      );
    }, "Date is unavailable"),
  time: z
    .string()
    .refine((v) => consultationSlots().includes(v), "Invalid time"),
  type: z.enum(["office", "phone", "remote"]),
  subject: z.string().trim().min(3).max(140),
  description: z.string().trim().min(10).max(1200),
  contactMethod: z.enum(["phone", "whatsapp", "email"]),
  consent: z.literal(true),
  website: z.string().max(200).optional(),
});
export type ConsultationInput = z.infer<typeof consultationSchema>;
