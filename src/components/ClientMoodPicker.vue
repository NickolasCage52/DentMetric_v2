<template>
  <div class="mood-picker">
    <div class="mood-picker__label">АДЕКВАТНОСТЬ КЛИЕНТА</div>
    <div class="mood-picker__row">
      <button
        v-for="m in MOODS"
        :key="m.key"
        type="button"
        class="mood-btn"
        :class="{ 'mood-btn--active': modelValue === m.key }"
        @click="$emit('update:modelValue', m.key)"
        :title="m.label"
      >
        {{ m.emoji }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: null }
});
defineEmits(['update:modelValue']);

const MOODS = [
  { key: 'good', emoji: '😊', label: 'Хороший клиент' },
  { key: 'neutral', emoji: '😐', label: 'Нейтральный' },
  { key: 'bad', emoji: '😠', label: 'Сложный клиент' }
];
</script>

<style scoped>
.mood-picker__label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #666;
  margin-bottom: 12px;
}
.mood-picker__row {
  display: flex;
  gap: 14px;
}
.mood-btn {
  background: none;
  border: none;
  padding: 4px;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
  filter: grayscale(1) opacity(0.4);
  transition: filter 0.15s ease, transform 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}
.mood-btn--active {
  filter: none;
  transform: scale(1.18);
}
</style>
