/**
 * MVP: mock payment session. Точка интеграции для Telegram Payments / YooKassa / Stripe.
 */
import { getUserIdFromToken } from '../_shared/auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const userId = getUserIdFromToken(req)
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const body = (await req.json()) as { planId?: string }
  const planId = body.planId ?? 'master'

  return new Response(
    JSON.stringify({
      sessionId: `mock_${Date.now()}`,
      redirectUrl: null,
      invoiceLink: null,
      status: 'mock',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
