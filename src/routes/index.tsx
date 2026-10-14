import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, CalendarDays, CheckSquare, ShoppingBag, Loader2, LayoutGrid } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { usePlanner } from "@/lib/use-planner";
import { AuthScreen } from "@/components/planner/AuthScreen";
import { ScheduleView } from "@/components/planner/ScheduleView";
import { DashboardView } from "@/components/planner/DashboardView";
import { TasksView } from "@/components/planner/TasksView";
import { ShoppingView } from "@/components/planner/ShoppingView";
import { SettingsView } from "@/components/planner/SettingsView";
import { SettingsAccess } from "@/components/planner/SettingsAccess";
import { PrimaryButton } from "@/components/planner/ui";
import { MoreView, useReminders } from "@/components/planner/MoreView";
import { prayerEventsAround } from "@/lib/prayer-times";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منظّم يوم الطبيب — دوامك ومناوباتك وعياداتك" },
      { name: "description", content: "نظّم دوام المشفى والمناوبات والعيادات، وتابع دخلك ومهامك ومشترياتك في مكان واحد." },
      { property: "og:title", content: "منظّم يوم الطبيب" },
      { property: "og:description", content: "تقويم ذكي للطبيب: مناوبات، عيادات، دخل، مهام ومشتريات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    supabase.auth.getSession().then(({ data: d }) => setUser(d.session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  if (user === undefined)
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <AuthScreen />;
  return <App userId={user.id} />;
}

const TABS = [
  { id: "schedule", label: "الجدول", Icon: CalendarDays },
  { id: "dashboard", label: "اللوحة", Icon: BarChart3 },
  { id: "tasks", label: "المهام", Icon: CheckSquare },
  { id: "shopping", label: "المشتريات", Icon: ShoppingBag },
  { id: "more", label: "المزيد", Icon: LayoutGrid },
] as const;

function App({ userId }: { userId: string }) {
  const p = usePlanner(userId);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("schedule");
  const [settingsOpen, setSettingsOpen] = useState(false);
  useReminders(p.events, prayerEventsAround);
  return (
    <div className="min-h-screen bg-hero pb-28">
      <main className="mx-auto max-w-2xl px-4 pt-6">
        {settingsOpen ? <>
          <PrimaryButton variant="secondary" className="mb-4 w-auto" onClick={() => setSettingsOpen(false)}><ArrowRight className="h-4 w-4" />العودة</PrimaryButton>
          <SettingsView userId={userId} onSignOut={() => supabase.auth.signOut()} />
        </> : tab === "schedule" ? <ScheduleView p={p} /> : tab === "dashboard" ? <DashboardView p={p} /> : tab === "tasks" ? <TasksView p={p} /> : tab === "shopping" ? <ShoppingView p={p} /> : <MoreView p={p} />}
      </main>
      {!settingsOpen && <SettingsAccess onUnlock={() => setSettingsOpen(true)} />}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl">
          {TABS.map(({ id, label, Icon }) => (
            <PrimaryButton variant="secondary" key={id} onClick={() => { setSettingsOpen(false); setTab(id); }}
              className={`flex flex-1 flex-col gap-1 rounded-none bg-transparent py-3 text-xs font-medium ${!settingsOpen && tab === id ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="h-5 w-5" />{label}
            </PrimaryButton>
          ))}
        </div>
      </nav>
    </div>
  );
}
