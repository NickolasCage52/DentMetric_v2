<template>
  <button
    type="button"
    class="w-full rounded-xl px-4 py-3 min-h-[48px] flex items-center justify-between gap-3 border transition-colors touch-manipulation"
    :class="active ? 'bg-[#1a1a1a] border-metric-green/40 text-white' : 'bg-[#151515] border-white/10 text-gray-200 hover:border-white/15'"
    @click="emit('click')"
  >
    <div class="min-w-0 flex-1">
      <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">
        {{ label }}
      </div>
      <div class="text-[14px] font-semibold truncate" :class="valueText ? 'text-white' : 'text-gray-500'">
        {{ valueText || placeholder }}
      </div>
    </div>
    <div class="shrink-0 flex items-center gap-2">
      <div
        v-if="showCheck && active"
        class="w-5 h-5 rounded-full border border-metric-green/40 bg-metric-green/15 text-metric-green flex items-center justify-center text-[12px] leading-none"
        aria-hidden="true"
        title="Заполнено"
      >
        ✓
      </div>
      <slot name="right" />
      <svg class="w-3.5 h-3.5 text-metric-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path>
      </svg>
    </div>
  </button>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  valueText: { type: String, default: '' },
  placeholder: { type: String, default: '—' },
  active: { type: Boolean, default: false },
  showCheck: { type: Boolean, default: false }
});
const emit = defineEmits(['click']);
</script>

