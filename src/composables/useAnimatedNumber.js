import { ref, watch } from 'vue';

/**
 * Анимированное числовое значение при изменении источника (ease-out cubic).
 * @param {import('vue').Ref|import('vue').ComputedRef} source - реактивный источник числа
 * @param {number} duration - длительность анимации в мс
 * @returns {import('vue').Ref<number>}
 */
export function useAnimatedNumber(source, duration = 300) {
  const displayed = ref(source?.value ?? 0);
  let rafId = null;

  watch(
    source,
    (to) => {
      const from = displayed.value;
      if (from === to) return;
      const t0 = performance.now();
      if (rafId) cancelAnimationFrame(rafId);
      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
        displayed.value = Math.round(from + (to - from) * e);
        if (p < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          displayed.value = to;
          rafId = null;
        }
      };
      rafId = requestAnimationFrame(tick);
    },
    { immediate: true }
  );

  return displayed;
}
