<template>
  <div class="step0-panel flex flex-col min-h-0">
    <div class="graphics-panel-content p-3 space-y-3">
      <div class="flex items-center justify-between">
        <div class="text-[11px] text-gray-300 uppercase tracking-widest">Данные клиента</div>
        <div v-if="clientRequired" class="text-[10px] text-red-400 uppercase tracking-widest">обязательно</div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openField('clientName', 'Имя', 'text', 'Имя')">
          <span class="truncate">{{ model.clientName || 'Имя' }}</span>
          <span class="text-gray-500 shrink-0">✎</span>
        </button>
        <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openField('clientCompany', 'Компания', 'text', 'Компания')">
          <span class="truncate">{{ model.clientCompany || 'Компания' }}</span>
          <span class="text-gray-500 shrink-0">✎</span>
        </button>
        <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openField('clientPhone', 'Тел', 'tel', 'Телефон')">
          <span class="truncate">{{ model.clientPhone || 'Тел' }}</span>
          <span class="text-gray-500 shrink-0">✎</span>
        </button>
        <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openField('carBrand', 'Марка', 'text', 'Марка')">
          <span class="truncate">{{ model.carBrand || 'Марка' }}</span>
          <span class="text-gray-500 shrink-0">✎</span>
        </button>
        <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openField('carModel', 'Модель', 'text', 'Модель')">
          <span class="truncate">{{ model.carModel || 'Модель' }}</span>
          <span class="text-gray-500 shrink-0">✎</span>
        </button>
        <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openField('inspectDate', 'Дата осмотра', 'date', 'Дата')">
          <span class="truncate">{{ model.inspectDate || 'Дата' }}</span>
          <span class="text-gray-500 shrink-0">✎</span>
        </button>
        <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openField('inspectTime', 'Время осмотра', 'time', 'Время')">
          <span class="truncate">{{ model.inspectTime || 'Время' }}</span>
          <span class="text-gray-500 shrink-0">✎</span>
        </button>
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
</script>
