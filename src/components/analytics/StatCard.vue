<template>
  <div class="stat-card" :class="{ 'stat-card--highlight': highlight }">
    <div v-if="icon" class="stat-card__icon" aria-hidden="true">{{ icon }}</div>
    <div class="stat-card__label">{{ label }}</div>
    <div class="stat-card__value">{{ value }}</div>
    <div v-if="sub" class="stat-card__sub">{{ sub }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  icon?: string;
  sub?: string;
  highlight?: boolean;
}>();
</script>

<style scoped>
.stat-card {
  background: var(--dm-surface, #161616);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 14px;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-card--highlight {
  border-color: color-mix(in srgb, var(--dm-accent, #a0e040) 35%, var(--dm-border));
  background: color-mix(in srgb, var(--dm-accent, #a0e040) 8%, var(--dm-surface));
}
.stat-card__icon {
  font-size: 18px;
}
.stat-card__label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--dm-text-secondary, #888);
}
.stat-card__value {
  font-size: 20px;
  font-weight: 800;
  color: var(--dm-text-primary, #fff);
}
.stat-card__sub {
  font-size: 11px;
  color: var(--dm-text-secondary, #888);
}
</style>
