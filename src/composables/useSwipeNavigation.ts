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
    minSwipeDistance = 48,
    maxVerticalRatio = 0.65,
    maxDurationMs = 450
  } = options;

  let startX = 0;
  let startY = 0;
  let startTime = 0;

  function onTouchStart(e: TouchEvent) {
    if (!e.touches?.length) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
  }

  function onTouchEnd(e: TouchEvent) {
    const t = e.changedTouches?.[0];
    if (!t) return;
    const deltaX = t.clientX - startX;
    const deltaY = t.clientY - startY;
    const elapsed = Date.now() - startTime;

    if (elapsed > maxDurationMs) return;
    if (Math.abs(deltaX) < minSwipeDistance) return;
    // Vertical scroll: require horizontal to dominate
    if (Math.abs(deltaY) > Math.abs(deltaX) * maxVerticalRatio) return;

    if (deltaX < 0) onSwipeLeft();
    else onSwipeRight();
  }

  let detach: (() => void) | null = null;

  watch(
    containerRef,
    (el) => {
      detach?.();
      detach = null;
      if (!el) return;
      el.addEventListener('touchstart', onTouchStart, { passive: true });
      el.addEventListener('touchend', onTouchEnd, { passive: true });
      detach = () => {
        el.removeEventListener('touchstart', onTouchStart);
        el.removeEventListener('touchend', onTouchEnd);
      };
    },
    { immediate: true, flush: 'post' }
  );

  onUnmounted(() => {
    detach?.();
    detach = null;
  });
}
