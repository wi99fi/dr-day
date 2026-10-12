import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { LockKeyhole, Settings, X } from "lucide-react";
import { matchesSettingsCode } from "@/lib/settings-access";
import { Field, PrimaryButton } from "./ui";

const TAPS_NEEDED = 5;
const TAP_WINDOW_MS = 2500;
const REVEAL_MS = 30_000;

export function SettingsAccess({ onUnlock }: { onUnlock: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const taps = useRef<number[]>([]);
  const hideTimer = useRef<number | null>(null);

  // The floating button stays hidden; tapping the page title 5 times
  // quickly reveals it for a short while.
  useEffect(() => {
    function onTap(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-app-title]")) return;
      const now = Date.now();
      taps.current = [...taps.current.filter((t) => now - t <= TAP_WINDOW_MS), now];
      if (taps.current.length >= TAPS_NEEDED) {
        taps.current = [];
        if (hideTimer.current) window.clearTimeout(hideTimer.current);
        setRevealed(true);
        hideTimer.current = window.setTimeout(() => setRevealed(false), REVEAL_MS);
      }
    }
    document.addEventListener("click", onTap);
    return () => document.removeEventListener("click", onTap);
  }, []);

  useEffect(() => () => { if (hideTimer.current) window.clearTimeout(hideTimer.current); }, []);

  function changeOpen(next: boolean) {
    setCode("");
    setError("");
    setOpen(next);
    if (!next && hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setRevealed(false), REVEAL_MS);
    }
  }

  return (
    <>
      {revealed && (
        <PrimaryButton
          aria-label="فتح الإعدادات"
          title="الإعدادات"
          className="fixed bottom-24 left-4 z-40 h-12 w-12 animate-in fade-in zoom-in rounded-full p-0 shadow-lift duration-200"
          onClick={() => changeOpen(true)}
        >
          <Settings className="h-5 w-5" />
        </PrimaryButton>
      )}
      <Dialog.Root open={open} onOpenChange={changeOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40" />
          <Dialog.Content dir="rtl" className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-5 shadow-lift">
            <div className="mb-5 flex items-center justify-between">
              <Dialog.Title className="flex items-center gap-2 text-lg font-bold"><LockKeyhole className="h-5 w-5 text-primary" />رمز الإعدادات</Dialog.Title>
              <Dialog.Close asChild><PrimaryButton variant="secondary" aria-label="إغلاق" className="h-9 w-9 rounded-full p-0"><X className="h-4 w-4" /></PrimaryButton></Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">أدخل رمز الدخول إلى الإعدادات</Dialog.Description>
            <form className="space-y-4" onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              setBusy(true);
              try {
                if (await matchesSettingsCode(code)) {
                  changeOpen(false);
                  onUnlock();
                } else {
                  setError("الرمز غير صحيح");
                  setCode("");
                }
              } catch {
                setError("تعذّر التحقق، حاول مجدداً");
              } finally {
                setBusy(false);
              }
            }}>
              <Field label="رمز الدخول" type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={code} dir="ltr" aria-invalid={Boolean(error)} aria-describedby={error ? "settings-code-error" : undefined} onChange={(event) => { setCode(event.target.value.replace(/[^0-9]/g, "")); setError(""); }} />
              {error && <p id="settings-code-error" role="alert" className="text-sm text-destructive">{error}</p>}
              <PrimaryButton type="submit" disabled={busy || code.length !== 4}>فتح الإعدادات</PrimaryButton>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
