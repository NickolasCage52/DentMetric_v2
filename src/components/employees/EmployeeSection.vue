<template>
  <div class="emp-section">
    <div class="emp-section__label">{{ label }}</div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>();
</script>

<style scoped>
.emp-section {
  border-top: 1px solid var(--dm-border);
}

.emp-section__label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--dm-text-secondary);
  padding: 12px 16px 4px;
}
</style>
