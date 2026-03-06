<template>
  <div class="quick-style-conditions flex flex-col min-h-0 flex-1 overflow-hidden">
    <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2 pb-6">
      <!-- ПАРАМЕТРЫ РАСЧЁТА -->
      <div class="card-metallic rounded-xl" style="padding:var(--qc-card-py,12px) var(--qc-card-px,12px)">
        <div class="qc-section-title text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">ПАРАМЕТРЫ РАСЧЁТА</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          <button
            type="button"
            data-testid="detail-param-repair"
            class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
            :class="model.repairCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="$emit('pick', 'repairCode', 'Технология ремонта', repairOptions)"
          >
            <div class="min-w-0 flex-1">
              <div class="qc-sr-value text-[12px] font-semibold truncate" :class="model.repairCode ? 'text-white' : 'text-gray-400'">{{ getRepairLabel(model.repairCode) || 'Метод ремонта' }}</div>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <div v-if="model.repairCode" class="w-3 h-3 rounded-full bg-metric-green/80"></div>
              <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
          <button
            type="button"
            data-testid="detail-param-risk"
            class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
            :class="model.riskCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="$emit('pick', 'riskCode', 'Сложность выполнения', riskOptions)"
          >
            <div class="min-w-0 flex-1">
              <div class="qc-sr-value text-[12px] font-semibold truncate" :class="model.riskCode ? 'text-white' : 'text-gray-400'">{{ getRiskLabel(model.riskCode) || 'Сложность выполнения' }}</div>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <div v-if="model.riskCode" class="w-3 h-3 rounded-full bg-metric-green/80"></div>
              <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
          <button
            type="button"
            data-testid="detail-param-material"
            class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
            :class="model.materialCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="$emit('pick', 'materialCode', 'Материал панели', materialOptions)"
          >
            <div class="min-w-0 flex-1">
              <div class="qc-sr-value text-[12px] font-semibold truncate" :class="model.materialCode ? 'text-white' : 'text-gray-400'">{{ getMaterialLabel(model.materialCode) || 'Материал панели' }}</div>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <div v-if="model.materialCode" class="w-3 h-3 rounded-full bg-metric-green/80"></div>
              <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
          <button
            type="button"
            data-testid="detail-param-carclass"
            class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
            :class="model.carClassCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="$emit('pick', 'carClassCode', 'Класс автомобиля', carClassOptions)"
          >
            <div class="min-w-0 flex-1">
              <div class="qc-sr-value text-[12px] font-semibold truncate" :class="model.carClassCode ? 'text-white' : 'text-gray-400'">{{ getCarClassLabel(model.carClassCode) || 'Класс автомобиля' }}</div>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <div v-if="model.carClassCode" class="w-3 h-3 rounded-full bg-metric-green/80"></div>
              <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
        </div>
      </div>

      <!-- ДОПОЛНИТЕЛЬНО (always expanded) -->
      <div class="card-metallic rounded-xl" style="padding:var(--qc-card-py,12px) var(--qc-card-px,12px)">
        <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">ДОПОЛНИТЕЛЬНО…</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          <button
            type="button"
            data-testid="detail-armaturnaya"
            class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
            :class="(model.disassemblyCodes?.length ?? 0) > 0 ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="$emit('pick-armature')"
          >
            <div class="min-w-0 flex-1">
              <div class="qc-sr-value text-[12px] font-semibold truncate" :class="(model.disassemblyCodes?.length ?? 0) > 0 ? 'text-white' : 'text-gray-400'">{{ armatureSummary || 'Арматурные работы' }}</div>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
          <button
            v-if="showPaintMaterial"
            type="button"
            data-testid="detail-param-paint"
            class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
            :class="model.paintMaterialCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="$emit('pick', 'paintMaterialCode', 'Материал ЛКП', paintOptions)"
          >
            <div class="min-w-0 flex-1">
              <div class="qc-sr-value text-[12px] font-semibold truncate" :class="model.paintMaterialCode ? 'text-white' : 'text-gray-400'">{{ getPaintLabel(model.paintMaterialCode) || 'Материал ЛКП' }}</div>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <div v-if="model.paintMaterialCode" class="w-3 h-3 rounded-full bg-metric-green/80"></div>
              <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
          <button
            v-if="showSoundInsulation"
            type="button"
            data-testid="detail-param-sound"
            class="qc-select-row w-full flex items-center justify-between gap-2 border transition-colors touch-manipulation"
            :class="model.soundInsulationCode ? 'bg-[#1a1a1a] border-white/15' : 'bg-[#151515] border-white/10 hover:border-white/15'"
            @click="$emit('pick', 'soundInsulationCode', 'Шумоизоляция', soundOptions)"
          >
            <div class="min-w-0 flex-1">
              <div class="qc-sr-value text-[12px] font-semibold truncate" :class="model.soundInsulationCode ? 'text-white' : 'text-gray-400'">{{ getSoundLabel(model.soundInsulationCode) || 'Шумоизоляция' }}</div>
            </div>
            <div class="shrink-0 flex items-center gap-1.5">
              <div v-if="model.soundInsulationCode" class="w-3 h-3 rounded-full bg-metric-green/80"></div>
              <svg class="w-3 h-3 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>
        </div>
      </div>

      <!-- Price block -->
      <div class="qc-price-block">
        <div class="qc-price-value">{{ formatPrice(totalPrice) }} ₽</div>
      </div>
    </div>
    <div class="graphics-action-bar shrink-0 p-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-white/10">
      <div class="flex items-center gap-2 w-full">
        <button type="button" @click="$emit('back')" class="step-nav-back-btn shrink-0 py-2.5 px-3 rounded-xl text-xs font-medium text-gray-400 hover:text-white border border-white/15 hover:border-white/25 transition-all touch-manipulation min-h-[44px]">Назад</button>
        <button type="button" :disabled="!conditionsComplete" @click="conditionsComplete && $emit('calculate')" :class="conditionsComplete ? 'bg-metric-green text-black shadow-[0_0_15px_rgba(136,229,35,0.4)] hover:opacity-95 active:opacity-90' : 'bg-white/10 text-gray-500 cursor-not-allowed'" class="flex-1 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 min-h-[44px] touch-manipulation">
          Вперёд
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  model: { type: Object, required: true },
  initialData: { type: Object, required: true },
  selectedPartName: { type: String, default: null },
  totalPrice: { type: Number, default: 0 },
  showPaintMaterial: { type: Boolean, default: true },
  showSoundInsulation: { type: Boolean, default: true },
  armatureSummary: { type: String, default: '' }
});

defineEmits(['back', 'calculate', 'pick', 'pick-armature']);

const repairOptions = computed(() => (props.initialData?.repairTypes || []).map((o) => ({ value: o.code, label: o.name })));
const riskOptions = computed(() => (props.initialData?.risks || []).map((o) => ({ value: o.code, label: o.name })));
const materialOptions = computed(() => (props.initialData?.materials || []).map((o) => ({ value: o.code, label: o.name })));
const carClassOptions = computed(() => (props.initialData?.carClasses || []).map((o) => ({ value: o.code, label: o.name })));
const paintOptions = computed(() => (props.initialData?.paintMaterials || []).map((o) => ({ value: o.code, label: o.name })));
const soundOptions = computed(() => (props.initialData?.soundInsulation || []).map((o) => ({ value: o.code, label: o.name })));

const conditionsComplete = computed(() => {
  const m = props.model;
  if (!m) return false;
  return !!(m.repairCode && m.riskCode && m.materialCode && m.carClassCode);
});

function getRepairLabel(c) { return (props.initialData?.repairTypes || []).find((r) => r.code === c)?.name || ''; }
function getRiskLabel(c) { return (props.initialData?.risks || []).find((r) => r.code === c)?.name || ''; }
function getMaterialLabel(c) { return (props.initialData?.materials || []).find((m) => m.code === c)?.name || ''; }
function getCarClassLabel(c) { return (props.initialData?.carClasses || []).find((c2) => c2.code === c)?.name || ''; }
function getPaintLabel(c) { return (props.initialData?.paintMaterials || []).find((p) => p.code === c)?.name || ''; }
function getSoundLabel(c) { return (props.initialData?.soundInsulation || []).find((s) => s.code === c)?.name || ''; }

const formatPrice = (v) => new Intl.NumberFormat('ru-RU').format(v ?? 0);
</script>
