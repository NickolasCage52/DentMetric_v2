import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue error]', err, info)
  if (typeof window !== 'undefined') {
    window.__VUE_HISTORY_ERROR__ = { message: err?.message, stack: err?.stack, info }
  }
}

app.mount('#app')

if (typeof window !== 'undefined') {
  window.onerror = (msg, source, line, col, err) => {
    console.error('[Global error]', msg, source, line, col, err)
  }
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[Unhandled rejection]', e.reason)
  })
}

if (import.meta.env?.DEV) {
  fetch('/meta.json')
    .then((r) => (r.ok ? null : Promise.reject(new Error(`${r.status}`))))
    .catch(() => console.warn('[dev] meta.json not found or failed to load (404 is OK in dev)'))
}
