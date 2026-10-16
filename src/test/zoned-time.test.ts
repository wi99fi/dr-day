import { describe, expect, it } from "vitest";
import { dateKeyInTz, formatHm, zonedToUtcMs } from "@/lib/zoned-time";

describe("zoned time", () => {
  it("converts Damascus wall-clock time to UTC (UTC+3)", () => {
    expect(new Date(zonedToUtcMs("2026-10-16", "17:00", "Asia/Damascus")).toISOString()).toBe("2026-10-16T14:00:00.000Z");
  });
  it("handles daylight saving in New York", () => {
    expect(new Date(zonedToUtcMs("2026-01-15", "09:00", "America/New_York")).toISOString()).toBe("2026-01-15T14:00:00.000Z");
    expect(new Date(zonedToUtcMs("2026-07-15", "09:00", "America/New_York")).toISOString()).toBe("2026-07-15T13:00:00.000Z");
  });
  it("round-trips date key and time", () => {
    const t = zonedToUtcMs("2026-03-01", "00:10", "Asia/Riyadh");
    expect(dateKeyInTz(t, "Asia/Riyadh")).toBe("2026-03-01");
    expect(formatHm(t, "Asia/Riyadh")).toBe("00:10");
    expect(dateKeyInTz(t, "UTC")).toBe("2026-02-28");
  });
});
