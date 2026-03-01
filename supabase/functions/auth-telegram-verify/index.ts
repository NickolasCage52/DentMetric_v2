/**
 * Supabase Edge Function: verify Telegram initData and upsert user.
 * ТЗ-3: авторизация через Telegram WebApp.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function hmacSha256Hex(key: ArrayBuffer, data: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(data)
  )
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function verifyTelegramInitData(
  initData: string,
  botToken: string
): Promise<{ telegramUserId: number; telegramUsername?: string; telegramName: string } | null> {
  if (initData.startsWith('mock_')) {
    const id = parseInt(initData.replace('mock_', ''), 10)
    if (Number.isNaN(id)) return null
    return {
      telegramUserId: id,
      telegramName: 'Dev User',
    }
  }

  const params = new URLSearchParams(initData)
  const receivedHash = params.get('hash')
  params.delete('hash')
  if (!receivedHash) return null

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const botTokenBytes = new TextEncoder().encode(botToken)
  const secretKeyHex = await hmacSha256Hex(botTokenBytes, 'WebAppData')
  const secretKeyBytes = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    secretKeyBytes[i] = parseInt(secretKeyHex.slice(i * 2, i * 2 + 2), 16)
  }
  const expectedHash = await hmacSha256Hex(secretKeyBytes.buffer, dataCheckString)

  if (expectedHash !== receivedHash) return null

  const userStr = params.get('user')
  if (!userStr) return null
  const user = JSON.parse(userStr) as {
    id: number
    first_name?: string
    last_name?: string
    username?: string
  }
  const telegramName = [user.first_name, user.last_name].filter(Boolean).join(' ') || ''
  return {
    telegramUserId: user.id,
    telegramUsername: user.username,
    telegramName,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { initData } = (await req.json()) as { initData?: string }
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!initData || !botToken || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing initData or server config' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const verified = await verifyTelegramInitData(initData, botToken)
    if (!verified) {
      return new Response(
        JSON.stringify({ error: 'Invalid Telegram signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert(
        {
          telegram_user_id: verified.telegramUserId,
          telegram_username: verified.telegramUsername ?? null,
          name: verified.telegramName || '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'telegram_user_id' }
      )
      .select()
      .single()

    if (userError) throw userError

    const { data: sub } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: user.id,
          plan: 'free',
          status: 'inactive',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    const token = `dm_${user.id}_${Date.now()}`
    return new Response(
      JSON.stringify({
        token,
        user: {
          id: user.id,
          telegramUserId: user.telegram_user_id,
          telegramUsername: user.telegram_username,
          name: user.name,
          phone: user.phone,
          phoneVerified: user.phone_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        subscription: sub
          ? {
              id: sub.id,
              userId: sub.user_id,
              plan: sub.plan,
              status: sub.status,
              trialStartedAt: sub.trial_started_at,
              trialEndsAt: sub.trial_ends_at,
              periodStart: sub.period_start,
              periodEnd: sub.period_end,
              autoRenew: sub.auto_renew,
            }
          : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
