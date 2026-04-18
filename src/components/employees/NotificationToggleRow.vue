<template>
  <div class="notif-row">
    <span class="notif-row__label">{{ label }}</span>
    <label v-if="editing" class="notif-row__toggle">
      <input type="checkbox" :checked="value" @change="onChange">
      <span class="notif-row__track" />
    </label>
    <span v-else class="notif-row__value">{{ value ? 'Вкл' : 'Выкл' }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: boolean; editing: boolean }>();
const emit = defineEmits<{ update: [value: boolean] }>();

function onChange(e: Event) {
  emit('update', (e.target as HTMLInputElement).checked);
}
</script>

<style scoped>
.notif-row {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 0 16px;
  gap: 12px;
  border-bottom: 1px solid var(--dm-border);
  box-sizing: border-box;
}

.notif-row__label {
  flex: 1;
  font-size: 14px;
  color: var(--dm-text-primary);
}

.notif-row__value {
  font-size: 13px;
  color: var(--dm-text-secondary);
}

.notif-row__toggle {
  position: relative;
  width: 44px;
  height: 26px;
  flex-shrink: 0;
}

.notif-row__toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.notif-row__track {
  position: absolute;
  inset: 0;
  border-radius: 13px;
  background: var(--dm-border);
  cursor: pointer;
  transition: background 0.2s;
}

.notif-row__toggle input:checked + .notif-row__track {
  background: var(--dm-accent);
}

.notif-row__track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--dm-text-primary);
  transition: transform 0.2s;
}

.notif-row__toggle input:checked + .notif-row__track::after {
  transform: translateX(18px);
}
</style>
