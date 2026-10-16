CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  lead_minutes integer NOT NULL DEFAULT 10 CHECK (lead_minutes BETWEEN 0 AND 180),
  tz text NOT NULL DEFAULT 'Asia/Damascus',
  prayer_tz text NOT NULL DEFAULT 'Asia/Damascus',
  lat double precision NOT NULL DEFAULT 33.5138,
  lng double precision NOT NULL DEFAULT 36.2765,
  method text NOT NULL DEFAULT 'mwl',
  madhab text NOT NULL DEFAULT 'shafi',
  sent_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX push_subscriptions_user_idx ON public.push_subscriptions (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.push_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.push_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);
