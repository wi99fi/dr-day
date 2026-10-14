import { useEffect, useRef, useState } from "react";
import { Bell, Download, FileSpreadsheet, Printer, Trash2, Upload, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import type { Planner, WaitlistItem } from "@/lib/use-planner";
import { appointmentType, dateKey, eventLabel, isPersonalActivity, newId, parseDate, toNumber, type PlannerEvent } from "@/lib/planner";
import { Field, PageHeader, Panel, PrimaryButton } from "./ui";
import { EventIcon } from "./EventIcon";

const REMINDER_KEY = "dr-day-reminder-minutes";

export function MoreView({ p }: { p: Planner }) {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="منظّم يوم الطبيب" title="أدوات إضافية" />
      <Waitlist p={p} />
      <Templates p={p} />
      <Reminders />
      <Report p={p} />
      <Backup p={p} />
    </div>
  );
}

function Waitlist({ p }: { p: Planner }) {
  const [patient, setPatient] = useState(""); const [phone, setPhone] = useState(""); const [procedure, setProcedure] = useState(""); const [mins, setMins] = useState("60");
  const [booking, setBooking] = useState<string | null>(null);
  const [date, setDate] = useState(dateKey(new Date())); const [time, setTime] = useState("10:00");
  const add = async () => {
    if (!patient.trim()) { toast.error("أدخل اسم المريض"); return; }
    try { await p.saveWaitlist([{ id: newId(), patient: patient.trim(), phone: phone.trim(), procedure: procedure.trim(), durationMinutes: Math.max(5, Math.round(toNumber(mins) || 60)), note: "" }, ...p.waitlist]); setPatient(""); setPhone(""); setProcedure(""); }
    catch { toast.error("تعذر الحفظ"); }
  };
  const book = async (w: WaitlistItem) => {
    const ev: PlannerEvent = { id: newId(), date, startTime: time, durationMinutes: w.durationMinutes, type: "ownClinic", place: "", note: [w.patient, w.procedure, w.phone].filter(Boolean).join(" · "), clinicName: "", sharePercent: 0, revenue: 0 };
    try { await p.saveEvents([ev, ...p.events]); await p.saveWaitlist(p.waitlist.filter((i) => i.id !== w.id)); setBooking(null); toast.success("تحوّل إلى موعد في الجدول"); }
    catch { toast.error("تعذر إنشاء الموعد"); }
  };
  return (
    <Panel className="space-y-3">
      <h2 className="flex items-center gap-2 font-bold"><Users className="h-5 w-5 text-primary" />قائمة انتظار المرضى</h2>
      <div className="grid grid-cols-2 gap-2">
        <Field label="اسم المريض" value={patient} onChange={(e) => setPatient(e.target.value)} />
        <Field label="الهاتف" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Field label="الإجراء" value={procedure} onChange={(e) => setProcedure(e.target.value)} placeholder="مثل: قلع ضرس عقل" />
        <Field label="المدة (دقائق)" inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value)} />
      </div>
      <PrimaryButton onClick={add}><UserPlus className="h-4 w-4" />إضافة إلى الانتظار</PrimaryButton>
      {p.waitlist.map((w) => (
        <div key={w.id} className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0"><p className="font-medium">{w.patient}</p><p className="text-xs text-muted-foreground">{[w.procedure, w.phone, `${w.durationMinutes} د`].filter(Boolean).join(" · ")}</p></div>
            <div className="flex gap-1">
              <PrimaryButton className="w-auto px-3 text-xs" onClick={() => setBooking(booking === w.id ? null : w.id)}>تحويل لموعد</PrimaryButton>
              <button aria-label="حذف" className="p-2 text-muted-foreground" onClick={() => p.saveWaitlist(p.waitlist.filter((i) => i.id !== w.id))}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
          {booking === w.id ? <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
            <Field label="التاريخ" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Field label="الوقت" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            <PrimaryButton className="w-auto" onClick={() => book(w)}>تأكيد</PrimaryButton>
          </div> : null}
        </div>
      ))}
    </Panel>
  );
}

function Templates({ p }: { p: Planner }) {
  return (
    <Panel className="space-y-2">
      <h2 className="font-bold">القوالب السريعة</h2>
      {p.templates.length === 0 ? <p className="text-sm text-muted-foreground">احفظ قالباً من نافذة إضافة موعد بزر «حفظ كقالب»، ثم استخدمه بضغطة.</p> :
        p.templates.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-xl border border-border p-2.5">
            <span className="flex items-center gap-2 text-sm"><EventIcon type={t.type} />{t.name} · {t.durationMinutes / 60} س</span>
            <button aria-label="حذف القالب" className="p-1.5 text-muted-foreground" onClick={() => p.saveTemplates(p.templates.filter((i) => i.id !== t.id))}><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
    </Panel>
  );
}

function Reminders() {
  const [mins, setMins] = useState(0);
  useEffect(() => { setMins(Number(localStorage.getItem(REMINDER_KEY) ?? 0)); }, []);
  const choose = async (m: number) => {
    if (m > 0 && "Notification" in window && Notification.permission !== "granted") {
      const r = await Notification.requestPermission();
      if (r !== "granted") toast("لم يُسمح بالإشعارات — ستظهر التذكيرات داخل التطبيق فقط.");
    }
    localStorage.setItem(REMINDER_KEY, String(m)); setMins(m); window.dispatchEvent(new Event("reminder-change"));
  };
  return (
    <Panel className="space-y-3">
      <h2 className="flex items-center gap-2 font-bold"><Bell className="h-5 w-5 text-primary" />تذكير قبل الموعد والصلاة</h2>
      <div className="flex gap-2">{[0, 10, 15].map((m) => <PrimaryButton key={m} variant={mins === m ? "primary" : "secondary"} onClick={() => choose(m)}>{m === 0 ? "إيقاف" : `${m} دقيقة`}</PrimaryButton>)}</div>
      <p className="text-xs text-muted-foreground">يعمل التذكير ما دام التطبيق مفتوحاً على هذا الجهاز.</p>
    </Panel>
  );
}

function Report({ p }: { p: Planner }) {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const rows = p.events.filter((e) => e.date.startsWith(month) && !isPersonalActivity(e.type)).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const share = rows.reduce((s, e) => s + (e.type === "percentageClinic" ? (e.revenue * e.sharePercent) / 100 : 0), 0);
  const table = [["التاريخ", "الوقت", "النوع", "الموعد", "المدة (ساعة)", "الإيراد", "النسبة %", "حصتي"],
    ...rows.map((e) => [e.date, e.startTime, appointmentType(e.type).label, eventLabel(e), String(e.durationMinutes / 60), String(e.revenue), String(e.sharePercent), String(e.type === "percentageClinic" ? (e.revenue * e.sharePercent) / 100 : 0)]),
    ["", "", "", "الإجمالي", String(rows.reduce((s, e) => s + e.durationMinutes, 0) / 60), String(rows.reduce((s, e) => s + e.revenue, 0)), "", String(share)]];
  const excel = () => {
    const csv = "\uFEFF" + table.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `تقرير-${month}.csv`);
  };
  const pdf = () => {
    const w = window.open("", "_blank"); if (!w) { toast.error("اسمح بالنوافذ المنبثقة"); return; }
    const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
    w.document.write(`<html dir="rtl"><head><meta charset="utf-8"><title>تقرير ${month}</title><style>body{font-family:sans-serif;padding:24px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #ccc;padding:6px}th{background:#e6f4f1}</style></head><body><h2>تقرير المواعيد والدخل — ${month}</h2><p>عدد المواعيد: ${rows.length} · حصتي: ${share}</p><table>${table.map((r, i) => `<tr>${r.map((c) => i === 0 ? `<th>${esc(c)}</th>` : `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table><script>onload=()=>print()</script></body></html>`);
    w.document.close();
  };
  return (
    <Panel className="space-y-3">
      <h2 className="font-bold">التقرير الشهري</h2>
      <Field label="الشهر" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      <p className="text-sm text-muted-foreground">{rows.length} موعداً · حصتك {share.toLocaleString("ar-SY")}</p>
      <div className="flex gap-2">
        <PrimaryButton variant="secondary" onClick={excel}><FileSpreadsheet className="h-4 w-4" />Excel</PrimaryButton>
        <PrimaryButton variant="secondary" onClick={pdf}><Printer className="h-4 w-4" />PDF</PrimaryButton>
      </div>
    </Panel>
  );
}

function Backup({ p }: { p: Planner }) {
  const input = useRef<HTMLInputElement>(null);
  const exportAll = () => {
    const data = { app: "dr-day", version: 1, exportedAt: new Date().toISOString(), events: p.events, tasks: p.tasks, shopping: p.shopping, waitlist: p.waitlist, templates: p.templates };
    download(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `نسخة-احتياطية-${dateKey(new Date())}.json`);
  };
  const importAll = async (file: File) => {
    try {
      const d = JSON.parse(await file.text());
      if (d?.app !== "dr-day" || !Array.isArray(d.events)) throw new Error();
      if (!confirm("سيتم استبدال كل بياناتك الحالية بمحتوى النسخة الاحتياطية. متابعة؟")) return;
      await p.saveEvents(d.events); await p.saveTasks(d.tasks ?? []); await p.saveShopping(d.shopping ?? []);
      await p.saveWaitlist(d.waitlist ?? []); await p.saveTemplates(d.templates ?? []);
      toast.success("تمت استعادة النسخة الاحتياطية");
    } catch { toast.error("الملف غير صالح"); }
  };
  return (
    <Panel className="space-y-3">
      <h2 className="font-bold">النسخة الاحتياطية</h2>
      <div className="flex gap-2">
        <PrimaryButton variant="secondary" onClick={exportAll}><Download className="h-4 w-4" />تصدير</PrimaryButton>
        <PrimaryButton variant="secondary" onClick={() => input.current?.click()}><Upload className="h-4 w-4" />استيراد</PrimaryButton>
      </div>
      <input ref={input} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importAll(f); e.target.value = ""; }} />
    </Panel>
  );
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function useReminders(events: PlannerEvent[], extra: (d: Date) => PlannerEvent[]) {
  const fired = useRef(new Set<string>());
  useEffect(() => {
    const tick = () => {
      const mins = Number(localStorage.getItem(REMINDER_KEY) ?? 0);
      if (!mins) return;
      const now = Date.now();
      for (const e of [...events, ...extra(new Date())]) {
        if (e.done) continue;
        const [h, m] = e.startTime.split(":").map(Number);
        const start = parseDate(e.date); start.setHours(h ?? 0, m ?? 0, 0, 0);
        const diff = (start.getTime() - now) / 60000;
        const key = `${e.id}-${e.date}-${e.startTime}`;
        if (diff > 0 && diff <= mins && !fired.current.has(key)) {
          fired.current.add(key);
          const msg = `${eventLabel(e)} بعد ${Math.ceil(diff)} دقيقة (${e.startTime})`;
          toast(msg, { duration: 10000 });
          if ("Notification" in window && Notification.permission === "granted") try { new Notification("تذكير", { body: msg, icon: "/icon-192.png" }); } catch { /* mobile */ }
        }
      }
    };
    tick(); const id = setInterval(tick, 30000);
    window.addEventListener("reminder-change", tick);
    return () => { clearInterval(id); window.removeEventListener("reminder-change", tick); };
  }, [events, extra]);
}
