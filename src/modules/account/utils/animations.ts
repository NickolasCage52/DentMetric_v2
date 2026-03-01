/**
 * Haptic feedback через Telegram WebApp.
 * Безопасно вне Telegram — no-op.
 */

export function hapticLight(): void {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light')
  } catch {
    /* noop */
  }
}

export function hapticMedium(): void {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium')
  } catch {
    /* noop */
  }
}

export function hapticSuccess(): void {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success')
  } catch {
    /* noop */
  }
}

export function hapticError(): void {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('error')
  } catch {
    /* noop */
  }
}
