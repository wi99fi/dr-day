import { X } from "lucide-react";
import type { ReactNode, InputHTMLAttributes } from "react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-card p-4 shadow-soft ${className}`}>{children}</div>;
}

export function Sheet({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl bg-card shadow-lift sm:rounded-3xl animate-in slide-in-from-bottom-8 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button aria-label="إغلاق" onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
        <div className="border-t border-border px-5 py-4">{footer}</div>
      </div>
    </div>
  );
}

export function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}

export function PrimaryButton({ children, className = "", variant = "primary", ...props }: { variant?: "primary" | "secondary" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const v = variant === "primary" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80";
  return (
    <button
      {...props}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition disabled:opacity-50 ${v} ${className}`}
    >
      {children}
    </button>
  );
}

export function Chip({ active, onClick, children, colorClass = "" }: { active: boolean; onClick: () => void; children: ReactNode; colorClass?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"
      }`}
    >
      {colorClass ? <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} /> : null}
      {children}
    </button>
  );
}

export function Empty({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function PageHeader({ eyebrow, title, icon, action }: { eyebrow: string; title: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{eyebrow}</p>
        <h1 data-app-title className="cursor-default select-none text-3xl font-bold">{title}</h1>
      </div>
      {action ?? <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">{icon}</div>}
    </div>
  );
}
