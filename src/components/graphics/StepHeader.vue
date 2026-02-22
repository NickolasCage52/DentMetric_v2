<template>
  <header class="graphics-header shrink-0 flex flex-wrap items-center gap-2 px-2 py-1.5 border-b border-white/10 bg-black/60">
    <button
      type="button"
      @click="$emit('home')"
      class="text-xs text-gray-300 hover:text-white border border-white/10 rounded-lg px-2 py-2 min-h-[36px] flex items-center gap-1"
    >
      <span>←</span>
      <span class="hidden sm:inline">Домой</span>
    </button>
    <img
      src="/dm-small.png"
      alt="DentMetric"
      class="graphics-header-logo h-7 w-auto max-w-full object-contain min-w-0"
      style="border:none;box-shadow:none"
      onerror="this.style.display='none'"
    >
    <div class="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
      <select
        :value="selectedClassId"
        :disabled="lockSelection"
        @change="$emit('update:selectedClassId', ($event.target).value)"
        class="graphics-select flex-1 min-w-0 max-w-[140px] bg-[#151515] border border-[#333] rounded-lg px-2 py-1.5 text-xs text-white focus:border-metric-green/50 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <option value="" disabled class="text-gray-500">Класс автомобиля</option>
        <option v-for="cls in carClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
      </select>
      <select
        :value="selectedPartId"
        :disabled="lockSelection"
        @change="$emit('update:selectedPartId', ($event.target).value)"
        class="graphics-select flex-1 min-w-0 max-w-[160px] bg-[#151515] border border-[#333] rounded-lg px-2 py-1.5 text-xs text-white focus:border-metric-green/50 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <option value="" disabled class="text-gray-500">Элемент кузова</option>
        <option v-for="part in partsList" :key="part.id" :value="part.id">{{ part.name }}</option>
      </select>
    </div>
    <button
      v-if="currentStep > 1"
      type="button"
      @click="$emit('client')"
      class="text-xs text-gray-300 hover:text-white border border-white/10 rounded-lg px-2.5 py-2 min-h-[36px] flex items-center gap-1"
    >
      👤
      <span class="hidden sm:inline">Клиент</span>
    </button>
    <div v-if="showReset" class="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        @click="$emit('reset-dents')"
        class="graphics-reset-btn p-1.5 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-400 transition-colors touch-manipulation"
        aria-label="Сбросить вмятины"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  selectedClassId: { type: String, required: true },
  selectedPartId: { type: String, required: true },
  carClasses: { type: Array, default: () => [] },
  partsList: { type: Array, default: () => [] },
  lockSelection: { type: Boolean, default: false },
  showReset: { type: Boolean, default: true },
  currentStep: { type: Number, default: 1 }
});

defineEmits(['update:selectedClassId', 'update:selectedPartId', 'reset', 'reset-dents', 'home', 'client']);
</script>

<style scoped>
.graphics-header {
  min-height: 44px;
  padding-left: max(8px, env(safe-area-inset-left));
  padding-right: max(8px, env(safe-area-inset-right));
}
@media (max-width: 380px) {
  .graphics-header-logo {
    display: none;
  }
}
</style>
