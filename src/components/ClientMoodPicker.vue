<template>
  <div class="mood-picker">
    <div class="mood-picker__label">АДЕКВАТНОСТЬ КЛИЕНТА</div>
    <div class="mood-picker__row">
      <button
        v-for="m in MOODS"
        :key="m.key"
        type="button"
        class="mood-btn"
        :class="[
          `mood-btn--${m.color}`,
          { 'mood-btn--active': modelValue === m.key }
        ]"
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
  { key: 'good', emoji: '😊', label: 'Хороший клиент', color: 'green' },
  { key: 'neutral', emoji: '😐', label: 'Нейтральный', color: 'yellow' },
  { key: 'bad', emoji: '😠', label: 'Сложный клиент', color: 'red' }
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
  padding: 6px;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.mood-btn--green { background: rgba(76, 175, 80, 0.2); }
.mood-btn--green.mood-btn--active { background: rgba(76, 175, 80, 0.35); box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.6); }
.mood-btn--yellow { background: rgba(255, 193, 7, 0.2); }
.mood-btn--yellow.mood-btn--active { background: rgba(255, 193, 7, 0.35); box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.6); }
.mood-btn--red { background: rgba(229, 57, 53, 0.2); }
.mood-btn--red.mood-btn--active { background: rgba(229, 57, 53, 0.35); box-shadow: 0 0 0 2px rgba(229, 57, 53, 0.6); }
.mood-btn:not(.mood-btn--active) {
  opacity: 0.7;
}
.mood-btn--active {
  transform: scale(1.18);
  opacity: 1;
}
</style>
