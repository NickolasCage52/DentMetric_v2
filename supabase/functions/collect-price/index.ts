import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PriceDataPoint {
  city: string
  carClass: string
  panelElement: string
  price: number
  dentLengthMm?: number
  dentWidthMm?: number
  appVersion?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = await req.json()
    const points: PriceDataPoint[] = Array.isArray(body) ? body : [body]

    const rows = points
      .filter(
        (p) =>
          p.city &&
          p.carClass &&
          p.panelElement &&
          typeof p.price === 'number' &&
          p.price > 100 &&
          p.price < 500_000,
      )
      .map((p) => ({
        city: normalizeCity(p.city),
        car_class: normalizeCarClass(p.carClass),
        panel_element: normalizePanelElement(p.panelElement),
        price: Math.round(p.price / 100) * 100,
        dent_length_mm: p.dentLengthMm != null ? Math.round(Number(p.dentLengthMm)) : null,
        dent_width_mm: p.dentWidthMm != null ? Math.round(Number(p.dentWidthMm)) : null,
        app_version: p.appVersion || null,
      }))

    if (rows.length === 0) {
      return new Response(JSON.stringify({ accepted: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error } = await supabaseAdmin.from('market_prices_raw').insert(rows)
    if (error) throw error

    return new Response(JSON.stringify({ accepted: rows.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function normalizeCity(city: string): string {
  const map: Record<string, string> = {
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
  const normalized = city.toLowerCase().trim()
  return map[normalized] || normalized.slice(0, 20)
}

function normalizeCarClass(cls: string): string {
  const valid = ['A', 'B', 'C', 'D', 'E', 'F', 'SUV', 'VAN']
  const upper = cls?.toUpperCase().trim()
  return valid.includes(upper) ? upper : 'C'
}

function normalizePanelElement(el: string): string {
  if (!el) return 'unknown'
  return el
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 50)
}
