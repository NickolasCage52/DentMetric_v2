<template>
  <div class="step3-panel flex flex-col min-h-0 flex-1">
    <div class="graphics-panel-content step3-params-wrap flex flex-col flex-1 min-h-0 mx-0 p-2">
      <div class="step3-hint rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 shrink-0">
        <p class="text-[11px] font-medium leading-tight text-gray-200 step3-hint-text">
          <span class="step3-hint-full">Технология ремонта, сложность выполнения, материал панели и класс автомобиля влияют на итог.</span>
          <span class="step3-hint-short">Параметры влияют на итог.</span>
        </p>
      </div>
      <div class="step3-scroll-wrap">
        <div class="rounded-2xl border border-metric-green/20 bg-[#0d0d0d]/80 p-4">
          <div class="flex items-center gap-1.5 mb-3">
            <span class="text-[10px] font-bold text-metric-green uppercase tracking-widest">ПАРАМЕТРЫ РАСЧЁТА</span>
            <InfoIcon v-if="showInfoTooltips" tooltip-text="Технология ремонта, сложность, материал панели и класс авто влияют на итоговую стоимость. Материал ЛКП — тип лакокрасочного покрытия (глянец, мат, плёнка)." />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">Технология ремонта</label>
              <div class="relative">
                <select
                  :value="model.repairCode"
                  @change="update('repairCode', $event.target.value)"
                  :class="['w-full rounded-xl px-3 py-2.5 text-sm focus:border-metric-green/50 outline-none appearance-none transition-colors', model.repairCode ? 'bg-[#1a1a1a] border border-metric-green/40 text-white' : 'bg-[#151515] border border-[#333] text-gray-400']"
                >
                  <option :value="null" disabled>Выберите</option>
                  <option v-for="r in initialData.repairTypes" :key="r.code" :value="r.code">{{ r.name }}</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">Сложность выполнения</label>
              <div class="relative">
                <select
                  :value="model.riskCode"
                  @change="update('riskCode', $event.target.value)"
                  :class="['w-full rounded-xl px-3 py-2.5 text-sm focus:border-metric-green/50 outline-none appearance-none transition-colors', model.riskCode ? 'bg-[#1a1a1a] border border-metric-green/40 text-white' : 'bg-[#151515] border border-[#333] text-gray-400']"
                >
                  <option :value="null" disabled>Выберите</option>
                  <option v-for="risk in initialData.risks" :key="risk.code" :value="risk.code">{{ risk.name }}</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">Материал панели</label>
              <div class="relative">
                <select
                  :value="model.materialCode"
                  @change="update('materialCode', $event.target.value)"
                  :class="['w-full rounded-xl px-3 py-2.5 text-sm focus:border-metric-green/50 outline-none appearance-none transition-colors', model.materialCode ? 'bg-[#1a1a1a] border border-metric-green/40 text-white' : 'bg-[#151515] border border-[#333] text-gray-400']"
                >
                  <option :value="null" disabled>Выберите</option>
                  <option v-for="m in initialData.materials" :key="m.code" :value="m.code">{{ m.name }}</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">Материал ЛКП</label>
              <div class="relative">
                <select
                  :value="model.paintMaterialCode"
                  @change="update('paintMaterialCode', $event.target.value)"
                  :class="['w-full rounded-xl px-3 py-2.5 text-sm focus:border-metric-green/50 outline-none appearance-none transition-colors', model.paintMaterialCode ? 'bg-[#1a1a1a] border border-metric-green/40 text-white' : 'bg-[#151515] border border-[#333] text-gray-400']"
                >
                  <option :value="null" disabled>Выберите</option>
                  <option v-for="p in initialData.paintMaterials" :key="p.code" :value="p.code">{{ p.name }}</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              <p v-if="model.paintMaterialCode" class="text-[9px] text-gray-500 mt-1 ml-1">{{ (initialData.paintMaterials.find(p => p.code === model.paintMaterialCode))?.desc }}</p>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">Класс автомобиля</label>
              <div class="relative">
                <select
                  :value="model.carClassCode"
                  @change="update('carClassCode', $event.target.value)"
                  :class="['w-full rounded-xl px-3 py-2.5 text-sm focus:border-metric-green/50 outline-none appearance-none transition-colors', model.carClassCode ? 'bg-[#1a1a1a] border border-metric-green/40 text-white' : 'bg-[#151515] border border-[#333] text-gray-400']"
                >
                  <option :value="null" disabled>Выберите</option>
                  <option v-for="c in initialData.carClasses" :key="c.code" :value="c.code">{{ c.name }}</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>
          <div class="col-span-2 mt-2">
            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">Арматурные работы</label>
            <p class="text-[9px] text-gray-500 mb-2 ml-1">Выберите вид работ. Стоимость учитывается в расчёте.</p>
            <div class="relative">
              <select
                :value="model.disassemblyCode"
                @change="update('disassemblyCode', $event.target.value)"
                :class="['w-full rounded-xl px-4 py-3 text-sm focus:border-metric-green/50 outline-none appearance-none transition-colors', model.disassemblyCode ? 'bg-[#1a1a1a] border border-metric-green/40 text-white' : 'bg-[#151515] border border-[#333] text-gray-400']"
              >
                <option :value="null" disabled>Выберите арматурные работы</option>
                <option v-for="work in disassemblyOptions" :key="work.code" :value="work.code">
                  {{ work.name }}{{ work.price > 0 ? ' — ' + work.price.toLocaleString('ru-RU') + ' ₽' : '' }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
          <div class="mt-2">
            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">Шумоизоляция</label>
            <div class="relative">
              <select
                :value="model.soundInsulationCode"
                @change="update('soundInsulationCode', $event.target.value)"
                :class="['w-full rounded-xl px-3 py-2.5 text-sm focus:border-metric-green/50 outline-none appearance-none transition-colors', model.soundInsulationCode ? 'bg-[#1a1a1a] border border-metric-green/40 text-white' : 'bg-[#151515] border border-[#333] text-gray-400']"
              >
                <option :value="null" disabled>Выберите</option>
                <option v-for="s in initialData.soundInsulation" :key="s.code" :value="s.code" :title="s.desc">{{ s.name }}</option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
            <p v-if="model.soundInsulationCode" class="text-[9px] text-gray-500 mt-1 ml-1">{{ (initialData.soundInsulation.find(s => s.code === model.soundInsulationCode))?.desc }}</p>
          </div>
        </div>
        <div class="rounded-lg bg-black/35 border border-white/10 p-2 space-y-0.5 mt-2">
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
import { computed, watch } from 'vue';
import InfoIcon from '../InfoIcon.vue';
import { getArmaturnayaWorksForElement } from '../../data/armaturnayaWorks.js';

const props = defineProps({
  model: { type: Object, required: true },
  initialData: { type: Object, required: true },
  selectedPartName: { type: String, default: null },
  basePrice: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  showInfoTooltips: { type: Boolean, default: true }
});

const disassemblyOptions = computed(() =>
  props.selectedPartName
    ? getArmaturnayaWorksForElement(props.selectedPartName)
    : (props.initialData?.disassembly ?? [])
);

watch(disassemblyOptions, (options) => {
  if (!props.model?.disassemblyCode) return;
  const codes = options.map((w) => w.code);
  if (!codes.includes(props.model.disassemblyCode)) {
    props.model.disassemblyCode = null;
  }
}, { immediate: true });

defineEmits(['back', 'calculate']);

const conditionsComplete = computed(() => {
  const m = props.model;
  if (!m) return false;
  return !!(
    m.repairCode &&
    m.riskCode &&
    m.materialCode &&
    m.carClassCode &&
    m.disassemblyCode
  );
});

function update(field, value) {
  if (props.model) props.model[field] = value;
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
