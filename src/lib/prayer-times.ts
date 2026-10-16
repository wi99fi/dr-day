import { CalculationMethod, Coordinates, Madhab, PrayerTimes, type CalculationParameters } from "adhan";
import { dateKey, shiftDate, type PlannerEvent } from "./planner";
import { CUSTOM_CITY_ID, DEFAULT_CITY_ID, findCity } from "./cities";
import { formatHm, isValidTimeZone } from "./zoned-time";

export type PrayerMethodId = "mwl" | "egyptian" | "ummalqura" | "turkey" | "dubai" | "kuwait" | "qatar";
export type PrayerMadhab = "shafi" | "hanafi";
export type PrayerSettings = { cityId: string; lat: number; lng: number; tz: string; method: PrayerMethodId; madhab: PrayerMadhab };

export const PRAYER_METHODS: { id: PrayerMethodId; label: string }[] = [
  { id: "mwl", label: "رابطة العالم الإسلامي" },
  { id: "egyptian", label: "الهيئة المصرية العامة للمساحة" },
  { id: "ummalqura", label: "أم القرى (مكة)" },
  { id: "turkey", label: "رئاسة الشؤون الدينية التركية" },
  { id: "dubai", label: "دبي" },
  { id: "kuwait", label: "الكويت" },
  { id: "qatar", label: "قطر" },
];

const METHOD_FACTORY: Record<PrayerMethodId, () => CalculationParameters> = {
  mwl: CalculationMethod.MuslimWorldLeague,
  egyptian: CalculationMethod.Egyptian,
  ummalqura: CalculationMethod.UmmAlQura,
  turkey: CalculationMethod.Turkey,
  dubai: CalculationMethod.Dubai,
  kuwait: CalculationMethod.Kuwait,
  qatar: CalculationMethod.Qatar,
};

// Same behaviour as before this change: Damascus + Muslim World League.
export const DEFAULT_PRAYER_SETTINGS: PrayerSettings = {
  cityId: DEFAULT_CITY_ID, lat: 33.5138, lng: 36.2765, tz: "Asia/Damascus", method: "mwl", madhab: "shafi",
};

export const PRAYER_SETTINGS_KEY = "dr-day-prayer-settings";
export const PRAYER_SETTINGS_EVENT = "prayer-settings-change";

const NAMES = [["fajr", "الفجر"], ["dhuhr", "الظهر"], ["asr", "العصر"], ["maghrib", "المغرب"], ["isha", "العشاء"]] as const;

export const isPrayerTimeEvent = (e: PlannerEvent) => e.id.startsWith("auto-prayer-");

export function sanitizePrayerSettings(v: unknown): PrayerSettings {
  const o = (v && typeof v === "object" ? v : {}) as Partial<Record<keyof PrayerSettings, unknown>>;
  const d = DEFAULT_PRAYER_SETTINGS;
  const lat = typeof o.lat === "number" && Math.abs(o.lat) <= 90 ? o.lat : d.lat;
  const lng = typeof o.lng === "number" && Math.abs(o.lng) <= 180 ? o.lng : d.lng;
  const tz = typeof o.tz === "string" && isValidTimeZone(o.tz) ? o.tz : d.tz;
  const method = typeof o.method === "string" && o.method in METHOD_FACTORY ? (o.method as PrayerMethodId) : d.method;
  const madhab: PrayerMadhab = o.madhab === "hanafi" ? "hanafi" : "shafi";
  const cityId = typeof o.cityId === "string" && (o.cityId === CUSTOM_CITY_ID || findCity(o.cityId)) ? o.cityId : d.cityId;
  return { cityId, lat, lng, tz, method, madhab };
}

export function loadPrayerSettings(): PrayerSettings {
  if (typeof localStorage === "undefined") return DEFAULT_PRAYER_SETTINGS;
  try {
    const raw = localStorage.getItem(PRAYER_SETTINGS_KEY);
    return raw ? sanitizePrayerSettings(JSON.parse(raw)) : DEFAULT_PRAYER_SETTINGS;
  } catch {
    return DEFAULT_PRAYER_SETTINGS;
  }
}

export function savePrayerSettings(s: PrayerSettings) {
  localStorage.setItem(PRAYER_SETTINGS_KEY, JSON.stringify(sanitizePrayerSettings(s)));
  window.dispatchEvent(new Event(PRAYER_SETTINGS_EVENT));
}

export type PrayerInstant = { id: string; label: string; at: number };

/** Absolute prayer instants (UTC ms) for the calendar day of `date`. */
export function prayerInstants(date: Date, s: PrayerSettings): PrayerInstant[] {
  const params = METHOD_FACTORY[s.method]();
  params.madhab = s.madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  const t = new PrayerTimes(new Coordinates(s.lat, s.lng), date, params);
  return NAMES.map(([k, label]) => ({ id: k, label: `صلاة ${label}`, at: t[k].getTime() }));
}

export function prayerEventsForSettings(date: Date, s: PrayerSettings): PlannerEvent[] {
  const key = dateKey(date);
  return prayerInstants(date, s).map((p) => ({
    id: `auto-prayer-${key}-${p.id}`, date: key, startTime: formatHm(p.at, s.tz),
    durationMinutes: 15, type: "prayer", place: "", note: "", clinicName: "", sharePercent: 0, revenue: 0,
    activityName: p.label,
  }));
}

export function prayerEventsFor(date: Date): PlannerEvent[] {
  return prayerEventsForSettings(date, loadPrayerSettings());
}

export function prayerEventsAround(date: Date) {
  return [-1, 0, 1].flatMap((o) => prayerEventsFor(shiftDate(date, o)));
}
