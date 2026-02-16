<template>
  <div
    ref="graphicsRoot"
    class="graphics-fullscreen-wrapper"
    :class="`graphics-step-${wizardStep}`"
    :style="matrixSafeTopStyle"
  >
    <StepHeader
      :selected-class-id="selectedClassId"
      :selected-part-id="selectedPartId"
      :car-classes="carClasses"
      :parts-list="partsList"
      :lock-selection="wizardStep >= 4"
      :show-reset="true"
      :current-step="wizardStep"
      @home="$emit('home')"
      @client="showClientInfo = true"
      @update:selected-class-id="$emit('update:selectedClassId', $event)"
      @update:selected-part-id="$emit('update:selectedPartId', $event)"
      @reset-dents="resetDentsOnly"
    />
    <!-- Hint: фиксированная высота, не влияет на позицию матрицы -->
    <div class="graphics-hint-area">
      <div
        v-if="wizardStep >= 2 && wizardStep <= 3"
        ref="hintRef"
        class="step-hint-block w-full px-2.5 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border pointer-events-none"
        :class="wizardStep === 2 ? 'border-metric-green/40' : 'border-metric-green/40'"
      >
        <p class="step-hint-text text-[12px] font-medium leading-tight text-gray-200 mb-1">
          {{ stepHintText }}
        </p>
        <div class="flex items-center justify-between text-[11px]">
          <span class="text-gray-400">Предварительно:</span>
          <span :class="basePrice > 0 ? 'text-metric-green font-bold' : 'text-gray-500'">
            {{ basePrice > 0 ? formatCurrency(roundPrice(basePrice)) + ' ₽' : '—' }}
          </span>
        </div>
      </div>
    </div>
    <!-- Stage: матрица всегда в одном месте, фиксированная позиция на всех этапах -->
    <div class="graphics-stage-area flex flex-col flex-1 min-h-0">
      <div
        id="canvas-wrapper"
        class="canvas-editor-wrap relative overflow-hidden matrix-container flex-1 min-h-0 w-full"
        style="background-color: #0b0f14"
      >
        <div ref="konvaContainer" id="konva-container" class="absolute inset-0 w-full h-full" style="background-color: #0b0f14; padding: 0; margin: 0"></div>
        <!-- Кнопка удаления вмятины на этапах 1–3 (HUD): активна только при выбранной вмятине -->
        <button
          v-if="wizardStep <= 3"
          type="button"
          class="hud-delete-btn"
          :class="{ 'hud-delete-btn--active': selectedDentSize }"
          :disabled="!selectedDentSize"
          :aria-label="selectedDentSize ? 'Удалить вмятину' : 'Выберите вмятину для удаления'"
          @click="selectedDentSize && deleteCurrent()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>
    <!-- Индикаторы этапов: фиксированная зона ниже матрицы -->
    <div class="graphics-progress-area">
      <StepDots :current-step="detailLogicalStep" :total-steps="detailTotalSteps" />
    </div>
    <!-- Controls: z-index выше stage, чтобы селекты всегда были кликабельны -->
    <div
      ref="controlsAreaRef"
      class="graphics-controls-area shrink-0 border-t border-white/10 bg-black/80 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[env(safe-area-inset-bottom,0px)]"
      :style="controlsAreaKeyboardStyle"
    >
      <Step0ClientPanel
        v-if="wizardStep === 1 && props.showClientStep"
        :model="estimateDraft"
        :client-required="clientRequired"
        :can-next="clientValid"
        @next="() => goToStep(2)"
        @back="goBack"
      />
      <Step1PlacementPanel
        v-else-if="wizardStep === 2 || (wizardStep === 1 && !props.showClientStep)"
        :can-next="dents.length >= 1"
        @add-type="openSizeMenu"
        @add-freeform="openFreeformModal"
        @next="() => goToStep(3)"
        @back="goBack"
      />
      <Step2SizePanel
        v-else-if="wizardStep === 3"
        :selected-dent-size="selectedDentSize"
        :shape-variant="selectedDentSize?.shapeVariant ?? (selectedDentSize?.type === 'circle' ? 'oval' : 'strip')"
        :size-width-mm="sizeWidthMm"
        :size-height-mm="sizeHeightMm"
        :free-stretch="freeStretchMode"
        :area-mm2="selectedDentSize?.areaMm2 ?? null"
        :can-next="dentsValid"
        @update:shape-variant="onShapeVariantChange"
        @update:free-stretch="onFreeStretchChange"
        @update:size-width-mm="onSizeWidthInput"
        @update:size-height-mm="onSizeHeightInput"
        @dimensions-focus="onDimensionsInputFocus"
        @fix-freeform="onFixFreeformShape"
        @next="() => goToStep(4)"
        @back="goBack"
      />
      <Step3ConditionsPanel
        v-else-if="wizardStep === 4"
        :model="form"
        :initial-data="initialData"
        :selected-part-name="selectedPart?.name"
        :base-price="roundPrice(basePrice)"
        :total-price="displayTotal"
        :show-info-tooltips="userSettings?.showInfoTooltips !== false"
        @back="goBack"
        @calculate="() => goToStep(5)"
      />
      <Step4SummaryPanel
        v-else-if="wizardStep === 5"
        :breakdown="breakdown"
        :total-price="displayTotal"
        :freeform-used="freeformUsed"
        :freeform-area-mm2="freeformAreaMm2"
        :history-saving="historySaving"
        :comment="estimateDraft.comment"
        @update:comment="estimateDraft.comment = $event"
        @back="goBack"
        @back-to-edit="() => goToStep(3)"
        @save="emit('save-history')"
        @reset="resetAll"
      />
    </div>
    <!-- Size menu modal -->
    <Teleport :to="sizeMenuPortalTarget" :disabled="!sizeMenuPortalTarget">
      <div
        v-if="showSizeMenu"
        class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click.self="showSizeMenu = false"
      >
        <div class="bg-[#151F2E] w-full max-w-md rounded-2xl p-5 border border-white/10 shadow-2xl space-y-4 pb-8 max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 class="text-white font-bold text-lg pl-1">
              Выберите размер ({{ activeToolType === 'circle' ? 'Круг/Овал' : 'Полоса' }})
            </h3>
            <button @click="showSizeMenu = false" class="text-gray-400 p-2 text-xl">✕</button>
          </div>
          <div class="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
            <button
              v-for="s in (activeToolType === 'circle' ? circleSizes : stripSizes)"
              :key="s.code"
              :data-testid="`size-option-${s.code}`"
              @click="confirmAddShape(s.code)"
              class="card-metallic p-3 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all hover:border-metric-green/50"
            >
              <span class="text-metric-green font-bold text-base">{{ s.code }}</span>
              <span class="text-gray-400 text-xs text-center leading-tight">{{ s.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <Teleport :to="sizeMenuPortalTarget" :disabled="!sizeMenuPortalTarget">
      <div
        v-if="showClientInfo"
        class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click.self="showClientInfo = false"
      >
        <div class="bg-[#151F2E] w-full max-w-md rounded-2xl p-5 border border-white/10 shadow-2xl space-y-3 pb-6 max-h-[85vh] overflow-y-auto">
          <div class="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 class="text-white font-bold text-lg pl-1">Данные клиента</h3>
            <button @click="showClientInfo = false" class="text-gray-400 p-2 text-xl">✕</button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openClientField('clientName', 'Имя', 'text')">
              <span class="truncate">{{ estimateDraft.clientName || 'Имя' }}</span><span class="text-gray-500 shrink-0">✎</span>
            </button>
            <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openClientField('clientCompany', 'Компания', 'text')">
              <span class="truncate">{{ estimateDraft.clientCompany || 'Компания' }}</span><span class="text-gray-500 shrink-0">✎</span>
            </button>
            <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openClientField('clientPhone', 'Тел', 'tel')">
              <span class="truncate">{{ estimateDraft.clientPhone || 'Тел' }}</span><span class="text-gray-500 shrink-0">✎</span>
            </button>
            <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openClientField('carBrand', 'Марка', 'text')">
              <span class="truncate">{{ estimateDraft.carBrand || 'Марка' }}</span><span class="text-gray-500 shrink-0">✎</span>
            </button>
            <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openClientField('carModel', 'Модель', 'text')">
              <span class="truncate">{{ estimateDraft.carModel || 'Модель' }}</span><span class="text-gray-500 shrink-0">✎</span>
            </button>
            <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openClientField('inspectDate', 'Дата', 'date')">
              <span class="truncate">{{ estimateDraft.inspectDate || 'Дата' }}</span><span class="text-gray-500 shrink-0">✎</span>
            </button>
            <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openClientField('inspectTime', 'Время', 'time')">
              <span class="truncate">{{ estimateDraft.inspectTime || 'Время' }}</span><span class="text-gray-500 shrink-0">✎</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <FreeformDrawModal
      :open="showFreeformModal"
      :canvas-size="freeformCanvasSize"
      @confirm="onFreeformConfirm"
      @cancel="closeFreeformModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount, inject } from 'vue';

const emit = defineEmits(['update:selectedClassId', 'update:selectedPartId', 'close', 'dents-change', 'home', 'save-history']);
import {
  initKonva,
  destroyKonva,
  addDent,
  addFreeformDentFromPoints,
  resetDents,
  deleteSelected,
  scheduleFit,
  setSelectedDentSizeMm,
  setDentShapeVariant,
  setKeepRatio,
  setEditable,
  setHideGridOnMobile,
  setSelectedDentFreeStretch,
  setSelectedDentShapeFixed,
  convertSelectedDentToType,
  setDisplayUnit
} from '../../graphics/konvaEditor';
import { classifyShapeByRatio } from '../../utils/shapeClassification';
import { calcBasePriceFromDents, calcTotalPrice, buildBreakdown, roundPrice } from '../../utils/priceCalc';
import { normalizeGraphicsDentsForPricing } from '../../features/pricing/pricingAdapter';
import { applyPriceRoundingCeil } from '../../utils/priceRounding';
import StepHeader from './StepHeader.vue';
import Step0ClientPanel from './Step0ClientPanel.vue';
import Step1PlacementPanel from './Step1PlacementPanel.vue';
import Step2SizePanel from './Step2SizePanel.vue';
import Step3ConditionsPanel from './Step3ConditionsPanel.vue';
import Step4SummaryPanel from './Step4SummaryPanel.vue';
import StepDots from './StepDots.vue';
import FreeformDrawModal from './FreeformDrawModal.vue';

const props = defineProps({
  form: { type: Object, required: true },
  conditionsForCalc: { type: Object, default: null },
  initialData: { type: Object, required: true },
  userSettings: { type: Object, required: true },
  carClasses: { type: Array, default: () => [] },
  partsList: { type: Array, default: () => [] },
  selectedClassId: { type: String, required: true },
  selectedPartId: { type: String, required: true },
  selectedPart: { type: Object, default: null },
  circleSizes: { type: Array, default: () => [] },
  stripSizes: { type: Array, default: () => [] },
  estimateDraft: { type: Object, required: true },
  historySaving: { type: Boolean, default: false },
  clientRequired: { type: Boolean, default: false },
  clientValid: { type: Boolean, default: true },
  showClientStep: { type: Boolean, default: true },
  autoSave: { type: Boolean, default: false }
});

const openInputModal = inject('openInputModal');

async function openClientField(field, label, inputType) {
  const value = await openInputModal({
    title: 'Данные клиента',
    label,
    value: props.estimateDraft[field] ?? '',
    inputType,
    placeholder: label
  });
  if (value !== undefined && value !== null) props.estimateDraft[field] = value;
}

const wizardStep = ref(1);

function initWizardStep() {
  if (!props.showClientStep) wizardStep.value = 2;
}
const graphicsRoot = ref(null);
const konvaContainer = ref(null);
const controlsAreaRef = ref(null);
const hintRef = ref(null);
const showSizeMenu = ref(false);
const showClientInfo = ref(false);
const activeToolType = ref(null);
const selectedDentSize = ref(null);
const sizeWidthMm = ref(0);
const sizeHeightMm = ref(0);
const freeStretchMode = ref(true);
const sizeEditAxis = ref(null);
const sizeAdjusting = ref(false);
const dents = ref([]);
const showFreeformModal = ref(false);
const freeformCanvasSize = ref({ width: 320, height: 240 });
let sizeApplyTimeout = null;
let sizeEditByUser = false;

const keyboardInset = ref(0);
let keyboardInsetRaf = null;

const MIN_SAFE_TOP = 44;
const SAFE_OVERLAP = 24;
const matrixSafeTop = ref(MIN_SAFE_TOP);
const matrixSafeTopStyle = computed(() => ({
  '--matrixSafeTop': `${matrixSafeTop.value}px`
}));
let hintObserver = null;

function updateMatrixSafeTop() {
  if (wizardStep.value <= 3) {
    if (matrixSafeTop.value !== MIN_SAFE_TOP) matrixSafeTop.value = MIN_SAFE_TOP;
    return;
  }
  const hintEl = hintRef.value;
  if (!hintEl) {
    matrixSafeTop.value = Math.max(matrixSafeTop.value, MIN_SAFE_TOP);
    return;
  }
  const height = hintEl.getBoundingClientRect().height || 0;
  const next = Math.max(MIN_SAFE_TOP, Math.round(height - SAFE_OVERLAP));
  if (next !== matrixSafeTop.value) matrixSafeTop.value = next;
}
function updateKeyboardInset() {
  if (keyboardInsetRaf) return;
  keyboardInsetRaf = requestAnimationFrame(() => {
    keyboardInsetRaf = null;
    const vv = window.visualViewport;
    const vvh = vv ? vv.height * 0.01 : window.innerHeight * 0.01;
    if (!vv) {
      keyboardInset.value = 0;
      graphicsRoot.value?.style?.setProperty('--vvh', `${vvh}px`);
      graphicsRoot.value?.style?.setProperty('--keyboard-offset', '0px');
      return;
    }
    const inset = window.innerHeight - vv.height - (vv.offsetTop || 0);
    const nextInset = Math.max(0, Math.round(inset));
    keyboardInset.value = nextInset;
    graphicsRoot.value?.style?.setProperty('--vvh', `${vvh}px`);
    graphicsRoot.value?.style?.setProperty('--keyboard-offset', `${nextInset}px`);
  });
}
let dimensionsScrollGuard = false;
function onDimensionsInputFocus(panelEl) {
  const el = panelEl?.scrollIntoView ? panelEl : panelEl?.$el;
  if (!el?.scrollIntoView) return;
  if (dimensionsScrollGuard) return;
  dimensionsScrollGuard = true;
  requestAnimationFrame(() => {
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      setTimeout(() => {
        const headerEl = graphicsRoot.value?.querySelector('.graphics-header');
        const hintEl = hintRef.value;
        const actionBarEl = graphicsRoot.value?.querySelector('.graphics-action-bar');
        const headerH = headerEl?.getBoundingClientRect().height || 0;
        const hintH = hintEl?.getBoundingClientRect().height || 0;
        const actionBarH = actionBarEl?.getBoundingClientRect().height || 0;
        const keyboardH = keyboardInset.value || 0;
        const offset = Math.round(headerH + hintH + actionBarH + Math.max(12, keyboardH * 0.6));
        window.scrollBy({ top: -offset, left: 0, behavior: 'smooth' });
      }, 180);
      setTimeout(() => { dimensionsScrollGuard = false; }, 900);
    }, 150);
  });
}

const controlsAreaKeyboardStyle = computed(() => ({
  '--keyboard-offset': `${keyboardInset.value}px`
}));

const sizeMenuPortalTarget = computed(() => {
  if (graphicsRoot.value) return graphicsRoot.value;
  return typeof document !== 'undefined' ? document.body : null;
});

const detailTotalSteps = computed(() => props.showClientStep ? 5 : 4);
const detailLogicalStep = computed(() => props.showClientStep ? wizardStep.value : Math.max(1, wizardStep.value - 1));
const dentsForPricing = computed(() => {
  const ctx = {
    circleSizes: props.circleSizes,
    stripSizes: props.stripSizes,
    prices: props.userSettings.prices,
    initialData: props.initialData
  };
  return normalizeGraphicsDentsForPricing(dents.value, ctx);
});
const basePrice = computed(() => calcBasePriceFromDents(dentsForPricing.value));
const conditionsForCalc = computed(() => props.conditionsForCalc || props.form);
const totalPrice = computed(() =>
  calcTotalPrice(dentsForPricing.value, conditionsForCalc.value, props.initialData, props.userSettings?.priceRoundStep ?? 0)
);
const displayTotal = computed(() =>
  applyPriceRoundingCeil(totalPrice.value, props.userSettings?.priceRoundStep ?? 0)
);
const breakdown = computed(() => {
  const sizeCode = dentsForPricing.value?.[0]?.sizeCode ?? 'STRIP_DEFAULT';
  const items = buildBreakdown(basePrice.value, conditionsForCalc.value, props.initialData, sizeCode);
  props.estimateDraft.breakdown = items;
  return items;
});
const freeformUsed = computed(() => dents.value?.some((d) => d?.type === 'freeform'));
const freeformAreaMm2 = computed(() => dents.value.reduce((sum, d) => {
  if (d?.type !== 'freeform') return sum;
  const area = Number(d?.areaMm2);
  return sum + (Number.isFinite(area) ? area : 0);
}, 0));
const dentsValid = computed(() => {
  if (dents.value.length === 0) return false;
  if (!selectedDentSize.value) return true;
  const w = Number(sizeWidthMm.value);
  const h = Number(sizeHeightMm.value);
  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0;
});

const stepHintText = computed(() => {
  switch (wizardStep.value) {
    case 2:
      return 'Выберите деталь. Добавьте вмятины и перетащите на место.';
    case 3:
      return 'Размер повреждения в мм. Геометрия: круг/овал или полоса/царапина.';
    default:
      return '';
  }
});

watch(selectedDentSize, (info, oldInfo) => {
  if (info) {
    const w = Number(info.widthMm);
    const h = Number(info.heightMm);
    sizeWidthMm.value = Number.isFinite(w) && w > 0 ? Math.round(w * 10) / 10 : 0;
    sizeHeightMm.value = Number.isFinite(h) && h > 0 ? Math.round(h * 10) / 10 : 0;
    if (info.type === 'freeform') {
      freeStretchMode.value = !!info.freeStretchEnabled;
    }
  }
  sizeEditByUser = false;
  const panelToggled = (info && !oldInfo) || (!info && oldInfo);
  if (panelToggled) nextTick(() => setTimeout(() => scheduleFit('controls-resize'), 50));
}, { immediate: true });

watch([sizeWidthMm, sizeHeightMm], () => {
  if (!selectedDentSize.value) return;
  if (!sizeEditByUser) return;
  if (sizeAdjusting.value) return;
  if (sizeApplyTimeout) clearTimeout(sizeApplyTimeout);
  sizeApplyTimeout = setTimeout(() => {
    let w = Number(sizeWidthMm.value);
    let h = Number(sizeHeightMm.value);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      sizeEditByUser = false;
      sizeApplyTimeout = null;
      return;
    }
    const isFreeform = selectedDentSize.value?.type === 'freeform';
    const shouldKeepRatio = isFreeform && (selectedDentSize.value?.isShapeFixed || !selectedDentSize.value?.freeStretchEnabled);
    if (shouldKeepRatio) {
      const ratio = Number(selectedDentSize.value?.fixedAspectRatio) || (h ? w / h : null);
      if (ratio && ratio > 0) {
        if (sizeEditAxis.value === 'width') {
          h = w / ratio;
        } else if (sizeEditAxis.value === 'height') {
          w = h * ratio;
        }
        sizeAdjusting.value = true;
        sizeWidthMm.value = Math.round(w * 10) / 10;
        sizeHeightMm.value = Math.round(h * 10) / 10;
        sizeAdjusting.value = false;
      }
    }
    const cur = selectedDentSize.value;
    if (cur && Math.abs(cur.widthMm - w) < 0.01 && Math.abs(cur.heightMm - h) < 0.01) {
      sizeEditByUser = false;
      sizeApplyTimeout = null;
      return;
    }
    const curType = cur?.type;
    setSelectedDentSizeMm(w, h);
    if (curType && curType !== 'freeform') {
      const classified = classifyShapeByRatio({ widthMm: w, heightMm: h });
      const targetType = classified === 'stripe' ? 'strip' : 'circle';
      if (curType !== targetType) convertSelectedDentToType(targetType);
    }
    sizeEditByUser = false;
    sizeApplyTimeout = null;
  }, 150);
});

watch(dents, (val) => {
  emit('dents-change', val);
  if (wizardStep.value === 3 && val.length === 0) {
    goToStep(2);
  }
}, { deep: true });

watch(wizardStep, (step, prev) => {
  if (props.autoSave && step === 5 && prev === 4 && totalPrice.value > 0 && !props.historySaving) {
    nextTick(() => emit('save-history'));
  }
});

/**
 * Кнопка "Назад" в шапке.
 * Step 1: закрыть графический режим.
 * Step 2: → Step 1 (вмятины остаются, editable остаётся).
 * Step 3: → Step 2 (условия не сбрасывать, editable=true).
 * Step 4: → Step 3.
 */
function goBack() {
  switch (wizardStep.value) {
    case 1:
      emit('close');
      break;
    case 2:
      if (props.showClientStep) goToStep(1);
      else emit('close');
      break;
    case 3:
      goToStep(2);
      break;
    case 4:
      goToStep(3);
      break;
    case 5:
      goToStep(4);
      break;
    default:
      goToStep(1);
  }
}

/**
 * Переход на шаг. Step 1–2: editable=true, Step 3–4: editable=false.
 * Контроль editable — в watch(wizardStep).
 */
function goToStep(step) {
  wizardStep.value = step;
}

/**
 * Сброс только вмятин и шага (данные клиента в estimateDraft не трогаем).
 * Вызывается из App при нажатии «Сброс вмятин».
 */
function resetDentsOnly() {
  if (dents.value.length > 0 && !confirm('Сбросить вмятины и расчёт? Данные клиента сохранятся.')) return;
  if (sizeApplyTimeout) {
    clearTimeout(sizeApplyTimeout);
    sizeApplyTimeout = null;
  }
  resetDents();
  dents.value = [];
  selectedDentSize.value = null;
  sizeWidthMm.value = 0;
  sizeHeightMm.value = 0;
  dimensionsScrollGuard = false;
  activeToolType.value = null;
  freeStretchMode.value = true;
  setKeepRatio(false);
  showSizeMenu.value = false;
  props.form.repairCode = null;
  props.form.riskCode = null;
  props.form.materialCode = null;
  props.form.carClassCode = null;
  props.form.disassemblyCode = null;
  props.form.paintMaterialCode = null;
  props.form.soundInsulationCode = null;
  initWizardStep();
  emit('dents-change', []);
}

/**
 * Полный сброс: wizardStep=1, все вмятины, условия, цены, UI-флаги.
 * Состояние как при первом заходе в графический режим.
 */
function resetAll() {
  if (dents.value.length > 0 && !confirm('Сбросить все вмятины и начать заново?')) return;
  resetDentsOnly();
}

function openSizeMenu(type) {
  activeToolType.value = type;
  showSizeMenu.value = true;
}

function confirmAddShape(sizeCode) {
  if (!props.selectedPart) return;
  showSizeMenu.value = false;
  const type = activeToolType.value;
  const sizes = type === 'circle' ? props.circleSizes : props.stripSizes;
  addDent(type, sizeCode, sizes);
}

function deleteCurrent() {
  deleteSelected();
}

function onShapeVariantChange(variant) {
  setDentShapeVariant(variant);
}

function onFreeStretchChange(checked) {
  if (selectedDentSize.value?.type === 'freeform') {
    setSelectedDentFreeStretch(!!checked);
    freeStretchMode.value = !!checked;
    return;
  }
  setKeepRatio(!checked);
}

function onSizeWidthInput(val) {
  sizeEditByUser = true;
  sizeEditAxis.value = 'width';
  sizeWidthMm.value = val;
}

function onSizeHeightInput(val) {
  sizeEditByUser = true;
  sizeEditAxis.value = 'height';
  sizeHeightMm.value = val;
}

function onFixFreeformShape() {
  setSelectedDentShapeFixed();
}

function updateFreeformCanvasSize() {
  const rect = konvaContainer.value?.getBoundingClientRect?.();
  if (!rect?.width || !rect?.height) {
    freeformCanvasSize.value = { width: 320, height: 240 };
    return;
  }
  freeformCanvasSize.value = { width: Math.round(rect.width), height: Math.round(rect.height) };
}

function openFreeformModal() {
  updateFreeformCanvasSize();
  showFreeformModal.value = true;
}

function closeFreeformModal() {
  showFreeformModal.value = false;
}

function onFreeformConfirm(points) {
  if (!Array.isArray(points) || points.length < 3) {
    closeFreeformModal();
    return;
  }
  addFreeformDentFromPoints(points, props.circleSizes);
  closeFreeformModal();
}

const formatCurrency = (v) => new Intl.NumberFormat('ru-RU').format(v);

const initKonvaEditor = async () => {
  if (!konvaContainer.value || !props.selectedPart) return;
  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '';
  await initKonva(
    konvaContainer.value,
    props.selectedPart,
    props.userSettings.prices,
    (newDents) => {
      dents.value = newDents;
      emit('dents-change', newDents);
    },
    baseUrl,
    (info) => { selectedDentSize.value = info; }
  );
  /* Применить текущий шаг (draggable формы vs handle) после init */
  setEditable(wizardStep.value >= 2 && wizardStep.value <= 3, wizardStep.value);
  setDisplayUnit(props.userSettings?.sizeUnit || 'mm');
  updateMobileGrid();
  /* Повторный fit после layout: контейнер мог иметь 0 размер при init */
  nextTick(() => setTimeout(() => scheduleFit('init-layout'), 150));
};

function updateMobileGrid() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 480;
  setHideGridOnMobile(isMobile);
}

watch(
  () => wizardStep.value,
  (step) => {
    nextTick(() => {
      updateMatrixSafeTop();
      setEditable(step >= 2 && step <= 3, step);
      updateMobileGrid();
      if (step === 3) {
        setKeepRatio(!freeStretchMode.value);
        setTimeout(() => scheduleFit('step2-show'), 200);
      }
      if (step >= 4) {
      }
      if (step >= 4) setTimeout(() => scheduleFit('resize'), 150);
    });
  },
  { immediate: true }
);

watch(() => hintRef.value, (el) => {
  if (hintObserver) {
    hintObserver.disconnect();
    hintObserver = null;
  }
  if (el) {
    hintObserver = new ResizeObserver(() => updateMatrixSafeTop());
    hintObserver.observe(el);
  }
  nextTick(() => updateMatrixSafeTop());
});

watch(
  () => props.userSettings?.sizeUnit,
  (unit) => {
    if (unit) setDisplayUnit(unit);
  }
);

watch(
  () => [props.selectedClassId, props.selectedPartId, props.selectedPart],
  (newVal, oldVal) => {
    /* При смене элемента кузова или класса — полный сброс, новый расчёт */
    const partChanged = oldVal && (newVal[1] !== oldVal[1] || newVal[0] !== oldVal[0]);
    if (partChanged) {
      resetAll();
    }
    nextTick(() => setTimeout(initKonvaEditor, 50));
  },
  { deep: true }
);

onMounted(() => {
  initWizardStep();
  nextTick(() => setTimeout(initKonvaEditor, 100));
  updateMobileGrid();
  window.addEventListener('resize', updateMobileGrid);
  window.addEventListener('resize', updateMatrixSafeTop);
  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', updateKeyboardInset);
    vv.addEventListener('scroll', updateKeyboardInset);
    updateKeyboardInset();
  }
  updateKeyboardInset();
  updateMatrixSafeTop();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMobileGrid);
  window.removeEventListener('resize', updateMatrixSafeTop);
  const vv = window.visualViewport;
  if (vv) {
    vv.removeEventListener('resize', updateKeyboardInset);
    vv.removeEventListener('scroll', updateKeyboardInset);
  }
  if (hintObserver) {
    hintObserver.disconnect();
    hintObserver = null;
  }
  destroyKonva();
});

defineExpose({ resetDentsOnly });
</script>

<style scoped>
/* Layout графики: fullscreen overlay, матрица занимает максимум */
.graphics-fullscreen-wrapper {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  min-height: 100dvh;
  max-height: 100dvh;
  width: 100vw;
  max-width: none;
  overflow: hidden;
  padding: 0 0 var(--app-footer-height, 0px) 0;
  margin: 0;
  background: #000;
  --bottomH: 34%;
  --matrixSafeTop: 60px;
  --matrixHeight: auto;
  --actionbar-height: calc(112px + env(safe-area-inset-bottom, 0px) + var(--app-footer-height, 0px));
  --controlsMaxH: clamp(230px, 28vh, 340px);
}

/* Верхняя панель: flex 0 0 auto, safe area */
.graphics-header {
  flex: 0 0 auto;
  padding-top: env(safe-area-inset-top, 0);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
}

/* Подсказка: фиксированная высота, отдельный слой над матрицей */
.graphics-hint-area {
  position: relative;
  flex: 0 0 0;
  min-height: 0;
  max-height: 0;
  padding: 0;
  z-index: 20;
}

/* Индикаторы этапов: фиксированная зона между матрицей и управлением */
.graphics-progress-area {
  flex: 0 0 32px;
  min-height: 32px;
  max-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: max(0.5rem, env(safe-area-inset-left));
  padding-right: max(0.5rem, env(safe-area-inset-right));
}

/* Матрица: фиксированная доля экрана, не меняется между этапами */
.graphics-stage-area {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: none;
  padding: 0;
  margin: 0;
  overflow: hidden;
  padding-top: var(--matrixSafeTop);
  box-sizing: border-box;
}

/* Контейнер Konva: width 100vw, без max-width, padding 0 */
.matrix-container {
  width: 100vw;
  max-width: none;
  padding: 0;
  margin: 0;
}

.graphics-stage-area .canvas-editor-wrap {
  flex: 1 1 0;
  min-height: 120px;
}

/* Нижняя панель: фиксированная доля экрана — одинаковая высота на этапах 1 и 2, без прыжков матрицы */
.graphics-controls-area {
  position: relative;
  flex: 0 0 auto;
  min-height: 0;
  max-height: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Кнопка удаления вмятины на HUD (этап 1) */
.hud-delete-btn {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  background: rgba(20, 20, 20, 0.85);
  color: #88e523;
  opacity: 0.35;
  filter: grayscale(1);
  cursor: default;
  pointer-events: none;
  transition: opacity 0.2s, filter 0.2s, background 0.2s;
}

@media (max-width: 480px) {
  .hud-delete-btn {
    right: 8px;
    bottom: 8px;
  }
  /* Мобильные: фиксированная доля для стабильной высоты матрицы */
  .graphics-controls-area {
    flex: 0 0 var(--bottomH);
    min-height: 140px;
    max-height: var(--bottomH);
  }
}

.hud-delete-btn--active {
  opacity: 1;
  filter: none;
  cursor: pointer;
  pointer-events: auto;
}

.hud-delete-btn--active:hover {
  background: rgba(30, 30, 30, 0.95);
  border-color: rgba(136, 229, 35, 0.4);
}

.hud-delete-btn--active:active {
  transform: scale(0.96);
}

/* Подсказка этапа: читабельный шрифт, без наложения */
.step-hint-block {
  max-width: min(90%, 520px);
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 6px;
}
.step-hint-text {
  word-wrap: break-word;
  hyphens: auto;
}

.graphics-step-2 .graphics-controls-area,
.graphics-step-3 .graphics-controls-area {
  flex: 0 0 auto;
  min-height: 0;
  height: var(--controlsMaxH);
  max-height: var(--controlsMaxH);
}

.graphics-step-2 :deep(.graphics-panel-content),
.graphics-step-3 :deep(.graphics-panel-content) {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  overflow: visible;
}

.graphics-step-1 .graphics-stage-area,
.graphics-step-4 .graphics-stage-area {
  display: none;
}

.graphics-step-1 .graphics-controls-area {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  height: auto;
  border-top: none;
}

/* Этап 4 (условия и коэффициенты): контент по высоте без пустого чёрного полотна, кнопки вплотную к контенту и к меню */
.graphics-step-4 .graphics-controls-area {
  flex: 1 1 0;
  min-height: 0;
  max-height: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0;
}
.graphics-step-4 :deep(.step3-panel) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  justify-content: flex-start;
  /* Критично: без min-height:0 flex-ребёнок не сожмётся и скролл не появится */
}
/* Область контента — занимает всё место до кнопок, скролл внутри; min-height:0 критично для flex+scroll */
.graphics-step-4 :deep(.step3-params-wrap) {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: scroll;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  display: flex;
  flex-direction: column;
}
.graphics-step-4 :deep(.step3-scroll-wrap) {
  flex: 0 0 auto;
  padding-bottom: 1.25rem;
}
.graphics-step-4 :deep(.graphics-action-bar) {
  flex-shrink: 0;
  margin-top: 0;
  padding-top: 0.5rem;
  padding-bottom: 0.25rem;
  background: transparent;
}

.graphics-step-1 :deep(.graphics-panel-content) {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  overflow: visible;
}
/* Step 4: panel content = step3-params-wrap, overflow-y:scroll нужен для скролла — не перезаписываем overflow */
.graphics-step-4 :deep(.graphics-panel-content) {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
}


.graphics-step-1 .graphics-hint-area,
.graphics-step-4 .graphics-hint-area {
  flex: 0 0 0;
  min-height: 0;
  max-height: 0;
  padding: 0;
}

.graphics-step-5 .graphics-stage-area {
  flex: 0 0 22%;
  min-height: 90px;
  max-height: 22%;
}

.graphics-step-5 .graphics-controls-area {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  height: auto;
}


.graphics-step-5 .graphics-hint-area {
  flex: 0 0 0;
  min-height: 0;
  max-height: 0;
  padding: 0;
}

.graphics-step-5 {
  --actionbar-height: calc(160px + env(safe-area-inset-bottom, 0px) + var(--app-footer-height, 0px));
}

.graphics-step-5 :deep(.graphics-panel-content) {
  padding-bottom: calc(var(--actionbar-height) + 8px);
}

:deep(.graphics-panel-content) {
  padding-bottom: var(--actionbar-height);
}

:deep(.graphics-action-bar) {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  padding: 0.5rem 0.5rem calc(0.5rem + env(safe-area-inset-bottom, 0px));
  background: rgba(10, 12, 16, 0.85);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

:deep(.actionbar-total-btn) {
  width: 100%;
  min-height: 44px;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: opacity 0.2s ease;
}

:deep(.actionbar-total-btn--active) {
  background: #88e523;
  color: #000;
  box-shadow: 0 0 15px rgba(136, 229, 35, 0.35);
}

:deep(.actionbar-total-btn--idle) {
  background: rgba(255, 255, 255, 0.08);
  color: #9aa3ad;
  cursor: default;
}
</style>
