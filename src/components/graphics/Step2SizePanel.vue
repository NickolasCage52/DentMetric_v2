<template>
  <div class="step2-panel quick-style-size flex flex-col min-h-0 flex-1 overflow-hidden">
    <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pt-3 pb-6">
      <!-- Quick-style geometry block: card-metallic, qc-section-title -->
      <div class="card-metallic rounded-xl step2-unified-block" style="padding: var(--qc-card-py, 12px) var(--qc-card-px, 12px)">
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <span class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest">{{ dentTotal > 1 ? `Вмятина ${dentIndex} из ${dentTotal}` : 'Геометрия повреждения' }}</span>
          <label
            v-if="showFreeStretch"
            class="step2-checkbox"
          >
            <input
              type="checkbox"
              :checked="freeStretch"
              @change="$emit('update:freeStretch', $event.target.checked)"
              class="rounded border-white/20 bg-[#151515] text-metric-green focus:ring-metric-green/50"
              :disabled="selectedDentSize?.type === 'freeform' && selectedDentSize?.isShapeFixed"
            />
            <span>Своб. растяж.</span>
          </label>
        </div>
        <div class="step2-controls-grid">
          <!-- Левая колонка: ввод размера (Quick-style qc-geo-btn) -->
          <div ref="sizesPanel" class="step2-sizes-col">
            <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Размер (мм)</div>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                :disabled="inputsDisabled"
                class="qc-geo-btn border transition-colors touch-manipulation text-left w-full"
                :class="(Number(sizeWidthMm) || 0) > 0 ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
                @click="openWidthModal"
              >
                <div class="qc-geo-label">длина</div>
                <div class="qc-geo-value flex items-center justify-between gap-1" :class="(Number(sizeWidthMm) || 0) > 0 ? 'text-metric-green' : 'text-gray-500'">
                  <span>{{ displayWidthVal ? Number(sizeWidthMm).toFixed(0) + 'мм' : '—' }}</span>
                  <span class="text-gray-500 shrink-0 text-xs">✎</span>
                </div>
              </button>
              <button
                type="button"
                :disabled="inputsDisabled"
                class="qc-geo-btn border transition-colors touch-manipulation text-left w-full"
                :class="(Number(sizeHeightMm) || 0) > 0 ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
                @click="openHeightModal"
              >
                <div class="qc-geo-label">высота</div>
                <div class="qc-geo-value flex items-center justify-between gap-1" :class="(Number(sizeHeightMm) || 0) > 0 ? 'text-metric-green' : 'text-gray-500'">
                  <span>{{ displayHeightVal ? Number(sizeHeightMm).toFixed(0) + 'мм' : '—' }}</span>
                  <span class="text-gray-500 shrink-0 text-xs">✎</span>
                </div>
              </button>
            </div>
          </div>
          <!-- Правая колонка: геометрия (форма) -->
          <div class="step2-form-col">
            <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Форма</div>
            <div class="flex items-center min-h-[40px]">
              <template v-if="selectedDentSize">
                <div
                  v-if="selectedDentSize.type === 'freeform'"
                  class="flex flex-col gap-0.5 w-full"
                >
                  <button
                    type="button"
                    class="step2-action-btn step2-shape-btn step2-shape-btn--freeform w-full px-2 py-1.5 rounded text-[11px] font-medium bg-metric-green text-black whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    Произвольная форма
                  </button>
                  <span v-if="freeformBboxHint" class="text-[8px] text-gray-500">По габаритам: {{ freeformBboxHint }}</span>
                </div>
                <div
                  v-else-if="selectedDentSize.type === 'circle'"
                  class="flex gap-0.5 p-0.5 rounded-lg bg-white/5 w-full flex-wrap"
                >
                  <button
                    type="button"
                    @click="$emit('update:shapeVariant', 'circle')"
                    class="step2-action-btn step2-shape-btn flex-1 min-w-0 px-2 py-1.5 rounded text-[11px] font-medium transition-all touch-manipulation whitespace-nowrap overflow-hidden text-ellipsis"
                    :class="shapeVariant === 'circle' ? 'bg-metric-green text-black' : 'text-gray-400 hover:text-white'"
                  >
                    Круг
                  </button>
                  <button
                    type="button"
                    @click="$emit('update:shapeVariant', 'oval')"
                    class="step2-action-btn step2-shape-btn flex-1 min-w-0 px-2 py-1.5 rounded text-[11px] font-medium transition-all touch-manipulation whitespace-nowrap overflow-hidden text-ellipsis"
                    :class="shapeVariant === 'oval' ? 'bg-metric-green text-black' : 'text-gray-400 hover:text-white'"
                  >
                    Овал
                  </button>
                </div>
                <div
                  v-else-if="selectedDentSize.type === 'strip'"
                  class="flex gap-0.5 p-0.5 rounded-lg bg-white/5 w-full flex-wrap"
                >
                  <button
                    type="button"
                    @click="$emit('update:shapeVariant', 'strip')"
                    class="step2-action-btn step2-shape-btn flex-1 min-w-0 px-2 py-1.5 rounded text-[11px] font-medium transition-all touch-manipulation whitespace-nowrap overflow-hidden text-ellipsis"
                    :class="shapeVariant === 'strip' ? 'bg-metric-green text-black' : 'text-gray-400 hover:text-white'"
                  >
                    Полоса
                  </button>
                  <button
                    type="button"
                    @click="$emit('update:shapeVariant', 'scratch')"
                    class="step2-action-btn step2-shape-btn flex-1 min-w-0 px-2 py-1.5 rounded text-[11px] font-medium transition-all touch-manipulation whitespace-nowrap overflow-hidden text-ellipsis"
                    :class="shapeVariant === 'scratch' ? 'bg-metric-green text-black' : 'text-gray-400 hover:text-white'"
                  >
                    Царапина
                  </button>
                </div>
              </template>
              <span v-else class="text-[10px] text-gray-500">Выберите вмятину</span>
            </div>
          </div>
        </div>
        <!-- Quick-style info row: площадь · соотношение · тип -->
        <div class="qc-info-rows">
          <div>Площадь: <span>{{ areaMm2 != null ? formatArea(areaMm2) + ' мм²' : '—' }}</span></div>
          <div>Соотношение сторон: <span>{{ computedRatio ?? '—' }}</span></div>
          <div>Тип формы: <span>{{ computedShapeType ?? '—' }}</span></div>
        </div>
        <div v-if="selectedDentSize?.type === 'freeform' && !selectedDentSize?.isShapeFixed" class="mt-1.5">
          <button
            type="button"
            @click="$emit('fix-freeform')"
            class="step2-action-btn w-full px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-metric-green text-black shadow-[0_0_12px_rgba(136,229,35,0.3)] active:opacity-90 whitespace-nowrap overflow-hidden text-ellipsis touch-manipulation"
          >
            Зафиксировать форму
          </button>
        </div>
      </div>
      <p v-if="!canNext" class="text-[10px] text-gray-500 text-center py-0.5">Размер повреждения должен быть больше 0</p>
    </div>
    <div v-if="!hideActionBar" class="graphics-action-bar shrink-0 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-white/10">
      <div class="flex items-center gap-2 w-full">
        <button
          type="button"
          @click="$emit('back')"
          class="step-nav-back-btn shrink-0 py-2.5 px-3 rounded-xl text-xs font-medium text-gray-400 hover:text-white border border-white/15 hover:border-white/25 transition-all touch-manipulation min-h-[44px]"
        >
          {{ dentTotal > 1 && dentIndex > 1 ? 'Пред. вмятина' : 'Назад' }}
        </button>
        <button
          type="button"
          @click="$emit('next')"
          :disabled="!canNext"
          class="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
          :class="canNext ? 'bg-metric-green text-black shadow-[0_0_15px_rgba(136,229,35,0.4)] hover:opacity-95 active:opacity-90' : 'bg-white/10 text-gray-500 cursor-not-allowed'"
        >
          <span>{{ dentTotal > 1 && dentIndex < dentTotal ? 'След. вмятина' : 'Продолжить → Условия' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, inject } from 'vue';
import { getShapeDisplayLabel } from '../../features/pricing/pricingAdapter';
import { getResolvedShapeDisplayLabel } from '../../utils/resolveDentShapeType';

const openInputModal = inject('openInputModal');

const props = defineProps({
  selectedDentSize: { type: Object, default: null },
  shapeVariant: { type: String, default: 'oval' },
  sizeWidthMm: { type: Number, default: 0 },
  sizeHeightMm: { type: Number, default: 0 },
  freeStretch: { type: Boolean, default: false },
  areaMm2: { type: Number, default: null },
  canNext: { type: Boolean, default: false },
  dentIndex: { type: Number, default: 1 },
  dentTotal: { type: Number, default: 1 },
  hideActionBar: { type: Boolean, default: false }
});

const emit = defineEmits([
  'update:shapeVariant',
  'update:freeStretch',
  'update:sizeWidthMm',
  'update:sizeHeightMm',
  'dimensions-focus',
  'fix-freeform',
  'next',
  'back'
]);
const sizesPanel = ref(null);

/** Отображаемое значение: NaN/undefined/0 → пустая строка. */
const displayWidthVal = computed(() => {
  const n = Number(props.sizeWidthMm);
  return Number.isFinite(n) && n > 0 ? props.sizeWidthMm : '';
});
const displayHeightVal = computed(() => {
  const n = Number(props.sizeHeightMm);
  return Number.isFinite(n) && n > 0 ? props.sizeHeightMm : '';
});
const showFreeStretch = computed(() => {
  if (!props.selectedDentSize) return true;
  if (props.selectedDentSize.type !== 'freeform') return true;
  return !props.selectedDentSize.isShapeFixed;
});
const inputsDisabled = computed(() => {
  if (!props.selectedDentSize) return true;
  return false;
});
const freeformBboxHint = computed(() => {
  if (props.selectedDentSize?.type !== 'freeform') return '';
  const w = Number(props.sizeWidthMm) || 0;
  const h = Number(props.sizeHeightMm) || 0;
  const label = getShapeDisplayLabel('circle', w, h);
  return label !== '—' ? label : '';
});

const computedRatio = computed(() => {
  const w = Number(props.sizeWidthMm) || 0;
  const h = Number(props.sizeHeightMm) || 0;
  if (w <= 0 || h <= 0) return null;
  const r = Math.max(w, h) / Math.min(w, h);
  return Number.isFinite(r) ? r.toFixed(2) : null;
});

const computedShapeType = computed(() => {
  const w = Number(props.sizeWidthMm) || 0;
  const h = Number(props.sizeHeightMm) || 0;
  if (w <= 0 || h <= 0) return null;
  const label = getResolvedShapeDisplayLabel(w, h);
  return label;
});

async function openWidthModal() {
  if (inputsDisabled.value) return;
  const label = 'Длина (мм)';
  const value = await openInputModal({
    title: 'Размер повреждения',
    label,
    value: props.sizeWidthMm > 0 ? props.sizeWidthMm : '',
    inputType: 'number',
    placeholder: 'мм',
    min: 0.1,
    max: 2000,
    step: 0.5
  });
  if (value !== undefined && value !== null && Number.isFinite(Number(value))) emit('update:sizeWidthMm', Number(value));
}

async function openHeightModal() {
  if (inputsDisabled.value) return;
  const label = 'Высота (мм)';
  const value = await openInputModal({
    title: 'Размер повреждения',
    label,
    value: props.sizeHeightMm > 0 ? props.sizeHeightMm : '',
    inputType: 'number',
    placeholder: 'мм',
    min: 0.1,
    max: 2000,
    step: 0.5
  });
  if (value !== undefined && value !== null && Number.isFinite(Number(value))) emit('update:sizeHeightMm', Number(value));
}

const formatArea = (v) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(v));

</script>

<style scoped>
/* Единый блок: header + 2-колоночная сетка */
.step2-unified-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 0;
}


/* 2-колоночная сетка: размер (Дл/Выс) | форма */
.step2-controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  align-items: start;
  min-height: 0;
}

.step2-sizes-col,
.step2-form-col {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* Единый размер кнопок */
.step2-action-btn {
  min-height: 40px;
  height: 40px;
  line-height: 1.2;
}

.step2-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 9px;
  color: #9aa3ad;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  white-space: nowrap;
}

.step2-checkbox input {
  width: 14px;
  height: 14px;
}

.step2-shape-btn--freeform {
  max-width: 100%;
}

/* Мобильная версия: компактнее */
@media (max-width: 480px) {
  .step2-unified-block {
    gap: 0.4rem;
  }

  .step2-controls-grid {
    gap: 0.5rem;
  }

  .step2-action-btn {
    min-height: 38px;
    height: 38px;
  }

  .step2-shape-btn {
    font-size: 10px !important;
    padding: 0.35rem 0.4rem !important;
  }
}

/* Очень узкие экраны: колонка, размер сверху */
@media (max-width: 360px) {
  .step2-controls-grid {
    grid-template-columns: 1fr;
  }

  .step2-sizes-col {
    order: 0;
  }

  .step2-form-col {
    order: 1;
  }
}
</style>
