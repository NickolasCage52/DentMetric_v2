<template>
  <div class="emp-row">
    <span class="emp-row__label">{{ label }}</span>
    <input
      v-if="editing"
      :value="value"
      :type="type || 'text'"
      :placeholder="placeholder"
      class="emp-row__input"
      @input="onInput"
    >
    <span v-else class="emp-row__value">{{ displayValue }}</span>
    <slot name="suffix" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  label: string;
  value?: string | number;
  editing: boolean;
  type?: string;
  placeholder?: string;
}>();

const emit = defineEmits<{ update: [value: string] }>();

const displayValue = computed(() => {
  if (props.value === '' || props.value === null || props.value === undefined) return '—';
  return props.value;
});

function onInput(e: Event) {
  emit('update', (e.target as HTMLInputElement).value);
}
</script>

<style scoped>
.emp-row {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 0 16px;
  gap: 12px;
  border-bottom: 1px solid var(--dm-border);
  box-sizing: border-box;
}

.emp-row__label {
  font-size: 14px;
  color: var(--dm-text-secondary);
  min-width: 120px;
  flex-shrink: 0;
}

.emp-row__value {
  flex: 1;
  font-size: 14px;
  color: var(--dm-text-primary);
  text-align: right;
  word-break: break-word;
}

.emp-row__input {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--dm-accent);
  color: var(--dm-text-primary);
  font-size: 14px;
  text-align: right;
  outline: none;
  padding: 4px 0;
  min-height: 44px;
  box-sizing: border-box;
}
</style>
