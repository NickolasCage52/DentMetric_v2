import { isSupabaseConfigured } from '@/services/supabase'

export interface MarketPriceBenchmark {
  city: string
  carClass: string
  panelElement: string
  medianPrice: number
  p25Price: number
  p75Price: number
  sampleCount: number
  computedAt: string
}

export interface PriceDataPoint {
  city: string
  carClass: string
  panelElement: string
  price: number
  dentLengthMm?: number
  dentWidthMm?: number
  appVersion?: string
}

const CACHE_KEY = 'dm_market_prices_cache_v1'
const CACHE_TTL_MS = 15 * 60 * 1000

interface CacheEntry {
  data: MarketPriceBenchmark[]
  city: string
  cachedAt: number
}

const CITY_MAP: Record<string, string> = {
  москва: 'msk',
  moscow: 'msk',
  msk: 'msk',
  'санкт-петербург': 'spb',
  спб: 'spb',
  spb: 'spb',
  питер: 'spb',
  екатеринбург: 'ekb',
  ekb: 'ekb',
  новосибирск: 'nsk',
  nsk: 'nsk',
  казань: 'kzn',
  kzn: 'kzn',
  краснодар: 'krd',
  krd: 'krd',
  'нижний новгород': 'nnov',
  нн: 'nnov',
  'ростов-на-дону': 'rost',
  ростов: 'rost',
  уфа: 'ufa',
  ufa: 'ufa',
  самара: 'sam',
  sam: 'sam',
}

/** Normalize free-text or slug city to aggregation key (matches Edge collect-price). */
export function normalizeCitySlug(city: string): string {
  const normalized = city.toLowerCase().trim()
  return CITY_MAP[normalized] || normalized.replace(/\s+/g, '_').slice(0, 20)
}

export function normalizePanelKey(el: string): string {
  if (!el) return 'unknown'
  return el
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 50)
}

function loadCache(city: string): MarketPriceBenchmark[] | null {
  try {
    const slug = normalizeCitySlug(city)
    const raw = localStorage.getItem(`${CACHE_KEY}:${slug}`)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null
    if (entry.city !== slug) return null
    return entry.data
  } catch {
    return null
  }
}

function saveCache(city: string, data: MarketPriceBenchmark[]): void {
  try {
    const slug = normalizeCitySlug(city)
    const entry: CacheEntry = { data, city: slug, cachedAt: Date.now() }
    localStorage.setItem(`${CACHE_KEY}:${slug}`, JSON.stringify(entry))
  } catch {
    /* ignore quota */
  }
}

function edgeBase(): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined
  return base ? `${base.replace(/\/$/, '')}/functions/v1` : ''
}

export async function fetchMarketPrices(city: string): Promise<MarketPriceBenchmark[]> {
  if (!isSupabaseConfigured() || !city?.trim()) return []

  const slug = normalizeCitySlug(city)
  const cached = loadCache(slug)
  if (cached) return cached

  const base = edgeBase()
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!base || !anon) return []

  try {
    const params = new URLSearchParams({ city: slug })
    const resp = await fetch(`${base}/market-prices?${params}`, {
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      },
    })

    if (!resp.ok) return []

    const json = await resp.json()
    const benchmarks: MarketPriceBenchmark[] = (json.data || []).map((row: Record<string, unknown>) => ({
      city: String(row.city ?? ''),
      carClass: String(row.car_class ?? ''),
      panelElement: String(row.panel_element ?? ''),
      medianPrice: Number(row.median_price) || 0,
      p25Price: Number(row.p25_price) || 0,
      p75Price: Number(row.p75_price) || 0,
      sampleCount: Number(row.sample_count) || 0,
      computedAt: String(row.computed_at ?? ''),
    }))

    saveCache(slug, benchmarks)
    return benchmarks
  } catch {
    return []
  }
}

export function findBenchmark(
  benchmarks: MarketPriceBenchmark[],
  panelElement: string,
  carClass?: string,
): MarketPriceBenchmark | null {
  if (!benchmarks.length || !panelElement) return null

  const normalizedElement = normalizePanelKey(panelElement)

  if (carClass) {
    const cc = carClass.toUpperCase().trim()
    const exact = benchmarks.find((b) => b.panelElement === normalizedElement && b.carClass === cc)
    if (exact && exact.sampleCount >= 5) return exact
  }

  const fallback = benchmarks.find((b) => b.panelElement === normalizedElement)
  if (fallback && fallback.sampleCount >= 5) return fallback
  return null
}

const CONSENT_KEY = 'dm_market_prices_consent'
const PENDING_QUEUE_KEY = 'dm_market_prices_queue_v1'

export function hasMarketPricesConsent(): boolean {
  return localStorage.getItem(CONSENT_KEY) === 'granted'
}

export function setMarketPricesConsent(granted: boolean): void {
  localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied')
}

export function clearMarketPricesQueue(): void {
  try {
    localStorage.removeItem(PENDING_QUEUE_KEY)
  } catch {
    /* ignore */
  }
}

function loadQueue(): PriceDataPoint[] {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(queue: PriceDataPoint[]): void {
  const trimmed = queue.slice(-500)
  try {
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(trimmed))
  } catch {
    /* ignore */
  }
}

export function enqueueDataPoint(point: PriceDataPoint): void {
  if (!hasMarketPricesConsent()) return
  if (!point.city || !point.carClass || !point.panelElement) return
  if (!point.price || point.price <= 0) return

  const queue = loadQueue()
  queue.push({
    ...point,
    city: normalizeCitySlug(point.city),
    panelElement: point.panelElement,
  })
  saveQueue(queue)
}

export function enqueueRecordDataPoints(record: Record<string, unknown>, cityRaw: string): void {
  if (!hasMarketPricesConsent()) return
  if (!cityRaw?.trim()) return

  const items = Array.isArray(record.lineItemsSnapshot)
    ? (record.lineItemsSnapshot as Record<string, unknown>[])
    : []

  let carClass =
    (record.recordCarClass as string) ||
    (record.carClassCode as string) ||
    ''
  if (!carClass) {
    const dents = record.dents as { items?: { conditions?: { carClassCode?: string } }[] } | undefined
    carClass = dents?.items?.[0]?.conditions?.carClassCode || ''
  }
  if (!carClass) carClass = 'C'

  for (const item of items) {
    const dent = item.dent as Record<string, unknown> | undefined
    const element =
      (dent?.panelElement as string) ||
      ((dent?.conditions as { panelElement?: string })?.panelElement as string) ||
      (item.panelElement as string) ||
      ''
    const price =
      Number(item.appliedTotal ?? item.dmCalculatedLineTotal ?? item.base ?? 0) || 0
    if (!element || price <= 0) continue

    const len = dent?.sizeLengthMm ?? (dent?.bboxMm as { width?: number })?.width
    const wid = dent?.sizeWidthMm ?? (dent?.bboxMm as { height?: number })?.height

    enqueueDataPoint({
      city: cityRaw,
      carClass: String(carClass).toUpperCase().trim(),
      panelElement: String(element),
      price: Math.round(price),
      dentLengthMm: len != null ? Number(len) : undefined,
      dentWidthMm: wid != null ? Number(wid) : undefined,
    })
  }
}

export async function flushQueue(): Promise<void> {
  if (!isSupabaseConfigured()) return
  const queue = loadQueue()
  if (queue.length === 0) return

  const base = edgeBase()
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!base || !anon) return

  const body = queue.map((p) => ({
    city: normalizeCitySlug(p.city),
    carClass: p.carClass,
    panelElement: p.panelElement,
    price: p.price,
    dentLengthMm: p.dentLengthMm,
    dentWidthMm: p.dentWidthMm,
    appVersion: p.appVersion,
  }))

  try {
    const resp = await fetch(`${base}/collect-price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      },
      body: JSON.stringify(body),
    })

    if (resp.ok) saveQueue([])
  } catch {
    /* keep queue */
  }
}
