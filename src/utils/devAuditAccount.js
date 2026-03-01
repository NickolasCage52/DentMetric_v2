/**
 * DEV-only audit for Account module (ТЗ-3).
 * Checks: validation, plan features, feature gating, security.
 */

import { validateName, validatePhone } from '../modules/account/utils/validation'
import { canUse, PLAN_FEATURES } from '../modules/account/planFeatures'

export async function runAccountAudit() {
  if (!import.meta.env?.DEV) return
  console.group('[DM Account Audit]')

  try {
    // 1. Валидация полей
    const nameOk = validateName('Иван') === null
    const nameEmpty = validateName('') !== null
    const phoneOk = validatePhone('+79001234567') === null
    const phoneBad = validatePhone('89001234567') !== null
    if (nameOk && nameEmpty && phoneOk && phoneBad) {
      console.log('Validation: OK')
    } else {
      console.error('Validation FAILED')
    }

    // 2. Plan features структура
    const plans = ['free', 'demo', 'master', 'pro', 'corporate']
    let plansOk = true
    for (const p of plans) {
      if (!(p in PLAN_FEATURES)) plansOk = false
      if (!('historyLimit' in PLAN_FEATURES[p])) plansOk = false
    }
    console.log(plansOk ? 'Plan features structure: OK' : 'Plan features structure: FAILED')

    // 3. Feature gating logic
    const freeNoHistory = canUse('historyUnlimited', 'free') === false
    const proHasHistory = canUse('historyUnlimited', 'pro') === true
    const freeNoAnalytics = canUse('analyticsAdvanced', 'free') === false
    if (freeNoHistory && proHasHistory && freeNoAnalytics) {
      console.log('Feature gating logic: OK')
    } else {
      console.error('Feature gating logic: FAILED')
    }

    // 4. BOT_TOKEN не в клиентском коде
    const envKeys = Object.keys(import.meta.env || {})
    const hasBotToken = envKeys.some((k) => k.includes('BOT_TOKEN'))
    console.log(!hasBotToken ? 'Security (no BOT_TOKEN in client): OK' : 'Security: BOT_TOKEN in client!')

    // 5. Account composable
    const { useAccount } = await import('../modules/account/useAccount')
    const acc = useAccount()
    const hasCan = typeof acc.can === 'function'
    const hasLimit = typeof acc.limit === 'function'
    const hasToken = acc.token !== undefined
    console.log(hasCan && hasLimit && hasToken ? 'Account composable: OK' : 'Account composable: FAILED')

    // 6. Animations
    const { hapticLight } = await import('../modules/account/utils/animations')
    console.log(typeof hapticLight === 'function' ? 'Haptic utils: OK' : 'Haptic utils: FAILED')

    // 7. Notifications
    const { useNotifications } = await import('../modules/account/useNotifications')
    const notif = useNotifications()
    const id = notif.success('Test')
    console.log(notif.notifications.value.some((n) => n.id === id) ? 'Notifications: OK' : 'Notifications: FAILED')
    notif.dismiss(id)
  } catch (e) {
    console.error('Account audit error:', e)
  }

  console.groupEnd()
}
