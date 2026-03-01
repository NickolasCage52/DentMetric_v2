/**
 * Feature gate composable — проверка доступа по тарифу.
 * requireFeature → paywall при отсутствии прав.
 */

import { ref } from 'vue'
import { useAccount } from './useAccount'
import type { FeatureGates } from './types'
import { getMinPlanFor, getPlanDisplayName } from './planFeatures'
import type { FeatureKey } from './planFeatures'

const paywallVisible = ref(false)
const paywallFeature = ref<FeatureKey | null>(null)
const paywallMinPlan = ref('')

export function useFeatureGate() {
  const account = useAccount()

  function requireFeature(
    featureKey: FeatureKey,
    opts?: { silent?: boolean; onBlocked?: () => void }
  ): boolean {
    if (account.can(featureKey)) return true

    const minPlan = getMinPlanFor(featureKey)
    paywallFeature.value = featureKey
    paywallMinPlan.value = getPlanDisplayName(minPlan)

    if (opts?.onBlocked) {
      opts.onBlocked()
    } else if (!opts?.silent) {
      paywallVisible.value = true
    }

    return false
  }

  function checkHistoryLimit(currentCount: number): boolean {
    if (account.can('historyUnlimited')) return true
    const lim = account.limit('historyLimit')
    if (lim <= 0) {
      paywallFeature.value = 'historyEnabled'
      paywallMinPlan.value = getPlanDisplayName(getMinPlanFor('historyEnabled'))
      paywallVisible.value = true
      return false
    }
    if (currentCount < lim) return true
    paywallFeature.value = 'historyLimit'
    paywallMinPlan.value = getPlanDisplayName(getMinPlanFor('historyUnlimited'))
    paywallVisible.value = true
    return false
  }

  function checkCalcLimit(currentCount: number): boolean {
    if (account.can('calcUnlimited')) return true
    const lim = account.limit('calcLimit')
    if (currentCount < lim) return true
    paywallFeature.value = 'calcLimit'
    paywallMinPlan.value = getPlanDisplayName(getMinPlanFor('calcUnlimited'))
    paywallVisible.value = true
    return false
  }

  function closePaywall(): void {
    paywallVisible.value = false
    paywallFeature.value = null
  }

  return {
    requireFeature,
    checkHistoryLimit,
    checkCalcLimit,
    paywallVisible,
    paywallFeature,
    paywallMinPlan,
    closePaywall,
    can: account.can,
    limit: account.limit,
  }
}
