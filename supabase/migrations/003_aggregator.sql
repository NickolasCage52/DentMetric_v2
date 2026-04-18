-- Stage 10: client portal links + aggregator jobs (stubs / demo seed)

CREATE TABLE IF NOT EXISTS public.portal_links (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  estimate_id TEXT,
  booking_id TEXT,
  snapshot JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  password_hash TEXT,
  viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  client_confirmed_at TIMESTAMPTZ,
  client_note TEXT,
  client_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.portal_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY portal_links_select_public
  ON public.portal_links FOR SELECT
  USING (
    (is_active = TRUE AND expires_at > NOW())
    OR (auth.uid() IS NOT NULL AND auth.uid()::text = user_id)
  );

CREATE POLICY portal_links_insert_authenticated
  ON public.portal_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL);

CREATE POLICY portal_links_update_public_interaction
  ON public.portal_links FOR UPDATE
  TO anon, authenticated
  USING (is_active = TRUE AND expires_at > NOW())
  WITH CHECK (is_active = TRUE AND expires_at > NOW());

CREATE POLICY portal_links_update_owner
  ON public.portal_links FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE INDEX IF NOT EXISTS idx_portal_links_lookup
  ON public.portal_links (id, is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_portal_links_user
  ON public.portal_links (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.aggregator_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  logo_url TEXT,
  commission_percent NUMERIC(4, 2) DEFAULT 10.0,
  is_active BOOLEAN DEFAULT TRUE,
  cities TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.aggregator_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY aggregator_sources_select
  ON public.aggregator_sources FOR SELECT
  USING (is_active = TRUE);

INSERT INTO public.aggregator_sources  (id, name, type, commission_percent, cities)
VALUES
  ('src_demo_1', 'Росгосстрах', 'insurance', 10.0, ARRAY['msk', 'spb', 'ekb']),
  ('src_demo_2', 'СОГАЗ', 'insurance', 12.0, ARRAY['msk', 'spb']),
  ('src_demo_3', 'АльфаСтрахование', 'insurance', 11.0, ARRAY['msk', 'spb', 'kzn']),
  ('src_demo_4', 'Корпоративный автопарк', 'fleet', 8.0, ARRAY['msk'])
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.aggregator_jobs (
  id TEXT PRIMARY KEY,
  source_id TEXT REFERENCES public.aggregator_sources (id),
  city TEXT NOT NULL,
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  car_brand TEXT,
  car_model TEXT,
  car_class TEXT,
  car_year INTEGER,
  car_plate TEXT,
  damage_description TEXT NOT NULL,
  damage_elements TEXT[],
  photo_urls TEXT[],
  estimated_budget_min INTEGER,
  estimated_budget_max INTEGER,
  client_name_masked TEXT,
  client_phone_masked TEXT,
  status TEXT DEFAULT 'open',
  assigned_master_id TEXT,
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  commission_percent NUMERIC(4, 2),
  commission_amount INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.aggregator_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY aggregator_jobs_select
  ON public.aggregator_jobs FOR SELECT
  USING (
    status = 'open'
    OR (assigned_master_id IS NOT NULL AND auth.uid() IS NOT NULL AND assigned_master_id = auth.uid()::text)
  );

CREATE POLICY aggregator_jobs_update_assigned
  ON public.aggregator_jobs FOR UPDATE
  TO authenticated
  USING (assigned_master_id = auth.uid()::text)
  WITH CHECK (assigned_master_id = auth.uid()::text);

CREATE INDEX IF NOT EXISTS idx_aggr_jobs_city_status
  ON public.aggregator_jobs (city, status, created_at DESC);

INSERT INTO public.aggregator_jobs
  (id, source_id, city, car_brand, car_model, car_class,
   damage_description, damage_elements, estimated_budget_min,
   estimated_budget_max, client_name_masked, commission_percent,
   expires_at)
VALUES
  ('job_demo_1', 'src_demo_1', 'spb',
   'Toyota', 'Camry', 'E',
   'Вмятина на левой задней двери после парковки, без сколов',
   ARRAY['левая задняя дверь'],
   8000, 15000, 'Михаил С.', 10.0,
   NOW() + INTERVAL '3 days'),
  ('job_demo_2', 'src_demo_2', 'msk',
   'Kia', 'Sportage', 'SUV',
   'Две вмятины на капоте, вероятно от града',
   ARRAY['капот'],
   12000, 20000, 'Анна В.', 12.0,
   NOW() + INTERVAL '5 days'),
  ('job_demo_3', 'src_demo_3', 'spb',
   'BMW', '3 Series', 'D',
   'Вмятина на переднем бампере',
   ARRAY['передний бампер'],
   5000, 10000, 'Дмитрий П.', 11.0,
   NOW() + INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.job_applications (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES public.aggregator_jobs (id),
  master_id TEXT NOT NULL,
  proposed_price INTEGER,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_applications_all_own
  ON public.job_applications FOR ALL
  TO authenticated
  USING (auth.uid()::text = master_id)
  WITH CHECK (auth.uid()::text = master_id);
