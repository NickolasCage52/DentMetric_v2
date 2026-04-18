import { createApp } from 'vue'
import { createPinia } from 'pinia'
import AppShell from './AppShell.vue'
import './styles.css'
import { router } from './router/index.js'
import { useAuthStore } from './stores/auth'
import { useEmployeesStore } from './stores/employees'
import { useBookingsStore } from './stores/bookings'
import { useSyncStore } from './stores/sync'
import { useHistoryPiniaStore } from './stores/history'
import {
  isFirstVisit,
  markUserAsRegistered,
  isRegistrationConfirmed,
} from './services/userIdentity'
import { trackUserRegistration } from './services/trackingService'
import { runDevAudit } from './utils/devAudit'
import { runDevAuditSettings } from './utils/devAuditSettings'
import { showToast } from './utils/toast'

function initTracking() {
  void (async () => {
    if (isFirstVisit()) {
      try {
        await trackUserRegistration()
      } finally {
        markUserAsRegistered()
      }
    } else if (!isRegistrationConfirmed()) {
      await trackUserRegistration()
    }
  })()
}

initTracking()

const app = createApp(AppShell)
const pinia = createPinia()
app.use(pinia)
app.use(router)

const authStore = useAuthStore()
authStore.initialize()
useEmployeesStore().loadEmployees()
useBookingsStore().loadBookings()
useHistoryPiniaStore().loadHistory(true)
const syncStore = useSyncStore()
syncStore.updatePendingCount()
syncStore.initAutoSync()

app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue error]', err, info)
  if (typeof window !== 'undefined') {
    window.__VUE_HISTORY_ERROR__ = { message: err?.message, stack: err?.stack, info }
    if (import.meta.env?.DEV) {
      console.error('[DentMetric DEV] Runtime error captured. If History shows black screen, inspect window.__VUE_HISTORY_ERROR__', err?.message)
    }
  }
}

app.mount('#app')

if (typeof window !== 'undefined') {
  window.onerror = (msg, source, line, col, err) => {
    console.error('[Global error]', msg, source, line, col, err)
    if (import.meta.env?.DEV) {
      console.error('[DentMetric DEV] Global error. If History black screen, check window.__VUE_HISTORY_ERROR__', msg)
    }
  }
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[Unhandled rejection]', e.reason)
    try {
      e.preventDefault()
    } catch {
      /* ignore */
    }
    const reason = e.reason
    const msg =
      reason && typeof reason === 'object' && 'message' in reason
        ? String((reason).message)
        : String(reason ?? '')
    if (/abort|AbortError/i.test(msg)) return
    showToast('Произошла ошибка. Попробуйте ещё раз', 'error', 3200)
    if (import.meta.env?.DEV) {
      console.error('[DentMetric DEV] Unhandled rejection. If History black screen, check window.__VUE_HISTORY_ERROR__', e?.reason)
    }
  })
}

if (import.meta.env?.DEV) {
  runDevAudit()
  runDevAuditSettings()
  import('./utils/devAuditFull').then((m) => m.runFullAudit())
  import('./utils/devAuditMath').then((m) => m.runMathAudit())
  import('./utils/devAuditAccount').then((m) => m.runAccountAudit())
  import('./utils/devAuditDiscount').then((m) => m.runDiscountAudit())
  fetch('/meta.json')
    .then((r) => (r.ok ? null : Promise.reject(new Error(`${r.status}`))))
    .catch(() => console.warn('[dev] meta.json not found or failed to load (404 is OK in dev)'))
}
