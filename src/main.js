import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'

const app = createApp(App)

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
    if (import.meta.env?.DEV) {
      console.error('[DentMetric DEV] Unhandled rejection. If History black screen, check window.__VUE_HISTORY_ERROR__', e?.reason)
    }
  })
}

if (import.meta.env?.DEV) {
  fetch('/meta.json')
    .then((r) => (r.ok ? null : Promise.reject(new Error(`${r.status}`))))
    .catch(() => console.warn('[dev] meta.json not found or failed to load (404 is OK in dev)'))
}
