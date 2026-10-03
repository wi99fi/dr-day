import { useMemo, useState } from "react";
import { CheckCircle2, Circle, CheckSquare, Plus, Trash2, CloudOff } from "lucide-react";
import { toast } from "sonner";
import type { Planner } from "@/lib/use-planner";
import { newId, type PlannerTask } from "@/lib/planner";
import { Empty, Field, PageHeader, Panel, PrimaryButton, Sheet } from "./ui";

export function TasksView({ p }: { p: Planner }) {
  const { tasks } = p;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const done = tasks.filter((t) => t.done).length;
  const sorted = useMemo(
    () => [...tasks].sort((a, b) => Number(a.done) - Number(b.done) || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")),
    [tasks],
  );
  const save = (n: PlannerTask[]) => p.saveTasks(n).catch(() => toast.error("تعذر حفظ المهام. تحقق من اتصالك."));

  const add = async () => {
    if (!text.trim()) return;
    await save([{ id: newId(), text: text.trim(), done: false, dueDate: due || null }, ...tasks]);
    setText("");
    setDue("");
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="قائمة اليوم" title="المهام" icon={<CheckSquare className="h-6 w-6" />} />
      <Panel className="flex items-center gap-4">
        <div>
          <p className="text-xs text-muted-foreground">المنجزة</p>
          <p className="text-2xl font-bold">{done} / {tasks.length}</p>
        </div>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: tasks.length ? `${(done / tasks.length) * 100}%` : "0%" }} />
        </div>
        <button aria-label="إضافة مهمة" onClick={() => setOpen(true)} className="rounded-xl bg-accent p-2.5 text-primary">
          <Plus className="h-5 w-5" />
        </button>
      </Panel>
      {p.isError ? <button onClick={() => p.reload()} className="flex items-center gap-2 text-sm text-destructive"><CloudOff className="h-4 w-4" />تعذر الاتصال · اضغط لإعادة المحاولة</button> : null}
      {p.isLoading ? null : sorted.length === 0 ? (
        <Panel><Empty icon={<CheckCircle2 className="h-8 w-8" />} title="لا توجد مهام بعد" description="أضف أول مهمة وتابع إنجازها هنا." /></Panel>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((t) => (
            <Panel key={t.id} className="flex items-center gap-3 p-3">
              <button aria-label={t.done ? "إلغاء الإنجاز" : "إنجاز"} onClick={() => save(tasks.map((i) => (i.id === t.id ? { ...i, done: !i.done } : i)))}>
                {t.done ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
              </button>
              <div className="flex-1">
                <p className={t.done ? "text-muted-foreground line-through" : ""}>{t.text}</p>
                {t.dueDate ? <p className="text-xs text-muted-foreground">موعدها {t.dueDate}</p> : null}
              </div>
              <button aria-label="حذف" className="p-2 text-muted-foreground hover:text-destructive" onClick={() => confirm(`حذف المهمة؟\n${t.text}`) && save(tasks.filter((i) => i.id !== t.id))}>
                <Trash2 className="h-4 w-4" />
              </button>
            </Panel>
          ))}
        </div>
      )}
      {done > 0 ? <PrimaryButton variant="secondary" onClick={() => save(tasks.filter((t) => !t.done))}><Trash2 className="h-4 w-4" />حذف المهام المنجزة</PrimaryButton> : null}
      <Sheet open={open} title="مهمة جديدة" onClose={() => setOpen(false)} footer={<PrimaryButton onClick={add} disabled={!text.trim()}><Plus className="h-4 w-4" />إضافة المهمة</PrimaryButton>}>
        <Field label="ما المهمة؟" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="مثال: الاتصال بالمريض" />
        <Field label="تاريخ الاستحقاق (اختياري)" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </Sheet>
    </div>
  );
}
