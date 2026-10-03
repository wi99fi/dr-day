import { useState } from "react";
import { Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Field, Panel, PrimaryButton } from "./ui";

export function AuthScreen() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ ok: false, text: "البريد أو كلمة المرور غير صحيحة." });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      setMsg(error ? { ok: false, text: error.message } : { ok: true, text: "أرسلنا رابط تأكيد إلى بريدك. افتحه ثم سجّل الدخول." });
    }
    setBusy(false);
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setMsg({ ok: false, text: "تعذر تسجيل الدخول عبر Google." });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lift">
            <Stethoscope className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold">منظّم يوم الطبيب</h1>
          <p className="mt-2 text-muted-foreground">دوامك ومناوباتك وعياداتك ودخلك في مكان واحد.</p>
        </div>
        <Panel className="space-y-4 p-5">
          <form onSubmit={submit} className="space-y-4">
            <Field label="البريد الإلكتروني" type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field label="كلمة المرور" type="password" dir="ltr" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            {msg ? <p className={`text-sm ${msg.ok ? "text-primary" : "text-destructive"}`}>{msg.text}</p> : null}
            <PrimaryButton disabled={busy}>{busy ? "لحظة..." : mode === "in" ? "تسجيل الدخول" : "إنشاء حساب"}</PrimaryButton>
          </form>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />أو<span className="h-px flex-1 bg-border" />
          </div>
          <PrimaryButton variant="secondary" onClick={google} type="button">المتابعة عبر Google</PrimaryButton>
          <button type="button" className="w-full text-sm font-medium text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "ليس لديك حساب؟ أنشئ حساباً" : "لديك حساب؟ سجّل الدخول"}
          </button>
        </Panel>
      </div>
    </div>
  );
}
