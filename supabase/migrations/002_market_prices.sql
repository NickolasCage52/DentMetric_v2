-- Market prices: anonymous per-dent samples + public read cache
-- Inserts only via Edge Function (service role bypasses RLS).

CREATE TABLE IF NOT EXISTS public.market_prices_raw (
  id BIGSERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  car_class TEXT NOT NULL,
  panel_element TEXT NOT NULL,
  price INTEGER NOT NULL,
  dent_length_mm INTEGER,
  dent_width_mm INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  app_version TEXT
);

ALTER TABLE public.market_prices_raw ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.market_prices_cache (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  car_class TEXT NOT NULL,
  panel_element TEXT NOT NULL,
  median_price INTEGER NOT NULL,
  p25_price INTEGER NOT NULL,
  p75_price INTEGER NOT NULL,
  sample_count INTEGER NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.market_prices_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_prices_cache_select_anon"
  ON public.market_prices_cache FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_market_prices_agg
  ON public.market_prices_raw (city, car_class, panel_element, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_market_cache_lookup
  ON public.market_prices_cache (city, car_class, panel_element);
