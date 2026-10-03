CREATE TABLE public.planner_collections (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  collection text NOT NULL CHECK (collection IN ('events','tasks','shopping')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, collection)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_collections TO authenticated;
GRANT ALL ON public.planner_collections TO service_role;
ALTER TABLE public.planner_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.planner_collections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.planner_collections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.planner_collections FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.planner_collections FOR DELETE TO authenticated USING (auth.uid() = user_id);