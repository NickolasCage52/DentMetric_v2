<template>
  <div class="summary-panel flex flex-col min-h-0">
    <div
      class="summary-scroll flex-1 min-h-0 overflow-y-auto p-2"
      style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 9rem);"
    >
      <div class="summary-card rounded-xl bg-black/35 border border-white/10 p-4 space-y-2">
        <div class="text-[10px] font-bold text-metric-green uppercase tracking-widest mb-2">Расчёт стоимости</div>
        <div v-if="freeformUsed" class="summary-row flex justify-between text-[11px]">
          <span class="text-gray-400">Форма:</span>
          <span class="text-white font-medium">Произвольная (расчёт по габаритам круга/овала)</span>
        </div>
        <div v-for="(item, idx) in breakdown" :key="idx" class="summary-row flex justify-between text-[11px]">
          <span class="text-gray-400">{{ item.name }}:</span>
          <span class="text-white font-medium">{{ item.value }}</span>
        </div>
        <div class="border-t border-white/10 pt-2 mt-2 flex justify-between">
          <span class="text-metric-green font-bold text-sm">Итог:</span>
          <span data-testid="total-price-graphics" class="text-metric-green font-bold text-lg">{{ formatPrice(totalPrice) }} ₽</span>
        </div>
      </div>

      <div class="summary-comment-card rounded-xl bg-black/35 border border-white/10 p-3 mt-2">
        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Комментарий</div>
        <button
          type="button"
          class="input-row w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]"
          @click="openCommentModal"
        >
          <span class="truncate flex-1">{{ comment ? comment : 'Комментарий к оценке (необязательно)' }}</span>
          <span class="text-gray-500 shrink-0">✎</span>
        </button>
      </div>
    </div>
    <div class="graphics-action-bar space-y-2 shrink-0 p-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
          @click="$emit('back-to-edit')"
          class="flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 bg-metric-green text-black shadow-[0_0_15px_rgba(136,229,35,0.4)] hover:opacity-95 active:opacity-90 transition-opacity min-h-[44px]"
        >
          <span>Вернуться к редактированию</span>
        </button>
      </div>
      <button
        data-testid="btn-save-graphics"
        type="button"
        @click="$emit('save')"
        class="w-full py-3 text-xs font-bold uppercase tracking-widest text-metric-green border border-metric-green/40 rounded-xl transition-all hover:bg-metric-green/10 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="historySaving"
      >
        {{ historySaving ? 'Сохранение...' : 'Сохранить в историю' }}
      </button>
      <!-- Reset button removed per request -->
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const props = defineProps({
  breakdown: { type: Array, default: () => [] },
  totalPrice: { type: Number, default: 0 },
  freeformUsed: { type: Boolean, default: false },
  freeformAreaMm2: { type: Number, default: 0 },
  comment: { type: String, default: '' },
  historySaving: { type: Boolean, default: false }
});

const emit = defineEmits(['back', 'back-to-edit', 'reset', 'update:comment', 'save']);

const openInputModal = inject('openInputModal');

async function openCommentModal() {
  const value = await openInputModal({
    title: 'Комментарий',
    label: 'Комментарий к оценке (необязательно)',
    value: props.comment ?? '',
    multiline: true,
    placeholder: 'Введите комментарий...'
  });
  if (value !== undefined) emit('update:comment', value ?? '');
}

const formatPrice = (v) => new Intl.NumberFormat('ru-RU').format(v);
const formatArea = (v) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(v));
</script>

<style scoped>
@media (max-width: 480px) {
  .summary-panel {
    padding: 0.35rem !important;
  }
  .summary-panel > * + * {
    margin-top: 0.5rem !important;
  }
  .summary-card {
    padding: 0.5rem !important;
  }
  .summary-row {
    font-size: 10px !important;
  }
}
</style>
