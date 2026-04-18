<template>
  <div class="profile-field">
    <span class="profile-field__label">{{ label }}</span>
    <input
      v-if="editing"
      :value="value"
      :type="type || 'text'"
      :placeholder="placeholder"
      class="profile-field__input"
      @input="onInput"
    >
    <span v-else class="profile-field__value">{{ displayValue }}</span>
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
.profile-field {
  display: flex;
  align-items: center;
  padding: 0 16px;
  min-height: 52px;
  border-bottom: 1px solid var(--dm-border);
  gap: 12px;
  box-sizing: border-box;
}

.profile-field__label {
  font-size: 14px;
  color: var(--dm-text-secondary);
  min-width: 120px;
  flex-shrink: 0;
}

.profile-field__value {
  flex: 1;
  font-size: 14px;
  color: var(--dm-text-primary);
  text-align: right;
  word-break: break-word;
}

.profile-field__input {
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
