<template>
  <div class="faq-item" :class="{ 'faq-item--open': isOpen }">
    <button class="faq-item__question" @click="isOpen = !isOpen">
      <span class="faq-item__q-text">{{ question }}</span>
      <svg
        class="faq-item__chevron"
        :class="{ 'faq-item__chevron--open': isOpen }"
        width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
    <Transition name="faq-body">
      <div v-if="isOpen" class="faq-item__answer">
        <p>{{ answer }}</p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  question: string;
  answer: string;
}>();

const isOpen = ref(false);
</script>

<style scoped>
.faq-item {
  background: var(--dm-surface-2, #1e1e1e);
  border-radius: 10px;
  overflow: hidden;
  border-left: 3px solid transparent;
  transition: border-color 0.2s;
}
.faq-item--open {
  border-left-color: var(--dm-accent, #88e523);
}
.faq-item__question {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 13px 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  min-height: 44px;
}
.faq-item__q-text {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--dm-text-primary, #fff);
  line-height: 1.4;
}
.faq-item__chevron {
  flex-shrink: 0;
  color: var(--dm-text-secondary, #888);
  transition: transform 0.2s ease;
  margin-top: 2px;
}
.faq-item__chevron--open {
  transform: rotate(90deg);
}
.faq-item__answer {
  padding: 0 14px 13px;
  font-size: 13px;
  color: var(--dm-text-secondary, #aaa);
  line-height: 1.6;
}
.faq-item__answer p {
  margin: 0;
}

.faq-body-enter-active,
.faq-body-leave-active {
  transition: opacity 0.15s ease;
}
.faq-body-enter-from,
.faq-body-leave-to {
  opacity: 0;
}
</style>
