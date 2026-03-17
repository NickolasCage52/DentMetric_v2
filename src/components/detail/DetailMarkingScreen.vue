<template>
  <div class="marking-screen">
    <!-- Рабочая область: фиксированный размер, никогда не сдвигается при появлении UI -->
    <div class="marking-canvas-area" ref="canvasArea">
      <div ref="konvaContainer" class="marking-konva-layer" />
    </div>

    <!-- Верхняя плашка: назад, заголовок (overlay, не сдвигает фото) -->
    <div class="marking-top-overlay">
      <button type="button" class="dm-back-btn-sm" @click="$emit('back')">←</button>
      <span class="marking-controls__step-label">
        {{ currentStep === 'marking' ? 'Разметка' : 'Размеры' }}
      </span>
      <div class="marking-controls__top-spacer" />
    </div>

    <!-- Нижняя плашка: инструменты поверх фото -->
    <div class="marking-controls-overlay" :class="{ 'marking-controls-overlay--marking': currentStep === 'marking' }">

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
          @click="$emit('proceed')"
        >
          <template v-if="allDimensionsFilled">К параметрам →</template>
          <template v-else>Заполните все размеры ({{ totalCount - filledCount }} осталось)</template>
        </button>
      </template>

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
  'proceed',
  'back',
  'reset-drawing',
  'update:currentDentIndex',
]);

const canvasArea = ref(null);
const konvaContainer = ref(null);

let stage = null;
let contentGroup = null;
let dentLayer = null;
let drawingLayer = null;
let stageInitializedForPhoto = null;
let resizeObserver = null;

const activeMode = ref('idle');
const showResetConfirm = ref(false);
const pulseAnimations = new Map();
const dimModalOpen = ref(false);
const dimModalDentId = ref(null);

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

function goToDimensions() {
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
    const textNode = (node).findOne('.dent-badge-text');
    if (textNode) textNode.text(String(i + 1));
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
    if (!outline) return;

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

  const xs = points.filter((_, i) => i % 2 === 0);
  const ys = points.filter((_, i) => i % 2 === 1);
  const cx = xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  const cy = ys.reduce((a, b) => a + b, 0) / (ys.length || 1);

  const circle = new Konva.Circle({
    x: cx,
    y: cy,
    radius: 16,
    fill: color,
    stroke: 'rgba(0,0,0,0.3)',
    strokeWidth: 1.5,
    listening: true,
    name: 'dent-badge-circle',
  });

  const text = new Konva.Text({
    x: cx - 7,
    y: cy - 9,
    text: String(index),
    fontSize: 18,
    fontStyle: 'bold',
    fill: '#000',
    listening: false,
    name: 'dent-badge-text',
  });

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
    if (circleNode) {
      circleNode.x(cx + dx);
      circleNode.y(cy + dy);
    }
    if (textNode) {
      textNode.x(cx - 7 + dx);
      textNode.y(cy - 9 + dy);
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

function initCanvas() {
  if (!konvaContainer.value || !props.photoDataUrl || !canvasArea.value) return;
  if (stageInitializedForPhoto === props.photoDataUrl) return;
  stageInitializedForPhoto = props.photoDataUrl;

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = src;
    });

  loadImage(props.photoDataUrl)
    .then((img) => {
      const container = konvaContainer.value;
      const area = canvasArea.value;
      if (!container || !area) return;

      requestAnimationFrame(() => {
        nextTick(() => {
          const rect = area.getBoundingClientRect();
          const w = Math.max(320, Math.round(rect.width));
          const h = Math.max(240, Math.round(rect.height));

          if (stage) {
            stage.destroy();
            stage = null;
            contentGroup = null;
            dentLayer = null;
            drawingLayer = null;
          }

          Object.assign(container.style, {
            position: 'absolute',
            left: '0',
            top: '0',
            width: `${w}px`,
            height: `${h}px`,
            pointerEvents: 'all',
          });

          Konva.hitOnDragEnabled = true;
          stage = new Konva.Stage({ container, width: w, height: h });
          const stageContainer = stage.container();
          if (stageContainer) {
            stageContainer.style.touchAction = 'none';
            stageContainer.style.msTouchAction = 'none';
          }

          const mainLayer = new Konva.Layer();
          contentGroup = new Konva.Group({ x: 0, y: 0, scaleX: 1, scaleY: 1 });

          const imgW = img.naturalWidth || img.width || 1;
          const imgH = img.naturalHeight || img.height || 1;
          const scaleFit = Math.min(w / imgW, h / imgH, 1);
          const dw = imgW * scaleFit;
          const dh = imgH * scaleFit;
          const photoNode = new Konva.Image({
            image: img,
            x: (w - dw) / 2,
            y: (h - dh) / 2,
            width: dw,
            height: dh,
            listening: false,
          });
          contentGroup.add(photoNode);

          dentLayer = new Konva.Group({ name: 'dents' });
          drawingLayer = new Konva.Group({ name: 'drawing' });
          contentGroup.add(dentLayer);
          contentGroup.add(drawingLayer);
          mainLayer.add(contentGroup);
          stage.add(mainLayer);

          redrawDentLayer();

          let lastPinchCenter = null;
          let lastPinchDist = 0;
          const getDist = (p1, p2) => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
          const getCenter = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });

          stage.on('touchmove', (e) => {
            const t1 = e.evt.touches?.[0];
            const t2 = e.evt.touches?.[1];
            if (t1 && t2) {
              e.evt.preventDefault();
              const rect = stage.container().getBoundingClientRect();
              const p1 = { x: t1.clientX - rect.left, y: t1.clientY - rect.top };
              const p2 = { x: t2.clientX - rect.left, y: t2.clientY - rect.top };
              const newCenter = getCenter(p1, p2);
              const dist = getDist(p1, p2);
              if (!lastPinchCenter) {
                lastPinchCenter = newCenter;
                lastPinchDist = dist;
                return;
              }
              const pointTo = {
                x: (newCenter.x - contentGroup.x()) / contentGroup.scaleX(),
                y: (newCenter.y - contentGroup.y()) / contentGroup.scaleY(),
              };
              const scale = Math.max(0.5, Math.min(5, contentGroup.scaleX() * (dist / lastPinchDist)));
              contentGroup.scaleX(scale);
              contentGroup.scaleY(scale);
              const dx = newCenter.x - lastPinchCenter.x;
              const dy = newCenter.y - lastPinchCenter.y;
              contentGroup.position({
                x: newCenter.x - pointTo.x * scale + dx,
                y: newCenter.y - pointTo.y * scale + dy,
              });
              lastPinchCenter = newCenter;
              lastPinchDist = dist;
              stage.batchDraw();
            }
          });
          stage.on('touchend touchcancel', () => {
            lastPinchCenter = null;
            lastPinchDist = 0;
          });

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

    if (typeof ResizeObserver !== 'undefined' && canvasArea.value) {
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(() => {
        if (!stage || !konvaContainer.value || !canvasArea.value) return;
        const rect = canvasArea.value.getBoundingClientRect();
        const w = Math.max(320, Math.round(rect.width));
        const h = Math.max(240, Math.round(rect.height));
        Object.assign(konvaContainer.value.style, { width: `${w}px`, height: `${h}px` });
        stage.width(w);
        stage.height(h);
        stage.batchDraw();
      });
      resizeObserver.observe(canvasArea.value);
    }
      });
    });
  })
    .catch((err) => {
      console.error('[DetailMarking] Image load failed:', err);
      stageInitializedForPhoto = null;
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
    initCanvas();
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
      badge?.radius(20);
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
      badge?.radius(14);
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
  const preventScroll = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const area = canvasArea.value;
  if (area) {
    area._dmPreventScroll = preventScroll;
    area.addEventListener('touchmove', preventScroll, { passive: false });
    area.addEventListener('touchstart', preventScroll, { passive: false });
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
  const area = canvasArea.value;
  if (area?._dmPreventScroll) {
    area.removeEventListener('touchmove', area._dmPreventScroll);
    area.removeEventListener('touchstart', area._dmPreventScroll);
    delete area._dmPreventScroll;
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
.marking-konva-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: all;
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
  padding: 6px 12px calc(10px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 7px;
  max-height: 42vh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  pointer-events: auto;
  z-index: 5;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
@media (max-width: 600px) {
  .marking-controls-overlay {
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
  max-height: 42vh;
}
.marking-controls-overlay:not(.marking-controls-overlay--marking) {
  display: flex;
  flex-direction: column;
  height: 42vh;
  max-height: 42vh;
  min-height: 180px;
}
.dimensions-proceed {
  flex-shrink: 0;
  margin-top: 12px;
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
