import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { arrangeDay, type ArrangedItem } from "@/lib/ai/arrange-day.functions";
import { dateKey, eventLabel, formatTime, newId, segmentOnDate, startMinute, type ActivityIconName, type PlannerEvent } from "@/lib/planner";
import { PrimaryButton, Sheet } from "./ui";
import { EventIcon } from "./EventIcon";

export function AiArrangeSheet({ open, onClose, date, events, onSave }: {
  open: boolean; onClose: () => void; date: Date; events: PlannerEvent[]; onSave: (next: PlannerEvent[]) => Promise<void>;
}) {
  const run = useServerFn(arrangeDay);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ items: ArrangedItem[]; summary: string } | null>(null);
  const key = dateKey(date);

  const arrange = async () => {
    if (text.trim().length < 3) { toast.error("اكتب قائمة مواعيدك أولاً"); return; }
    setBusy(true); setResult(null);
    try {
      const existing = events.filter((e) => segmentOnDate(e, date)).map((e) => ({ startTime: e.startTime, durationMinutes: e.durationMinutes, label: eventLabel(e) }));
      const r = await run({ data: { date: key, text, existing } });
      if (r.error) toast.error(r.error); else if (!r.items.length) toast.error("لم أتمكن من استخراج مواعيد من النص."); else setResult(r);
    } catch { toast.error("تعذر الاتصال بالمساعد."); }
    finally { setBusy(false); }
  };

  const add = async () => {
    if (!result) return;
    const items: PlannerEvent[] = result.items.map((i) => ({
      id: newId(), date: key, startTime: i.startTime, durationMinutes: i.durationMinutes, type: i.type,
      place: i.place.trim(), note: i.note.trim(), clinicName: i.type === "percentageClinic" ? i.title : "", sharePercent: 0, revenue: 0,
      ...(i.type === "other" ? { activityName: i.title, activityIcon: i.activityIcon as ActivityIconName } : {}),
    }));
    setBusy(true);
    try { await onSave([...items, ...events]); toast.success("أضيف الجدول إلى يومك"); setResult(null); setText(""); onClose(); }
    catch { toast.error("تعذر الحفظ."); }
    finally { setBusy(false); }
  };

  return (
    <Sheet open={open} title="ترتيب اليوم بالذكاء الاصطناعي" onClose={onClose}
      footer={result
        ? <div className="flex gap-2"><PrimaryButton variant="secondary" className="w-auto" onClick={() => setResult(null)}>تعديل</PrimaryButton><PrimaryButton onClick={add} disabled={busy}>إضافة إلى الجدول</PrimaryButton></div>
        : <PrimaryButton onClick={arrange} disabled={busy}><Sparkles className="h-4 w-4" />{busy ? "جارٍ الترتيب..." : "رتّب يومي"}</PrimaryButton>}>
      {!result ? (
        <label className="block space-y-2">
          <span className="text-sm font-medium text-muted-foreground">اكتب مواعيدك ونشاطاتك كما تريد</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} maxLength={4000}
            placeholder={"مثال: عملية قلع ضرس عقل الساعة 9 لمدة ساعتين في المشفى، مراجعة مريض كسر فك، عيادتي من 5 لـ 8، غداء، صلاة الظهر، نادي"}
            className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </label>
      ) : (
        <div className="space-y-2">
          {result.summary ? <p className="text-sm text-muted-foreground">{result.summary}</p> : null}
          {result.items.map((i, n) => (
            <div key={n} className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2">
              <EventIcon type={i.type} activityIcon={i.activityIcon as ActivityIconName} className="h-4 w-4 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{i.title}</p>
                <p className="text-xs text-muted-foreground">{i.startTime} – {formatTime(startMinute({ startTime: i.startTime } as PlannerEvent) + i.durationMinutes)}{i.place ? ` · ${i.place}` : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}
