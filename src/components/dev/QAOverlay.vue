<template>
  <div class="dm-qa-overlay">
    <div class="dm-qa-panel" :class="{ 'dm-qa-panel--open': open }">
      <div class="dm-qa-header">
        <div class="dm-qa-title">QA</div>
        <div class="dm-qa-badges">
          <span class="dm-qa-badge" :class="state.overflowIssues.length ? 'bad' : 'ok'">
            X: {{ state.overflowIssues.length }}
          </span>
          <span class="dm-qa-badge" :class="state.overlapIssues.length ? 'bad' : 'ok'">
            Overlap: {{ state.overlapIssues.length }}
          </span>
          <span class="dm-qa-badge" :class="state.clsTotal > 0.1 ? 'bad' : 'ok'">
            CLS: {{ state.clsTotal.toFixed(3) }}
          </span>
        </div>
        <button type="button" class="dm-qa-btn" @click="open = !open">{{ open ? '–' : '+' }}</button>
      </div>

      <div v-if="open" class="dm-qa-body">
        <div class="dm-qa-row">
          <button type="button" class="dm-qa-btn dm-qa-btn-wide" @click="scanNow">Rescan</button>
          <button type="button" class="dm-qa-btn dm-qa-btn-wide" @click="resetCls">Reset CLS</button>
        </div>

        <div class="dm-qa-section">
          <div class="dm-qa-section-title">Viewport</div>
          <div class="dm-qa-kv">
            <div class="k">w×h</div><div class="v">{{ state.viewport.w }}×{{ state.viewport.h }}</div>
            <div class="k">dpr</div><div class="v">{{ state.viewport.dpr }}</div>
            <div class="k">scroll</div><div class="v">{{ state.viewport.scrollW }}→{{ state.viewport.clientW }}</div>
          </div>
        </div>

        <div class="dm-qa-section">
          <div class="dm-qa-section-title">Safe-area & bars</div>
          <div class="dm-qa-kv">
            <div class="k">safeTop</div><div class="v">{{ state.safe.top }}px</div>
            <div class="k">safeBottom</div><div class="v">{{ state.safe.bottom }}px</div>
            <div class="k">navH</div><div class="v">{{ state.bars.navH }}px</div>
            <div class="k">quickBarH</div><div class="v">{{ state.bars.quickBarH }}px</div>
            <div class="k">ctaH</div><div class="v">{{ state.bars.quickCtaH }}px</div>
          </div>
        </div>

        <div class="dm-qa-section" v-if="state.overlapIssues.length">
          <div class="dm-qa-section-title">Overlaps</div>
          <div class="dm-qa-list">
            <div v-for="(it, idx) in state.overlapIssues.slice(0, 8)" :key="idx" class="dm-qa-item bad">
              {{ it }}
            </div>
            <div v-if="state.overlapIssues.length > 8" class="dm-qa-item muted">
              +{{ state.overlapIssues.length - 8 }} more
            </div>
          </div>
        </div>

        <div class="dm-qa-section">
          <div class="dm-qa-section-title">Horizontal overflow</div>
          <div v-if="!state.overflowIssues.length" class="dm-qa-item ok">OK</div>
          <div v-else class="dm-qa-list">
            <div v-for="(it, idx) in state.overflowIssues.slice(0, 10)" :key="idx" class="dm-qa-item bad">
              {{ it.label }}
            </div>
            <div v-if="state.overflowIssues.length > 10" class="dm-qa-item muted">
              +{{ state.overflowIssues.length - 10 }} more
            </div>
          </div>
        </div>

        <div class="dm-qa-section">
          <div class="dm-qa-section-title">Layout shifts</div>
          <div class="dm-qa-item" :class="state.clsTotal > 0.1 ? 'bad' : 'ok'">
            Total CLS: {{ state.clsTotal.toFixed(3) }} (entries: {{ state.clsEntries }})
          </div>
          <div v-if="state.clsOffenders.length" class="dm-qa-list">
            <div v-for="(it, idx) in state.clsOffenders.slice(0, 6)" :key="idx" class="dm-qa-item">
              {{ it }}
            </div>
          </div>
        </div>

        <div class="dm-qa-row">
          <label class="dm-qa-check">
            <input type="checkbox" v-model="showLines" />
            <span>Guides</span>
          </label>
        </div>
      </div>
    </div>

    <div v-if="showLines" class="dm-qa-guides" aria-hidden="true">
      <div class="line top" :style="{ top: `${state.safe.top}px` }"></div>
      <div class="line bottom" :style="{ bottom: `${state.safe.bottom}px` }"></div>
      <div v-if="state.bars.navRect" class="line navTop" :style="{ top: `${state.bars.navRect.top}px` }"></div>
      <div v-if="state.bars.quickCtaRect" class="line ctaTop" :style="{ top: `${state.bars.quickCtaRect.top}px` }"></div>
      <div v-if="state.bars.quickBarRect" class="line quickTop" :style="{ top: `${state.bars.quickBarRect.top}px` }"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref } from 'vue';

const open = ref(false);
const showLines = ref(true);

const state = reactive({
  overflowIssues: [],
  overlapIssues: [],
  clsTotal: 0,
  clsEntries: 0,
  clsOffenders: [],
  viewport: { w: 0, h: 0, dpr: 1, scrollW: 0, clientW: 0 },
  safe: { top: 0, bottom: 0 },
  bars: { navH: 0, quickBarH: 0, quickCtaH: 0, navRect: null, quickBarRect: null, quickCtaRect: null }
});

let scanTimer = null;
let clsObserver = null;
const clsBySelector = new Map();

function elLabel(el) {
  if (!el) return '';
  const id = el.id ? `#${el.id}` : '';
  const cls = el.classList?.length ? `.${[...el.classList].slice(0, 3).join('.')}` : '';
  return `${el.tagName.toLowerCase()}${id}${cls}`;
}

function readSafeInsets() {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none;';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const top = Math.round(parseFloat(cs.paddingTop) || 0);
  const bottom = Math.round(parseFloat(cs.paddingBottom) || 0);
  probe.remove();
  return { top, bottom };
}

function measureBars() {
  const nav = document.querySelector('.bottom-nav');
  const quickBar = document.querySelector('.quick-nav-bar');
  const quickCta = document.querySelector('.quick-cta-bar');

  const navRect = nav ? nav.getBoundingClientRect() : null;
  const quickBarRect = quickBar ? quickBar.getBoundingClientRect() : null;
  const quickCtaRect = quickCta ? quickCta.getBoundingClientRect() : null;

  state.bars.navRect = navRect ? { top: Math.round(navRect.top), bottom: Math.round(navRect.bottom) } : null;
  state.bars.quickBarRect = quickBarRect ? { top: Math.round(quickBarRect.top), bottom: Math.round(quickBarRect.bottom) } : null;
  state.bars.quickCtaRect = quickCtaRect ? { top: Math.round(quickCtaRect.top), bottom: Math.round(quickCtaRect.bottom) } : null;

  state.bars.navH = navRect ? Math.round(navRect.height) : 0;
  state.bars.quickBarH = quickBarRect ? Math.round(quickBarRect.height) : 0;
  state.bars.quickCtaH = quickCtaRect ? Math.round(quickCtaRect.height) : 0;

  const overlaps = [];
  if (navRect && quickBarRect && quickBarRect.bottom > navRect.top + 1) overlaps.push('quick-nav-bar overlaps bottom-nav');
  if (navRect && quickCtaRect && quickCtaRect.bottom > navRect.top + 1) overlaps.push('quick-cta-bar overlaps bottom-nav');
  state.overlapIssues = overlaps;
}

function scanOverflow() {
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  state.viewport.w = Math.round(vw);
  state.viewport.h = Math.round(vh);
  state.viewport.dpr = window.devicePixelRatio || 1;
  state.viewport.scrollW = Math.round(document.documentElement.scrollWidth);
  state.viewport.clientW = Math.round(vw);

  const issues = [];
  const root = document.body;
  if (!root) {
    state.overflowIssues = [];
    return;
  }

  // Fast fail: if the page itself has horizontal scroll, we will also try to find offenders below.
  const pageHasHScroll = document.documentElement.scrollWidth > vw + 1;

  const all = root.querySelectorAll('*');
  const max = Math.min(all.length, 6000);

  for (let i = 0; i < max; i++) {
    const el = all[i];
    if (!el || el.closest?.('.dm-qa-overlay')) continue;
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
    // Ignore SVG sub-elements (path, circle, etc.) — their bounding boxes are not layout-relevant
    // and can produce noisy "overflow" signals.
    if (el.ownerSVGElement && el.tagName.toLowerCase() !== 'svg') continue;
    const rect = el.getBoundingClientRect?.();
    if (!rect || rect.width <= 0 || rect.height <= 0) continue;

    const outRight = rect.right - vw;
    const outLeft = -rect.left;
    const outTop = -rect.top;
    const outBottom = rect.bottom - vh;

    // Allow a small tolerance for sub-pixel rounding / filter effects (common on blurred layers).
    const overflowRect = outRight > 2 || outLeft > 2;
    if (overflowRect) {
      const label = `${elLabel(el)} rect=[${Math.round(rect.left)},${Math.round(rect.top)}→${Math.round(rect.right)},${Math.round(rect.bottom)}] ` +
        `scrollW=${Math.round(el.scrollWidth)} clientW=${Math.round(el.clientWidth)}` +
        (overflowRect ? ` outL=${Math.round(outLeft)} outR=${Math.round(outRight)}` : '') +
        (outTop > 1 || outBottom > 1 ? ` (v: outT=${Math.round(outTop)} outB=${Math.round(outBottom)})` : '');
      issues.push({ label });
      if (issues.length >= 40) break;
    }
  }

  if (pageHasHScroll && issues.length === 0) {
    issues.push({ label: `documentElement.scrollWidth=${Math.round(document.documentElement.scrollWidth)} > clientWidth=${Math.round(vw)}` });
  }

  state.overflowIssues = issues;
}

function updateClsOffenders() {
  const sorted = [...clsBySelector.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  state.clsOffenders = sorted.map(([sel, v]) => `${sel} (${v.toFixed(3)})`);
}

function resetCls() {
  state.clsTotal = 0;
  state.clsEntries = 0;
  clsBySelector.clear();
  state.clsOffenders = [];
}

function scanNow() {
  state.safe = readSafeInsets();
  measureBars();
  scanOverflow();
  updateClsOffenders();
}

onMounted(() => {
  // Expose for automation/tests
  window.__dmQa = {
    getState: () => JSON.parse(JSON.stringify(state)),
    scanNow,
    resetCls,
    ready: true
  };

  // Layout shifts
  try {
    if ('PerformanceObserver' in window) {
      clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          state.clsTotal += entry.value || 0;
          state.clsEntries += 1;
          const sources = entry.sources || [];
          for (const s of sources) {
            const node = s.node;
            if (!node || !node.nodeType) continue;
            if (node.closest?.('.dm-qa-overlay')) continue;
            const sel = elLabel(node);
            clsBySelector.set(sel, (clsBySelector.get(sel) || 0) + (entry.value || 0));
          }
        }
        updateClsOffenders();
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    }
  } catch {
    // ignore
  }

  // Periodic scan (throttled)
  scanNow();
  scanTimer = window.setInterval(scanNow, 1500);

  const onResize = () => scanNow();
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
  });
});

onBeforeUnmount(() => {
  if (scanTimer) window.clearInterval(scanTimer);
  scanTimer = null;
  if (clsObserver) clsObserver.disconnect();
  clsObserver = null;
  try {
    if (window.__dmQa) delete window.__dmQa;
  } catch {
    // ignore
  }
});
</script>

<style scoped>
.dm-qa-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 12000;
}
.dm-qa-panel {
  pointer-events: auto;
  position: fixed;
  top: calc(8px + env(safe-area-inset-top, 0px));
  right: 8px;
  width: min(360px, calc(100vw - 16px));
  background: rgba(10, 10, 10, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  color: #e5e7eb;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
}
.dm-qa-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
}
.dm-qa-title {
  font-weight: 800;
  letter-spacing: 0.14em;
  font-size: 11px;
  text-transform: uppercase;
  color: #88e523;
}
.dm-qa-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.dm-qa-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  white-space: nowrap;
}
.dm-qa-badge.ok {
  color: #88e523;
  border-color: rgba(136, 229, 35, 0.35);
}
.dm-qa-badge.bad {
  color: #fb7185;
  border-color: rgba(251, 113, 133, 0.35);
}
.dm-qa-btn {
  font-size: 11px;
  line-height: 1;
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: #e5e7eb;
}
.dm-qa-btn-wide {
  flex: 1;
}
.dm-qa-body {
  padding: 0 10px 10px 10px;
}
.dm-qa-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.dm-qa-section {
  margin-top: 10px;
}
.dm-qa-section-title {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.75);
  margin-bottom: 6px;
}
.dm-qa-kv {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 10px;
  font-size: 11px;
}
.dm-qa-kv .k {
  color: rgba(229, 231, 235, 0.65);
}
.dm-qa-kv .v {
  color: rgba(229, 231, 235, 0.95);
}
.dm-qa-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dm-qa-item {
  font-size: 11px;
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  word-break: break-word;
}
.dm-qa-item.ok {
  border-color: rgba(136, 229, 35, 0.30);
  color: #88e523;
}
.dm-qa-item.bad {
  border-color: rgba(251, 113, 133, 0.30);
  color: #fb7185;
}
.dm-qa-item.muted {
  opacity: 0.7;
}
.dm-qa-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: rgba(229, 231, 235, 0.85);
}
.dm-qa-guides .line {
  position: fixed;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(136, 229, 35, 0.7);
  pointer-events: none;
}
.dm-qa-guides .line.bottom {
  background: rgba(59, 130, 246, 0.75);
}
.dm-qa-guides .line.navTop {
  background: rgba(251, 191, 36, 0.8);
}
.dm-qa-guides .line.ctaTop {
  background: rgba(236, 72, 153, 0.8);
}
.dm-qa-guides .line.quickTop {
  background: rgba(168, 85, 247, 0.8);
}
</style>

