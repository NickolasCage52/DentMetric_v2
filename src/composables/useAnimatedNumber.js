import { ref, watch } from 'vue';

/**
 * Анимированное числовое значение при изменении источника (ease-out cubic).
 * @param {import('vue').Ref|import('vue').ComputedRef} source - реактивный источник числа
 * @param {number} duration - длительность анимации в мс
 * @param {number} [delay=0] - задержка перед началом анимации в мс (сглаживает частые пересчёты)
 * @returns {import('vue').Ref<number>}
 */
export function useAnimatedNumber(source, duration = 300, delay = 0) {
  const displayed = ref(source?.value ?? 0);
  let rafId = null;
  let delayId = null;

  watch(
    source,
    (to) => {
      const from = displayed.value;
      if (from === to) return;
      if (delayId) clearTimeout(delayId);
      if (rafId) cancelAnimationFrame(rafId);
      const startAnimation = () => {
        delayId = null;
        const t0 = performance.now();
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
      };
      if (delay > 0) {
        delayId = setTimeout(startAnimation, delay);
      } else {
        startAnimation();
      }
    },
    { immediate: true }
  );

  return displayed;
}
