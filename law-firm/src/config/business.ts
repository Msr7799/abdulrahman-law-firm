export const businessConfig = {
  timezone: "Asia/Bahrain",
  open: "09:00",
  close: "18:00",
  appointmentMinutes: 30,
  workingDays: [0, 1, 2, 3, 4] as number[],
  blockedDates: [] as string[],
};

export function consultationSlots() {
  const slots: string[] = [];
  const [openHour, openMinute] = businessConfig.open.split(":").map(Number);
  const [closeHour, closeMinute] = businessConfig.close.split(":").map(Number);
  let current = openHour * 60 + openMinute;
  const close = closeHour * 60 + closeMinute;
  while (current + businessConfig.appointmentMinutes <= close) {
    slots.push(
      `${String(Math.floor(current / 60)).padStart(2, "0")}:${String(current % 60).padStart(2, "0")}`,
    );
    current += businessConfig.appointmentMinutes;
  }
  return slots;
}
