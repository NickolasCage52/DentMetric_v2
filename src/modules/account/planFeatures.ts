/**
 * Матрица тарифов по ТЗ-3.
 * DM Free/Demo | DM Master | DM PRO | DM Corporate
 */

import type { PlanId, FeatureGates, PlanInfo } from './types'

/** Временно отключить ограничения по тарифу. Приложение работает полностью без выбранного тарифа. */
export const TARIFF_BYPASS_ENABLED = true

/** По ТЗ-3: Free/Demo — 10 расчётов по умолчанию, без истории и аналитики */
const FREE_FEATURES: FeatureGates = {
  calcLimit: 10,
  calcUnlimited: false,
  historyEnabled: false,
  historyUnlimited: false,
  historyLimit: 0,
  searchByPhone: false,
  clientHistory: false,
  analyticsBasic: false,
  analyticsAdvanced: false,
  profitCalc: false,
  exportPdf: false,
  attachmentsEnabled: false,
  attachmentsPerDent: 0,
  multiMaster: false,
  crmEnabled: false,
  apiAccess: false,
  prioritySupport: false,
}

/** Demo — пробный период Master (7 дней). Те же фичи что Master */
const DEMO_FEATURES: FeatureGates = {
  ...FREE_FEATURES,
  calcLimit: 999,
  calcUnlimited: true,
  historyEnabled: true,
  historyUnlimited: true,
  historyLimit: 999,
  searchByPhone: true,
  clientHistory: true,
}

/** Master — расчёт + история + поиск по телефону. Без аналитики. ТЗ: 500–990 ₽/мес */
const MASTER_FEATURES: FeatureGates = {
  ...DEMO_FEATURES,
}

/** PRO — полная аналитика (метрики 1–11), прибыль, расходы. ТЗ: 1990 ₽/мес */
const PRO_FEATURES: FeatureGates = {
  ...MASTER_FEATURES,
  analyticsBasic: true,
  analyticsAdvanced: true,
  profitCalc: true,
  exportPdf: true,
  attachmentsEnabled: true,
  attachmentsPerDent: 5,
  crmEnabled: true,
  prioritySupport: true,
}

/** Corporate — до 3 мастеров + доп. пользователи. ТЗ: 2990 ₽/мес */
const CORPORATE_FEATURES: FeatureGates = {
  ...PRO_FEATURES,
  multiMaster: true,
  attachmentsPerDent: 10,
  apiAccess: true,
}

export const PLAN_FEATURES: Record<PlanId, FeatureGates> = {
  free: FREE_FEATURES,
  demo: DEMO_FEATURES,
  master: MASTER_FEATURES,
  pro: PRO_FEATURES,
  corporate: CORPORATE_FEATURES,
}

/** Цены по ТЗ-3 (ориентиры). Заказчик предоставляет финальные значения */
export const PLAN_INFO: Record<PlanId, Omit<PlanInfo, 'features'>> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'RUB',
    description: '10 расчётов, без истории и аналитики',
    highlighted: false,
  },
  demo: {
    id: 'demo',
    name: 'Demo',
    price: 0,
    currency: 'RUB',
    description: '7 дней пробного доступа (как Master)',
    highlighted: false,
  },
  master: {
    id: 'master',
    name: 'Master',
    price: 990,
    currency: 'RUB',
    description: 'История оценок, поиск по телефону',
    highlighted: false,
  },
  pro: {
    id: 'pro',
    name: 'PRO',
    price: 1990,
    currency: 'RUB',
    description: 'Полная аналитика, расчёт прибыли, CRM',
    highlighted: true,
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    price: 2990,
    currency: 'RUB',
    description: 'До 3 мастеров, доп. пользователи',
    highlighted: false,
  },
}

/** Дней пробного периода для Demo */
export const TRIAL_DAYS = 7

/** Ключи для canUse/getLimit — поддерживаем legacy и новые */
export type FeatureKey = keyof FeatureGates

export function canUse(featureKey: FeatureKey, plan: PlanId): boolean {
  const gates = PLAN_FEATURES[plan]
  const value = gates[featureKey]
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  return false
}

export function getLimit(featureKey: FeatureKey, plan: PlanId): number {
  const value = PLAN_FEATURES[plan][featureKey]
  return typeof value === 'number' ? value : (value ? 999 : 0)
}

export function getMinPlanFor(featureKey: FeatureKey): PlanId {
  const order: PlanId[] = ['free', 'demo', 'master', 'pro', 'corporate']
  return order.find((p) => canUse(featureKey, p)) ?? 'corporate'
}

export function getPlanDisplayName(plan: PlanId): string {
  return PLAN_INFO[plan].name
}
