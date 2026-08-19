import { businessConfig } from "@/config/business";

export function isOfficeOpen(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: businessConfig.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  const [oh, om] = businessConfig.open.split(":").map(Number);
  const [ch, cm] = businessConfig.close.split(":").map(Number);
  return (
    businessConfig.workingDays.includes(dayMap[get("weekday")]) &&
    minutes >= oh * 60 + om &&
    minutes < ch * 60 + cm
  );
}
