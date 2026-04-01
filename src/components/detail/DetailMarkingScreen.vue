<template>
  <div class="marking-screen">
    <!-- Рабочая область: фиксированный размер, никогда не сдвигается при появлении UI -->
    <div class="marking-canvas-area" ref="canvasArea">
      <div class="marking-zoom-wrapper" :style="zoomTransformStyle">
        <img
          v-if="photoDataUrl"
          :src="photoDataUrl"
          class="marking-photo"
          ref="photoImg"
          alt=""
          @load="initCanvas"
        />
        <div ref="konvaContainer" class="marking-konva-layer" />
      </div>
      <transition name="zoom-fade">
        <button
          v-if="zoomScale > 1.05"
          type="button"
          class="marking-zoom-reset"
          @click.stop="resetZoom"
        >
          {{ Math.round(zoomScale * 100) }}%&nbsp;✕
        </button>
      </transition>
    </div>

    <!-- Верхняя плашка: назад, заголовок (overlay, не сдвигает фото) -->
    <div class="marking-top-overlay">
      <button type="button" class="dm-back-btn-sm" @click="$emit('back')">←</button>
      <span class="marking-controls__step-label">
        {{ currentStep === 'marking' ? 'Разметка' : 'Размеры' }}
      </span>
      <div class="marking-controls__top-spacer" />
    </div>

    <!-- Нижняя плашка: инструменты поверх фото (сворачивается, чтобы не перекрывать фото) -->
    <div
      class="marking-controls-overlay"
      :class="{
        'marking-controls-overlay--marking': currentStep === 'marking',
        'marking-controls-overlay--dimensions': currentStep === 'dimensions',
        'marking-controls-overlay--collapsed': isPanelCollapsed,
      }"
    >
      <button
        type="button"
        class="marking-controls__toggle"
        :title="isPanelCollapsed ? 'Развернуть панель' : 'Свернуть панель'"
        @click="togglePanel"
      >
        <span class="marking-controls__handle-bar" />
        <span class="marking-controls__toggle-chevron">{{ isPanelCollapsed ? '▲' : '▼' }}</span>
      </button>

      <div v-show="!isPanelCollapsed" class="marking-controls__body">

      <DetailProgressDots
        v-if="detailSteps?.length && currentStep === 'marking'"
        :steps="detailSteps"
        :current-index="detailStepIndex"
      />

      <template v-if="currentStep === 'marking'">

        <div class="marking-hint-bar">
          <span
            v-if="activeMode === 'idle' && dents.length === 0"
            class="marking-hint-text"
          >
            👆 Нажмите «+ Вмятину» и обведите повреждение
          </span>
          <span
            v-else-if="activeMode === 'drawing-dent'"
            class="marking-hint-text marking-hint-text--active"
          >
            ✏️ Обводите пальцем — можно несколько подряд
          </span>
          <span
            v-else-if="activeMode === 'drawing-secondary'"
            class="marking-hint-text marking-hint-text--secondary"
          >
            ✏️ Обводите зону вторичной деформации
          </span>
          <span
            v-else-if="selectedDentId"
            class="marking-hint-text marking-hint-text--selected"
          >
            ☝️ Вмятина {{ selectedDentIndex }} выбрана — можно перетащить или удалить
          </span>
          <span v-else class="marking-hint-text">
            Нажмите на вмятину чтобы выбрать
          </span>
        </div>

        <div v-if="dents.length > 0" class="marking-badges-row">
          <button
            v-for="dent in dents"
            :key="dent.id"
            type="button"
            class="zone-badge"
            :class="{ 'zone-badge--selected': selectedDentId === dent.id }"
            :style="{
              background: dent.color,
              boxShadow: selectedDentId === dent.id ? `0 0 0 3px white, 0 0 0 5px ${dent.color}` : 'none'
            }"
            @click="selectDentFromBadge(dent.id)"
          >
            {{ dent.index }}
          </button>
          <div
            v-for="dent in dentsWithSecondary"
            :key="'sd_' + dent.id"
            class="zone-badge zone-badge--secondary"
          >
            <span style="font-size:9px">СД</span>{{ dent.index }}
          </div>
        </div>

        <div class="marking-actions-row">
          <button
            type="button"
            class="marking-draw-btn"
            :class="{ 'marking-draw-btn--active': activeMode === 'drawing-dent' }"
            @click="toggleDrawDent"
          >
            <span class="marking-draw-btn__icon">{{ activeMode === 'drawing-dent' ? '⏹' : '+' }}</span>
            <span class="marking-draw-btn__label">{{ activeMode === 'drawing-dent' ? 'Стоп' : 'Вмятину' }}</span>
          </button>

          <button
            v-if="selectedDentId && !selectedDentHasSecondary && dents.length > 0"
            type="button"
            class="marking-draw-btn marking-draw-btn--secondary"
            :class="{ 'marking-draw-btn--active': activeMode === 'drawing-secondary' }"
            @click="toggleDrawSecondary"
          >
            <span class="marking-draw-btn__icon">{{ activeMode === 'drawing-secondary' ? '⏹' : '↗' }}</span>
            <span class="marking-draw-btn__label">{{ activeMode === 'drawing-secondary' ? 'Стоп' : 'Деф.' }}</span>
          </button>

          <button
            type="button"
            class="marking-icon-btn marking-icon-btn--danger"
            :class="{ 'marking-icon-btn--inactive': !selectedDentId }"
            :disabled="!selectedDentId"
            @click="handleDeleteSelected"
            title="Удалить выбранную вмятину"
            data-testid="btn-delete-dent"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18M8 6V4h8v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>

          <button
            v-if="dents.length > 0"
            type="button"
            class="marking-icon-btn marking-icon-btn--reset"
            @click="showResetConfirm = true"
            title="Сбросить всю разметку"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 3v5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <div v-if="showResetConfirm" class="reset-confirm">
          <span class="reset-confirm__text">Очистить всю разметку?</span>
          <button type="button" class="reset-confirm__yes" @click="confirmReset">Да</button>
          <button type="button" class="reset-confirm__no" @click="showResetConfirm = false">Нет</button>
        </div>

        <button
          v-if="dents.length > 0"
          type="button"
          class="marking-proceed-btn"
          @click="goToDimensions"
          data-testid="btn-go-to-dimensions"
        >
          Задать размеры ({{ dents.length }} {{ plural(dents.length) }}) →
        </button>

      </template>

      <template v-else-if="currentStep === 'dimensions'">
        <div class="dimensions-nav">
          <span class="dimensions-nav__count">{{ filledCount }}/{{ totalCount }}</span>
          <div class="dimensions-nav__progress">
            <div class="dimensions-nav__fill" :style="{ width: progressPercent + '%' }" />
          </div>
          <DetailProgressDots
            v-if="detailSteps?.length"
            :steps="detailSteps"
            :current-index="detailStepIndex"
          />
        </div>
        <div class="dimensions-nav-row">
          <button
            type="button"
            class="dimensions-nav-btn"
            :disabled="currentDentIndex <= 0"
            aria-label="Предыдущая вмятина"
            @click="goToPrevDent"
          >
            ‹
          </button>
          <div class="dimensions-nav-current">
            Вмятина {{ currentDentIndex + 1 }} из {{ dents.length }}
          </div>
          <button
            type="button"
            class="dimensions-nav-btn"
            :disabled="currentDentIndex >= dents.length - 1"
            aria-label="Следующая вмятина"
            @click="goToNextDent"
          >
            ›
          </button>
        </div>
        <p class="dimensions-tap-hint">Нажмите на вмятину на фото для ввода размеров</p>
        <button
          type="button"
          class="dm-btn dm-btn--primary dm-btn--full dimensions-proceed"
          :disabled="!allDimensionsFilled"
          data-testid="btn-proceed-to-params"
          @click="handleProceedToParams"
        >
          <template v-if="allDimensionsFilled">К параметрам →</template>
          <template v-else>Заполните все размеры ({{ totalCount - filledCount }} осталось)</template>
        </button>
      </template>

      </div>
    </div>

    <DentDimensionsModal
      v-model="dimModalOpen"
      :dent="dimModalDent"
      @save="handleDimModalSave"
      @cancel="dimModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import Konva from 'konva';
import { DENT_COLORS } from '../../types/detailSession';
import DetailProgressDots from './DetailProgressDots.vue';
import DentDimensionsModal from './DentDimensionsModal.vue';

const props = defineProps({
  detailSteps: { type: Array, default: () => [] },
  detailStepIndex: { type: Number, default: 0 },
  photoDataUrl: { type: String, default: null },
  dents: { type: Array, default: () => [] },
  currentStep: { type: String, default: 'marking' },
  selectedDentId: { type: String, default: null },
  currentDentIndex: { type: Number, default: 0 },
  allDimensionsFilled: { type: Boolean, default: false },
});

const emit = defineEmits([
  'dent-added',
  'secondary-added',
  'dimensions-set',
  'secondary-dimensions-set',
  'dent-deleted',
  'dent-selected',
  'dent-moved',
  'go-to-dimensions',
  'annotated-photo',
  'proceed',
  'back',
  'reset-drawing',
  'update:currentDentIndex',
]);

const canvasArea = ref(null);
const photoImg = ref(null);
const konvaContainer = ref(null);

let stage = null;
let dentLayer = null;
let drawingLayer = null;
let stageInitializedForPhoto = null;
let resizeObserver = null;

const activeMode = ref('idle');
const isPanelCollapsed = ref(false);
const showResetConfirm = ref(false);

const BADGE_RADIUS = 10;
const BADGE_RADIUS_DIM_ACTIVE = 12;
const BADGE_RADIUS_DIM_IDLE = 9;
const BADGE_FONT_SIZE = 11;

function togglePanel() {
  isPanelCollapsed.value = !isPanelCollapsed.value;
}
const pulseAnimations = new Map();
const dimModalOpen = ref(false);
const dimModalDentId = ref(null);

const zoomScale = ref(1);
const panX = ref(0);
const panY = ref(0);

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

let isPinching = false;
let pinchStartDist = 0;
let pinchStartScale = 1;
let pinchStartCenter = { x: 0, y: 0 };
let pinchStartPanX = 0;
let pinchStartPanY = 0;
let lastTapTime = 0;
let wasPinching = false;
let wasPinchingTimer = null;

const zoomTransformStyle = computed(() => {
  if (zoomScale.value <= 1 && panX.value === 0 && panY.value === 0) return {};
  return {
    transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoomScale.value})`,
    transformOrigin: '0 0',
  };
});

const dentsWithSecondary = computed(() =>
  props.dents.filter((d) => d.secondaryDeformation)
);

const selectedDentIndex = computed(() => {
  const d = props.dents.find((x) => x.id === props.selectedDentId);
  return d?.index ?? null;
});

const selectedDentHasSecondary = computed(() => {
  const d = props.dents.find((d) => d.id === props.selectedDentId);
  return !!d?.secondaryDeformation;
});

const dimModalDent = computed(() =>
  props.dents.find((d) => d.id === dimModalDentId.value) ?? null
);

function plural(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'вмятин';
  if (mod10 === 1) return 'вмятина';
  if (mod10 >= 2 && mod10 <= 4) return 'вмятины';
  return 'вмятин';
}

function isDentFilled(dent) {
  const ok = dent.dimensions && dent.dimensions.lengthMm > 0 && dent.dimensions.widthMm > 0;
  const sdOk =
    !dent.secondaryDeformation ||
    (dent.secondaryDeformation.dimensions &&
      dent.secondaryDeformation.dimensions.lengthMm > 0 &&
      dent.secondaryDeformation.dimensions.widthMm > 0);
  return ok && sdOk;
}

const filledCount = computed(() => {
  let n = 0;
  for (const d of props.dents) {
    if (d.dimensions?.lengthMm > 0 && d.dimensions?.widthMm > 0) n++;
    if (d.secondaryDeformation) {
      if (d.secondaryDeformation.dimensions?.lengthMm > 0 && d.secondaryDeformation.dimensions?.widthMm > 0) n++;
    }
  }
  return n;
});
const totalCount = computed(() => {
  let n = props.dents.length;
  for (const d of props.dents) {
    if (d.secondaryDeformation) n++;
  }
  return n;
});
const progressPercent = computed(() =>
  totalCount.value > 0 ? (filledCount.value / totalCount.value) * 100 : 0
);

function hexToRgba(hex, alpha) {
  if (!hex || hex.length < 7) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Координаты контура [x0,y0,...] → ограничивающий прямоугольник */
function outlineBBox(points) {
  if (!points?.length) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  const xs = points.filter((_, i) => i % 2 === 0);
  const ys = points.filter((_, i) => i % 2 === 1);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

/** Бейдж внизу слева у контура (как в PRD: minX+4, maxY−4 от bbox) */
function badgeAnchorFromOutline(points) {
  const { minX, maxY } = outlineBBox(points);
  return { bx: minX + 4, by: maxY - 4 };
}

function layoutCenteredBadgeText(textNode, bx, by) {
  textNode.align('center');
  textNode.verticalAlign('middle');
  textNode.x(bx);
  textNode.y(by);
  textNode.offsetX(textNode.width() / 2);
  textNode.offsetY(textNode.height() / 2);
}

const DIM_OVERLAY_COLOR = '#FFD700';

/**
 * Пунктирные линии размеров на фото.
 * Модалка: «Длина» = lengthMm, «Ширина» = widthMm.
 * По референсу Notes: горизонтальная линия — длина (мм справа), вертикальная — ширина (мм сверху).
 */
function drawDimensionOverlayOnLayer(layer, overlayId, outlinePoints, lengthMm, widthMm) {
  if (!layer) return;
  const existing = layer.findOne(`#${overlayId}`);
  if (existing) existing.destroy();

  const len = Number(lengthMm);
  const wid = Number(widthMm);
  if (!len || !wid || !outlinePoints?.length) return;

  const { minX, maxX, minY, maxY } = outlineBBox(outlinePoints);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const group = new Konva.Group({
    id: overlayId,
    name: 'dim-overlay-group',
    listening: false,
  });

  const hLine = new Konva.Line({
    points: [minX - 4, cy, maxX + 4, cy],
    stroke: DIM_OVERLAY_COLOR,
    strokeWidth: 2,
    dash: [6, 4],
    listening: false,
  });

  const lengthLabel = new Konva.Text({
    x: maxX + 6,
    y: cy - 8,
    text: `${len}мм`,
    fontSize: 12,
    fontStyle: 'bold',
    fill: DIM_OVERLAY_COLOR,
    shadowColor: 'rgba(0,0,0,0.85)',
    shadowBlur: 3,
    shadowOffset: { x: 1, y: 1 },
    listening: false,
  });

  const vLine = new Konva.Line({
    points: [cx, minY - 4, cx, maxY + 4],
    stroke: DIM_OVERLAY_COLOR,
    strokeWidth: 2,
    dash: [6, 4],
    listening: false,
  });

  const widthLabel = new Konva.Text({
    x: cx - 20,
    y: minY - 20,
    text: `${wid}мм`,
    fontSize: 12,
    fontStyle: 'bold',
    fill: DIM_OVERLAY_COLOR,
    shadowColor: 'rgba(0,0,0,0.85)',
    shadowBlur: 3,
    shadowOffset: { x: 1, y: 1 },
    listening: false,
  });

  group.add(hLine);
  group.add(lengthLabel);
  group.add(vLine);
  group.add(widthLabel);
  layer.add(group);
}

function redrawDimensionOverlays() {
  if (!dentLayer || !props.dents?.length) return;
  for (const dent of props.dents) {
    if (dent.outline?.points?.length >= 4 && dent.dimensions?.lengthMm && dent.dimensions?.widthMm) {
      const safeId = `dim_overlay_${String(dent.id).replace(/[^a-zA-Z0-9_]/g, '_')}`;
      drawDimensionOverlayOnLayer(
        dentLayer,
        safeId,
        dent.outline.points,
        dent.dimensions.lengthMm,
        dent.dimensions.widthMm
      );
    }
    const sd = dent.secondaryDeformation;
    if (
      sd?.outline?.points?.length >= 4 &&
      sd.dimensions?.lengthMm &&
      sd.dimensions?.widthMm
    ) {
      const safeSdId = `dim_overlay_sd_${String(dent.id).replace(/[^a-zA-Z0-9_]/g, '_')}`;
      drawDimensionOverlayOnLayer(
        dentLayer,
        safeSdId,
        sd.outline.points,
        sd.dimensions.lengthMm,
        sd.dimensions.widthMm
      );
    }
  }
}

function captureAnnotatedPhoto() {
  return new Promise((resolve) => {
    const imgEl = photoImg.value;
    if (!stage || !imgEl?.complete || !imgEl.naturalWidth) {
      resolve(null);
      return;
    }
    try {
      stage.batchDraw();
      const w = stage.width();
      const h = stage.height();
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      const ctx = out.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(imgEl, 0, 0, w, h);
      const children = stage.getChildren();
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.getClassName?.() === 'Layer') {
          const native = node.getNativeCanvasElement?.();
          if (native) {
            ctx.drawImage(native, 0, 0, native.width, native.height, 0, 0, w, h);
          }
        }
      }
      resolve(out.toDataURL('image/jpeg', 0.88));
    } catch (e) {
      console.warn('[DetailMarking] captureAnnotatedPhoto', e);
      resolve(null);
    }
  });
}

async function handleProceedToParams() {
  if (!props.allDimensionsFilled) return;
  const annotated = await captureAnnotatedPhoto();
  if (annotated) emit('annotated-photo', annotated);
  emit('proceed');
}

function selectDentFromBadge(dentId) {
  if (props.selectedDentId === dentId) {
    emit('dent-selected', null);
    updateSelectionVisuals(null);
    return;
  }
  emit('dent-selected', dentId);
  updateSelectionVisuals(dentId);
}

function toggleDrawDent() {
  activeMode.value = activeMode.value === 'drawing-dent' ? 'idle' : 'drawing-dent';
}

function toggleDrawSecondary() {
  activeMode.value = activeMode.value === 'drawing-secondary' ? 'idle' : 'drawing-secondary';
}

async function goToDimensions() {
  const annotated = await captureAnnotatedPhoto();
  if (annotated) emit('annotated-photo', annotated);
  emit('update:currentDentIndex', 0);
  emit('go-to-dimensions');
  nextTick(() => {
    if (props.dents.length > 0) {
      dimModalDentId.value = props.dents[0].id;
      dimModalOpen.value = true;
    }
  });
}

function goToPrevDent() {
  const next = Math.max(0, props.currentDentIndex - 1);
  emit('update:currentDentIndex', next);
  dimModalDentId.value = props.dents[next]?.id ?? null;
  dimModalOpen.value = true;
}

function goToNextDent() {
  const next = Math.min(props.dents.length - 1, props.currentDentIndex + 1);
  emit('update:currentDentIndex', next);
  dimModalDentId.value = props.dents[next]?.id ?? null;
  dimModalOpen.value = true;
}

function openDimModalForDent(dentId) {
  const idx = props.dents.findIndex((d) => d.id === dentId);
  if (idx >= 0) {
    emit('update:currentDentIndex', idx);
    dimModalDentId.value = dentId;
    dimModalOpen.value = true;
  }
}

function handleDimModalSave({ dentId, dims, secondaryDims }) {
  emit('dimensions-set', { dentId, dims });
  if (secondaryDims) {
    emit('secondary-dimensions-set', { dentId, dims: secondaryDims });
  }
  const idx = props.dents.findIndex((d) => d.id === dentId);
  if (idx >= 0 && idx < props.dents.length - 1) {
    const nextDent = props.dents[idx + 1];
    emit('update:currentDentIndex', idx + 1);
    nextTick(() => {
      dimModalDentId.value = nextDent?.id ?? null;
      dimModalOpen.value = true;
    });
  }
}

function renumberCanvasBadges() {
  if (!dentLayer) return;
  const groups = dentLayer.find('.dent-group');
  groups.forEach((node, i) => {
    const textNode = node.findOne('.dent-badge-text');
    const circleNode = node.findOne('.dent-badge-circle');
    if (textNode) {
      textNode.text(String(i + 1));
      if (circleNode) {
        layoutCenteredBadgeText(textNode, circleNode.x(), circleNode.y());
      }
    }
  });
  dentLayer.batchDraw();
}

function handleDeleteSelected() {
  const dentId = props.selectedDentId;
  if (!dentId) return;

  if (dentLayer) {
    const group = dentLayer.findOne(`#dent_group_${dentId}`);
    if (group) {
      group.destroy();
    }
    dentLayer.batchDraw();
  }

  emit('dent-selected', null);
  updateSelectionVisuals(null);
  emit('dent-deleted', dentId);
  nextTick(() => renumberCanvasBadges());
}

function handleResetDrawing() {
  if (dentLayer) {
    dentLayer.destroyChildren();
    dentLayer.batchDraw();
  }
  if (drawingLayer) {
    drawingLayer.destroyChildren();
    drawingLayer.batchDraw();
  }
  pulseAnimations.forEach((a) => a.stop());
  pulseAnimations.clear();
  activeMode.value = 'idle';
  emit('dent-selected', null);
  emit('reset-drawing');
}

function confirmReset() {
  showResetConfirm.value = false;
  handleResetDrawing();
}

function updateSelectionVisuals(selectedId) {
  if (!dentLayer) return;
  const allowDrag = activeMode.value === 'idle';
  const groups = dentLayer.find('.dent-group');
  groups.forEach((node) => {
    const group = node;
    const id = group.getAttr('dentId');
    const outline = group.findOne('.dent-outline');
    const badge = group.findOne('.dent-badge-circle');
    if (!outline) return;

    if (props.currentStep !== 'dimensions') {
      badge?.radius(BADGE_RADIUS);
      badge?.shadowBlur(0);
      badge?.shadowOpacity(0);
    }

    if (id === selectedId) {
      outline.strokeWidth(5);
      outline.shadowColor('#ffffff');
      outline.shadowBlur(12);
      outline.shadowOpacity(0.7);
      outline.fill(hexToRgba(outline.stroke(), 0.25));
      group.opacity(1);
      group.draggable(allowDrag);
    } else {
      outline.strokeWidth(2.5);
      outline.shadowBlur(0);
      outline.shadowOpacity(0);
      outline.fill(hexToRgba(outline.stroke(), 0.12));
      group.opacity(selectedId ? 0.55 : 1);
      group.draggable(false);
    }
  });
  dentLayer.batchDraw();
}


function createDentGroup(points, color, dentId, index) {
  const group = new Konva.Group({
    id: `dent_group_${dentId}`,
    draggable: false,
    listening: true,
  });
  group.setAttr('dentId', dentId);
  group.setAttr('dentIndex', index);
  group.name('dent-group');

  const shape = new Konva.Line({
    points,
    stroke: color,
    strokeWidth: 3,
    fill: hexToRgba(color, 0.2),
    lineCap: 'round',
    lineJoin: 'round',
    closed: true,
    tension: 0.4,
    listening: true,
    hitStrokeWidth: 16,
    name: 'dent-outline',
  });

  const { bx, by } = badgeAnchorFromOutline(points);

  const circle = new Konva.Circle({
    x: bx,
    y: by,
    radius: BADGE_RADIUS,
    fill: color,
    stroke: 'rgba(0,0,0,0.45)',
    strokeWidth: 1,
    listening: false,
    name: 'dent-badge-circle',
  });

  const text = new Konva.Text({
    text: String(index),
    fontSize: BADGE_FONT_SIZE,
    fontStyle: 'bold',
    fill: '#000',
    listening: false,
    name: 'dent-badge-text',
  });
  layoutCenteredBadgeText(text, bx, by);

  group.add(shape);
  group.add(circle);
  group.add(text);

  group.on('tap click', (e) => {
    e.cancelBubble = true;
    if (props.currentStep === 'dimensions') {
      openDimModalForDent(dentId);
      return;
    }
    if (activeMode.value !== 'idle') return;
    emit('dent-selected', dentId);
    updateSelectionVisuals(dentId);
  });

  group.on('dragstart', () => {
    emit('dent-selected', dentId);
    updateSelectionVisuals(dentId);
    group.opacity(0.9);
  });

  group.on('dragmove', () => {
    const stageW = stage.width();
    const stageH = stage.height();
    const pos = group.position();
    group.x(Math.max(-stageW * 0.4, Math.min(stageW * 0.4, pos.x)));
    group.y(Math.max(-stageH * 0.4, Math.min(stageH * 0.4, pos.y)));
  });

  group.on('dragend', () => {
    const dx = group.x();
    const dy = group.y();
    group.opacity(1);
    const currentOutline = group.findOne('.dent-outline');
    const oldPoints = currentOutline ? currentOutline.points() : points;
    const newPoints = oldPoints.map((v, i) => (i % 2 === 0 ? v + dx : v + dy));
    const circleNode = group.findOne('.dent-badge-circle');
    const textNode = group.findOne('.dent-badge-text');
    const anchor = badgeAnchorFromOutline(newPoints);
    if (circleNode) {
      circleNode.x(anchor.bx);
      circleNode.y(anchor.by);
    }
    if (textNode && circleNode) {
      layoutCenteredBadgeText(textNode, circleNode.x(), circleNode.y());
    }
    group.x(0);
    group.y(0);
    if (currentOutline) currentOutline.points(newPoints);
    dentLayer.batchDraw();
    emit('dent-moved', { dentId, newPoints });
  });

  return group;
}

function redrawDentLayer() {
  if (!dentLayer || !props.dents) return;
  dentLayer.destroyChildren();

  for (const dent of props.dents) {
    if (dent.outline?.points?.length >= 4) {
      const group = createDentGroup(
        dent.outline.points,
        dent.color,
        dent.id,
        dent.index
      );
      dentLayer.add(group);
    }

    if (dent.secondaryDeformation?.outline?.points?.length >= 4) {
      const sd = dent.secondaryDeformation;
      const sdLine = new Konva.Line({
        points: sd.outline.points,
        stroke: '#FF6B6B',
        strokeWidth: 2.5,
        lineCap: 'round',
        lineJoin: 'round',
        dash: [8, 5],
        closed: true,
        tension: 0.3,
        listening: false,
      });
      dentLayer.add(sdLine);
    }
  }

  if (props.currentStep === 'dimensions') {
    const activeId = props.dents[props.currentDentIndex]?.id ?? null;
    highlightDentForEditing(activeId);
  } else {
    updateSelectionVisuals(props.selectedDentId);
  }
  redrawDimensionOverlays();
  dentLayer.batchDraw();
}

watch(
  () => [props.currentStep, props.currentDentIndex, props.dents],
  () => {
    if (!dentLayer) return;
    if (props.currentStep === 'dimensions') {
      const activeId = props.dents[props.currentDentIndex]?.id ?? null;
      highlightDentForEditing(activeId);
    } else {
      pulseAnimations.forEach((a) => a.stop());
      pulseAnimations.clear();
      updateSelectionVisuals(props.selectedDentId);
    }
  },
  { immediate: true, deep: true }
);

function getTouchDistance(t1, t2) {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

function getTouchCenter(t1, t2) {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  };
}

function clampPan() {
  if (zoomScale.value <= 1) {
    panX.value = 0;
    panY.value = 0;
    return;
  }
  const area = canvasArea.value;
  if (!area) return;
  const w = area.clientWidth;
  const h = area.clientHeight;
  const maxPanX = w * (zoomScale.value - 1);
  const maxPanY = h * (zoomScale.value - 1);
  panX.value = Math.max(-maxPanX, Math.min(0, panX.value));
  panY.value = Math.max(-maxPanY, Math.min(0, panY.value));
}

function resetZoom() {
  zoomScale.value = 1;
  panX.value = 0;
  panY.value = 0;
}

function handlePinchTouchStart(e) {
  if (e.touches.length >= 2) {
    isPinching = true;
    wasPinching = true;
    clearTimeout(wasPinchingTimer);
    pinchStartDist = getTouchDistance(e.touches[0], e.touches[1]);
    pinchStartScale = zoomScale.value;
    pinchStartCenter = getTouchCenter(e.touches[0], e.touches[1]);
    pinchStartPanX = panX.value;
    pinchStartPanY = panY.value;
  } else if (e.touches.length === 1 && !wasPinching) {
    const now = Date.now();
    if (now - lastTapTime < 300 && zoomScale.value > 1.05) {
      resetZoom();
    }
    lastTapTime = now;
  }
}

function handlePinchTouchMove(e) {
  if (e.touches.length >= 2 && isPinching) {
    const dist = getTouchDistance(e.touches[0], e.touches[1]);
    const center = getTouchCenter(e.touches[0], e.touches[1]);

    let newScale = pinchStartScale * (dist / pinchStartDist);
    newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

    const areaRect = canvasArea.value?.getBoundingClientRect();
    if (areaRect) {
      const cx = pinchStartCenter.x - areaRect.left;
      const cy = pinchStartCenter.y - areaRect.top;
      panX.value = pinchStartPanX
        + (center.x - pinchStartCenter.x)
        - cx * (newScale / pinchStartScale - 1);
      panY.value = pinchStartPanY
        + (center.y - pinchStartCenter.y)
        - cy * (newScale / pinchStartScale - 1);
    }

    zoomScale.value = newScale;
    clampPan();
  }
}

function handlePinchTouchEnd(e) {
  if (e.touches.length < 2) {
    isPinching = false;
    clearTimeout(wasPinchingTimer);
    wasPinchingTimer = setTimeout(() => { wasPinching = false; }, 300);
  }
  if (zoomScale.value < 1.05) {
    resetZoom();
  }
}

function handleWheelZoom(e) {
  e.preventDefault();
  const scaleFactor = 1 - e.deltaY * 0.002;
  let newScale = zoomScale.value * scaleFactor;
  newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

  const areaRect = canvasArea.value?.getBoundingClientRect();
  if (areaRect) {
    const cx = e.clientX - areaRect.left;
    const cy = e.clientY - areaRect.top;
    panX.value -= cx * (newScale / zoomScale.value - 1);
    panY.value -= cy * (newScale / zoomScale.value - 1);
  }

  zoomScale.value = newScale;
  clampPan();
  if (newScale < 1.05) resetZoom();
}

function initCanvas() {
  if (!konvaContainer.value || !photoImg.value || !props.photoDataUrl || !canvasArea.value) return;
  if (stageInitializedForPhoto === props.photoDataUrl) return;
  stageInitializedForPhoto = props.photoDataUrl;
  resetZoom();

  nextTick(() => {
    const img = photoImg.value;
    const container = konvaContainer.value;
    const area = canvasArea.value;
    if (!img || !container || !area) return;

    const imgRect = img.getBoundingClientRect();
    const areaRect = area.getBoundingClientRect();
    const w = Math.round(imgRect.width) || 320;
    const h = Math.round(imgRect.height) || 240;
    const ox = imgRect.left - areaRect.left;
    const oy = imgRect.top - areaRect.top;

    if (stage) {
      stage.destroy();
      stage = null;
      dentLayer = null;
      drawingLayer = null;
    }

    Object.assign(container.style, {
      position: 'absolute',
      left: `${ox}px`,
      top: `${oy}px`,
      width: `${w}px`,
      height: `${h}px`,
      pointerEvents: 'all',
    });

    stage = new Konva.Stage({ container, width: w, height: h });
    const stageContainer = stage.container();
    if (stageContainer) {
      stageContainer.style.touchAction = 'none';
      stageContainer.style.msTouchAction = 'none';
    }
    dentLayer = new Konva.Layer();
    drawingLayer = new Konva.Layer();
    stage.add(dentLayer);
    stage.add(drawingLayer);

    redrawDentLayer();

    let isDrawing = false;
          let currentLine = null;
          let currentPoints = [];

          stage.on('mousedown touchstart', (e) => {
            if (e.evt.touches?.length >= 2) return;
      if (activeMode.value === 'idle') {
        let node = e.target;
        let hitDent = false;
        while (node) {
          if (node.getAttr?.('dentId')) {
            hitDent = true;
            break;
          }
          node = node.getParent?.();
        }
        if (!hitDent) {
          emit('dent-selected', null);
          updateSelectionVisuals(null);
        }
        return;
      }
      isDrawing = true;
      currentPoints = [];
      const pos = stage.getPointerPosition();
      if (!pos) return;
      currentPoints = [pos.x, pos.y];

      const isDent = activeMode.value === 'drawing-dent';
      const nextIdx = props.dents.length;
      const color = isDent ? DENT_COLORS[nextIdx % DENT_COLORS.length] : '#FF6B6B';

      currentLine = new Konva.Line({
        points: [...currentPoints],
        stroke: color,
        strokeWidth: isDent ? 3 : 2.5,
        lineCap: 'round',
        lineJoin: 'round',
        dash: isDent ? [] : [8, 5],
        closed: false,
        tension: 0.3,
      });
      drawingLayer.add(currentLine);
    });

    stage.on('mousemove touchmove', (e) => {
      if (e.evt.touches?.length >= 2) return;
      if (!isDrawing || !currentLine) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      currentPoints.push(pos.x, pos.y);
      currentLine.points(currentPoints);
      drawingLayer.batchDraw();
    });

    stage.on('mouseup touchend', () => {
      if (!isDrawing || !currentLine) return;
      isDrawing = false;

      if (currentPoints.length > 8) {
        currentLine.closed(true);
        currentLine.dash([]);

        if (activeMode.value === 'drawing-dent') {
          emit('dent-added', [...currentPoints]);
        } else if (activeMode.value === 'drawing-secondary' && props.selectedDentId) {
          emit('secondary-added', {
            parentDentId: props.selectedDentId,
            points: [...currentPoints],
          });
          activeMode.value = 'idle';
        }
      } else {
        currentLine.destroy();
      }
      currentLine = null;
      currentPoints = [];
      drawingLayer.destroyChildren();
      drawingLayer.batchDraw();
    });

    if (typeof ResizeObserver !== 'undefined' && canvasArea.value && photoImg.value) {
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(() => {
        if (!stage || !photoImg.value || !konvaContainer.value || !canvasArea.value) return;
        resetZoom();
        const img = photoImg.value;
        const area = canvasArea.value;
        const imgRect = img.getBoundingClientRect();
        const areaRect = area.getBoundingClientRect();
        const w = Math.round(imgRect.width) || 320;
        const h = Math.round(imgRect.height) || 240;
        const ox = imgRect.left - areaRect.left;
        const oy = imgRect.top - areaRect.top;
        Object.assign(konvaContainer.value.style, {
          position: 'absolute',
          left: `${ox}px`,
          top: `${oy}px`,
          width: `${w}px`,
          height: `${h}px`,
        });
        stage.width(w);
        stage.height(h);
        stage.batchDraw();
      });
      resizeObserver.observe(canvasArea.value);
    }
  });
}

watch(
  () => [props.dents, props.photoDataUrl],
  () => {
    if (dentLayer) redrawDentLayer();
  },
  { deep: true }
);

watch(
  () => props.photoDataUrl,
  (url) => {
    if (!url) {
      stageInitializedForPhoto = null;
      return;
    }
    if (photoImg.value?.complete) initCanvas();
  }
);

watch(
  () => props.selectedDentId,
  (newId) => {
    updateSelectionVisuals(newId);
  }
);

watch(activeMode, (mode) => {
  const allowDrag = mode === 'idle';
  if (dentLayer) {
    dentLayer.find('.dent-group').forEach((node) => {
      const group = node;
      const isSelected = group.getAttr('dentId') === props.selectedDentId;
      group.draggable(allowDrag && isSelected);
    });
    dentLayer.batchDraw();
  }
});

function startPulse(group) {
  const id = group.getAttr('dentId');
  if (pulseAnimations.has(id)) return;
  const outline = group.findOne('.dent-outline');
  if (!outline) return;
  let opacity = 0.25;
  let direction = 1;
  const anim = new Konva.Animation((frame) => {
    if (!frame) return;
    opacity += direction * 0.008;
    if (opacity > 0.45) direction = -1;
    if (opacity < 0.15) direction = 1;
    outline.fill(hexToRgba(outline.stroke(), opacity));
  }, dentLayer);
  anim.start();
  pulseAnimations.set(id, anim);
}

function stopPulse(group) {
  const id = group.getAttr('dentId');
  const anim = pulseAnimations.get(id);
  if (anim) {
    anim.stop();
    pulseAnimations.delete(id);
  }
}

function highlightDentForEditing(activeDentId) {
  if (!dentLayer) return;
  const groups = dentLayer.find('.dent-group');
  groups.forEach((node) => {
    const group = node;
    const id = group.getAttr('dentId');
    const outline = group.findOne('.dent-outline');
    const badge = group.findOne('.dent-badge-circle');

    if (id === activeDentId) {
      outline?.strokeWidth(6);
      outline?.shadowColor('#ffffff');
      outline?.shadowBlur(16);
      outline?.shadowOpacity(0.8);
      badge?.radius(BADGE_RADIUS_DIM_ACTIVE);
      badge?.shadowColor('#ffffff');
      badge?.shadowBlur(10);
      badge?.shadowOpacity(0.6);
      group.opacity(1);
      startPulse(group);
    } else {
      stopPulse(group);
      outline?.strokeWidth(2);
      outline?.shadowBlur(0);
      outline?.shadowOpacity(0);
      outline?.fill(hexToRgba(outline?.stroke() || '#4CAF50', 0.12));
      badge?.radius(BADGE_RADIUS_DIM_IDLE);
      badge?.shadowBlur(0);
      group.opacity(0.3);
    }
  });
  dentLayer.batchDraw();
}

onMounted(() => {
  document.body.style.overflow = 'hidden';
  document.body.style.overscrollBehavior = 'none';
  document.documentElement.style.overflow = 'hidden';
  document.documentElement.style.overscrollBehavior = 'none';
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.expand) {
    window.Telegram.WebApp.expand();
  }
  const area = canvasArea.value;
  if (area) {
    const onTouchStart = (e) => { e.preventDefault(); handlePinchTouchStart(e); };
    const onTouchMove = (e) => { e.preventDefault(); handlePinchTouchMove(e); };
    const onTouchEnd = (e) => { handlePinchTouchEnd(e); };
    const onWheel = (e) => { handleWheelZoom(e); };
    area._dmHandlers = { onTouchStart, onTouchMove, onTouchEnd, onWheel };
    area.addEventListener('touchstart', onTouchStart, { passive: false });
    area.addEventListener('touchmove', onTouchMove, { passive: false });
    area.addEventListener('touchend', onTouchEnd, { passive: false });
    area.addEventListener('wheel', onWheel, { passive: false });
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  pulseAnimations.forEach((a) => a.stop());
  pulseAnimations.clear();
  document.body.style.overflow = '';
  document.body.style.overscrollBehavior = '';
  document.documentElement.style.overflow = '';
  document.documentElement.style.overscrollBehavior = '';
  clearTimeout(wasPinchingTimer);
  const area = canvasArea.value;
  if (area?._dmHandlers) {
    area.removeEventListener('touchstart', area._dmHandlers.onTouchStart);
    area.removeEventListener('touchmove', area._dmHandlers.onTouchMove);
    area.removeEventListener('touchend', area._dmHandlers.onTouchEnd);
    area.removeEventListener('wheel', area._dmHandlers.onWheel);
    delete area._dmHandlers;
  }
});

</script>

<style scoped>
.marking-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: var(--tab-bar-height, var(--app-footer-height, var(--bottom-nav-h, 64px)));
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  background: var(--dm-bg, #0f0f0f);
  z-index: 10;
}
/* Рабочая область: фиксирована, не сдвигается при появлении UI */
.marking-canvas-area {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  background: var(--dm-surface, #161616);
}
.marking-photo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.marking-konva-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: all;
}
.marking-zoom-wrapper {
  position: absolute;
  inset: 0;
  will-change: transform;
}
.marking-zoom-reset {
  position: absolute;
  top: 48px;
  right: 8px;
  z-index: 7;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 4px 10px;
  cursor: pointer;
  pointer-events: auto;
  line-height: 1.4;
}
.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition: opacity 0.2s ease;
}
.zoom-fade-enter-from,
.zoom-fade-leave-to {
  opacity: 0;
}
/* Верхняя плашка: назад, заголовок (overlay) */
.marking-top-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: linear-gradient(to bottom, rgba(15, 15, 15, 0.92) 0%, transparent);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 6;
  pointer-events: auto;
}
.marking-top-overlay .dm-back-btn-sm {
  flex-shrink: 0;
}
.marking-top-overlay .marking-controls__step-label {
  flex: 1;
  text-align: center;
}
.marking-top-overlay .marking-controls__top-spacer {
  width: 36px;
  flex-shrink: 0;
}
/* Нижняя плашка поверх фото — не сдвигает рабочую область */
.marking-controls-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, rgba(15, 15, 15, 0.98) 0%, rgba(15, 15, 15, 0.95) 60%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 0;
  display: flex;
  flex-direction: column;
  max-height: 44vh;
  min-height: 0;
  overflow: hidden;
  pointer-events: auto;
  z-index: 5;
  transition: max-height 0.25s ease, opacity 0.2s ease;
}
.marking-controls-overlay--collapsed {
  max-height: 40px;
}
.marking-controls__toggle {
  flex-shrink: 0;
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--dm-text-secondary, #888);
}
.marking-controls__handle-bar {
  width: 32px;
  height: 4px;
  border-radius: 2px;
  background: var(--dm-text-secondary, #888);
}
.marking-controls__toggle-chevron {
  font-size: 10px;
  opacity: 0.85;
}
.marking-controls__body {
  flex: 1 1 auto;
  min-height: 0;
  max-height: calc(44vh - 36px);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 4px 12px calc(10px + env(safe-area-inset-bottom, 0px));
}
@media (max-width: 600px) {
  .marking-controls__body {
    padding: 4px 10px calc(10px + env(safe-area-inset-bottom, 0px));
  }
}
.marking-controls__top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
  min-height: 0;
}
.marking-controls__top-spacer {
  width: 36px;
}
.marking-controls__step-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--dm-text-secondary, #888);
}
.dm-back-btn-sm {
  min-height: 32px;
  min-width: 36px;
  padding: 0 6px;
  border-radius: 6px;
  background: transparent;
  color: var(--dm-text-secondary, #888);
  border: 1px solid var(--dm-border, #2a2a2a);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.marking-controls-overlay--marking {
  max-height: 44vh;
}
/* Экран размеров: без фиксированной высоты — только по контенту, фото занимает остаток */
.marking-controls-overlay--dimensions:not(.marking-controls-overlay--collapsed) {
  max-height: 38vh;
}
.marking-controls-overlay--dimensions .marking-controls__body {
  max-height: calc(38vh - 36px);
}
.dimensions-proceed {
  flex-shrink: 0;
  margin-top: 6px;
  min-height: 48px;
}
.marking-hint-bar {
  text-align: center;
  min-height: 18px;
}
.marking-hint-text {
  font-size: 12px;
  color: var(--dm-text-secondary, #888);
  line-height: 1.4;
}
.marking-hint-text--active {
  color: var(--dm-accent, #a0e040);
  font-weight: 600;
}
.marking-hint-text--secondary {
  color: var(--dm-danger, #e53935);
  font-weight: 600;
}
.marking-hint-text--selected {
  color: var(--dm-text-primary, #fff);
}
.marking-badges-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}
.zone-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  color: #000;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: box-shadow 0.15s, transform 0.15s;
}
.zone-badge--selected {
  transform: scale(1.15);
}
.zone-badge--secondary {
  background: transparent !important;
  border: 2px dashed var(--dm-danger, #e53935) !important;
  color: var(--dm-danger, #e53935);
  font-size: 9px;
  font-weight: 700;
  width: auto;
  padding: 0 8px;
  border-radius: 18px;
  display: flex;
  flex-direction: row;
  gap: 2px;
  align-items: center;
}
.marking-actions-row {
  display: flex;
  gap: 6px;
  align-items: stretch;
}
.marking-draw-btn {
  flex: 1;
  min-height: 42px;
  border-radius: 10px;
  border: 1.5px solid var(--dm-border, #2a2a2a);
  background: var(--dm-surface-2, #1e1e1e);
  color: var(--dm-text-primary, #fff);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: all 0.15s;
  padding: 6px 4px;
}
.marking-draw-btn__icon {
  font-size: 18px;
  line-height: 1;
}
.marking-draw-btn__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.marking-draw-btn--active {
  border-color: var(--dm-accent, #a0e040);
  color: var(--dm-accent, #a0e040);
  background: rgba(160, 224, 64, 0.08);
}
.marking-draw-btn--secondary {
  border-color: var(--dm-danger, #e53935);
  color: var(--dm-danger, #e53935);
}
.marking-draw-btn--secondary.marking-draw-btn--active {
  background: rgba(229, 57, 53, 0.08);
}
.marking-draw-btn:active {
  transform: scale(0.96);
}
.marking-icon-btn {
  width: 42px;
  min-height: 42px;
  border-radius: 10px;
  border: 1.5px solid var(--dm-border, #2a2a2a);
  background: var(--dm-surface-2, #1e1e1e);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.marking-icon-btn--danger {
  border-color: var(--dm-danger, #e53935);
  color: var(--dm-danger, #e53935);
}
.marking-icon-btn--danger:active {
  background: rgba(229, 57, 53, 0.15);
  transform: scale(0.94);
}
.marking-icon-btn--inactive {
  opacity: 0.3;
  cursor: not-allowed;
  border-color: var(--dm-border, #2a2a2a) !important;
  color: var(--dm-border, #2a2a2a) !important;
}
.marking-icon-btn--inactive:active {
  transform: none;
}
.marking-icon-btn--reset {
  border-color: var(--dm-text-secondary, #666);
  color: var(--dm-text-secondary, #666);
}
.marking-icon-btn--reset:hover,
.marking-icon-btn--reset:active {
  border-color: var(--dm-danger, #e53935);
  color: var(--dm-danger, #e53935);
}
.reset-confirm {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(229, 57, 53, 0.1);
  border: 1px solid var(--dm-danger, #e53935);
  animation: fadeIn 0.15s ease;
}
.reset-confirm__text {
  flex: 1;
  font-size: 13px;
  color: var(--dm-danger, #e53935);
  font-weight: 600;
}
.reset-confirm__yes,
.reset-confirm__no {
  min-height: 36px;
  min-width: 52px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}
.reset-confirm__yes {
  background: var(--dm-danger, #e53935);
  color: #fff;
}
.reset-confirm__no {
  background: var(--dm-surface-2, #1e1e1e);
  color: var(--dm-text-primary, #fff);
  border: 1px solid var(--dm-border, #2a2a2a);
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.marking-proceed-btn {
  width: 100%;
  min-height: 48px;
  border-radius: 12px;
  background: var(--dm-accent, #a0e040);
  color: var(--dm-bg, #000);
  font-size: 15px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}
.marking-proceed-btn:active {
  transform: scale(0.98);
}
.dimensions-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 2px 0 6px;
}
.dimensions-nav__count {
  font-size: 11px;
  color: var(--dm-text-secondary, #888);
  flex-shrink: 0;
}
.dimensions-nav__progress {
  flex: 1;
  min-width: 0;
  height: 3px;
  border-radius: 2px;
  background: var(--dm-border, #2a2a2a);
  overflow: hidden;
}
.dimensions-nav__fill {
  height: 100%;
  background: var(--dm-accent, #a0e040);
  transition: width 0.3s ease;
}
.dimensions-nav :deep(.detail-progress-dots) {
  flex-shrink: 0;
  height: 14px;
  padding: 0;
}
.dimensions-nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
}
.dimensions-nav-btn {
  min-width: 44px;
  min-height: 44px;
  border-radius: 10px;
  border: 1.5px solid var(--dm-border, #2a2a2a);
  background: var(--dm-surface-2, #1e1e1e);
  color: var(--dm-text-primary, #fff);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.dimensions-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.dimensions-nav-btn:not(:disabled):active {
  background: var(--dm-accent, #a0e040);
  color: var(--dm-bg, #000);
}
.dimensions-nav-current {
  font-size: 13px;
  font-weight: 600;
  color: var(--dm-text-primary, #fff);
}
.dimensions-tap-hint {
  font-size: 11px;
  color: var(--dm-text-secondary, #888);
  margin: 0;
  text-align: center;
}
.dm-btn {
  min-height: 44px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}
.dm-btn--primary {
  background: var(--dm-accent, #a0e040);
  color: var(--dm-bg, #000);
}
.dm-btn--full {
  width: 100%;
}
</style>
