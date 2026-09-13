import { addMinutes, isAfter, parse, format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

export function calculateAvailableSlots({
  date,
  timezone,
  durationMinutes,
  bufferMinutes,
  weeklySchedule,
  exceptions,
  existingAppointments,
  minNoticeHours,
  now,
}: any) {
  if (exceptions.some((e: any) => e.isBlocked && !e.startTime)) return [];
  const availableSlots: any[] = [];
  const dateStr = format(date, "yyyy-MM-dd");
  const earliestAllowedUtc = addMinutes(now, minNoticeHours * 60);

  for (const block of weeklySchedule) {
    const blockStartLocal = parse(`${dateStr} ${block.startTime}`, "yyyy-MM-dd HH:mm", new Date());
    const blockEndLocal = parse(`${dateStr} ${block.endTime}`, "yyyy-MM-dd HH:mm", new Date());
    let current = blockStartLocal;

    while (true) {
      const currentEnd = addMinutes(current, durationMinutes);
      if (isAfter(currentEnd, blockEndLocal)) break;

      const slotStartUtc = fromZonedTime(current, timezone);
      const slotEndUtc = fromZonedTime(currentEnd, timezone);

      if (isAfter(slotStartUtc, earliestAllowedUtc)) {
        const conflict = existingAppointments.some((appt: any) => (
          slotStartUtc < appt.endTime && slotEndUtc > appt.startTime
        ));
        if (!conflict) {
          availableSlots.push({
            startTime: slotStartUtc,
            endTime: slotEndUtc,
            formattedLocal: format(current, "HH:mm"),
          });
        }
      }
      current = addMinutes(currentEnd, bufferMinutes);
    }
  }
  return availableSlots;
}