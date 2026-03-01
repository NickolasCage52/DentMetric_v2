import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getUserIdFromToken } from '../_shared/auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateReferralCode(userId: string): string {
  return `DM${userId.slice(0, 8).toUpperCase().replace(/-/g, '')}${Math.random().toString(36).slice(2, 5).toUpperCase()}`
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

  let code: string
  const { data: existing } = await supabase
    .from('referrals')
    .select('code')
    .eq('referrer_id', userId)
    .is('referee_id', null)
    .limit(1)
    .maybeSingle()

  if (existing?.code) {
    code = existing.code
  } else {
    code = generateReferralCode(userId)
    await supabase.from('referrals').insert({
      referrer_id: userId,
      code,
      bonus_days: 14,
    })
  }

  const { count } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', userId)
    .not('referee_id', 'is', null)

  return new Response(
    JSON.stringify({
      code,
      activatedCount: count ?? 0,
      bonusDays: 14,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
