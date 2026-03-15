<template>
  <div class="detail-progress-dots">
    <div
      v-for="(step, i) in steps"
      :key="i"
      class="detail-progress-dot"
      :class="{
        'detail-progress-dot--done': i < currentIndex,
        'detail-progress-dot--active': i === currentIndex,
        'detail-progress-dot--pending': i > currentIndex,
      }"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  steps: string[];
  currentIndex: number;
}>();
</script>

<style scoped>
.detail-progress-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 2px 0;
  height: 18px;
  flex-shrink: 0;
}
.detail-progress-dot {
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.2s ease;
}
.detail-progress-dot--done {
  width: 6px;
  height: 6px;
  background: var(--dm-accent, #a0e040);
  opacity: 0.6;
}
.detail-progress-dot--active {
  width: 22px;
  height: 6px;
  border-radius: 3px;
  background: var(--dm-accent, #a0e040);
}
.detail-progress-dot--pending {
  width: 6px;
  height: 6px;
  background: var(--dm-border, #2a2a2a);
}
</style>
