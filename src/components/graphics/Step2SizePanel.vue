<template>
  <div class="step2-panel flex flex-col min-h-0">
    <div class="graphics-panel-content step2-panel-content p-2 space-y-1.5">
      <!-- Единый компактный блок: header | [Размер Дл/Выс] [Геометрия] -->
      <div class="step2-unified-block rounded-lg bg-black/35 border border-white/10 p-1.5">
        <div class="step-geometry__header-row">
          <span class="step-geometry__section-title">Геометрия повреждения</span>
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
          <!-- Левая колонка: ввод размера (приоритет — всегда виден на мобильном) -->
          <div ref="sizesPanel" class="step2-sizes-col">
            <div class="step-geometry__size-label">Размер (мм)</div>
            <div class="step-geometry__inputs-row">
              <div class="step-geometry__input-block">
                <label class="step-geometry__input-label">Дл.</label>
                <button
                  type="button"
                  :disabled="inputsDisabled"
                  class="step2-action-btn step2-input step-geometry__input-value w-full rounded-lg bg-white/5 border border-white/20 px-2 py-1.5 text-[13px] text-white text-left flex items-center justify-between gap-1 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  @click="openWidthModal"
                >
                  <span class="step-geometry__value-text">{{ displayWidthVal || (selectedDentSize ? '' : '—') }}</span>
                  <span class="text-gray-500 shrink-0 text-xs">✎</span>
                </button>
              </div>
              <div class="step-geometry__input-block">
                <label class="step-geometry__input-label">Выс.</label>
                <button
                  type="button"
                  :disabled="inputsDisabled"
                  class="step2-action-btn step2-input step-geometry__input-value w-full rounded-lg bg-white/5 border border-white/20 px-2 py-1.5 text-[13px] text-white text-left flex items-center justify-between gap-1 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  @click="openHeightModal"
                >
                  <span class="step-geometry__value-text">{{ displayHeightVal || (selectedDentSize ? '' : '—') }}</span>
                  <span class="text-gray-500 shrink-0 text-xs">✎</span>
                </button>
              </div>
            </div>
          </div>
          <!-- Правая колонка: геометрия (форма) -->
          <div class="step2-form-col">
            <div class="step-geometry__size-label">Форма</div>
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
        <!-- Справочная строка: площадь · соотношение · тип -->
        <div class="step-geometry__computed step-geometry__computed--compact">
          <span class="step-geometry__computed-inline">{{ areaMm2 != null ? formatArea(areaMm2) + ' мм²' : '—' }}</span>
          <span class="step-geometry__computed-sep">·</span>
          <span class="step-geometry__computed-inline">{{ computedRatio ?? '—' }}</span>
          <span class="step-geometry__computed-sep">·</span>
          <span class="step-geometry__computed-inline">{{ computedShapeType ?? '—' }}</span>
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
    <div class="graphics-action-bar wizard-step-controls space-y-2">
      <div class="flex items-center gap-2 w-full">
        <button
          type="button"
          @click="$emit('back')"
          class="step-nav-back-btn shrink-0 py-2.5 px-3 rounded-xl text-xs font-medium text-gray-400 hover:text-white border border-white/15 hover:border-white/25 transition-all touch-manipulation min-h-[44px]"
        >
          Назад
        </button>
        <button
          type="button"
          @click="$emit('next')"
          :disabled="!canNext"
          class="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 min-h-[40px]"
          :class="canNext ? 'bg-metric-green text-black shadow-[0_0_15px_rgba(136,229,35,0.4)] hover:opacity-95 active:opacity-90' : 'bg-white/10 text-gray-500 cursor-not-allowed'"
        >
          <span>Продолжить → Условия</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, inject } from 'vue';
import { classifyDamageShapeByRatio } from '../../utils/shapeClassification';

const openInputModal = inject('openInputModal');

const props = defineProps({
  selectedDentSize: { type: Object, default: null },
  shapeVariant: { type: String, default: 'oval' },
  sizeWidthMm: { type: Number, default: 0 },
  sizeHeightMm: { type: Number, default: 0 },
  freeStretch: { type: Boolean, default: false },
  areaMm2: { type: Number, default: null },
  canNext: { type: Boolean, default: false }
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
  if (w <= 0 || h <= 0) return '';
  const classified = classifyDamageShapeByRatio(w, h);
  if (classified === 'stripe') return 'Полоса';
  if (classified === 'round') return 'Круг';
  return 'Овал';
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
  const classified = classifyDamageShapeByRatio(w, h);
  if (classified === 'stripe') return 'Полоса';
  if (classified === 'round') return 'Круг';
  if (classified === 'oval') return 'Овал';
  return null;
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

.step-geometry__header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.step-geometry__section-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #88e523;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.step-geometry__size-label {
  font-size: 9px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
  line-height: 1;
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

.step-geometry__inputs-row {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  width: 100%;
}

.step-geometry__input-block {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.step-geometry__input-label {
  font-size: 8px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1;
  white-space: nowrap;
}

.step-geometry__value-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 18px;
  min-width: 0;
  flex: 1;
}

/* Единый размер кнопок */
.step2-action-btn {
  min-height: 40px;
  height: 40px;
  line-height: 1.2;
}

.step2-input {
  min-height: 40px !important;
}

/* Компактная справочная строка */
.step-geometry__computed--compact {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.35rem;
  font-size: 9px;
  color: #6b7280;
  line-height: 1.3;
}

.step-geometry__computed-inline {
  color: #e5e7eb;
  font-weight: 500;
}

.step-geometry__computed-sep {
  color: #4b5563;
  font-weight: 400;
  user-select: none;
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

/* Мобильная версия: компактнее, меньше отступы */
@media (max-width: 480px) {
  .step2-panel-content {
    padding: 0.35rem 0.5rem !important;
  }

  .step2-unified-block {
    padding: 0.5rem 0.6rem !important;
    gap: 0.4rem;
  }

  .step-geometry__header-row {
    margin-bottom: 0.2rem;
  }

  .step-geometry__section-title {
    font-size: 9px;
  }

  .step2-controls-grid {
    gap: 0.5rem;
  }

  .step-geometry__inputs-row {
    gap: 0.4rem;
  }

  .step2-action-btn {
    min-height: 38px;
    height: 38px;
  }

  .step2-input {
    min-height: 38px !important;
    padding: 0.3rem 0.4rem !important;
    font-size: 12px !important;
  }

  .step-geometry__computed--compact {
    margin-top: 0.25rem;
    font-size: 8px;
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
