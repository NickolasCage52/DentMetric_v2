<template>
  <Teleport to="body">
    <div v-if="open" class="freeform-modal-root">
      <div class="freeform-backdrop" @click="emitCancel"></div>
      <div class="freeform-modal">
        <div class="freeform-modal-header">
          <div class="freeform-title">Произвольная форма</div>
          <button type="button" class="freeform-close" @click="emitCancel">✕</button>
        </div>
        <div class="freeform-canvas-wrap">
          <canvas ref="canvasRef" class="freeform-canvas"></canvas>
          <div class="freeform-hint">Рисуйте пальцем замкнутую форму</div>
        </div>
        <div class="freeform-actions">
          <button type="button" class="freeform-btn freeform-btn-ghost" @click="clearDrawing">Очистить</button>
          <div class="freeform-actions-right">
            <button type="button" class="freeform-btn freeform-btn-ghost" @click="emitCancel">Отмена</button>
            <button type="button" data-testid="freeform-confirm" class="freeform-btn freeform-btn-primary" @click="confirmDrawing">Готово</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  canvasSize: { type: Object, default: () => ({ width: 320, height: 240 }) },
  initialPoints: { type: Array, default: () => [] },
  photoUrl: { type: String, default: '' }
});

const emit = defineEmits(['confirm', 'cancel']);

const canvasRef = ref(null);
let ctx = null;
let bgImage = null;
let drawing = false;
let points = [];
let activePointerId = null;
let activeTouchId = null;

function toCanvasPoint(e) {
  const canvas = canvasRef.value;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / Math.max(1, rect.width);
  const scaleY = canvas.height / Math.max(1, rect.height);
  const clientX = e?.clientX ?? 0;
  const clientY = e?.clientY ?? 0;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function drawBackground() {
  const canvas = canvasRef.value;
  if (!canvas || !ctx) return;
  ctx.fillStyle = '#0b0f14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.min(cw / bgImage.naturalWidth, ch / bgImage.naturalHeight);
    const w = bgImage.naturalWidth * scale;
    const h = bgImage.naturalHeight * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;
    ctx.drawImage(bgImage, x, y, w, h);
  }
}

function drawPath() {
  const canvas = canvasRef.value;
  if (!canvas || !ctx) return;
  drawBackground();
  if (points.length < 2) return;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#88E523';
  ctx.fillStyle = 'rgba(136, 229, 35, 0.2)';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function simplifyPoints(input, epsilon = 2) {
  if (!input || input.length < 3) return input || [];
  const sq = (v) => v * v;
  const distSq = (p1, p2) => sq(p1.x - p2.x) + sq(p1.y - p2.y);
  const rdp = (pts, start, end, out) => {
    let maxDist = 0;
    let index = -1;
    const a = pts[start];
    const b = pts[end];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const abLen = abx * abx + aby * aby;
    for (let i = start + 1; i < end; i += 1) {
      const p = pts[i];
      let t = 0;
      if (abLen > 0) t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / abLen;
      const proj = { x: a.x + abx * t, y: a.y + aby * t };
      const d = distSq(p, proj);
      if (d > maxDist) {
        maxDist = d;
        index = i;
      }
    }
    if (maxDist > epsilon * epsilon && index !== -1) {
      rdp(pts, start, index, out);
      out.push(pts[index]);
      rdp(pts, index, end, out);
    }
  };
  const out = [input[0]];
  rdp(input, 0, input.length - 1, out);
  out.push(input[input.length - 1]);
  return out;
}

function clearDrawing() {
  points = [];
  drawPath();
}

function confirmDrawing() {
  if (points.length < 3) {
    emit('cancel');
    return;
  }
  const simplified = simplifyPoints(points, 2.2);
  emit('confirm', simplified);
}

function emitCancel() {
  emit('cancel');
}

function startDrawing(e, clientX, clientY, id = null) {
  if (!props.open) return;
  if (typeof e?.button === 'number' && e.button !== 0) return;
  if (e?.preventDefault) e.preventDefault();
  activePointerId = id;
  const canvas = canvasRef.value;
  if (canvas && activePointerId != null && canvas.setPointerCapture) {
    try { canvas.setPointerCapture(activePointerId); } catch (_) {}
  }
  drawing = true;
  points = [];
  const p = toCanvasPoint({ clientX, clientY });
  if (p) points.push(p);
  drawPath();
}

function moveDrawing(e, clientX, clientY, id = null) {
  if (!drawing) return;
  if (id != null && activePointerId != null && id !== activePointerId) return;
  if (e?.preventDefault) e.preventDefault();
  const p = toCanvasPoint({ clientX, clientY });
  if (!p) return;
  const last = points[points.length - 1];
  const dx = p.x - last.x;
  const dy = p.y - last.y;
  if (dx * dx + dy * dy < 2) return;
  points.push(p);
  drawPath();
}

function endDrawing(e, id = null) {
  if (id != null && activePointerId != null && id !== activePointerId) return;
  drawing = false;
  const canvas = canvasRef.value;
  if (canvas && activePointerId != null && canvas.releasePointerCapture) {
    try { canvas.releasePointerCapture(activePointerId); } catch (_) {}
  }
  activePointerId = null;
  drawPath();
}

function handlePointerDown(e) {
  startDrawing(e, e?.clientX ?? 0, e?.clientY ?? 0, e?.pointerId ?? null);
}

function handlePointerMove(e) {
  moveDrawing(e, e?.clientX ?? 0, e?.clientY ?? 0, e?.pointerId ?? null);
}

function handlePointerUp(e) {
  endDrawing(e, e?.pointerId ?? null);
}

function handleTouchStart(e) {
  const t = e?.changedTouches?.[0];
  if (!t) return;
  activeTouchId = t.identifier;
  startDrawing(e, t.clientX, t.clientY, 'touch');
}

function handleTouchMove(e) {
  const touches = Array.from(e?.changedTouches || []);
  const t = touches.find((item) => item.identifier === activeTouchId) || touches[0];
  if (!t) return;
  moveDrawing(e, t.clientX, t.clientY, 'touch');
}

function handleTouchEnd(e) {
  const touches = Array.from(e?.changedTouches || []);
  const t = touches.find((item) => item.identifier === activeTouchId);
  if (!t && activeTouchId != null) return;
  activeTouchId = null;
  endDrawing(e, 'touch');
}

function handleMouseDown(e) {
  startDrawing(e, e?.clientX ?? 0, e?.clientY ?? 0, 'mouse');
}

function handleMouseMove(e) {
  if (!drawing) return;
  moveDrawing(e, e?.clientX ?? 0, e?.clientY ?? 0, 'mouse');
}

function handleMouseUp(e) {
  endDrawing(e, 'mouse');
}

function setupCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width || props.canvasSize?.width || 320));
  const h = Math.max(1, Math.round(rect.height || props.canvasSize?.height || 240));
  canvas.width = w;
  canvas.height = h;
  ctx = canvas.getContext('2d');
  points = Array.isArray(props.initialPoints) ? [...props.initialPoints] : [];
  if (props.photoUrl) {
    bgImage = new Image();
    bgImage.onload = () => drawPath();
    bgImage.onerror = () => { bgImage = null; drawPath(); };
    bgImage.src = props.photoUrl;
  } else {
    bgImage = null;
  }
  drawPath();
}

function bindCanvasEvents() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.addEventListener('pointerdown', handlePointerDown, { passive: false });
  canvas.addEventListener('pointermove', handlePointerMove, { passive: false });
  canvas.addEventListener('pointerup', handlePointerUp, { passive: false });
  canvas.addEventListener('pointercancel', handlePointerUp, { passive: false });
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
  canvas.addEventListener('mousedown', handleMouseDown, { passive: false });
  canvas.addEventListener('mousemove', handleMouseMove, { passive: false });
  window.addEventListener('mouseup', handleMouseUp, { passive: false });
}

function unbindCanvasEvents() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.removeEventListener('pointerdown', handlePointerDown);
  canvas.removeEventListener('pointermove', handlePointerMove);
  canvas.removeEventListener('pointerup', handlePointerUp);
  canvas.removeEventListener('pointercancel', handlePointerUp);
  canvas.removeEventListener('touchstart', handleTouchStart);
  canvas.removeEventListener('touchmove', handleTouchMove);
  canvas.removeEventListener('touchend', handleTouchEnd);
  canvas.removeEventListener('touchcancel', handleTouchEnd);
  canvas.removeEventListener('mousedown', handleMouseDown);
  canvas.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
}

watch(() => props.open, (val) => {
  if (!val) {
    unbindCanvasEvents();
    return;
  }
  nextTick(() => {
    setupCanvas();
    unbindCanvasEvents();
    bindCanvasEvents();
  });
});

watch(() => props.canvasSize, () => {
  if (!props.open) return;
  nextTick(() => setupCanvas());
}, { deep: true });

watch(() => props.photoUrl, () => {
  if (!props.open) return;
  nextTick(() => setupCanvas());
});

onMounted(() => {
  if (props.open) {
    nextTick(() => {
      setupCanvas();
      bindCanvasEvents();
    });
  }
});

onBeforeUnmount(() => {
  unbindCanvasEvents();
});
</script>

<style scoped>
.freeform-modal-root {
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(env(safe-area-inset-top, 0px) + 8px) 8px calc(env(safe-area-inset-bottom, 0px) + 8px);
}
.freeform-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
}
.freeform-modal {
  position: relative;
  width: min(96vw, 720px);
  height: min(88vh, 640px);
  margin: 0;
  display: flex;
  flex-direction: column;
  background: rgba(10, 12, 16, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}
.freeform-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px 8px;
}
.freeform-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #88e523;
}
.freeform-close {
  background: transparent;
  color: #9aa3ad;
  border: none;
  font-size: 18px;
  padding: 4px 8px;
}
.freeform-canvas-wrap {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  background: #0b0f14;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.freeform-canvas {
  width: 100%;
  height: 100%;
  touch-action: none;
  pointer-events: auto;
  user-select: none;
  -webkit-user-select: none;
}
.freeform-hint {
  position: absolute;
  left: 8px;
  bottom: 8px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.45);
  background: rgba(0, 0, 0, 0.45);
  padding: 4px 8px;
  border-radius: 8px;
  pointer-events: none;
}
.freeform-actions {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.freeform-actions-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.freeform-btn {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.freeform-btn-ghost {
  background: rgba(255, 255, 255, 0.06);
  color: #d1d5db;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.freeform-btn-primary {
  background: #88e523;
  color: #000;
  border: none;
  box-shadow: 0 0 12px rgba(136, 229, 35, 0.35);
}
</style>
