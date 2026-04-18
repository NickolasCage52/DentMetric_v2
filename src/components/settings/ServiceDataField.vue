<template>
  <div class="sdf">
    <span class="sdf__label">
      {{ label }}
      <span v-if="required" class="sdf__required">*</span>
    </span>
    <textarea
      v-if="multiline"
      :value="modelValue"
      :placeholder="placeholder"
      class="sdf__textarea"
      rows="2"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <input
      v-else
      :value="modelValue"
      :type="type || 'text'"
      :placeholder="placeholder"
      class="sdf__input"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  modelValue?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
}>();
defineEmits<{ 'update:modelValue': [v: string] }>();
</script>

<style scoped>
.sdf {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 0 16px;
  gap: 12px;
  border-bottom: 1px solid var(--dm-border);
}
.sdf__label {
  font-size: 14px;
  color: var(--dm-text-secondary);
  min-width: 120px;
  flex-shrink: 0;
}
.sdf__required {
  color: var(--dm-danger);
}
.sdf__input {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  color: var(--dm-text-primary);
  font-size: 14px;
  text-align: right;
  outline: none;
  padding: 4px 0;
  min-height: 44px;
}
.sdf__input:focus {
  border-bottom-color: var(--dm-accent);
}
.sdf__textarea {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  color: var(--dm-text-primary);
  font-size: 14px;
  text-align: right;
  outline: none;
  padding: 8px 0;
  resize: none;
  line-height: 1.4;
}
.sdf__textarea:focus {
  border-bottom-color: var(--dm-accent);
}
</style>
