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
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({
      id: data.id,
      telegramUserId: data.telegram_user_id,
      telegramUsername: data.telegram_username,
      name: data.name,
      phone: data.phone,
      phoneVerified: data.phone_verified,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
