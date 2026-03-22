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
    <div class="quick-nav-bar shrink-0 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-white/10 relative z-[1] pointer-events-auto">
      <div class="quick-nav-buttons grid gap-1" style="grid-template-columns: auto 1fr auto; align-items: center;">
        <button
          type="button"
          @click="$emit('back')"
          class="quick-nav-btn quick-nav-btn-back shrink-0 py-2.5 px-3 text-[11px] font-bold uppercase tracking-widest text-gray-300 border border-white/10 min-h-[40px] rounded-xl"
        >
          <span class="inline-flex items-center gap-1"><span aria-hidden="true">&lsaquo;</span> Назад</span>
        </button>
        <div class="quick-nav-price">
          <span v-if="price != null" class="quick-nav-price-value">{{ price.toLocaleString('ru-RU') }} ₽</span>
        </div>
        <button
          type="button"
          data-testid="btn-continue-placement"
          :disabled="!canNext"
          :aria-disabled="!canNext"
          class="quick-nav-btn quick-nav-btn-next shrink-0 py-2.5 px-3 text-[11px] font-bold uppercase tracking-widest text-metric-green border border-metric-green/40 transition-all hover:bg-metric-green/10 min-h-[40px] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleNext"
        >
          <span class="inline-flex items-center gap-1">Вперёд <span aria-hidden="true">&rsaquo;</span></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import InfoIcon from '../InfoIcon.vue';
import ClientFoundCard from '../ClientFoundCard.vue';

const props = defineProps({
  model: { type: Object, required: true },
  clientRequired: { type: Boolean, default: false },
  canNext: { type: Boolean, default: true },
  showInfoTooltips: { type: Boolean, default: true },
  historyEnabled: { type: Boolean, default: false },
  foundClient: { type: Object, default: null },
  onNext: { type: Function, default: null },
  price: { type: Number, default: null },
});

const emit = defineEmits(['back', 'next', 'open-field', 'reset-client', 'open-history', 'autofill-client']);

function handleNext(e) {
  if (e) {
    e.stopPropagation();
  }
  if (!props.canNext) return;
  if (props.onNext) {
    props.onNext();
  }
  emit('next');
}
</script>

<style scoped>
.quick-style-client {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
}
.quick-style-client > div:first-child {
  flex: 1 1 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
}
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
.quick-nav-price {
  text-align: center;
  overflow: hidden;
  padding: 0 4px;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.quick-nav-price-value {
  font-size: 17px;
  font-weight: 700;
  color: var(--metric-green, #8aff2a);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
