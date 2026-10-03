import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings, BarChart3, CalendarDays, CheckSquare, ShoppingBag, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { usePlanner } from "@/lib/use-planner";
import { AuthScreen } from "@/components/planner/AuthScreen";
import { ScheduleView } from "@/components/planner/ScheduleView";
import { DashboardView } from "@/components/planner/DashboardView";
import { TasksView } from "@/components/planner/TasksView";
import { ShoppingView } from "@/components/planner/ShoppingView";
import { SettingsView } from "@/components/planner/SettingsView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منظّم يوم الطبيب — دوامك ومناوباتك وعياداتك" },
      { name: "description", content: "نظّم دوام المشفى والمناوبات والعيادات، وتابع دخلك ومهامك ومشترياتك في مكان واحد." },
      { property: "og:title", content: "منظّم يوم الطبيب" },
      { property: "og:description", content: "تقويم ذكي للطبيب: مناوبات، عيادات، دخل، مهام ومشتريات." },
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
  { id: "settings", label: "الإعدادات", Icon: Settings },
] as const;

function App({ userId }: { userId: string }) {
  const p = usePlanner(userId);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("schedule");
  return (
    <div className="min-h-screen bg-hero pb-28">
      <main className="mx-auto max-w-2xl px-4 pt-6">
        {tab === "schedule" ? <ScheduleView p={p} /> : tab === "dashboard" ? <DashboardView p={p} /> : tab === "tasks" ? <TasksView p={p} /> : tab === "settings" ? <SettingsView userId={userId} onSignOut={() => supabase.auth.signOut()} /> : <ShoppingView p={p} />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium ${tab === id ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="h-5 w-5" />{label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
