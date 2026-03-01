import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getUserIdFromToken } from '../_shared/auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TRIAL_DAYS = 7

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

  const now = new Date()
  const trialEnds = new Date(now.getTime() + TRIAL_DAYS * 86400000)

  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        plan: 'demo',
        status: 'trial',
        trial_started_at: now.toISOString(),
        trial_ends_at: trialEnds.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({
      id: data.id,
      userId: data.user_id,
      plan: data.plan,
      status: data.status,
      trialStartedAt: data.trial_started_at,
      trialEndsAt: data.trial_ends_at,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      autoRenew: data.auto_renew,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
