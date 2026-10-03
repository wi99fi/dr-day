import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Plus, ShoppingBag, Trash2, CloudOff } from "lucide-react";
import { toast } from "sonner";
import type { Planner } from "@/lib/use-planner";
import { newId, SHOPPING_CATEGORIES, type ShoppingCategory, type ShoppingItem } from "@/lib/planner";
import { Chip, Empty, Field, PageHeader, Panel, PrimaryButton, Sheet } from "./ui";

type Filter = "all" | "active" | "done";

export function ShoppingView({ p }: { p: Planner }) {
  const { shopping } = p;
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [cat, setCat] = useState<ShoppingCategory>(null);
  const active = shopping.filter((i) => !i.done).length;
  const list = useMemo(() => shopping.filter((i) => filter === "all" || (filter === "active" ? !i.done : i.done)), [shopping, filter]);
  const save = (n: ShoppingItem[]) => p.saveShopping(n).catch(() => toast.error("تعذر حفظ المشتريات. تحقق من اتصالك."));

  const add = async () => {
    if (!text.trim()) return;
    await save([{ id: newId(), text: text.trim(), done: false, category: cat }, ...shopping]);
    setText("");
    setCat(null);
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="احتياجاتك" title="المشتريات" icon={<ShoppingBag className="h-6 w-6" />} />
      <Panel className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">متبقية</p>
          <p className="text-2xl font-bold">{active}</p>
        </div>
        <PrimaryButton className="w-auto" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />إضافة غرض</PrimaryButton>
      </Panel>
      <div className="flex gap-2">
        {([["all", "الكل"], ["active", "المتبقية"], ["done", "المشتراة"]] as const).map(([id, l]) => (
          <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>{l}</Chip>
        ))}
      </div>
      {p.isError ? <button onClick={() => p.reload()} className="flex items-center gap-2 text-sm text-destructive"><CloudOff className="h-4 w-4" />تعذر الاتصال · اضغط لإعادة المحاولة</button> : null}
      {p.isLoading ? null : list.length === 0 ? (
        <Panel><Empty icon={<ShoppingBag className="h-8 w-8" />} title="القائمة فارغة" description="أضف ما تحتاج شراءه للصيدلية أو المنزل أو العيادة." /></Panel>
      ) : (
        <div className="space-y-2.5">
          {list.map((i) => (
            <Panel key={i.id} className="flex items-center gap-3 p-3">
              <button aria-label="تبديل" onClick={() => save(shopping.map((c) => (c.id === i.id ? { ...c, done: !c.done } : c)))}>
                {i.done ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
              </button>
              <div className="flex-1">
                <p className={i.done ? "text-muted-foreground line-through" : ""}>{i.text}</p>
                {i.category ? <p className="text-xs text-muted-foreground">{SHOPPING_CATEGORIES.find((c) => c.id === i.category)?.label}</p> : null}
              </div>
              <button aria-label="حذف" className="p-2 text-muted-foreground hover:text-destructive" onClick={() => save(shopping.filter((c) => c.id !== i.id))}>
                <Trash2 className="h-4 w-4" />
              </button>
            </Panel>
          ))}
        </div>
      )}
      {shopping.some((i) => i.done) ? <PrimaryButton variant="secondary" onClick={() => save(shopping.filter((i) => !i.done))}><Trash2 className="h-4 w-4" />حذف المشتراة</PrimaryButton> : null}
      <Sheet open={open} title="غرض جديد" onClose={() => setOpen(false)} footer={<PrimaryButton onClick={add} disabled={!text.trim()}><Plus className="h-4 w-4" />إضافة</PrimaryButton>}>
        <Field label="ماذا تحتاج؟" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="مثال: قفازات طبية" />
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-muted-foreground">التصنيف (اختياري)</span>
          <div className="flex flex-wrap gap-2">
            {SHOPPING_CATEGORIES.map((c) => (
              <Chip key={c.id} active={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>{c.label}</Chip>
            ))}
          </div>
        </div>
      </Sheet>
    </div>
  );
}
