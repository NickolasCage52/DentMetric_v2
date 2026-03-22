<template>
  <div class="info-section" :class="{ 'info-section--open': isOpen }">
    <button class="info-section__header" @click="isOpen = !isOpen">
      <span class="info-section__icon">{{ icon }}</span>
      <span class="info-section__title">{{ title }}</span>
      <svg
        class="info-section__chevron"
        :class="{ 'info-section__chevron--open': isOpen }"
        width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
    <Transition name="info-section-body">
      <div v-if="isOpen" class="info-section__body">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title: string;
  icon: string;
  defaultOpen?: boolean;
}>();

const isOpen = ref(props.defaultOpen ?? false);
</script>

<style scoped>
.info-section {
  background: var(--dm-surface-2, #1e1e1e);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}
.info-section--open {
  border-color: rgba(136, 229, 35, 0.15);
}
.info-section__header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  min-height: 48px;
}
.info-section__icon {
  font-size: 18px;
  flex-shrink: 0;
  line-height: 1;
}
.info-section__title {
  flex: 1;
  font-size: 15px;
  font-weight: 700;
  color: var(--dm-text-primary, #fff);
}
.info-section__chevron {
  flex-shrink: 0;
  color: var(--dm-text-secondary, #888);
  transition: transform 0.2s ease;
}
.info-section__chevron--open {
  transform: rotate(90deg);
}
.info-section__body {
  padding: 0 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-section-body-enter-active,
.info-section-body-leave-active {
  transition: opacity 0.15s ease;
}
.info-section-body-enter-from,
.info-section-body-leave-to {
  opacity: 0;
}
</style>
