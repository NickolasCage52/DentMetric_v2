<template>
  <div v-if="active" class="qa-debug-overlay" aria-hidden="true">
    <div v-if="showSafeAreaGuides" class="qa-safe-area-guides">
      <div class="qa-safe-top" style="height: env(safe-area-inset-top, 0px);" title="safe-area-inset-top" />
      <div class="qa-safe-bottom" style="height: env(safe-area-inset-bottom, 0px);" title="safe-area-inset-bottom" />
    </div>
    <div class="qa-badge">QA</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';

const active = computed(() =>
  typeof window !== 'undefined' &&
  import.meta.env?.DEV &&
  (new URLSearchParams(window.location.search).get('qa') === '1' || window.location.search.includes('qa=1'))
);

const showSafeAreaGuides = ref(true);

let overflowCheckInterval = null;
let layoutShiftObserver = null;
let injectedStyleEl = null;
const overflowHighlightClass = 'qa-overflow-highlight';

function isScrollContainer(el) {
  if (!el || el.nodeType !== 1) return false;
  const s = getComputedStyle(el);
  const oy = s.overflowY;
  const ox = s.overflowX;
  return oy === 'auto' || oy === 'scroll' || oy === 'overlay' || ox === 'auto' || ox === 'scroll' || ox === 'overlay';
}

function hasOverflow(el) {
  if (!el || el.offsetParent === null) return { horizontal: false, vertical: false };
  const scrollWidth = el.scrollWidth;
  const scrollHeight = el.scrollHeight;
  const clientWidth = el.clientWidth;
  const clientHeight = el.clientHeight;
  const horizontal = scrollWidth > clientWidth + 1;
  const vertical = scrollHeight > clientHeight + 1;
  return { horizontal, vertical };
}

function shouldHighlightOverflow(el, overflow) {
  if (overflow.horizontal) return true;
  if (!overflow.vertical) return false;
  if (el.id === 'app' || el === document.body) return false;
  if (isScrollContainer(el)) return false;
  return true;
}

function scanOverflow() {
  if (!document.body || !active.value) return;
  document.querySelectorAll(`.${overflowHighlightClass}`).forEach((n) => n.classList.remove(overflowHighlightClass));
  const walk = (el) => {
    if (!el || el.nodeType !== 1) return;
    if (el.classList?.contains('qa-debug-overlay') || el.closest?.('.qa-debug-overlay')) return;
    const overflow = hasOverflow(el);
    if (shouldHighlightOverflow(el, overflow)) {
      el.classList.add(overflowHighlightClass);
    }
    for (let i = 0; i < el.children.length; i++) walk(el.children[i]);
  };
  walk(document.body);
}

function initLayoutShiftObserver() {
  if (typeof PerformanceObserver === 'undefined') return;
  try {
    layoutShiftObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        console.warn('[QA layout-shift]', {
          name: entry.name,
          value: entry.value,
          startTime: entry.startTime,
          sources: entry.sources?.length ? entry.sources.slice(0, 5) : []
        });
      }
    });
    layoutShiftObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (_) {}
}

onMounted(() => {
  if (!active.value) return;
  injectedStyleEl = document.createElement('style');
  injectedStyleEl.textContent = `
    .${overflowHighlightClass} { outline: 2px solid rgba(255, 0, 128, 0.8) !important; outline-offset: -1px; }
    .qa-debug-overlay { pointer-events: none; position: fixed; inset: 0; z-index: 99999; }
    .qa-safe-area-guides { position: absolute; inset: 0; pointer-events: none; }
    .qa-safe-top { position: absolute; top: 0; left: 0; right: 0; background: rgba(255, 200, 0, 0.15); }
    .qa-safe-bottom { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(255, 200, 0, 0.15); }
    .qa-badge { position: fixed; top: 8px; right: 8px; background: rgba(255, 0, 128, 0.9); color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; z-index: 100000; pointer-events: none; }
  `;
  document.head.appendChild(injectedStyleEl);
  scanOverflow();
  overflowCheckInterval = setInterval(scanOverflow, 2000);
  initLayoutShiftObserver();
  console.info('[QA] Debug mode active: overflow highlight + layout-shift logging + safe-area guides');
});

onBeforeUnmount(() => {
  if (overflowCheckInterval) clearInterval(overflowCheckInterval);
  if (layoutShiftObserver) layoutShiftObserver.disconnect();
  document.querySelectorAll(`.${overflowHighlightClass}`).forEach((n) => n.classList.remove(overflowHighlightClass));
  if (injectedStyleEl?.parentNode) injectedStyleEl.parentNode.removeChild(injectedStyleEl);
});
</script>

<style scoped>
.qa-debug-overlay {
  pointer-events: none;
}
</style>
