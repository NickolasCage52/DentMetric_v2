<template>
  <div class="segmented-wrap rounded-xl bg-black/35 border border-white/10 p-1 flex gap-1">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="segmented-btn flex-1 min-w-0 rounded-lg px-3 py-2.5 min-h-[44px] text-xs font-bold uppercase tracking-widest transition-all touch-manipulation"
      :class="modelValue === opt.value ? 'bg-metric-green text-black shadow-[0_0_15px_rgba(136,229,35,0.35)]' : 'bg-[#151515] text-gray-400 hover:text-gray-200'"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: null },
  options: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:modelValue']);
</script>

