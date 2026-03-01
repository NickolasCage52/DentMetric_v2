import { ref } from 'vue'

export interface AppNotification {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message?: string
  duration?: number
  action?: { label: string; handler: () => void }
}

const notifications = ref<AppNotification[]>([])

export function useNotifications() {
  function show(n: Omit<AppNotification, 'id'>) {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `n_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    notifications.value.push({ id, duration: 3500, ...n })
    if (n.duration !== 0) {
      setTimeout(() => dismiss(id), n.duration ?? 3500)
    }
    return id
  }

  function dismiss(id: string) {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  const success = (title: string, message?: string) =>
    show({ type: 'success', title, message })
  const info = (title: string, message?: string) =>
    show({ type: 'info', title, message })
  const warn = (title: string, message?: string) =>
    show({ type: 'warning', title, message, duration: 5000 })
  const error = (title: string, message?: string) =>
    show({ type: 'error', title, message, duration: 0 })

  return { notifications, show, dismiss, success, info, warn, error }
}
