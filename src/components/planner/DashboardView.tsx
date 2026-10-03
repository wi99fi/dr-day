import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Planner } from "@/lib/use-planner";
import { APPOINTMENT_TYPES, formatArabicNumber, monthHoursByType, parseDate, type AppointmentType } from "@/lib/planner";
import { Panel } from "./ui";

const TYPE_VAR: Record<AppointmentType, string> = {
  hospital: "var(--evt-hospital)", shift: "var(--evt-shift)", ownClinic: "var(--evt-own)", percentageClinic: "var(--evt-percent)",
};
const TREND_MONTHS = 6;

export function DashboardView({ p }: { p: Planner }) {
  const { events } = p;
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });

  const stats = (m: Date) => {
    const inMonth = events.filter((e) => { const d = parseDate(e.date); return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth(); });
    const income = new Map<AppointmentType, number>();
    const visits = new Map<AppointmentType, number>();
    const revenue = inMonth.reduce((s, e) => s + (e.type === "percentageClinic" ? e.revenue : 0), 0);
    for (const e of inMonth) {
      visits.set(e.type, (visits.get(e.type) ?? 0) + 1);
      if (e.type === "percentageClinic") income.set(e.type, (income.get(e.type) ?? 0) + (e.revenue * e.sharePercent) / 100);
    }
    const hours = monthHoursByType(events, m);
    const totalIncome = Array.from(income.values()).reduce((a, b) => a + b, 0);
    const clinics = Array.from(inMonth.filter((e) => e.type === "percentageClinic").reduce((acc, e) => {
      const n = e.clinicName.trim() || "عيادة بدون اسم";
      const c = acc.get(n) ?? { share: 0, revenue: 0, visits: 0 };
      acc.set(n, { share: c.share + (e.revenue * e.sharePercent) / 100, revenue: c.revenue + e.revenue, visits: c.visits + 1 });
      return acc;
    }, new Map<string, { share: number; revenue: number; visits: number }>())).sort((a, b) => b[1].share - a[1].share);
    return { income, visits, hours, totalIncome, revenue, clinics };
  };

  const cur = useMemo(() => stats(month), [events, month]);
  const prev = useMemo(() => stats(new Date(month.getFullYear(), month.getMonth() - 1, 1)), [events, month]);
  const trend = useMemo(() => Array.from({ length: TREND_MONTHS }, (_, i) => {
    const m = new Date(month.getFullYear(), month.getMonth() - (TREND_MONTHS - 1 - i), 1);
    const s = stats(m);
    const row: Record<string, number | string> = { label: m.toLocaleDateString("ar-SY", { month: "short" }), income: Math.round(s.totalIncome * 100) / 100 };
    for (const t of APPOINTMENT_TYPES) row[t.id] = Math.round(((s.hours.get(t.id) ?? 0) / 60) * 10) / 10;
    return row;
  }), [events, month]);

  const change = prev.totalIncome ? ((cur.totalIncome - prev.totalIncome) / prev.totalIncome) * 100 : null;
  const monthLabel = month.toLocaleDateString("ar-SY", { month: "long", year: "numeric" });
  const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, direction: "rtl" as const };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">لوحة الشهر</p>
        <h1 className="text-3xl font-bold">الدخل والساعات</h1>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-card px-2 py-1 shadow-soft">
        <button aria-label="الشهر السابق" className="rounded-lg p-2 hover:bg-muted" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronRight className="h-5 w-5" /></button>
        <span className="font-bold">{monthLabel}</span>
        <button aria-label="الشهر التالي" className="rounded-lg p-2 hover:bg-muted" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronLeft className="h-5 w-5" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Panel className="bg-accent">
          <p className="text-sm text-accent-foreground">حصتك هذا الشهر</p>
          <p className="text-2xl font-bold text-accent-foreground">{formatArabicNumber(cur.totalIncome, 2)}</p>
          {change !== null ? (
            <p className={`mt-1 flex items-center gap-1 text-xs ${change >= 0 ? "text-primary" : "text-destructive"}`}>
              {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {formatArabicNumber(Math.abs(change), 0)}٪ عن الشهر السابق
            </p>
          ) : <p className="mt-1 text-xs text-muted-foreground">لا بيانات للشهر السابق</p>}
        </Panel>
        <Panel>
          <p className="text-sm text-muted-foreground">إجمالي إيراد العيادات</p>
          <p className="text-2xl font-bold">{formatArabicNumber(cur.revenue, 2)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatArabicNumber(Array.from(cur.visits.values()).reduce((a, b) => a + b, 0))} موعد</p>
        </Panel>
      </div>

      <Panel className="space-y-2">
        <h3 className="font-bold">حسب نوع الموعد</h3>
        {APPOINTMENT_TYPES.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${t.cls}`} />
            <span className="flex-1">{t.label}</span>
            <span className="text-muted-foreground">{formatArabicNumber(cur.visits.get(t.id) ?? 0)} موعد · {formatArabicNumber((cur.hours.get(t.id) ?? 0) / 60, 1)} س</span>
            <span className="w-20 text-left font-bold">{t.id === "percentageClinic" ? formatArabicNumber(cur.income.get(t.id) ?? 0, 2) : "—"}</span>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">الدخل يُحسب من مواعيد "عيادة بالنسبة" (الإيراد × نسبتك).</p>
      </Panel>

      {cur.clinics.length ? (
        <Panel className="space-y-2">
          <h3 className="font-bold">حسب العيادة</h3>
          {cur.clinics.map(([n, c]) => (
            <div key={n} className="flex justify-between text-sm">
              <span>{n} <span className="text-muted-foreground">· {formatArabicNumber(c.visits)} موعد</span></span>
              <span className="font-bold">{formatArabicNumber(c.share, 2)}</span>
            </div>
          ))}
        </Panel>
      ) : null}

      <Panel className="space-y-2">
        <h3 className="font-bold">تطور الدخل (آخر {formatArabicNumber(TREND_MONTHS)} أشهر)</h3>
        <div className="h-52" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatArabicNumber(v, 2), "حصتك"]} />
              <Line type="monotone" dataKey="income" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="space-y-2">
        <h3 className="font-bold">ساعات العمل حسب النوع</h3>
        <div className="h-56" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, k: string) => [`${formatArabicNumber(v, 1)} س`, APPOINTMENT_TYPES.find((t) => t.id === k)?.label ?? k]} />
              {APPOINTMENT_TYPES.map((t) => <Bar key={t.id} dataKey={t.id} stackId="h" fill={TYPE_VAR[t.id]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {APPOINTMENT_TYPES.map((t) => <span key={t.id} className="flex items-center gap-1"><span className={`h-2.5 w-2.5 rounded-full ${t.cls}`} />{t.label}</span>)}
        </div>
      </Panel>
    </div>
  );
}
