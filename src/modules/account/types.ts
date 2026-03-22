/**
 * Доменные типы модуля Личный кабинет.
 * Строго по ТЗ-3: Free/Demo, Master, PRO, Corporate.
 */

export type PlanId = 'free' | 'demo' | 'master' | 'pro' | 'corporate'

export type SubscriptionStatus =
  | 'active'
  | 'inactive'
  | 'trial'
  | 'expired'
  | 'cancelled'

export interface UserProfile {
  id: string
  telegramUserId: number
  telegramUsername?: string
  name: string
  phone: string
  phoneVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  userId: string
  plan: PlanId
  status: SubscriptionStatus
  trialStartedAt?: string
  trialEndsAt?: string
  periodStart?: string
  periodEnd?: string
  autoRenew: boolean
}

export interface PaymentRecord {
  id: string
  userId: string
  amount: number
  currency: string
  plan: PlanId
  status: 'pending' | 'success' | 'failed' | 'refunded'
  provider: string
  externalId?: string
  createdAt: string
}

/** Feature gates — по ТЗ-3 */
export interface FeatureGates {
  /** Лимит расчётов в день/месяц (0 = нет доступа к расчётам) — ТЗ: Free=10 */
  calcLimit: number
  /** Безлимитные расчёты */
  calcUnlimited: boolean
  /** Доступ к истории оценок — ТЗ: Master+ */
  historyEnabled: boolean
  /** Безлимитная история */
  historyUnlimited: boolean
  /** Лимит записей в истории (0 = недоступно) */
  historyLimit: number
  /** Поиск по телефону клиента — ТЗ: Master+ */
  searchByPhone: boolean
  /** История по клиенту (все оценки по номеру) — ТЗ: Master+ */
  clientHistory: boolean
  /** Метрики 1–11 (аналитика) — ТЗ: PRO+ */
  analyticsBasic: boolean
  analyticsAdvanced: boolean
  /** Расчёт прибыли, учёт расходов — ТЗ: PRO+ */
  profitCalc: boolean
  /** Экспорт PDF */
  exportPdf: boolean
  /** Вложения к оценкам */
  attachmentsEnabled: boolean
  attachmentsPerDent: number
  /** Несколько мастеров — ТЗ: Corporate (до 3) */
  multiMaster: boolean
  /** CRM, запись клиентов, график — ТЗ: PRO+ */
  crmEnabled: boolean
  apiAccess: boolean
  prioritySupport: boolean
}

export interface PlanInfo {
  id: PlanId
  name: string
  price: number
  currency: string
  description: string
  highlighted: boolean
  features: FeatureGates
}

export type PaymentFlowStatus =
  | 'idle'
  | 'creating'
  | 'pending'
  | 'success'
  | 'error'
  | 'cancelled'

export interface PaymentSessionResult {
  sessionId: string
  redirectUrl?: string
  invoiceLink?: string
  confirmationUrl?: string
  amount?: number
}

export interface PaymentStatusResult {
  status: 'pending' | 'succeeded' | 'cancelled' | 'error'
  subscription?: Subscription
}
