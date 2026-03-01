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
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return new Response(
      JSON.stringify({
        id: '',
        userId,
        plan: 'free',
        status: 'inactive',
        autoRenew: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
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
