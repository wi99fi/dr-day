import { CalculationMethod, Coordinates, PrayerTimes } from "adhan";
import { dateKey, shiftDate, type PlannerEvent } from "./planner";

// Damascus by default.
const COORDS = new Coordinates(33.5138, 36.2765);
const NAMES = [["fajr", "الفجر"], ["dhuhr", "الظهر"], ["asr", "العصر"], ["maghrib", "المغرب"], ["isha", "العشاء"]] as const;

export const isPrayerTimeEvent = (e: PlannerEvent) => e.id.startsWith("auto-prayer-");

export function prayerEventsFor(date: Date): PlannerEvent[] {
  const t = new PrayerTimes(COORDS, date, CalculationMethod.MuslimWorldLeague());
  const key = dateKey(date);
  return NAMES.map(([k, label]) => {
    const d = t[k];
    return {
      id: `auto-prayer-${key}-${k}`, date: key,
      startTime: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      durationMinutes: 15, type: "prayer", place: "", note: "", clinicName: "", sharePercent: 0, revenue: 0,
      activityName: `صلاة ${label}`,
    };
  });
}

export function prayerEventsAround(date: Date) {
  return [-1, 0, 1].flatMap((o) => prayerEventsFor(shiftDate(date, o)));
}
