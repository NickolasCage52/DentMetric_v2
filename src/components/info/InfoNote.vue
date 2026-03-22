<template>
  <div class="info-note" :class="`info-note--${type}`">
    <span class="info-note__icon">{{ iconMap[type] }}</span>
    <span class="info-note__text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  type: 'tip' | 'warning' | 'error';
  text: string;
}>();

const iconMap: Record<string, string> = {
  tip: '💡',
  warning: '⚠️',
  error: '❌',
};
</script>

<style scoped>
.info-note {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.5;
}
.info-note--tip {
  background: rgba(136, 229, 35, 0.08);
  color: var(--dm-accent, #a0e040);
}
.info-note--warning {
  background: rgba(255, 160, 0, 0.08);
  color: #ffa000;
}
.info-note--error {
  background: rgba(229, 57, 53, 0.08);
  color: var(--dm-danger, #e53935);
}
.info-note__icon {
  flex-shrink: 0;
  font-size: 16px;
  margin-top: 1px;
  line-height: 1;
}
.info-note__text {
  flex: 1;
}
</style>
