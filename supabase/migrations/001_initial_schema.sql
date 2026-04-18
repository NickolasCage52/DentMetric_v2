-- DentMetric Stage 8 — initial cloud sync schema
-- Apply in Supabase SQL Editor or via CLI.
--
-- IMPORTANT (mock auth / bring-up):
-- user_id is TEXT so local profiles like user_79991234567 work without Supabase Auth.
-- RLS is DISABLED below until Supabase Auth is wired (see authService TODO).
-- Before production: enable RLS and policies using auth.uid()::text = user_id after login.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- PROFILES (optional; reserved for Supabase Auth linkage later)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  country TEXT,
  currency TEXT DEFAULT 'RUB',
  plan_id TEXT DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- HISTORY RECORDS (estimates)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.history_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  team_id UUID,
  data JSONB NOT NULL,
  client_updated_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.history_records DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_history_user_updated
  ON public.history_records (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_history_user_active
  ON public.history_records (user_id, deleted_at)
  WHERE deleted_at IS NULL;

-- ------------------------------------------------------------
-- BOOKINGS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  team_id UUID,
  data JSONB NOT NULL,
  client_updated_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_bookings_user_updated
  ON public.bookings (user_id, updated_at DESC);

-- ------------------------------------------------------------
-- EMPLOYEES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  team_id UUID,
  data JSONB NOT NULL,
  client_updated_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- SERVICE DATA (one row per user; future sync)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_data (
  user_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.service_data DISABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- SYNC METADATA (server-side cursor; optional — client uses localStorage too)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sync_metadata (
  user_id TEXT PRIMARY KEY,
  last_pull_at JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sync_metadata DISABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- STORAGE: annotated-photos
-- In Dashboard → Storage: create private bucket named: annotated-photos
-- Path pattern: {user_id}/{record_id}.{ext}
--
-- Example policy (when using Supabase Auth + UUID user_id as folder):
-- CREATE POLICY "annotated_photos_own_folder"
-- ON storage.objects FOR ALL TO authenticated
-- USING (
--   bucket_id = 'annotated-photos'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- )
-- WITH CHECK (
--   bucket_id = 'annotated-photos'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );
