<template>
  <div class="quick-style-step2 qc-compact" style="display:flex;flex-direction:column;gap:var(--qc-section-gap)">
    <div class="mb-2 flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">ПОВРЕЖДЕНИЯ</div>
        <div class="flex gap-1.5 flex-wrap items-center">
          <button
            v-for="(d, i) in dents"
            :key="d.id"
            type="button"
            class="dent-chip px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation"
            :class="String(activeDentId) === String(d.id) ? 'bg-metric-green text-black' : 'bg-white/10 text-gray-400 hover:bg-white/15 hover:text-white border border-white/10'"
            @click="$emit('set-active', d.id)"
          >
            Вмятина {{ i + 1 }}
          </button>
          <button
            v-if="!hideAddRemove && dents.length > 1"
            type="button"
            data-testid="quick-remove-dent"
            class="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-all touch-manipulation"
            aria-label="Удалить повреждение"
            @click="$emit('remove-active')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>
      <div v-if="!hideAddRemove" class="flex flex-col items-center gap-2 shrink-0 self-start">
        <button
          v-if="!hideReset"
          type="button"
          class="client-reset-btn qc-reset-btn"
          data-testid="quick-reset-dents"
          @click="$emit('reset')"
          aria-label="Сбросить введённые значения"
        >
          СБРОС
        </button>
        <button
          type="button"
          data-testid="quick-add-dent"
          class="px-3 py-1.5 rounded-lg text-xs font-bold bg-metric-green/20 text-metric-green border border-metric-green/40 hover:bg-metric-green/30 transition-all touch-manipulation"
          aria-label="Добавить повреждение"
          @click="$emit('add-dent')"
        >
          +
        </button>
      </div>
    </div>
    <div v-if="!activeDent" class="card-metallic rounded-2xl p-5 text-center text-gray-400">
      Повреждение не выбрано
    </div>
    <template v-else>
      <!-- 1. СТОРОНА АВТОМОБИЛЯ -->
      <div v-if="!hidePanelSide" style="padding:0 2px">
        <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">СТОРОНА АВТОМОБИЛЯ</div>
        <SegmentedControl
          :model-value="activeDent.panelSide || 'left'"
          :options="[{ value: 'left', label: 'ЛЕВАЯ' }, { value: 'top', label: 'ВЕРХ' }, { value: 'right', label: 'ПРАВАЯ' }]"
          @update:modelValue="$emit('update-panel-side', $event)"
        />
      </div>
      <!-- 2. ПОВРЕЖДЕННЫЙ ЭЛЕМЕНТ -->
      <div v-if="!hidePanelElement" style="padding:0 2px">
        <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">ПОВРЕЖДЕННЫЙ ЭЛЕМЕНТ</div>
        <button
          type="button"
          data-testid="quick-panel-element"
          class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
          :class="activeDent.panelElement ? 'bg-[#1a1a1a] border-white/15 text-white' : 'bg-[#151515] border-white/10 text-gray-200 hover:border-white/15'"
          @click="onOpenPanelElementPicker"
        >
          <span class="qc-sr-value text-[13px] font-semibold truncate">{{ activeDent.panelElement || 'Выбрать элемент' }}</span>
          <div class="shrink-0 flex items-center gap-1.5">
            <svg v-if="activeDent.panelElement" class="w-4 h-4 text-metric-green/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="getElementIconPath(activeDent.panelElement)" /></svg>
            <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </button>
      </div>
      <!-- 3. ГЕОМЕТРИЯ -->
      <div class="card-metallic rounded-xl" style="padding:var(--qc-card-py) var(--qc-card-px)">
        <div class="flex items-center justify-between mb-1.5">
          <span class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest">ГЕОМЕТРИЯ ПОВРЕЖДЕНИЯ</span>
          <button type="button" class="qc-preset-chip" data-testid="quick-presets" @click="presetsModalOpen = true">ПРЕСЕТЫ</button>
        </div>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            class="qc-geo-btn border transition-colors touch-manipulation text-left"
            :class="(Number(activeDent.sizeLengthMm) || 0) > 0 ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="onOpenSizeModal('sizeLengthMm', 'Длина (мм)')"
          >
            <div class="qc-geo-label">длина</div>
            <div class="qc-geo-value" :class="(Number(activeDent.sizeLengthMm) || 0) > 0 ? 'text-metric-green' : 'text-gray-500'">
              {{ (Number(activeDent.sizeLengthMm) || 0) > 0 ? Number(activeDent.sizeLengthMm).toFixed(0) + 'мм' : '—' }}
            </div>
          </button>
          <button
            type="button"
            class="qc-geo-btn border transition-colors touch-manipulation text-left"
            :class="(Number(activeDent.sizeWidthMm) || 0) > 0 ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="onOpenSizeModal('sizeWidthMm', 'Высота (мм)')"
          >
            <div class="qc-geo-label">ширина</div>
            <div class="qc-geo-value" :class="(Number(activeDent.sizeWidthMm) || 0) > 0 ? 'text-metric-green' : 'text-gray-500'">
              {{ (Number(activeDent.sizeWidthMm) || 0) > 0 ? Number(activeDent.sizeWidthMm).toFixed(0) + 'мм' : '—' }}
            </div>
          </button>
        </div>
        <div class="qc-info-rows">
          <div>Площадь: <span>{{ (Number(activeDent.sizeLengthMm) || 0) > 0 && (Number(activeDent.sizeWidthMm) || 0) > 0 ? ((Number(activeDent.sizeLengthMm) || 0) * (Number(activeDent.sizeWidthMm) || 0)).toFixed(1) : '—' }}</span></div>
          <div>Соотношение сторон: <span>{{ (Number(activeDent.sizeLengthMm) || 0) > 0 && (Number(activeDent.sizeWidthMm) || 0) > 0 ? (Math.max(Number(activeDent.sizeLengthMm), Number(activeDent.sizeWidthMm)) / Math.min(Number(activeDent.sizeLengthMm), Number(activeDent.sizeWidthMm))).toFixed(1) : '—' }}</span></div>
          <div>Тип формы: <span>{{ (Number(activeDent.sizeLengthMm) || 0) > 0 && (Number(activeDent.sizeWidthMm) || 0) > 0 ? getShapeLabel(activeDent) : '—' }}</span></div>
        </div>
      </div>
      <!-- 4. ПАРАМЕТРЫ РАСЧЁТА -->
      <div class="card-metallic rounded-xl" style="padding:var(--qc-card-py) var(--qc-card-px)">
        <div class="qc-section-title text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">ПАРАМЕТРЫ РАСЧЁТА</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          <button
            type="button"
            data-testid="quick-param-repair"
            class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
            :class="activeDent.conditions?.repairCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="onOpenParamPicker('repairCode', 'Технология ремонта', initialData.repairTypes)"
          >
            <div class="min-w-0 flex-1">
              <div class="qc-sr-value text-[12px] font-semibold truncate" :class="activeDent.conditions?.repairCode ? 'text-white' : 'text-gray-400'">{{ getRepairLabel(activeDent.conditions?.repairCode) || 'Метод ремонта' }}</div>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <div v-if="activeDent.conditions?.repairCode" class="w-3 h-3 rounded-full bg-metric-green/80" aria-hidden="true"></div>
              <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
          <button
            type="button"
            data-testid="quick-param-risk"
            class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
            :class="activeDent.conditions?.riskCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="onOpenParamPicker('riskCode', 'Сложность выполнения', initialData.risks)"
          >
            <div class="min-w-0 flex-1">
              <div class="qc-sr-value text-[12px] font-semibold truncate" :class="activeDent.conditions?.riskCode ? 'text-white' : 'text-gray-400'">{{ getRiskLabel(activeDent.conditions?.riskCode) || 'Сложность выполнения' }}</div>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <div v-if="activeDent.conditions?.riskCode" class="w-3 h-3 rounded-full bg-metric-green/80" aria-hidden="true"></div>
              <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
          <button
            type="button"
            data-testid="quick-param-material"
            class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
            :class="activeDent.conditions?.materialCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="onOpenParamPicker('materialCode', 'Материал панели', initialData.materials)"
          >
            <div class="min-w-0 flex-1">
              <div class="qc-sr-value text-[12px] font-semibold truncate" :class="activeDent.conditions?.materialCode ? 'text-white' : 'text-gray-400'">{{ getMaterialLabel(activeDent.conditions?.materialCode) || 'Материал панели' }}</div>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <div v-if="activeDent.conditions?.materialCode" class="w-3 h-3 rounded-full bg-metric-green/80" aria-hidden="true"></div>
              <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
          <button
            type="button"
            data-testid="quick-param-carclass"
            class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
            :class="activeDent.conditions?.carClassCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="onOpenParamPicker('carClassCode', 'Класс автомобиля', initialData.carClasses)"
          >
            <div class="min-w-0 flex-1">
              <div class="qc-sr-value text-[12px] font-semibold truncate" :class="activeDent.conditions?.carClassCode ? 'text-white' : 'text-gray-400'">{{ getCarClassLabel(activeDent.conditions?.carClassCode) || 'Класс автомобиля' }}</div>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <div v-if="activeDent.conditions?.carClassCode" class="w-3 h-3 rounded-full bg-metric-green/80" aria-hidden="true"></div>
              <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
        </div>
      </div>
      <!-- 5. ДОПОЛНИТЕЛЬНО -->
      <div class="card-metallic rounded-xl" style="padding:var(--qc-card-py) var(--qc-card-px)">
        <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">ДОПОЛНИТЕЛЬНО…</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          <button
            type="button"
            data-testid="quick-armaturnaya"
            class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
            :class="(activeDent.conditions?.disassemblyCodes?.length ?? 0) > 0 ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="onOpenArmaturePicker"
          >
            <div class="min-w-0 flex-1">
              <div class="qc-sr-value text-[12px] font-semibold truncate" :class="(activeDent.conditions?.disassemblyCodes?.length ?? 0) > 0 ? 'text-white' : 'text-gray-400'">{{ formatArmaturnayaSummary(activeDent.conditions?.disassemblyCodes, activeDent.panelElement) || 'Арматурные работы' }}</div>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
          <button
            v-if="showPaintMaterial"
            type="button"
            data-testid="quick-param-paint"
            class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
            :class="activeDent.conditions?.paintMaterialCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="onOpenPaintPicker"
          >
            <div class="min-w-0 flex-1">
              <div class="qc-sr-value text-[12px] font-semibold truncate" :class="activeDent.conditions?.paintMaterialCode ? 'text-white' : 'text-gray-400'">{{ getPaintLabel(activeDent.conditions?.paintMaterialCode) || 'Материал ЛКП' }}</div>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <div v-if="activeDent.conditions?.paintMaterialCode" class="w-3 h-3 rounded-full bg-metric-green/80" aria-hidden="true"></div>
              <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
          <button
            v-if="showSoundInsulation"
            type="button"
            class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
            :class="activeDent?.conditions?.soundInsulationCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="onOpenSoundPicker"
          >
            <div class="min-w-0 flex-1">
              <div class="qc-sr-value text-[12px] font-semibold truncate" :class="activeDent?.conditions?.soundInsulationCode ? 'text-white' : 'text-gray-400'">{{ getSoundLabel(activeDent?.conditions?.soundInsulationCode) || 'Шумоизоляция' }}</div>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <div v-if="activeDent?.conditions?.soundInsulationCode" class="w-3 h-3 rounded-full bg-metric-green/80" aria-hidden="true"></div>
              <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
        </div>
      </div>
    </template>
    <PresetsModal v-model="presetsModalOpen" @select="onPresetSelected" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { inject } from 'vue';
import SegmentedControl from '../ui/SegmentedControl.vue';
import PresetsModal from '../PresetsModal.vue';
import { getElementIconPath } from '../../utils/elementIcons';
import { getResolvedShapeDisplayLabel } from '../../utils/resolveDentShapeType';
import { formatArmaturnayaSummary, getArmaturnayaWorksForElement } from '../../data/armaturnayaWorks';
import { normalizeArmatureWorkIds, toggleArmatureWorkIds } from '../../utils/armatureSelection';

const ELEMENTS_TOP = ['Капот', 'Крыша', 'Крышка багажника'];
const ELEMENTS_SIDE = ['Переднее крыло', 'Передняя дверь', 'Задняя дверь', 'Заднее крыло', 'Стойка крыши', 'Порог', 'Бампер'];

const props = defineProps({
  activeDent: { type: Object, default: null },
  activeDentId: { type: [String, Number, null], default: null },
  dents: { type: Array, default: () => [] },
  initialData: { type: Object, required: true },
  userSettings: { type: Object, default: () => ({}) },
  selectedPartName: { type: String, default: null },
  hideAddRemove: { type: Boolean, default: false },
  hideReset: { type: Boolean, default: false },
  hidePanelSide: { type: Boolean, default: false },
  hidePanelElement: { type: Boolean, default: false }
});

const emit = defineEmits(['set-active', 'add-dent', 'remove-active', 'reset', 'update-size', 'update-conditions', 'update-panel-element', 'update-panel-side', 'preset-selected']);

const openInputModal = inject('openInputModal');
const openSelectModal = inject('openSelectModal');

const presetsModalOpen = ref(false);

const showPaintMaterial = computed(() => props.userSettings?.showPaintMaterial !== false);
const showSoundInsulation = computed(() => props.userSettings?.showSoundInsulation !== false);

function getElementsForSide(side) {
  return side === 'top' ? ELEMENTS_TOP : ELEMENTS_SIDE;
}

function getShapeLabel(dent) {
  const w = Number(dent?.sizeLengthMm) || 0;
  const h = Number(dent?.sizeWidthMm) || 0;
  return getResolvedShapeDisplayLabel(w, h);
}

function getRepairLabel(c) { return (props.initialData?.repairTypes || []).find((r) => r.code === c)?.name || ''; }
function getRiskLabel(c) { return (props.initialData?.risks || []).find((r) => r.code === c)?.name || ''; }
function getMaterialLabel(c) { return (props.initialData?.materials || []).find((m) => m.code === c)?.name || ''; }
function getCarClassLabel(c) { return (props.initialData?.carClasses || []).find((c2) => c2.code === c)?.name || ''; }
function getPaintLabel(c) { return (props.initialData?.paintMaterials || []).find((p) => p.code === c)?.name || ''; }
function getSoundLabel(c) { return (props.initialData?.soundInsulation || []).find((s) => s.code === c)?.name || ''; }

async function onOpenSizeModal(field, label) {
  if (!openInputModal || !props.activeDent) return;
  const value = await openInputModal({
    title: 'Произвольный размер',
    label,
    value: props.activeDent[field] != null && props.activeDent[field] > 0 ? props.activeDent[field] : '',
    inputType: 'number',
    placeholder: 'мм',
    min: 0.1,
    step: 0.5
  });
  if (value !== undefined && value !== null && Number.isFinite(Number(value))) {
    emit('update-size', { field, value: Number(value) });
  }
}

async function onOpenParamPicker(field, title, options) {
  if (!openSelectModal || !props.activeDent) return;
  const current = props.activeDent.conditions?.[field] ?? null;
  const selected = await openSelectModal({
    title,
    options: (options || []).map((o) => ({ value: o.code, label: o.name })),
    value: current
  });
  if (selected === undefined) return;
  emit('update-conditions', { field, value: selected || null });
}

async function onOpenPanelElementPicker() {
  if (!openSelectModal || !props.activeDent) return;
  const side = props.activeDent.panelSide ?? 'left';
  const list = getElementsForSide(side) || [];
  const selected = await openSelectModal({
    title: 'Поврежденный элемент',
    options: list.map((p) => ({ value: p, label: p })),
    value: props.activeDent.panelElement ?? null
  });
  if (selected === undefined) return;
  emit('update-panel-element', selected || null);
}

async function onOpenArmaturePicker() {
  if (!openSelectModal || !props.activeDent) return;
  const works = getArmaturnayaWorksForElement(props.activeDent.panelElement || props.selectedPartName);
  const cur = normalizeArmatureWorkIds(props.activeDent.conditions?.disassemblyCodes);
  const selected = await openSelectModal({
    title: 'Арматурные работы',
    multiple: true,
    toggleMultipleValue: (current, toggled) => toggleArmatureWorkIds(current, toggled),
    options: works.map((w) => ({ value: w.code, label: w.name, rightText: w.price > 0 ? `${w.price.toLocaleString('ru-RU')} ₽` : '' })),
    value: cur,
    confirmText: 'Готово'
  });
  if (selected === undefined) return;
  emit('update-conditions', { field: 'disassemblyCodes', value: normalizeArmatureWorkIds(selected) });
}

async function onOpenPaintPicker() {
  if (!openSelectModal || !props.activeDent) return;
  const selected = await openSelectModal({
    title: 'Материал ЛКП',
    options: (props.initialData.paintMaterials || []).map((p) => ({ value: p.code, label: p.name, subtitle: p.desc })),
    value: props.activeDent.conditions?.paintMaterialCode ?? null
  });
  if (selected === undefined) return;
  emit('update-conditions', { field: 'paintMaterialCode', value: selected || null });
}

async function onOpenSoundPicker() {
  if (!openSelectModal || !props.activeDent) return;
  const selected = await openSelectModal({
    title: 'Шумоизоляция',
    options: (props.initialData.soundInsulation || []).map((s) => ({
      value: s.code,
      label: s.name,
      subtitle: s.desc,
      rightText: s.price > 0 ? `${s.price.toLocaleString('ru-RU')} ₽` : ''
    })),
    value: props.activeDent.conditions?.soundInsulationCode ?? null
  });
  if (selected === undefined) return;
  emit('update-conditions', { field: 'soundInsulationCode', value: selected || null });
}

function onPresetSelected(preset) {
  presetsModalOpen.value = false;
  emit('preset-selected', preset);
}
</script>
