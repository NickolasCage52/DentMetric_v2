/**
 * API client для модуля Личный кабинет.
 * BASE_URL — Supabase Edge Functions или mock backend.
 */

import type { UserProfile, Subscription, PlanId, PaymentRecord, PaymentStatusResult } from '../types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? ''

async function req<T>(
  path: string,
  opts: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...rest } = opts
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers as Record<string, string>),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`[DM API] ${path} → ${res.status}: ${text}`)
  }
  return res.json()
}

export const accountApi = {
  verifyTelegram: (initData: string) =>
    req<{ token: string; user: UserProfile; subscription: Subscription | null }>('/auth-telegram-verify', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    }),

  getMe: (token: string) =>
    req<UserProfile>('/get-me', { headers: { Authorization: `Bearer ${token}` } }),

  updateMe: (token: string, data: Partial<Pick<UserProfile, 'name' | 'phone'>>) =>
    req<UserProfile>('/update-me', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  getSubscription: (token: string) =>
    req<Subscription>('/get-subscription', { headers: { Authorization: `Bearer ${token}` } }),

  startTrial: (token: string) =>
    req<Subscription>('/start-trial', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  createPaymentSession: (token: string, planId: PlanId) =>
    req<{ sessionId: string; redirectUrl?: string; invoiceLink?: string }>(
      '/create-payment-session',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId }),
      }
    ),

  getPayments: (token: string) =>
    req<PaymentRecord[]>('/get-payments', { token }),

  getReferral: (token: string) =>
    req<{ code: string; activatedCount: number; bonusDays: number }>('/referral-get', { token }),

  /**
   * Check payment status after user returns from payment gateway.
   * Backend queries YooKassa (or other provider) using its own credentials.
   */
  checkPaymentStatus: (token: string, sessionId: string) =>
    req<PaymentStatusResult>(`/payment-status/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
}

/**
 * BACKEND CONTRACT (for YooKassa integration):
 *
 * POST /create-payment-session
 *   Auth: Bearer token
 *   Body: { planId }
 *   Backend: creates YooKassa payment using shop credentials (NEVER on frontend)
 *   Response: { sessionId, redirectUrl?, invoiceLink?, confirmationUrl? }
 *
 * GET /payment-status/:sessionId
 *   Auth: Bearer token
 *   Response: { status: 'pending' | 'succeeded' | 'cancelled' | 'error', subscription? }
 *
 * POST /yookassa-webhook (called by YooKassa, not by frontend)
 *   Validates YooKassa IP + HMAC signature
 *   Updates subscription in DB
 *
 * IMPORTANT: YooKassa shopId and secretKey must NEVER appear in frontend code.
 * They belong exclusively to the backend .env / secrets manager.
 */
