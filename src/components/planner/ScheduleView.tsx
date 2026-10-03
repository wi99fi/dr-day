import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, CloudOff, LogOut, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Planner } from "@/lib/use-planner";
import {
  APPOINTMENT_TYPES, appointmentType, dateKey, formatArabicNumber, formatTime, groupTimeline, hasConflicts,
  MAX_REPEAT_WEEKS, monthCells, monthHoursByType, newId, parseDate, segmentOnDate, shiftDate, startMinute, toNumber,
  WEEKDAY_LABELS, type AppointmentType, type PlannerEvent,
} from "@/lib/planner";
import { Chip, Field, Panel, PrimaryButton, Sheet } from "./ui";

const HOUR_PX = 36;

export function ScheduleView({ p }: { p: Planner }) {
  const { events } = p;
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [selected, setSelected] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<AppointmentType>("hospital");
  const [date, setDate] = useState(dateKey(new Date()));
  const [start, setStart] = useState("09:00");
  const [hours, setHours] = useState("8");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [clinic, setClinic] = useState("");
  const [share, setShare] = useState("40");
  const [revenue, setRevenue] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [repeatCount, setRepeatCount] = useState("4");
  const [saving, setSaving] = useState(false);

  const cells = useMemo(() => monthCells(month), [month]);
  const dayEvents = useMemo(() => events.filter((e) => segmentOnDate(e, selected)).sort((a, b) => startMinute(a) - startMinute(b)), [events, selected]);
  const positioned = useMemo(() => groupTimeline(events, selected), [events, selected]);
  const conflict = useMemo(() => hasConflicts(events, selected), [events, selected]);
  const dailyMin = dayEvents.reduce((s, e) => { const g = segmentOnDate(e, selected); return s + (g ? g.end - g.start : 0); }, 0);
  const totals = useMemo(() => monthHoursByType(events, month), [events, month]);
  const pct = events.filter((e) => e.type === "percentageClinic" && parseDate(e.date).getFullYear() === month.getFullYear() && parseDate(e.date).getMonth() === month.getMonth());
  const monthlyShare = pct.reduce((s, e) => s + (e.revenue * e.sharePercent) / 100, 0);
  const clinicShares = Array.from(pct.reduce((m, e) => { const n = e.clinicName.trim() || "عيادة بدون اسم"; m.set(n, (m.get(n) ?? 0) + (e.revenue * e.sharePercent) / 100); return m; }, new Map<string, number>())).sort((a, b) => b[1] - a[1]);

  const monthLabel = month.toLocaleDateString("ar-SY", { month: "long", year: "numeric" });
  const selectedLabel = selected.toLocaleDateString("ar-SY", { weekday: "long", day: "numeric", month: "long" });
  const todayKey = dateKey(new Date());

  const openNew = () => {
    setEditingId(null); setType("hospital"); setDate(dateKey(selected)); setStart("09:00"); setHours("8");
    setPlace(""); setNote(""); setClinic(""); setShare("40"); setRevenue(""); setRepeat(false); setRepeatCount("4"); setOpen(true);
  };
  const openEdit = (e: PlannerEvent) => {
    setEditingId(e.id); setType(e.type); setDate(e.date); setStart(e.startTime); setHours(String(e.durationMinutes / 60));
    setPlace(e.place); setNote(e.note); setClinic(e.clinicName); setShare(String(e.sharePercent)); setRevenue(String(e.revenue)); setRepeat(false); setOpen(true);
  };
  const changeType = (t: AppointmentType) => { setType(t); setHours(String(appointmentType(t).defaultDurationMinutes / 60)); };

  const save = async (): Promise<void> => {
    if (saving) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { toast.error("تاريخ غير صالح"); return; }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)) { toast.error("وقت غير صالح"); return; }
    const h = toNumber(hours);
    const isPct = type === "percentageClinic";
    const percent = isPct ? toNumber(share) : 0;
    const income = isPct ? toNumber(revenue || "0") : 0;
    if (!Number.isFinite(h) || h <= 0 || h > 48) { toast.error("اختر مدة بين نصف ساعة و48 ساعة."); return; }
    if (isPct && (!clinic.trim() || !Number.isFinite(percent) || percent < 0 || percent > 100 || !Number.isFinite(income) || income < 0))
      { toast.error("أدخل اسم العيادة ونسبة صحيحة وإيراداً لا يقل عن صفر."); return; }
    const repeats = repeat && !editingId ? Math.max(1, Math.min(MAX_REPEAT_WEEKS, Math.floor(toNumber(repeatCount) || 1))) : 1;
    const base = parseDate(date);
    const items: PlannerEvent[] = Array.from({ length: repeats }, (_, i) => ({
      id: i === 0 && editingId ? editingId : newId(),
      date: dateKey(shiftDate(base, i * 7)),
      startTime: start, durationMinutes: Math.round(h * 60), type,
      place: place.trim(), note: note.trim(),
      clinicName: isPct ? clinic.trim() : "", sharePercent: percent, revenue: income,
    }));
    const next = editingId ? events.map((e) => (e.id === editingId ? items[0] : e)) : [...items, ...events];
    setSaving(true);
    try { await p.saveEvents(next); setOpen(false); setEditingId(null); setSelected(base); }
    catch { toast.error("تعذر حفظ الموعد. تحقق من اتصالك."); }
    finally { setSaving(false); }
  };

  const remove = async (e: PlannerEvent) => {
    if (!confirm(`حذف الموعد؟\n${appointmentType(e.type).label} · ${e.date}`)) return;
    try { await p.saveEvents(events.filter((i) => i.id !== e.id)); setOpen(false); } catch { toast.error("تعذر الحذف."); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">جدولك الطبي</p>
          <h1 className="text-3xl font-bold">منظّم يوم الطبيب</h1>
        </div>
        <button aria-label="تسجيل الخروج" className="rounded-xl p-2.5 text-muted-foreground hover:bg-muted"
          onClick={() => confirm("تسجيل الخروج؟ ستبقى بياناتك محفوظة في حسابك.") && supabase.auth.signOut()}>
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {p.isError ? <button onClick={() => p.reload()} className="flex items-center gap-2 text-sm text-destructive"><CloudOff className="h-4 w-4" />تعذر الاتصال · اضغط لإعادة المحاولة</button> : null}

      <Panel className="p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <button aria-label="الشهر السابق" className="rounded-lg p-2 hover:bg-muted" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronRight className="h-5 w-5" /></button>
          <span className="font-bold">{monthLabel}</span>
          <button aria-label="الشهر التالي" className="rounded-lg p-2 hover:bg-muted" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronLeft className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-7 text-center text-[11px] text-muted-foreground">
          {WEEKDAY_LABELS.map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d) => {
            const k = dateKey(d);
            const inMonth = d.getMonth() === month.getMonth();
            const isSel = k === dateKey(selected);
            const types = Array.from(new Set(events.filter((e) => segmentOnDate(e, d)).map((e) => e.type)));
            return (
              <button key={k} onClick={() => setSelected(d)}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm transition ${isSel ? "bg-primary text-primary-foreground" : k === todayKey ? "bg-accent font-bold text-accent-foreground" : "hover:bg-muted"} ${inMonth ? "" : "opacity-35"}`}>
                <span>{formatArabicNumber(d.getDate())}</span>
                <span className="flex h-1.5 gap-0.5">{types.slice(0, 4).map((t) => <span key={t} className={`h-1.5 w-1.5 rounded-full ${appointmentType(t).cls}`} />)}</span>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{selectedLabel}</h2>
          <p className="text-sm text-muted-foreground">{dayEvents.length ? `${formatArabicNumber(dailyMin / 60, 1)} ساعة عمل` : "يوم فارغ"}</p>
        </div>
        <PrimaryButton className="w-auto" onClick={openNew}><Plus className="h-4 w-4" />موعد</PrimaryButton>
      </div>
      {conflict ? <div className="flex items-center gap-2 rounded-xl bg-warning/15 px-3 py-2 text-sm text-warning-foreground"><AlertTriangle className="h-4 w-4" />يوجد تعارض بين مواعيد هذا اليوم</div> : null}

      {dayEvents.length ? (
        <Panel className="p-0">
          <div className="max-h-[420px] overflow-y-auto">
            <div className="relative" style={{ height: 24 * HOUR_PX }}>
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="absolute inset-x-0 border-t border-border/60" style={{ top: h * HOUR_PX }}>
                  <span className="absolute right-2 -translate-y-1/2 bg-card px-1 text-[10px] text-muted-foreground">{formatTime(h * 60)}</span>
                </div>
              ))}
              <div className="absolute inset-y-0 left-2 right-14">
                {positioned.map(({ event, start: s, end, lane, laneCount }) => (
                  <button key={event.id} onClick={() => openEdit(event)}
                    className={`absolute overflow-hidden rounded-lg px-2 py-1 text-right text-xs text-primary-foreground shadow-soft ${appointmentType(event.type).cls}`}
                    style={{ top: (s / 60) * HOUR_PX, height: Math.max(20, ((end - s) / 60) * HOUR_PX - 2), right: `${(lane / laneCount) * 100}%`, width: `calc(${100 / laneCount}% - 4px)` }}>
                    <div className="font-semibold">{event.type === "percentageClinic" && event.clinicName ? event.clinicName : appointmentType(event.type).label}</div>
                    <div className="opacity-90">{formatTime(startMinute(event))} – {formatTime(startMinute(event) + event.durationMinutes)}{event.place ? ` · ${event.place}` : ""}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      ) : null}

      <Panel className="space-y-3">
        <h3 className="font-bold">ملخص {monthLabel}</h3>
        <div className="grid grid-cols-2 gap-2">
          {APPOINTMENT_TYPES.map((t) => (
            <div key={t.id} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
              <span className={`h-2.5 w-2.5 rounded-full ${t.cls}`} />
              <span className="flex-1 text-sm">{t.label}</span>
              <span className="text-sm font-bold">{formatArabicNumber((totals.get(t.id) ?? 0) / 60, 1)} س</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-accent p-3">
          <p className="text-sm text-accent-foreground">حصتك من العيادات بالنسبة</p>
          <p className="text-2xl font-bold text-accent-foreground">{formatArabicNumber(monthlyShare, 2)}</p>
          {clinicShares.map(([n, v]) => (
            <div key={n} className="mt-1 flex justify-between text-sm text-accent-foreground"><span>{n}</span><span>{formatArabicNumber(v, 2)}</span></div>
          ))}
        </div>
      </Panel>

      <Sheet open={open} title={editingId ? "تعديل الموعد" : "موعد جديد"} onClose={() => setOpen(false)}
        footer={<div className="flex gap-2">
          {editingId ? <PrimaryButton variant="secondary" className="w-auto" onClick={() => { const e = events.find((i) => i.id === editingId); if (e) remove(e); }}><Trash2 className="h-4 w-4" /></PrimaryButton> : null}
          <PrimaryButton onClick={save} disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ الموعد"}</PrimaryButton>
        </div>}>
        <div className="flex flex-wrap gap-2">
          {APPOINTMENT_TYPES.map((t) => <Chip key={t.id} active={type === t.id} onClick={() => changeType(t.id)} colorClass={t.cls}>{t.label}</Chip>)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="التاريخ" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Field label="وقت البدء" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <Field label="المدة (ساعات)" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
        <Field label="المكان" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="اختياري" />
        {type === "percentageClinic" ? (
          <>
            <Field label="اسم العيادة" value={clinic} onChange={(e) => setClinic(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="نسبتك %" inputMode="decimal" value={share} onChange={(e) => setShare(e.target.value)} />
              <Field label="الإيراد" inputMode="decimal" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
            </div>
            {revenue ? <p className="text-sm text-muted-foreground">حصتك: {formatArabicNumber((toNumber(revenue) * toNumber(share)) / 100 || 0, 2)}</p> : null}
          </>
        ) : null}
        <Field label="ملاحظة" value={note} onChange={(e) => setNote(e.target.value)} placeholder="اختياري" />
        {!editingId ? (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} className="h-4 w-4 accent-primary" />
              تكرار أسبوعي
            </label>
            {repeat ? <Field label={`عدد الأسابيع (حتى ${MAX_REPEAT_WEEKS})`} inputMode="numeric" value={repeatCount} onChange={(e) => setRepeatCount(e.target.value)} /> : null}
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
