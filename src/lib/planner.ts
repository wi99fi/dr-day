export type AppointmentType = "hospital" | "shift" | "ownClinic" | "percentageClinic";

export type PlannerEvent = {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  type: AppointmentType;
  place: string;
  note: string;
  clinicName: string;
  sharePercent: number;
  revenue: number;
};
export type PlannerTask = { id: string; text: string; done: boolean; dueDate: string | null };
export type ShoppingCategory = "pharmacy" | "home" | "clinic" | null;
export type ShoppingItem = { id: string; text: string; done: boolean; category: ShoppingCategory };

export const APPOINTMENT_TYPES: { id: AppointmentType; label: string; cls: string; defaultDurationMinutes: number }[] = [
  { id: "hospital", label: "دوام مشفى", cls: "evt-hospital", defaultDurationMinutes: 480 },
  { id: "shift", label: "مناوبة", cls: "evt-shift", defaultDurationMinutes: 1440 },
  { id: "ownClinic", label: "عيادتي", cls: "evt-own", defaultDurationMinutes: 120 },
  { id: "percentageClinic", label: "عيادة بالنسبة", cls: "evt-percent", defaultDurationMinutes: 120 },
];
export const WEEKDAY_LABELS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
export const SHOPPING_CATEGORIES = [
  { id: "pharmacy", label: "صيدلية" },
  { id: "home", label: "منزل" },
  { id: "clinic", label: "عيادة" },
] as const;
export const MAX_REPEAT_WEEKS = 20;

export const appointmentType = (t: AppointmentType) => APPOINTMENT_TYPES.find((i) => i.id === t) ?? APPOINTMENT_TYPES[0];
export const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function parseDate(v: string) {
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function shiftDate(date: Date, days: number) {
  const n = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  n.setDate(n.getDate() + days);
  return n;
}
export function monthCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = shiftDate(first, -((first.getDay() + 1) % 7));
  return Array.from({ length: 42 }, (_, i) => shiftDate(start, i));
}
export function formatTime(minutes: number) {
  const n = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}
export function startMinute(e: PlannerEvent) {
  const [h, m] = e.startTime.split(":").map(Number);
  return h * 60 + m;
}
export function segmentOnDate(e: PlannerEvent, date: Date) {
  const diff = Math.round(
    (new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - parseDate(e.date).getTime()) / 86400000,
  );
  const start = startMinute(e) - diff * 1440;
  const end = start + e.durationMinutes;
  if (end <= 0 || start >= 1440) return null;
  return { start: Math.max(0, start), end: Math.min(1440, end) };
}
export function monthHoursByType(events: PlannerEvent[], month: Date) {
  const totals = new Map<string, number>();
  for (const e of events) {
    const s = parseDate(e.date);
    for (let o = 0; o < Math.ceil(e.durationMinutes / 1440) + 1; o++) {
      const day = shiftDate(s, o);
      if (day.getFullYear() !== month.getFullYear() || day.getMonth() !== month.getMonth()) continue;
      const seg = segmentOnDate(e, day);
      if (seg) totals.set(e.type, (totals.get(e.type) ?? 0) + seg.end - seg.start);
    }
  }
  return totals;
}
export const formatArabicNumber = (v: number, max = 0) =>
  new Intl.NumberFormat("ar-SY", { maximumFractionDigits: max }).format(v);

export function groupTimeline(events: PlannerEvent[], date: Date) {
  const rows = events
    .map((event) => ({ event, segment: segmentOnDate(event, date) }))
    .filter((r): r is { event: PlannerEvent; segment: { start: number; end: number } } => r.segment !== null)
    .sort((a, b) => a.segment.start - b.segment.start || b.segment.end - a.segment.end);
  const out: { event: PlannerEvent; start: number; end: number; lane: number; laneCount: number }[] = [];
  let group: typeof rows = [];
  let groupEnd = -1;
  const flush = () => {
    if (!group.length) return;
    const ends: number[] = [];
    const placed = group.map((row) => {
      let lane = ends.findIndex((e) => e <= row.segment.start);
      if (lane < 0) lane = ends.length;
      ends[lane] = row.segment.end;
      return { row, lane };
    });
    for (const p of placed)
      out.push({ event: p.row.event, start: p.row.segment.start, end: p.row.segment.end, lane: p.lane, laneCount: ends.length });
    group = [];
    groupEnd = -1;
  };
  for (const row of rows) {
    if (group.length && row.segment.start >= groupEnd) flush();
    group.push(row);
    groupEnd = Math.max(groupEnd, row.segment.end);
  }
  flush();
  return out;
}
export function hasConflicts(events: PlannerEvent[], date: Date) {
  const iv = events
    .map((e) => segmentOnDate(e, date))
    .filter((i): i is { start: number; end: number } => i !== null)
    .sort((a, b) => a.start - b.start);
  return iv.some((it, i) => i > 0 && it.start < iv[i - 1].end);
}
export function toNumber(value: string) {
  return Number(
    value
      .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/٬/g, "")
      .replace(/٫/g, "."),
  );
}
