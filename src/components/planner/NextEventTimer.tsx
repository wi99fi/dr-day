import { useEffect, useMemo, useState } from "react";
import { Hourglass, Timer } from "lucide-react";
import { dateKey, eventLabel, formatArabicNumber, parseDate, shiftDate, startMinute, type PlannerEvent } from "@/lib/planner";
import { EventIcon } from "./EventIcon";

function formatRemaining(minutes: number) {
  if (minutes < 60) return `${formatArabicNumber(minutes)} دقيقة`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${formatArabicNumber(h)} س و${formatArabicNumber(m)} د` : `${formatArabicNumber(h)} ساعة`;
}

function eventStart(e: PlannerEvent) {
  const d = parseDate(e.date);
  d.setHours(Math.floor(startMinute(e) / 60), startMinute(e) % 60, 0, 0);
  return d;
}

export function NextEventTimer({ events }: { events: PlannerEvent[] }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 20_000);
    return () => window.clearInterval(t);
  }, []);

  const info = useMemo(() => {
    const today = dateKey(now);
    const tomorrow = dateKey(shiftDate(now, 1));
    const relevant = events.filter((e) => e.date === today || e.date === tomorrow);
    let current: { e: PlannerEvent; leftMin: number } | null = null;
    let next: { e: PlannerEvent; inMin: number } | null = null;
    for (const e of relevant) {
      const start = eventStart(e);
      const end = new Date(start.getTime() + e.durationMinutes * 60_000);
      if (now >= start && now < end) {
        const leftMin = Math.max(1, Math.round((end.getTime() - now.getTime()) / 60_000));
        if (!current || leftMin < current.leftMin) current = { e, leftMin };
      } else if (start > now) {
        const inMin = Math.round((start.getTime() - now.getTime()) / 60_000);
        if (!next || inMin < next.inMin) next = { e, inMin };
      }
    }
    return current ?? next;
  }, [events, now]);

  if (!info) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Hourglass className="h-4 w-4" />
        <span>لا مواعيد قريبة اليوم أو غداً</span>
      </div>
    );
  }

  const isCurrent = "leftMin" in info;
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-accent px-3.5 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-primary">
        <EventIcon type={info.e.type} activityIcon={info.e.activityIcon} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-accent-foreground">{eventLabel(info.e)}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          {isCurrent ? `جارٍ الآن · بقي ${formatRemaining(info.leftMin)}` : `يبدأ بعد ${formatRemaining(info.inMin)}`}
        </p>
      </div>
    </div>
  );
}
