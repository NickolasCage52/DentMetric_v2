<template>
  <div class="notif-toggle">
    <div class="notif-toggle__text">
      <div class="notif-toggle__label">{{ label }}</div>
      <div v-if="description" class="notif-toggle__desc">{{ description }}</div>
    </div>
    <label class="notif-toggle__switch">
      <input
        type="checkbox"
        :checked="value"
        @change="
          $emit('update', ($event.target as HTMLInputElement).checked)
        "
      />
      <span class="notif-toggle__track" />
    </label>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  label: string;
  value: boolean;
  description?: string;
}>();
defineEmits<{ update: [value: boolean] }>();
</script>
<style scoped>
.notif-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--dm-border);
}
.notif-toggle__text {
  flex: 1;
}
.notif-toggle__label {
  font-size: 15px;
  color: var(--dm-text-primary);
}
.notif-toggle__desc {
  font-size: 12px;
  color: var(--dm-text-secondary);
  margin-top: 2px;
}
.notif-toggle__switch {
  position: relative;
  width: 50px;
  height: 28px;
  flex-shrink: 0;
}
.notif-toggle__switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.notif-toggle__track {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: var(--dm-border);
  cursor: pointer;
  transition: background 0.2s;
}
.notif-toggle__switch input:checked + .notif-toggle__track {
  background: var(--dm-accent);
}
.notif-toggle__track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: hsl(0 0% 100%);
  transition: transform 0.2s;
}
.notif-toggle__switch input:checked + .notif-toggle__track::after {
  transform: translateX(22px);
}
</style>
