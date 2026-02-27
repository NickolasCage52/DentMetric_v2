<template>
  <div class="step0-panel flex flex-col min-h-0">
    <div class="graphics-panel-content step0-content p-3 space-y-3">
      <div class="card-metallic rounded-2xl p-5 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <span class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest">ДАННЫЕ КЛИЕНТА</span>
            <span v-if="clientRequired" class="text-[10px] text-red-400 uppercase tracking-widest">обязательно</span>
            <span v-else class="text-[10px] text-gray-500">опционально</span>
          </div>
          <button
            type="button"
            class="client-reset-btn"
            @click="resetClientFields"
          >
            СБРОС
          </button>
        </div>
        <div class="grid grid-cols-1 gap-2">
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openField('clientName', 'Имя клиента', 'text', 'Имя клиента')">
            <span class="truncate text-[12px] font-semibold" :class="model.clientName ? 'text-white' : 'text-gray-400'">{{ model.clientName || 'Имя клиента' }}</span>
            <span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openField('clientPhone', 'Телефон', 'tel', 'Телефон')">
            <span class="truncate text-[12px] font-semibold" :class="model.clientPhone ? 'text-white' : 'text-gray-400'">{{ model.clientPhone || 'Телефон' }}</span>
            <span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openField('clientCompany', 'Компания (необязательно)', 'text', 'Компания')">
            <span class="truncate text-[12px] font-semibold" :class="model.clientCompany ? 'text-white' : 'text-gray-400'">{{ model.clientCompany || 'Компания (необязательно)' }}</span>
            <span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
        </div>
      </div>
      <div class="card-metallic rounded-2xl p-5 space-y-3">
        <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">АВТОМОБИЛЬ</div>
        <div class="grid grid-cols-1 gap-2">
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openField('carBrand', 'Марка автомобиля', 'text', 'Марка')">
            <span class="truncate text-[12px] font-semibold" :class="model.carBrand ? 'text-white' : 'text-gray-400'">{{ model.carBrand || 'Марка' }}</span>
            <span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openField('carModel', 'Модель автомобиля', 'text', 'Модель')">
            <span class="truncate text-[12px] font-semibold" :class="model.carModel ? 'text-white' : 'text-gray-400'">{{ model.carModel || 'Модель' }}</span>
            <span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openField('carPlate', 'Гос.номер', 'text', 'Гос.номер')">
            <span class="truncate text-[12px] font-semibold" :class="model.carPlate ? 'text-white' : 'text-gray-400'">{{ model.carPlate || 'Гос.номер' }}</span>
            <span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
        </div>
      </div>
      <div class="card-metallic rounded-2xl p-5 space-y-3">
        <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">ДАТА И ВРЕМЯ</div>
        <div class="grid grid-cols-2 gap-2">
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openField('inspectDate', 'Дата осмотра', 'date', 'Дата')">
            <span class="truncate text-[12px] font-semibold" :class="model.inspectDate ? 'text-white' : 'text-gray-400'">{{ model.inspectDate || 'Дата' }}</span>
            <span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="openField('inspectTime', 'Время осмотра', 'time', 'Время')">
            <span class="truncate text-[12px] font-semibold" :class="model.inspectTime ? 'text-white' : 'text-gray-400'">{{ model.inspectTime || 'Время' }}</span>
            <span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
        </div>
      </div>
      <p v-if="clientRequired && !canNext" class="text-[10px] text-gray-500 text-center">Заполните имя и телефон</p>
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
          :title="canNext ? '' : 'Заполните имя и телефон'"
          class="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 min-h-[40px]"
          :class="canNext ? 'bg-metric-green text-black shadow-[0_0_15px_rgba(136,229,35,0.4)] hover:opacity-95 active:opacity-90' : 'bg-white/10 text-gray-500 cursor-not-allowed'"
        >
          <span>Продолжить → Размещение</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const props = defineProps({
  model: { type: Object, required: true },
  clientRequired: { type: Boolean, default: false },
  canNext: { type: Boolean, default: true }
});

defineEmits(['back', 'next']);

const openInputModal = inject('openInputModal');

async function openField(field, label, inputType, placeholder) {
  const value = await openInputModal({
    title: 'Данные клиента',
    label,
    value: props.model[field] ?? '',
    inputType,
    placeholder
  });
  if (value !== undefined && value !== null) props.model[field] = value;
}

function resetClientFields() {
  props.model.clientName = '';
  props.model.clientCompany = '';
  props.model.clientPhone = '';
  props.model.carBrand = '';
  props.model.carModel = '';
  props.model.carPlate = '';
}
</script>

<style scoped>
/* Эталон: второстепенная кнопка; СБРОС — ghost, серый (деструктивное действие) */
.client-reset-btn {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 2px 8px;
  border-radius: 6px;
  color: #888;
  background: transparent;
  border: 1px solid #444;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}
.client-reset-btn:hover {
  color: #aaa;
  border-color: #555;
}
/* Строки полей: min-height как qc-select-row (36px) */
.client-input-row {
  min-height: 36px;
}
</style>
