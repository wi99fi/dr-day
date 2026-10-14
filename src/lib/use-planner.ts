import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { PlannerEvent, PlannerTask, ShoppingItem } from "./planner";
export type WaitlistItem = { id: string; patient: string; phone: string; procedure: string; durationMinutes: number; note: string };
export type EventTemplate = { id: string; name: string; type: PlannerEvent["type"]; durationMinutes: number; place: string; note: string };

export type Snapshot = { events: PlannerEvent[]; tasks: PlannerTask[]; shopping: ShoppingItem[]; waitlist: WaitlistItem[]; templates: EventTemplate[] };
type Name = keyof Snapshot;
const EMPTY: Snapshot = { events: [], tasks: [], shopping: [], waitlist: [], templates: [] };

export function usePlanner(userId: string) {
  const qc = useQueryClient();
  const key = ["planner", userId];
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Snapshot> => {
      const { data, error } = await supabase.from("planner_collections").select("collection, items");
      if (error) throw error;
      const snap: Snapshot = { ...EMPTY };
      for (const row of data ?? []) (snap as Record<string, unknown>)[row.collection] = row.items;
      return snap;
    },
    retry: 1,
  });

  const save = useCallback(
    async <N extends Name>(name: N, items: Snapshot[N]) => {
      const prev = qc.getQueryData<Snapshot>(key) ?? EMPTY;
      qc.setQueryData(key, { ...prev, [name]: items });
      const write = async () => {
        const { error } = await supabase
          .from("planner_collections")
          .upsert({ user_id: userId, collection: name, items: items as unknown as Json, updated_at: new Date().toISOString() });
        if (error) throw error;
      };
      const next = queue.current.catch(() => undefined).then(write);
      queue.current = next;
      try {
        await next;
      } catch (e) {
        await qc.invalidateQueries({ queryKey: key });
        throw e;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qc, userId],
  );

  return {
    events: query.data?.events ?? [],
    tasks: query.data?.tasks ?? [],
    shopping: query.data?.shopping ?? [],
    waitlist: query.data?.waitlist ?? [],
    templates: query.data?.templates ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    reload: query.refetch,
    saveEvents: (i: PlannerEvent[]) => save("events", i),
    saveTasks: (i: PlannerTask[]) => save("tasks", i),
    saveShopping: (i: ShoppingItem[]) => save("shopping", i),
    saveWaitlist: (i: WaitlistItem[]) => save("waitlist", i),
    saveTemplates: (i: EventTemplate[]) => save("templates", i),
  };
}
export type Planner = ReturnType<typeof usePlanner>;
