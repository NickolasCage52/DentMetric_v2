<template>
  <div class="marking-screen">

    <div class="marking-canvas-area" ref="canvasArea">
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

    <div class="marking-controls" :class="{ 'marking-controls--marking': currentStep === 'marking' }">

      <div class="marking-controls__top-bar">
        <button type="button" class="dm-back-btn-sm" @click="$emit('back')">← Назад</button>
        <span class="marking-controls__step-label">
          {{ currentStep === 'marking' ? 'Разметка' : 'Размеры' }}
        </span>
        <div style="width: 64px" />
      </div>

      <DetailProgressDots
        v-if="detailSteps?.length"
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
        <div class="dimensions-header">
          <span class="dimensions-header__text">Введите размеры всех зон</span>
          <span class="dimensions-header__count">{{ filledCount }} / {{ totalCount }} заполнено</span>
        </div>

        <div class="dimensions-progress">
          <div class="dimensions-progress__fill" :style="{ width: progressPercent + '%' }" />
        </div>

        <div class="dimensions-scroll">
        <div class="dimensions-list">
          <div
            v-for="dent in dents"
            :key="dent.id"
            class="dimensions-card"
            :class="{
              filled: isDentFilled(dent),
              'dimensions-card--active': dent.index === currentEditingIndex + 1,
            }"
            @click="setActiveDent(dent.index - 1)"
          >
            <div class="dimensions-card__header" :style="{ borderLeftColor: dent.color }">
              <div class="dimensions-card__badge" :style="{ background: dent.color }">{{ dent.index }}</div>
              <span class="dimensions-card__title">Вмятина {{ dent.index }}</span>
              <span v-if="dent.index === currentEditingIndex + 1" class="dimensions-card__active-label">← редактируется</span>
              <span v-else-if="dent.dimensions" class="dimensions-card__check">✓</span>
              <span v-else class="dimensions-card__required">обязательно</span>
            </div>
            <div class="dimensions-card__fields">
              <div class="dimensions-field">
                <label>Длина (мм)</label>
                <input
                  type="number"
                  inputmode="decimal"
                  :value="dent.dimensions?.lengthMm > 0 ? dent.dimensions.lengthMm : ''"
                  @input="updateDimension(dent.id, 'length', $event)"
                  placeholder="Длина"
                  min="1"
                />
              </div>
              <div class="dimensions-field">
                <label>Ширина (мм)</label>
                <input
                  type="number"
                  inputmode="decimal"
                  :value="dent.dimensions?.widthMm > 0 ? dent.dimensions.widthMm : ''"
                  @input="updateDimension(dent.id, 'width', $event)"
                  placeholder="Ширина"
                  min="1"
                />
              </div>
            </div>

            <div v-if="dent.secondaryDeformation" class="dimensions-card dimensions-card--secondary">
              <div class="dimensions-card__header">
                <span>Вторичная деформация</span>
                <span v-if="dent.secondaryDeformation.dimensions" class="dimensions-card__check">✓</span>
                <span v-else class="dimensions-card__required">обязательно</span>
              </div>
              <div class="dimensions-card__fields">
                <div class="dimensions-field">
                  <label>Длина (мм)</label>
                  <input
                    type="number"
                    inputmode="decimal"
                    :value="dent.secondaryDeformation.dimensions?.lengthMm > 0 ? dent.secondaryDeformation.dimensions.lengthMm : ''"
                    @input="updateSecondaryDimension(dent.id, 'length', $event)"
                    placeholder="Длина"
                    min="1"
                  />
                </div>
                <div class="dimensions-field">
                  <label>Ширина (мм)</label>
                  <input
                    type="number"
                    inputmode="decimal"
                    :value="dent.secondaryDeformation.dimensions?.widthMm > 0 ? dent.secondaryDeformation.dimensions.widthMm : ''"
                    @input="updateSecondaryDimension(dent.id, 'width', $event)"
                    placeholder="Ширина"
                    min="1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

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
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import Konva from 'konva';
import { DENT_COLORS } from '../../types/detailSession';
import DetailProgressDots from './DetailProgressDots.vue';

const props = defineProps({
  detailSteps: { type: Array, default: () => [] },
  detailStepIndex: { type: Number, default: 0 },
  photoDataUrl: { type: String, default: null },
  dents: { type: Array, default: () => [] },
  currentStep: { type: String, default: 'marking' },
  selectedDentId: { type: String, default: null },
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
]);

const canvasArea = ref(null);
const photoImg = ref(null);
const konvaContainer = ref(null);

let stage = null;
let dentLayer = null;
let drawingLayer = null;
let stageInitializedForPhoto = null;

const activeMode = ref('idle');
const currentEditingIndex = ref(0);
const showResetConfirm = ref(false);
const pulseAnimations = new Map();

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
  currentEditingIndex.value = 0;
  emit('go-to-dimensions');
}

function setActiveDent(index) {
  currentEditingIndex.value = Math.max(0, Math.min(index, props.dents.length - 1));
  const activeId = props.dents[currentEditingIndex.value]?.id ?? null;
  highlightDentForEditing(activeId);
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
    const activeId = props.dents[currentEditingIndex.value]?.id ?? null;
    highlightDentForEditing(activeId);
  } else {
    updateSelectionVisuals(props.selectedDentId);
  }
  dentLayer.batchDraw();
}

watch(
  () => [props.currentStep, currentEditingIndex.value, props.dents],
  () => {
    if (!dentLayer) return;
    if (props.currentStep === 'dimensions') {
      const activeId = props.dents[currentEditingIndex.value]?.id ?? null;
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
  if (!konvaContainer.value || !photoImg.value || !props.photoDataUrl || !canvasArea.value) return;
  if (stageInitializedForPhoto === props.photoDataUrl) return;
  stageInitializedForPhoto = props.photoDataUrl;

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

    stage = new Konva.Stage({
      container,
      width: w,
      height: h,
    });
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

    stage.on('mousemove touchmove', () => {
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

function updateDimension(dentId, field, e) {
  const val = Number(e.target.value);
  const dent = props.dents.find((d) => d.id === dentId);
  if (!dent) return;
  const dims = dent.dimensions ?? { lengthMm: 0, widthMm: 0 };
  const next = { ...dims };
  if (field === 'length') next.lengthMm = val;
  else next.widthMm = val;
  emit('dimensions-set', { dentId, dims: next });
}

function updateSecondaryDimension(dentId, field, e) {
  const val = Number(e.target.value);
  const dent = props.dents.find((d) => d.id === dentId);
  if (!dent?.secondaryDeformation) return;
  const dims = dent.secondaryDeformation.dimensions ?? { lengthMm: 0, widthMm: 0 };
  const next = { ...dims };
  if (field === 'length') next.lengthMm = val;
  else next.widthMm = val;
  emit('secondary-dimensions-set', { dentId, dims: next });
}
</script>

<style scoped>
.marking-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: var(--tab-bar-height, var(--app-footer-height, var(--bottom-nav-h, 64px)));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: none;
  -webkit-overflow-scrolling: auto;
  user-select: none;
  -webkit-user-select: none;
  background: var(--dm-bg, #0f0f0f);
  z-index: 10;
}
.marking-canvas-area {
  flex: 1 1 0;
  min-height: 0;
  position: relative;
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
.marking-controls {
  flex-shrink: 0;
  background: var(--dm-surface, #161616);
  border-top: 1px solid var(--dm-border, #2a2a2a);
  padding: 8px 14px calc(10px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 7px;
  max-height: 38vh;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.marking-controls__top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.marking-controls__step-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--dm-text-primary, #fff);
}
.dm-back-btn-sm {
  min-height: 44px;
  padding: 0 10px;
  border-radius: 8px;
  background: transparent;
  color: var(--dm-text-secondary, #888);
  border: 1px solid var(--dm-border, #2a2a2a);
  font-size: 13px;
  cursor: pointer;
}
.marking-controls--marking {
  max-height: 38vh;
}
.marking-controls:not(.marking-controls--marking) {
  display: flex;
  flex-direction: column;
  height: 38vh;
  max-height: 38vh;
  min-height: 200px;
}
.dimensions-scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}
.dimensions-proceed {
  flex-shrink: 0;
  margin-top: 10px;
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
.dimensions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
  flex-shrink: 0;
}
.dimensions-header__text {
  font-size: 14px;
  font-weight: 600;
  color: var(--dm-text-primary, #fff);
}
.dimensions-header__count {
  font-size: 12px;
  color: var(--dm-text-secondary, #888);
}
.dimensions-progress {
  height: 3px;
  border-radius: 2px;
  background: var(--dm-border, #2a2a2a);
  overflow: hidden;
  flex-shrink: 0;
}
.dimensions-progress__fill {
  height: 100%;
  background: var(--dm-accent, #a0e040);
  transition: width 0.3s ease;
}
.dimensions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dimensions-card {
  background: var(--dm-surface-2, #1e1e1e);
  border-radius: 10px;
  padding: 12px;
  border-left: 3px solid var(--dm-border);
  cursor: pointer;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
}
.dimensions-card--secondary {
  border-left-color: var(--dm-danger, #e53935);
  margin-top: 8px;
}
.dimensions-card.filled {
  border-left-color: var(--dm-accent, #a0e040);
}
.dimensions-card--active {
  border-left-width: 4px;
  border-left-color: var(--dm-accent, #a0e040) !important;
  background: rgba(160, 224, 64, 0.06);
  box-shadow: 0 0 0 1px rgba(160, 224, 64, 0.2);
}
.dimensions-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: var(--dm-text-primary);
  margin-bottom: 10px;
  border-left: 3px solid transparent;
  flex-wrap: wrap;
}
.dimensions-card__badge {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #000;
  flex-shrink: 0;
}
.dimensions-card__title {
  flex: 1;
  min-width: 0;
}
.dimensions-card__active-label {
  font-size: 11px;
  color: var(--dm-accent, #a0e040);
  font-weight: 600;
  font-style: italic;
}
.dimensions-card__check {
  color: var(--dm-accent, #a0e040);
}
.dimensions-card__required {
  color: var(--dm-text-secondary, #888);
  font-weight: 400;
  font-size: 11px;
}
.dimensions-card__fields {
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}
.dimensions-field {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
}
.dimensions-field label {
  font-size: 11px;
  color: var(--dm-text-secondary, #888);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.dimensions-field input {
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  height: 44px;
  border-radius: 8px;
  border: 1.5px solid var(--dm-border, #2a2a2a);
  background: var(--dm-surface, #161616);
  color: var(--dm-text-primary, #fff);
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  padding: 0 8px;
  -webkit-appearance: none;
  appearance: none;
}
.dimensions-field input[type='number'] {
  -moz-appearance: textfield;
}
.dimensions-field input::-webkit-outer-spin-button,
.dimensions-field input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.dimensions-field input:focus {
  border-color: var(--dm-accent, #a0e040);
  outline: none;
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
