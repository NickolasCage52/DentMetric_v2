/**
 * Telegram WebApp utilities — безопасное чтение initData и user.
 * Верификация подписи — ТОЛЬКО на сервере.
 */

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export function getTelegramInitData(): string {
  return (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) ?? ''
}

export function getTelegramUser(): TelegramUser | null {
  try {
    const raw = (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) as TelegramUser | undefined
    if (!raw?.id) return null
    return raw
  } catch {
    return null
  }
}

export function expandTelegramWebApp(): void {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    window.Telegram.WebApp.expand?.()
    window.Telegram.WebApp.enableClosingConfirmation?.()
  }
}

export function getTelegramColorScheme(): 'dark' | 'light' {
  return (typeof window !== 'undefined' && window.Telegram?.WebApp?.colorScheme) ?? 'dark'
}

/** В DEV без initData — имитация для локальной разработки */
export function getMockTelegramUser(): TelegramUser {
  return {
    id: 123456789,
    first_name: 'Dev',
    last_name: 'User',
    username: 'devuser',
  }
}

export function getEffectiveTelegramUser(): TelegramUser | null {
  if (import.meta.env?.DEV && typeof window !== 'undefined' && !window.Telegram?.WebApp?.initData) {
    console.warn('[DM Account] DEV mode: using mock Telegram user')
    return getMockTelegramUser()
  }
  return getTelegramUser()
}
