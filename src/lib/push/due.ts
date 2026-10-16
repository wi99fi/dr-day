import { eventLabel, type PlannerEvent } from "../planner";
import { dateKeyInTz, formatHm, zonedToUtcMs } from "../zoned-time";

export type PrayerInstantLite = { id: string; label: string; at: number; date: string };
export type Due = { key: string; body: string };

type Input = {
  events: PlannerEvent[];
  prayers: PrayerInstantLite[]; // absolute instants for today/tomorrow
  tz: string; // device time zone the appointment times are written in
  leadMinutes: number;
  now: number; // UTC ms
  sentKeys: string[];
};

/** Reminders that should go out right now: start is in the future but within `leadMinutes`. */
export function computeDue({ events, prayers, tz, leadMinutes, now, sentKeys }: Input): Due[] {
  if (leadMinutes <= 0) return [];
  const today = dateKeyInTz(now, tz);
  const tomorrow = dateKeyInTz(now + 24 * 3600_000, tz);
  const sent = new Set(sentKeys);
  const out: Due[] = [];

  const consider = (key: string, label: string, startMs: number, hm: string) => {
    const diff = (startMs - now) / 60_000;
    if (diff <= 0 || diff > leadMinutes || sent.has(key)) return;
    out.push({ key, body: `${label} بعد ${Math.ceil(diff)} دقيقة (${hm})` });
  };

  for (const e of events) {
    if (e.done || (e.date !== today && e.date !== tomorrow)) continue;
    consider(`${e.id}-${e.date}-${e.startTime}`, eventLabel(e), zonedToUtcMs(e.date, e.startTime, tz), e.startTime);
  }
  for (const p of prayers) consider(`prayer-${p.date}-${p.id}`, p.label, p.at, formatHm(p.at, tz));
  return out;
}
