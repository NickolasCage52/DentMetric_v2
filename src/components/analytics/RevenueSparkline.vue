<template>
  <div class="sparkline">
    <svg
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      class="sparkline__svg"
      preserveAspectRatio="none"
    >
      <path v-if="areaPath" :d="areaPath" class="sparkline__area" />
      <polyline v-if="linePoints" :points="linePoints" class="sparkline__line" />
      <circle
        v-if="lastPoint"
        :cx="lastPoint.x"
        :cy="lastPoint.y"
        r="4"
        class="sparkline__dot"
      />
    </svg>
    <div class="sparkline__labels">
      <span
        v-for="(d, i) in data"
        :key="i"
        class="sparkline__label"
        :style="{ opacity: i % 2 === 0 ? 1 : 0 }"
      >
        {{ d.week }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  data: Array<{ week: string; amount: number }>;
}>();

const WIDTH = 300;
const HEIGHT = 80;
const PADDING = 8;

const points = computed(() => {
  if (!props.data.length) return [];
  const max = Math.max(...props.data.map((d) => d.amount), 1);
  const denom = Math.max(props.data.length - 1, 1);
  return props.data.map((d, i) => ({
    x: PADDING + (i / denom) * (WIDTH - PADDING * 2),
    y: HEIGHT - PADDING - (d.amount / max) * (HEIGHT - PADDING * 2),
    amount: d.amount,
  }));
});

const linePoints = computed(() => points.value.map((p) => `${p.x},${p.y}`).join(' '));

const areaPath = computed(() => {
  if (!points.value.length) return '';
  const pts = points.value;
  const first = pts[0];
  const last = pts[pts.length - 1];
  const line = pts.map((p) => `${p.x},${p.y}`).join(' L ');
  return `M ${first.x},${HEIGHT - PADDING} L ${line} L ${last.x},${HEIGHT - PADDING} Z`;
});

const lastPoint = computed(() => points.value[points.value.length - 1]);
</script>

<style scoped>
.sparkline {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sparkline__svg {
  width: 100%;
  height: 80px;
}
.sparkline__area {
  fill: color-mix(in srgb, var(--dm-accent, #a0e040) 14%, transparent);
  stroke: none;
}
.sparkline__line {
  fill: none;
  stroke: var(--dm-accent, #a0e040);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.sparkline__dot {
  fill: var(--dm-accent, #a0e040);
}
.sparkline__labels {
  display: flex;
  justify-content: space-between;
}
.sparkline__label {
  font-size: 9px;
  color: var(--dm-text-secondary, #888);
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
