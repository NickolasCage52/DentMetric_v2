import { watch, onUnmounted, type Ref } from 'vue';

export interface SwipeNavigationOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  /** px */
  minSwipeDistance?: number;
  /** Ignore if vertical movement dominates (ratio of horiz to vert) */
  maxVerticalRatio?: number;
  /** ms — ignore slow drags */
  maxDurationMs?: number;
}

/**
 * Horizontal swipe on a container without fighting vertical scroll:
 * only fires when horizontal delta clearly dominates vertical.
 */
export function useSwipeNavigation(
  containerRef: Ref<HTMLElement | null>,
  options: SwipeNavigationOptions
) {
  const {
    onSwipeLeft,
    onSwipeRight,
    minSwipeDistance = 36,
    maxVerticalRatio = 0.92,
    maxDurationMs = 550
  } = options;

  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let tracking = false;

  function onTouchStart(e: TouchEvent) {
    if (!e.touches?.length) return;
    tracking = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
  }

  function onTouchEnd(e: TouchEvent) {
    if (!tracking) return;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const deltaX = t.clientX - startX;
    const deltaY = t.clientY - startY;
    const elapsed = Date.now() - startTime;
    tracking = false;

    if (elapsed > maxDurationMs) return;
    if (Math.abs(deltaX) < minSwipeDistance) return;
    // Чуть мягче, чем раньше: на мобильном скролл даёт небольшой vertical drift
    if (Math.abs(deltaY) > Math.abs(deltaX) * maxVerticalRatio) return;

    if (deltaX < 0) onSwipeLeft();
    else onSwipeRight();
  }

  function onTouchCancel() {
    tracking = false;
  }

  let detach: (() => void) | null = null;

  const cap = { passive: true, capture: true } as const;

  watch(
    containerRef,
    (el) => {
      detach?.();
      detach = null;
      if (!el) return;
      /** capture: true — жест начинается на дочернем скролле (список истории), а не только на «полосе» вкладок */
      el.addEventListener('touchstart', onTouchStart, cap);
      el.addEventListener('touchend', onTouchEnd, cap);
      el.addEventListener('touchcancel', onTouchCancel, cap);
      detach = () => {
        el.removeEventListener('touchstart', onTouchStart, cap);
        el.removeEventListener('touchend', onTouchEnd, cap);
        el.removeEventListener('touchcancel', onTouchCancel, cap);
      };
    },
    { immediate: true, flush: 'post' }
  );

  onUnmounted(() => {
    detach?.();
    detach = null;
  });
}
