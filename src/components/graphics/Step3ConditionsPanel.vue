<template>
  <div class="step3-panel flex flex-col min-h-0 flex-1">
    <div class="graphics-panel-content step3-params-wrap flex flex-col flex-1 min-h-0 mx-0 p-2">
      <div class="step3-hint rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 shrink-0">
        <p class="text-[11px] font-medium leading-tight text-gray-200 step3-hint-text">
          <span class="step3-hint-full">Технология ремонта, сложность выполнения, материал панели и класс автомобиля влияют на итог.</span>
          <span class="step3-hint-short">Параметры влияют на итог.</span>
        </p>
      </div>
      <div class="step3-scroll-wrap space-y-2">
        <div class="rounded-2xl border border-metric-green/20 bg-[#0d0d0d]/80 p-4 space-y-3">
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-bold text-metric-green uppercase tracking-widest">ПАРАМЕТРЫ РАСЧЁТА</span>
            <InfoIcon
              v-if="showInfoTooltips"
              tooltip-text="Технология ремонта, сложность выполнения, материал панели и класс авто влияют на итоговую стоимость."
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <SelectRow
              data-testid="detail-param-repair"
              label="ТЕХНОЛОГИЯ РЕМОНТА"
              :value-text="getLabel(initialData.repairTypes, model.repairCode)"
              :active="!!model.repairCode"
              :show-check="true"
              @click="openPicker('repairCode', 'Технология ремонта', (initialData.repairTypes || []).map((o) => ({ value: o.code, label: o.name })))"
            />
            <SelectRow
              data-testid="detail-param-risk"
              label="СЛОЖНОСТЬ ВЫПОЛНЕНИЯ"
              :value-text="getLabel(initialData.risks, model.riskCode)"
              :active="!!model.riskCode"
              :show-check="true"
              @click="openPicker('riskCode', 'Сложность выполнения', (initialData.risks || []).map((o) => ({ value: o.code, label: o.name })))"
            />
            <SelectRow
              data-testid="detail-param-material"
              label="МАТЕРИАЛ ПАНЕЛИ"
              :value-text="getLabel(initialData.materials, model.materialCode)"
              :active="!!model.materialCode"
              :show-check="true"
              @click="openPicker('materialCode', 'Материал панели', (initialData.materials || []).map((o) => ({ value: o.code, label: o.name })))"
            />
            <SelectRow
              data-testid="detail-param-carclass"
              label="КЛАСС АВТОМОБИЛЯ"
              :value-text="getLabel(initialData.carClasses, model.carClassCode)"
              :active="!!model.carClassCode"
              :show-check="true"
              @click="openPicker('carClassCode', 'Класс автомобиля', (initialData.carClasses || []).map((o) => ({ value: o.code, label: o.name })))"
            />
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ДОПОЛНИТЕЛЬНЫЕ РАБОТЫ</span>
            </div>
            <SelectRow
              data-testid="detail-armaturnaya"
              label="АРМАТУРНЫЕ РАБОТЫ"
              :value-text="getDisassemblyLabel(model.disassemblyCodes)"
              :active="(model.disassemblyCodes?.length ?? 0) > 0"
              :show-check="true"
              @click="openDisassemblyPicker()"
            />
          </div>
        </div>

        <div v-if="showPaintMaterial || showSoundInsulation" class="card-metallic rounded-2xl p-4 space-y-3">
          <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Дополнительно</div>
          <SelectRow
            v-if="showPaintMaterial"
            data-testid="detail-param-paint"
            label="МАТЕРИАЛ ЛКП"
            :value-text="getLabel(initialData.paintMaterials, model.paintMaterialCode)"
            :active="!!model.paintMaterialCode"
            :show-check="true"
            @click="openPicker('paintMaterialCode', 'Материал ЛКП', (initialData.paintMaterials || []).map((p) => ({ value: p.code, label: p.name, subtitle: p.desc })))"
          />
          <SelectRow
            v-if="showSoundInsulation"
            data-testid="detail-param-sound"
            label="ШУМОИЗОЛЯЦИЯ"
            :value-text="getLabel(initialData.soundInsulation, model.soundInsulationCode)"
            :active="!!model.soundInsulationCode"
            :show-check="true"
            @click="openPicker('soundInsulationCode', 'Шумоизоляция', (initialData.soundInsulation || []).map((s) => ({ value: s.code, label: s.name, subtitle: s.desc })))"
          />
        </div>

        <div class="rounded-lg bg-black/35 border border-white/10 p-2 space-y-0.5">
          <div class="flex justify-between text-[11px]">
            <span class="text-gray-400">Базовая стоимость:</span>
            <span class="text-white font-medium">{{ formatPrice(basePrice) }} ₽</span>
          </div>
          <div class="flex justify-between text-[11px]">
            <span class="text-gray-400">Итоговая стоимость:</span>
            <span class="text-metric-green font-bold">{{ formatPrice(totalPrice) }} ₽</span>
          </div>
        </div>
      </div>
    </div>
    <div class="graphics-action-bar space-y-2 shrink-0">
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
          :disabled="!conditionsComplete"
          @click="conditionsComplete && $emit('calculate')"
          class="step3-calc-btn flex-1 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-opacity min-h-[44px]"
          :class="conditionsComplete ? 'bg-metric-green text-black shadow-[0_0_15px_rgba(136,229,35,0.4)] hover:opacity-95 active:opacity-90' : 'bg-white/10 text-gray-500 cursor-not-allowed'"
        >
          <span>Рассчитать стоимость</span>
        </button>
      </div>
      <p v-if="!conditionsComplete" class="text-[10px] text-gray-500 text-center">Выберите все параметры</p>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, inject } from 'vue';
import InfoIcon from '../InfoIcon.vue';
import { getArmaturnayaWorksForElement } from '../../data/armaturnayaWorks.js';
import { normalizeArmatureWorkIds, toggleArmatureWorkIds } from '../../utils/armatureSelection.js';
import SelectRow from '../ui/SelectRow.vue';

const props = defineProps({
  model: { type: Object, required: true },
  initialData: { type: Object, required: true },
  selectedPartName: { type: String, default: null },
  basePrice: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  showInfoTooltips: { type: Boolean, default: true },
  showPaintMaterial: { type: Boolean, default: true },
  showSoundInsulation: { type: Boolean, default: true }
});

const disassemblyOptions = computed(() =>
  props.selectedPartName
    ? getArmaturnayaWorksForElement(props.selectedPartName)
    : (props.initialData?.disassembly ?? [])
);

watch(disassemblyOptions, (options) => {
  if (!props.model) return;
  const validCodes = new Set((options || []).map((w) => w.code));
  const cur = normalizeArmatureWorkIds(props.model.disassemblyCodes);
  const next = normalizeArmatureWorkIds(cur.filter((c) => validCodes.has(c)));
  props.model.disassemblyCodes = next;
}, { immediate: true });

defineEmits(['back', 'calculate']);

const openSelectModal = inject('openSelectModal');

const conditionsComplete = computed(() => {
  const m = props.model;
  if (!m) return false;
  return !!(
    m.repairCode &&
    m.riskCode &&
    m.materialCode &&
    m.carClassCode &&
    (m.disassemblyCodes?.length ?? 0) > 0
  );
});

function update(field, value) {
  if (props.model) props.model[field] = value;
}

function getLabel(list, code) {
  if (!code) return '';
  const found = (list || []).find((x) => x.code === code);
  return found?.name || String(code);
}

const disassemblyModalOptions = computed(() =>
  (disassemblyOptions.value || []).map((w) => ({
    value: w.code,
    label: w.name,
    rightText: w.price > 0 ? `${w.price.toLocaleString('ru-RU')} ₽` : ''
  }))
);

function getDisassemblyLabel(codes) {
  const arr = normalizeArmatureWorkIds(codes);
  if (arr.length === 0) return '';
  const works = disassemblyOptions.value || [];
  const byCode = new Map(works.map((w) => [w.code, w]));
  const normalized = normalizeArmatureWorkIds(arr).filter((c) => byCode.has(c));
  if (normalized.length === 1) return byCode.get(normalized[0])?.name || String(normalized[0]);
  const sum = normalized.reduce((acc, c) => acc + (byCode.get(c)?.price ?? 0), 0);
  return sum > 0 ? `${normalized.length} выбрано · +${sum.toLocaleString('ru-RU')} ₽` : `${normalized.length} выбрано`;
}

async function openPicker(field, title, options) {
  if (!openSelectModal) return;
  const selected = await openSelectModal({
    title,
    options: options || [],
    value: props.model?.[field] ?? null
  });
  if (selected === undefined) return;
  update(field, selected || null);
}

async function openDisassemblyPicker() {
  if (!openSelectModal || !props.model) return;
  const cur = normalizeArmatureWorkIds(props.model.disassemblyCodes);
  const selected = await openSelectModal({
    title: 'Арматурные работы',
    multiple: true,
    toggleMultipleValue: (current, toggled) => toggleArmatureWorkIds(current, toggled),
    options: disassemblyModalOptions.value || [],
    value: cur,
    confirmText: 'Готово'
  });
  if (selected === undefined) return;
  props.model.disassemblyCodes = normalizeArmatureWorkIds(selected);
}

const formatPrice = (v) => new Intl.NumberFormat('ru-RU').format(v);
</script>

<style scoped>
.step3-hint-short {
  display: none;
}
/* Панель: колонка, контент скроллится, кнопки внизу; min-height:0 нужен для shrink flex-детей */
.step3-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}
/* Область с полями — скролл на всех устройствах; flex 1 1 0 + min-height 0 = обязательное условие для scroll */
.step3-params-wrap {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: scroll;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  display: flex;
  flex-direction: column;
}
/* Область полей: без растягивания по высоте; отступ снизу, чтобы при скролле все поля и кнопка «Рассчитать» были доступны */
.step3-scroll-wrap {
  flex: 0 0 auto;
  overflow: visible;
  padding-right: 4px;
  padding-bottom: 1.25rem;
}
.graphics-action-bar {
  flex-shrink: 0;
}
.step3-fields-grid {
  display: flex;
  flex-direction: column;
}
.step3-fields-grid > * + * {
  margin-top: 0.5rem;
}
/* Mobile: компактнее — кнопка «Рассчитать стоимость» всегда видна */
@media (max-width: 480px) {
  .step3-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
    gap: 0.5rem;
  }
  .step3-hint {
    padding: 0.4rem 0.6rem !important;
    flex-shrink: 0;
  }
  .step3-hint-text {
    font-size: 10px !important;
    line-height: 1.3;
  }
  .step3-hint-full {
    display: inline;
  }
  .step3-hint-short {
    display: none;
  }
  .step3-params-wrap {
    flex: 1;
    min-height: 0;
  }
  .step3-fields-grid > * + * {
    margin-top: 0.75rem;
  }
  .step3-select {
    min-height: 46px !important;
    padding: 0.5rem 0.65rem !important;
    font-size: 0.9rem !important;
  }
  .step3-calc-btn {
    min-height: 46px !important;
    padding: 0.6rem 0.7rem !important;
    font-size: 0.8rem !important;
  }
}
</style>
