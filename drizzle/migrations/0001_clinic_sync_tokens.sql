CREATE TABLE public.clinic_sync_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_sync_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_sync_tokens TO authenticated;
GRANT ALL ON public.clinic_sync_tokens TO service_role;
ALTER TABLE public.clinic_sync_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own token select" ON public.clinic_sync_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own token insert" ON public.clinic_sync_tokens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own token update" ON public.clinic_sync_tokens FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own token delete" ON public.clinic_sync_tokens FOR DELETE TO authenticated USING (auth.uid() = user_id);