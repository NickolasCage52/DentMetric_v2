/**
 * Императивный toast вне дерева Vue (main.js, публичный портал, clipboard).
 * Не заменяет in-app toast в App.vue — только для глобальных и изолированных экранов.
 */

let toastEl: HTMLDivElement | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

function ensureEl(): HTMLDivElement {
  if (toastEl && document.body.contains(toastEl)) return toastEl
  toastEl = document.createElement('div')
  toastEl.className = 'dm-global-toast'
  toastEl.setAttribute('role', 'status')
  document.body.appendChild(toastEl)
  if (!document.getElementById('dm-global-toast-style')) {
    const style = document.createElement('style')
    style.id = 'dm-global-toast-style'
    style.textContent = `
      .dm-global-toast {
        position: fixed;
        top: max(16px, env(safe-area-inset-top, 0px));
        left: 50%;
        transform: translateX(-50%);
        max-width: min(92vw, 360px);
        padding: 12px 18px;
        border-radius: 14px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
        pointer-events: none;
        text-align: center;
        line-height: 1.35;
        box-shadow: 0 8px 24px hsl(0 0% 0% / 0.45);
        border: 1px solid hsl(0 0% 100% / 0.12);
        background: hsl(0 0% 10%);
        color: hsl(0 0% 96%);
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      .dm-global-toast--success { border-color: hsl(78 70% 45%); color: hsl(78 70% 55%); }
      .dm-global-toast--error { border-color: hsl(0 72% 55%); color: hsl(0 72% 62%); }
      .dm-global-toast--info { border-color: hsl(210 40% 45%); color: hsl(210 30% 85%); }
      .dm-global-toast--hidden {
        opacity: 0;
        transform: translateX(-50%) translateY(-10px);
      }
    `
    document.head.appendChild(style)
  }
  return toastEl
}

export function showToast(
  message: string,
  type: 'success' | 'error' | 'info' = 'success',
  durationMs = 2600,
): void {
  if (typeof document === 'undefined') return
  const el = ensureEl()
  if (hideTimer) clearTimeout(hideTimer)
  el.textContent = message
  el.className = `dm-global-toast dm-global-toast--${type}`
  el.classList.remove('dm-global-toast--hidden')
  hideTimer = setTimeout(() => {
    el.classList.add('dm-global-toast--hidden')
    hideTimer = null
  }, durationMs)
}
