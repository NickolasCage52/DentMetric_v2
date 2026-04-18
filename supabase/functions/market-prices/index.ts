import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const url = new URL(req.url)

  if (req.method === 'GET') {
    const city = url.searchParams.get('city') || 'unknown'
    const carClass = url.searchParams.get('carClass') || ''
    const panelElement = url.searchParams.get('panelElement') || ''

    try {
      let query = supabaseAdmin.from('market_prices_cache').select('*').eq('city', city)

      if (carClass) query = query.eq('car_class', carClass)
      if (panelElement) query = query.eq('panel_element', panelElement)

      const { data: cached, error: cacheError } = await query

      const now = Date.now()
      const freshCached = (cached || []).filter((row) => {
        const age = now - new Date(row.computed_at).getTime()
        return age < 60 * 60 * 1000
      })

      if (!cacheError && freshCached.length > 0) {
        return new Response(JSON.stringify({ data: freshCached, source: 'cache' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const MIN_SAMPLES = 5
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

      let rawQuery = supabaseAdmin
        .from('market_prices_raw')
        .select('panel_element, car_class, city, price')
        .eq('city', city)
        .gte('recorded_at', cutoffDate)

      if (carClass) rawQuery = rawQuery.eq('car_class', carClass)
      if (panelElement) rawQuery = rawQuery.eq('panel_element', panelElement)

      const { data: rawData, error: rawError } = await rawQuery
      if (rawError) throw rawError

      const groups = new Map<string, number[]>()
      for (const row of rawData || []) {
        const key = `${row.city}:${row.car_class}:${row.panel_element}`
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(row.price)
      }

      const results: Array<Record<string, unknown>> = []
      for (const [key, prices] of groups) {
        if (prices.length < MIN_SAMPLES) continue
        const sorted = [...prices].sort((a, b) => a - b)
        const [cityVal, carClassVal, panelElementVal] = key.split(':')
        results.push({
          id: key,
          city: cityVal,
          car_class: carClassVal,
          panel_element: panelElementVal,
          median_price: percentile(sorted, 50),
          p25_price: percentile(sorted, 25),
          p75_price: percentile(sorted, 75),
          sample_count: prices.length,
          computed_at: new Date().toISOString(),
        })
      }

      if (results.length > 0) {
        await supabaseAdmin.from('market_prices_cache').upsert(results, { onConflict: 'id' })
      }

      return new Response(JSON.stringify({ data: results, source: 'computed' }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=900',
        },
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders })
})

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  const fraction = index - lower
  return Math.round(sorted[lower] + fraction * (sorted[upper] - sorted[lower]))
}
