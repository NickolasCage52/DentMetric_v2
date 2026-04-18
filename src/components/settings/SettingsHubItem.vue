<template>
  <button type="button" class="hub-item" @click="$emit('click')">
    <div class="hub-item__icon-wrap">
      <span class="hub-item__icon" aria-hidden="true">{{ icon }}</span>
    </div>
    <div class="hub-item__text">
      <span class="hub-item__label">{{ label }}</span>
      <span v-if="description" class="hub-item__desc">{{ description }}</span>
    </div>
    <span v-if="badge" class="hub-item__badge">{{ badge }}</span>
    <span class="hub-item__chevron" aria-hidden="true">›</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  description?: string;
  badge?: string | null;
}>();
defineEmits<{ click: [] }>();
</script>

<style scoped>
.hub-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 16px;
  min-height: 64px;
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--dm-border);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  box-sizing: border-box;
}

.hub-item:active {
  background: var(--dm-surface);
}

.hub-item__icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--dm-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hub-item__icon {
  font-size: 18px;
}

.hub-item__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.hub-item__label {
  font-size: 15px;
  font-weight: 500;
  color: var(--dm-text-primary);
}

.hub-item__desc {
  font-size: 12px;
  color: var(--dm-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hub-item__badge {
  font-size: 10px;
  font-weight: 700;
  background: color-mix(in srgb, var(--dm-accent) 15%, transparent);
  color: var(--dm-accent);
  border: 1px solid color-mix(in srgb, var(--dm-accent) 30%, transparent);
  padding: 2px 7px;
  border-radius: 8px;
  flex-shrink: 0;
}

.hub-item__chevron {
  color: var(--dm-text-secondary);
  font-size: 18px;
  flex-shrink: 0;
}
</style>
