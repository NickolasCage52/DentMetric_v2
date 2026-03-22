/**
 * Singleton composable для состояния аккаунта.
 * Offline-first: при недоступном backend работаем с локальным кэшем.
 */

import { ref, computed, readonly } from 'vue'
import type { UserProfile, Subscription, PlanId, FeatureGates, PaymentFlowStatus } from './types'
import { canUse, getLimit, TRIAL_DAYS, TARIFF_BYPASS_ENABLED } from './planFeatures'
import type { FeatureKey } from './planFeatures'
import { getEffectiveTelegramUser } from './utils/telegram'

const profile = ref<UserProfile | null>(null)
const subscription = ref<Subscription | null>(null)
const sessionToken = ref<string | null>(null)
const isLoading = ref(false)
const initError = ref<string | null>(null)
const isInitialized = ref(false)

const paymentFlowStatus = ref<PaymentFlowStatus>('idle')
const paymentError = ref<string | null>(null)
const currentPaymentSessionId = ref<string | null>(null)
const pendingPlanId = ref<PlanId | null>(null)

const STORAGE_TOKEN_KEY = 'dm_account_token'
const STORAGE_PROFILE_KEY = 'dm_account_profile_cache'

const isAuthenticated = computed(() => !!sessionToken.value && !!profile.value)
const isProfileComplete = computed(() =>
  !!profile.value?.name?.trim() && !!profile.value?.phone?.trim()
)
const currentPlan = computed<PlanId>(() => subscription.value?.plan ?? 'free')

const isTrialActive = computed(() => {
  if (subscription.value?.status !== 'trial') return false
  if (!subscription.value.trialEndsAt) return false
  return new Date(subscription.value.trialEndsAt) > new Date()
})

const trialDaysLeft = computed(() => {
  if (!isTrialActive.value || !subscription.value?.trialEndsAt) return 0
  const ms = new Date(subscription.value.trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86400000))
})

const isSubscriptionActive = computed(
  () => subscription.value?.status === 'active' || isTrialActive.value
)

function can(featureKey: FeatureKey): boolean {
  if (TARIFF_BYPASS_ENABLED) return true
  return canUse(featureKey, currentPlan.value)
}

function limit(featureKey: FeatureKey): number {
  if (TARIFF_BYPASS_ENABLED) return 999
  return getLimit(featureKey, currentPlan.value)
}

function loadTokenFromStorage(): void {
  try {
    sessionToken.value = localStorage.getItem(STORAGE_TOKEN_KEY)
    const cached = localStorage.getItem(STORAGE_PROFILE_KEY)
    if (cached) {
      profile.value = JSON.parse(cached) as UserProfile
    }
  } catch {
    /* ignore */
  }
}

function saveTokenToStorage(): void {
  try {
    if (sessionToken.value) {
      localStorage.setItem(STORAGE_TOKEN_KEY, sessionToken.value)
    } else {
      localStorage.removeItem(STORAGE_TOKEN_KEY)
    }
    if (profile.value) {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile.value))
    } else {
      localStorage.removeItem(STORAGE_PROFILE_KEY)
    }
  } catch {
    /* ignore */
  }
}

async function initialize(): Promise<void> {
  if (isInitialized.value) return
  isLoading.value = true
  initError.value = null
  loadTokenFromStorage()

  try {
    const tgUser = getEffectiveTelegramUser()
    const apiBase = (import.meta.env.VITE_API_BASE_URL as string) ?? ''

    if (tgUser && apiBase) {
      const initData =
        (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) ??
        `mock_${tgUser.id}`

      try {
        const { accountApi } = await import('./api/accountApi')
        const result = await accountApi.verifyTelegram(initData)
        sessionToken.value = result.token
        profile.value = result.user
        subscription.value = result.subscription ?? {
          id: '',
          userId: result.user.id,
          plan: 'free',
          status: 'inactive',
          autoRenew: false,
        }
        saveTokenToStorage()
      } catch (e) {
        console.warn('[DM Account] Backend unavailable, using local cache', e)
        if (!profile.value && tgUser) {
          profile.value = {
            id: `local_${tgUser.id}`,
            telegramUserId: tgUser.id,
            telegramUsername: tgUser.username,
            name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ').trim() || 'Гость',
            phone: '',
            phoneVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          subscription.value = {
            id: '',
            userId: profile.value.id,
            plan: 'free',
            status: 'inactive',
            autoRenew: false,
          }
          saveTokenToStorage()
        }
      }
    } else if (sessionToken.value && apiBase) {
      try {
        const { accountApi } = await import('./api/accountApi')
        profile.value = await accountApi.getMe(sessionToken.value)
        subscription.value = await accountApi.getSubscription(sessionToken.value)
      } catch {
        /* use cache */
      }
    } else if (tgUser && !profile.value) {
      profile.value = {
        id: `local_${tgUser.id}`,
        telegramUserId: tgUser.id,
        telegramUsername: tgUser.username,
        name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ').trim() || 'Гость',
        phone: '',
        phoneVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      subscription.value = {
        id: '',
        userId: profile.value.id,
        plan: 'free',
        status: 'inactive',
        autoRenew: false,
      }
      saveTokenToStorage()
    }
  } finally {
    isLoading.value = false
    isInitialized.value = true
  }
}

async function updateProfile(
  data: Partial<Pick<UserProfile, 'name' | 'phone'>>
): Promise<void> {
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string) ?? ''
  if (!sessionToken.value || !apiBase) {
    if (profile.value) {
      profile.value = {
        ...profile.value,
        ...data,
        updatedAt: new Date().toISOString(),
      }
      saveTokenToStorage()
    }
    return
  }
  try {
    const { accountApi } = await import('./api/accountApi')
    profile.value = await accountApi.updateMe(sessionToken.value, data)
    saveTokenToStorage()
  } catch {
    if (profile.value) {
      profile.value = { ...profile.value, ...data, updatedAt: new Date().toISOString() }
      saveTokenToStorage()
    }
  }
}

async function startTrial(): Promise<void> {
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string) ?? ''
  if (!apiBase) {
    subscription.value = {
      id: '',
      userId: profile.value?.id ?? '',
      plan: 'demo',
      status: 'trial',
      trialStartedAt: new Date().toISOString(),
      trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString(),
      autoRenew: false,
    }
    return
  }
  if (!sessionToken.value) throw new Error('Not authenticated')
  const { accountApi } = await import('./api/accountApi')
  subscription.value = await accountApi.startTrial(sessionToken.value)
}

async function activatePlan(
  planId: PlanId
): Promise<{ redirectUrl?: string; invoiceLink?: string }> {
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string) ?? ''
  if (!apiBase) {
    subscription.value = {
      id: '',
      userId: profile.value?.id ?? '',
      plan: planId,
      status: 'active',
      autoRenew: true,
    }
    return {}
  }
  if (!sessionToken.value) throw new Error('Not authenticated')
  const { accountApi } = await import('./api/accountApi')
  return accountApi.createPaymentSession(sessionToken.value, planId)
}

async function startPaymentFlow(planId: PlanId): Promise<void> {
  paymentFlowStatus.value = 'creating'
  paymentError.value = null
  pendingPlanId.value = planId

  try {
    const result = await activatePlan(planId)
    const tgWebApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : null

    if (result.invoiceLink) {
      paymentFlowStatus.value = 'pending'
      currentPaymentSessionId.value = result.invoiceLink
      tgWebApp?.openInvoice?.(result.invoiceLink)
    } else if (result.redirectUrl) {
      paymentFlowStatus.value = 'pending'
      currentPaymentSessionId.value = result.redirectUrl
      if (tgWebApp?.openLink) {
        tgWebApp.openLink(result.redirectUrl)
      } else {
        window.open(result.redirectUrl, '_blank')
      }
    } else {
      paymentFlowStatus.value = 'success'
    }
  } catch (e: any) {
    paymentFlowStatus.value = 'error'
    paymentError.value = e?.message ?? 'Произошла ошибка при создании платежа'
  }
}

async function checkPaymentStatus(): Promise<void> {
  if (!currentPaymentSessionId.value || !sessionToken.value) return
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string) ?? ''
  if (!apiBase) {
    paymentFlowStatus.value = 'success'
    return
  }
  try {
    const { accountApi } = await import('./api/accountApi')
    const result = await accountApi.checkPaymentStatus(
      sessionToken.value,
      currentPaymentSessionId.value
    )
    if (result.status === 'succeeded') {
      paymentFlowStatus.value = 'success'
      if (result.subscription) subscription.value = result.subscription
      currentPaymentSessionId.value = null
    } else if (result.status === 'cancelled') {
      paymentFlowStatus.value = 'cancelled'
      currentPaymentSessionId.value = null
    } else if (result.status === 'error') {
      paymentFlowStatus.value = 'error'
      paymentError.value = 'Платёж не прошёл'
    }
  } catch (e: any) {
    paymentFlowStatus.value = 'error'
    paymentError.value = e?.message ?? 'Не удалось проверить статус платежа'
  }
}

function resetPaymentFlow(): void {
  paymentFlowStatus.value = 'idle'
  paymentError.value = null
  currentPaymentSessionId.value = null
  pendingPlanId.value = null
}

function logout(): void {
  profile.value = null
  subscription.value = null
  sessionToken.value = null
  try {
    localStorage.removeItem(STORAGE_TOKEN_KEY)
    localStorage.removeItem(STORAGE_PROFILE_KEY)
  } catch {
    /* ignore */
  }
}

export function useAccount() {
  return {
    profile: readonly(profile),
    subscription: readonly(subscription),
    token: readonly(sessionToken),
    isLoading: readonly(isLoading),
    initError: readonly(initError),
    isAuthenticated,
    isProfileComplete,
    currentPlan,
    isTrialActive,
    trialDaysLeft,
    isSubscriptionActive,
    can,
    limit,
    initialize,
    updateProfile,
    startTrial,
    activatePlan,
    paymentFlowStatus: readonly(paymentFlowStatus),
    paymentError: readonly(paymentError),
    pendingPlanId: readonly(pendingPlanId),
    startPaymentFlow,
    checkPaymentStatus,
    resetPaymentFlow,
    logout,
  }
}
