<template>
  <div class="info-steps">
    <div v-for="(step, i) in steps" :key="i" class="info-step">
      <div class="info-step__number">{{ i + 1 }}</div>
      <div class="info-step__content">
        <p class="info-step__title">{{ step.title }}</p>
        <p v-if="step.desc" class="info-step__desc">{{ step.desc }}</p>
        <InfoNote v-if="step.tip" type="tip" :text="step.tip" />
        <InfoNote v-if="step.warning" type="warning" :text="step.warning" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import InfoNote from './InfoNote.vue';

defineProps<{
  steps: Array<{
    title: string;
    desc?: string;
    tip?: string;
    warning?: string;
  }>;
}>();
</script>

<style scoped>
.info-steps {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.info-step {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.info-step__number {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--dm-accent, #88e523);
  color: #000;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}
.info-step__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.info-step__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--dm-text-primary, #fff);
  margin: 0;
}
.info-step__desc {
  font-size: 13px;
  color: var(--dm-text-secondary, #888);
  margin: 0;
  line-height: 1.5;
}
</style>
