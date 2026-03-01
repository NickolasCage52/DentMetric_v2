import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const list = (data ?? []).map((p) => ({
    id: p.id,
    userId: p.user_id,
    amount: p.amount,
    currency: p.currency,
    plan: p.plan,
    status: p.status,
    provider: p.provider,
    externalId: p.external_id,
    createdAt: p.created_at,
  }))

  return new Response(JSON.stringify(list), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
