// Time-zone helpers built on Intl only (no dependencies), safe on server and client.

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(tz: string) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    fmtCache.set(tz, f);
  }
  return f;
}

function parts(utcMs: number, tz: string) {
  const out: Record<string, number> = {};
  for (const p of fmt(tz).formatToParts(new Date(utcMs))) if (p.type !== "literal") out[p.type] = Number(p.value);
  return {
    year: out["year"] ?? 0, month: out["month"] ?? 1, day: out["day"] ?? 1,
    hour: (out["hour"] ?? 0) % 24, minute: out["minute"] ?? 0, second: out["second"] ?? 0,
  };
}

/** Offset (ms) of `tz` from UTC at the given instant. */
export function tzOffsetMs(utcMs: number, tz: string): number {
  const p = parts(utcMs, tz);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(utcMs / 1000) * 1000;
}

/** Converts a wall-clock date ("YYYY-MM-DD") and time ("HH:MM") in `tz` to a UTC timestamp (ms). */
export function zonedToUtcMs(date: string, time: string, tz: string): number {
  const [y = 1970, m = 1, d = 1] = date.split("-").map(Number);
  const [h = 0, mi = 0] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const first = guess - tzOffsetMs(guess, tz);
  const second = guess - tzOffsetMs(first, tz);
  return second;
}

/** "YYYY-MM-DD" of the instant as seen in `tz`. */
export function dateKeyInTz(utcMs: number, tz: string): string {
  const p = parts(utcMs, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** "HH:MM" of the instant as seen in `tz`. */
export function formatHm(utcMs: number, tz: string): string {
  const p = parts(utcMs, tz);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

export function isValidTimeZone(tz: string): boolean {
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; }
}
