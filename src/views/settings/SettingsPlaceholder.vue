<template>
  <div class="settings-placeholder">
    <div class="settings-placeholder__header">
      <button type="button" class="settings-placeholder__back" @click="$emit('back')">
        ← Назад
      </button>
      <div class="settings-placeholder__title">{{ title }}</div>
    </div>
    <div class="settings-placeholder__body">
      <div class="settings-placeholder__icon" aria-hidden="true">{{ icon }}</div>
      <div class="settings-placeholder__text">
        {{ message || 'Этот раздел появится в следующем обновлении' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; message?: string }>();
defineEmits<{ back: [] }>();

const icon = '\u{1F6A7}';
</script>

<style scoped>
.settings-placeholder {
  position: fixed;
  inset: 0;
  background: var(--dm-bg);
  display: flex;
  flex-direction: column;
  z-index: 220;
}

.settings-placeholder__header {
  display: flex;
  align-items: center;
  padding: 16px;
  padding-top: max(16px, env(safe-area-inset-top, 0px));
  border-bottom: 1px solid var(--dm-border);
  gap: 8px;
}

.settings-placeholder__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
}

.settings-placeholder__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary);
}

.settings-placeholder__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
}

.settings-placeholder__icon {
  font-size: 48px;
}

.settings-placeholder__text {
  font-size: 16px;
  color: var(--dm-text-secondary);
  text-align: center;
}
</style>
