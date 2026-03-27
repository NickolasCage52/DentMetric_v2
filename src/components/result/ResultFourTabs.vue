<template>
  <div ref="rootRef" class="rf-tabs">
    <!-- Как hs-range-tabs в истории: единая рамка, сегменты без зазоров -->
    <div class="rf-tabs__bar-row">
      <div
        class="rf-tabs__segmented"
        role="tablist"
        aria-label="Разделы записи"
      >
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          role="tab"
          :aria-selected="modelValue === t.id"
          class="rf-tabs__segment"
          :class="{ 'rf-tabs__segment--active': modelValue === t.id }"
          :data-testid="'record-tab-' + t.id"
          @click="$emit('update:modelValue', t.id)"
        >
          {{ t.label }}
        </button>
      </div>
    </div>
    <!-- Контент; свайп вешаем на корень .rf-tabs (включая скролл родителя — capture в composable) -->
    <div
      class="rf-tabs__panels"
      data-testid="record-detail-panels"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useSwipeNavigation } from '../../composables/useSwipeNavigation';

const TAB_IDS = ['calculation', 'client', 'files', 'demo'];

const props = defineProps({
  modelValue: { type: String, default: 'calculation' }
});

const emit = defineEmits(['update:modelValue']);

const tabs = [
  { id: 'calculation', label: 'Расчёт' },
  { id: 'client', label: 'Клиент' },
  { id: 'files', label: 'Файлы' },
  { id: 'demo', label: 'Демонстрация' }
];

const rootRef = ref(null);

useSwipeNavigation(rootRef, {
  minSwipeDistance: 36,
  maxVerticalRatio: 0.92,
  onSwipeLeft: () => {
    const i = TAB_IDS.indexOf(props.modelValue);
    if (i >= 0 && i < TAB_IDS.length - 1) emit('update:modelValue', TAB_IDS[i + 1]);
  },
  onSwipeRight: () => {
    const i = TAB_IDS.indexOf(props.modelValue);
    if (i > 0) emit('update:modelValue', TAB_IDS[i - 1]);
  }
});
</script>

<style scoped>
.rf-tabs {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
}
.rf-tabs__bar-row {
  flex-shrink: 0;
  padding: 4px 0 10px;
}
/* Визуально как .hs-range-tabs + .hs-range-tab в HistoryScreen */
.rf-tabs__segmented {
  display: flex;
  width: 100%;
  min-width: 0;
  gap: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.rf-tabs__segment {
  flex: 1 1 0;
  min-width: 0;
  margin: 0;
  padding: 9px 2px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  text-transform: none;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  color: #9ca3af;
  cursor: pointer;
  touch-action: manipulation;
  transition: background 0.15s ease, color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.rf-tabs__segment--active {
  background: #88e523;
  color: #000;
}
.rf-tabs__segment:focus-visible {
  outline: 2px solid rgba(136, 229, 35, 0.55);
  outline-offset: 2px;
  z-index: 1;
}
.rf-tabs__panels {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  touch-action: pan-y;
}
</style>
