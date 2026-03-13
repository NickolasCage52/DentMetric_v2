<template>
  <div class="quick-style-client flex flex-col min-h-0 flex-1 overflow-hidden">
    <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pt-3 pb-6">
      <div class="card-metallic rounded-2xl p-5 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <span class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest">ДАННЫЕ КЛИЕНТА</span>
            <InfoIcon v-if="showInfoTooltips" tooltip-text="Заполните контактные данные клиента и информацию об автомобиле. Эти поля можно сделать обязательными в настройках." />
            <span v-if="clientRequired" class="text-[10px] text-red-400 uppercase tracking-widest">обязательно</span>
            <span v-else class="text-[10px] text-gray-500">опционально</span>
          </div>
          <button
            type="button"
            class="client-reset-btn"
            @click="$emit('reset-client')"
            aria-label="Сбросить данные клиента"
          >
            СБРОС
          </button>
        </div>
        <div class="grid grid-cols-1 gap-2">
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="$emit('open-field', 'clientName', 'Имя клиента', 'text', 'Имя клиента')">
            <span class="truncate text-[12px] font-semibold" :class="model.clientName ? 'text-white' : 'text-gray-400'">{{ model.clientName || 'Имя клиента' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="$emit('open-field', 'clientPhone', 'Телефон', 'tel', 'Телефон')">
            <span class="truncate text-[12px] font-semibold" :class="model.clientPhone ? 'text-white' : 'text-gray-400'">{{ model.clientPhone || 'Телефон' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
          <ClientFoundCard
            v-if="historyEnabled && foundClient"
            :client="foundClient"
            @open-history="$emit('open-history')"
            @autofill-client="$emit('autofill-client', $event)"
          />
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="$emit('open-field', 'clientCompany', 'Компания (необязательно)', 'text', 'Компания')">
            <span class="truncate text-[12px] font-semibold" :class="model.clientCompany ? 'text-white' : 'text-gray-400'">{{ model.clientCompany || 'Компания (необязательно)' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
        </div>
      </div>
      <div class="card-metallic rounded-2xl p-5 space-y-3">
        <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">АВТОМОБИЛЬ</div>
        <div class="grid grid-cols-1 gap-2">
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="$emit('open-field', 'carBrand', 'Марка автомобиля', 'text', 'Марка')">
            <span class="truncate text-[12px] font-semibold" :class="model.carBrand ? 'text-white' : 'text-gray-400'">{{ model.carBrand || 'Марка' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="$emit('open-field', 'carModel', 'Модель автомобиля', 'text', 'Модель')">
            <span class="truncate text-[12px] font-semibold" :class="model.carModel ? 'text-white' : 'text-gray-400'">{{ model.carModel || 'Модель' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="$emit('open-field', 'carPlate', 'Гос.номер', 'text', 'Гос.номер')">
            <span class="truncate text-[12px] font-semibold" :class="model.carPlate ? 'text-white' : 'text-gray-400'">{{ model.carPlate || 'Гос.номер' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
        </div>
      </div>
      <div class="card-metallic rounded-2xl p-5 space-y-3">
        <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">ДАТА И ВРЕМЯ</div>
        <div class="grid grid-cols-2 gap-2">
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="$emit('open-field', 'inspectDate', 'Дата осмотра', 'date', 'Дата')">
            <span class="truncate text-[12px] font-semibold" :class="model.inspectDate ? 'text-white' : 'text-gray-400'">{{ model.inspectDate || 'Дата' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
          <button type="button" class="client-input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-white/10 text-left touch-manipulation" @click="$emit('open-field', 'inspectTime', 'Время осмотра', 'time', 'Время')">
            <span class="truncate text-[12px] font-semibold" :class="model.inspectTime ? 'text-white' : 'text-gray-400'">{{ model.inspectTime || 'Время' }}</span><span class="text-gray-500 shrink-0 text-sm">✎</span>
          </button>
        </div>
        <p v-if="clientRequired && !canNext" class="text-[10px] text-gray-500 text-center">Заполните обязательные поля</p>
      </div>
    </div>
    <div class="graphics-action-bar shrink-0 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-white/10">
      <div class="flex items-center gap-2 w-full">
        <button type="button" @click="$emit('back')" class="step-nav-back-btn shrink-0 py-2.5 px-3 rounded-xl text-xs font-medium text-gray-400 hover:text-white border border-white/15 hover:border-white/25 transition-all touch-manipulation min-h-[44px]">Назад</button>
        <button type="button" @click="$emit('next')" :disabled="!canNext" :class="canNext ? 'bg-metric-green text-black shadow-[0_0_15px_rgba(136,229,35,0.4)] hover:opacity-95 active:opacity-90' : 'bg-white/10 text-gray-500 cursor-not-allowed'" class="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 min-h-[44px] touch-manipulation">
          <span>Продолжить → Размещение</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import InfoIcon from '../InfoIcon.vue';
import ClientFoundCard from '../ClientFoundCard.vue';

defineProps({
  model: { type: Object, required: true },
  clientRequired: { type: Boolean, default: false },
  canNext: { type: Boolean, default: true },
  showInfoTooltips: { type: Boolean, default: true },
  historyEnabled: { type: Boolean, default: false },
  foundClient: { type: Object, default: null }
});

defineEmits(['back', 'next', 'open-field', 'reset-client', 'open-history', 'autofill-client']);
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
.client-input-row {
  min-height: 36px;
}
</style>
