import { useEffect, useState } from "react";
import { Copy, Link2, Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, PrimaryButton } from "./ui";

async function sha256(v: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const EXAMPLE = `POST {URL}
Authorization: Bearer {KEY}
Content-Type: application/json

{
  "appointments": [
    {
      "id": "appt-123",
      "date": "2026-10-05",
      "startTime": "17:00",
      "durationMinutes": 30,
      "clinicName": "Alteesh Clinic",
      "revenue": 50000,
      "sharePercent": 100,
      "type": "ownClinic",
      "deleted": false
    }
  ]
}`;

export function SettingsView({ userId, onSignOut }: { userId: string; onSignOut: () => void }) {
  const [info, setInfo] = useState<{ created_at: string; last_sync_at: string | null } | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/api/public/clinic-sync` : "";

  const load = async () => {
    const { data } = await supabase.from("clinic_sync_tokens").select("created_at, last_sync_at").maybeSingle();
    setInfo(data ?? null);
  };
  useEffect(() => { void load(); }, []);

  const generate = async () => {
    setBusy(true);
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const key = "dds_" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const { error } = await supabase.from("clinic_sync_tokens").upsert({
      user_id: userId, token_hash: await sha256(key), created_at: new Date().toISOString(), last_sync_at: null,
    });
    setBusy(false);
    if (error) return toast.error("تعذّر إنشاء المفتاح");
    setNewKey(key);
    void load();
  };

  const revoke = async () => {
    await supabase.from("clinic_sync_tokens").delete().eq("user_id", userId);
    setNewKey(null);
    setInfo(null);
    toast.success("تم إلغاء الربط");
  };

  const copy = (v: string) => { void navigator.clipboard.writeText(v); toast.success("تم النسخ"); };

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="الإعدادات" title="ربط تطبيق العيادة" icon={<Settings className="h-5 w-5" />} />
      <Panel className="space-y-3">
        <div className="flex items-center gap-2 font-semibold"><Link2 className="h-4 w-4 text-primary" />مزامنة المواعيد والإيرادات</div>
        <p className="text-sm text-muted-foreground">
          ضع الرابط والمفتاح في تطبيق العيادة، فيُرسل كل موعد ودفعة إلى جدولك ولوحتك تلقائياً.
        </p>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">رابط المزامنة</div>
          <div className="flex items-center gap-2 rounded-xl bg-secondary p-2 text-xs" dir="ltr">
            <span className="flex-1 break-all">{url}</span>
            <button onClick={() => copy(url)} aria-label="نسخ الرابط"><Copy className="h-4 w-4" /></button>
          </div>
        </div>
        {newKey && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-destructive">المفتاح السري — انسخه الآن، لن يظهر مرة أخرى</div>
            <div className="flex items-center gap-2 rounded-xl bg-secondary p-2 text-xs" dir="ltr">
              <span className="flex-1 break-all">{newKey}</span>
              <button onClick={() => copy(newKey)} aria-label="نسخ المفتاح"><Copy className="h-4 w-4" /></button>
            </div>
          </div>
        )}
        <div className="text-sm">
          {info ? (
            <>الحالة: <span className="font-medium text-primary">مفعّل</span> · آخر مزامنة:{" "}
              {info.last_sync_at ? new Date(info.last_sync_at).toLocaleString("ar") : "لم تتم بعد"}</>
          ) : <>الحالة: غير مربوط</>}
        </div>
        <div className="flex gap-2">
          <PrimaryButton onClick={generate} disabled={busy}>{info ? "إنشاء مفتاح جديد" : "إنشاء مفتاح الربط"}</PrimaryButton>
          {info && <PrimaryButton variant="secondary" onClick={revoke}>إلغاء الربط</PrimaryButton>}
        </div>
      </Panel>
      <Panel className="space-y-2">
        <div className="font-semibold">لمطوّر تطبيق العيادة</div>
        <pre className="overflow-x-auto rounded-xl bg-secondary p-3 text-[11px] leading-5" dir="ltr">{EXAMPLE}</pre>
        <p className="text-xs text-muted-foreground">
          نفس الـ id يحدّث الموعد، و"deleted": true يحذفه. type إما ownClinic أو percentageClinic (الدخل = revenue × sharePercent ÷ 100).
        </p>
      </Panel>
      <PrimaryButton variant="secondary" className="w-full" onClick={onSignOut}>تسجيل الخروج</PrimaryButton>
    </div>
  );
}
