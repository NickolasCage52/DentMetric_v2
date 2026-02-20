/**
 * Centralized control for Telegram WebApp native buttons (MainButton / SecondaryButton).
 * All calls are safe to run outside Telegram (browser) — they no-op silently.
 */

function getMainButton() {
  return window.Telegram?.WebApp?.MainButton ?? null;
}

function getSecondaryButton() {
  return window.Telegram?.WebApp?.SecondaryButton ?? null;
}

export function hideTelegramButtons() {
  const main = getMainButton();
  if (main) {
    try {
      main.hide();
      if (typeof main.setParams === 'function') {
        main.setParams({ is_visible: false });
      }
    } catch { /* noop */ }
  }

  const secondary = getSecondaryButton();
  if (secondary) {
    try {
      secondary.hide();
      if (typeof secondary.setParams === 'function') {
        secondary.setParams({ is_visible: false });
      }
    } catch { /* noop */ }
  }
}
