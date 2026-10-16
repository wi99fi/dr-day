import { describe, expect, it } from "vitest";
import { computeDue } from "@/lib/push/due";
import { zonedToUtcMs } from "@/lib/zoned-time";
import type { PlannerEvent } from "@/lib/planner";

const TZ = "Asia/Damascus";
const ev = (over: Partial<PlannerEvent>): PlannerEvent => ({
  id: "e1", date: "2026-10-16", startTime: "17:00", durationMinutes: 30, type: "ownClinic", place: "", note: "", clinicName: "", sharePercent: 0, revenue: 0, ...over,
});
const at = (hm: string, date = "2026-10-16") => zonedToUtcMs(date, hm, TZ);

describe("computeDue", () => {
  it("fires only inside the lead window", () => {
    const base = { events: [ev({})], prayers: [], tz: TZ, leadMinutes: 10, sentKeys: [] as string[] };
    expect(computeDue({ ...base, now: at("16:49") })).toHaveLength(0);
    expect(computeDue({ ...base, now: at("16:51") })).toHaveLength(1);
    expect(computeDue({ ...base, now: at("17:00") })).toHaveLength(0);
  });
  it("does not repeat a reminder already sent, and skips done events", () => {
    const now = at("16:55");
    const first = computeDue({ events: [ev({})], prayers: [], tz: TZ, leadMinutes: 10, now, sentKeys: [] });
    expect(computeDue({ events: [ev({})], prayers: [], tz: TZ, leadMinutes: 10, now, sentKeys: [first[0]!.key] })).toHaveLength(0);
    expect(computeDue({ events: [ev({ done: true })], prayers: [], tz: TZ, leadMinutes: 10, now, sentKeys: [] })).toHaveLength(0);
  });
  it("covers events just after midnight tomorrow and prayers", () => {
    const events = [ev({ id: "e2", date: "2026-10-17", startTime: "00:05" })];
    const prayers = [{ id: "maghrib", label: "صلاة المغرب", at: at("17:12"), date: "2026-10-16" }];
    const out = computeDue({ events, prayers, tz: TZ, leadMinutes: 15, now: at("23:55"), sentKeys: [] });
    expect(out).toHaveLength(1);
    const prayerOut = computeDue({ events, prayers, tz: TZ, leadMinutes: 15, now: at("17:00"), sentKeys: [] });
    expect(prayerOut[0]!.body).toContain("صلاة المغرب");
  });
  it("is off when lead is 0", () => {
    expect(computeDue({ events: [ev({})], prayers: [], tz: TZ, leadMinutes: 0, now: at("16:59"), sentKeys: [] })).toHaveLength(0);
  });
});
