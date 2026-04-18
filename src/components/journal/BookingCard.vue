<template>
  <div
    class="bk-card"
    :style="cardStyle"
    @click.stop="$emit('click')"
  >
    <div class="bk-card__time">
      {{ booking.startTime }} – {{ booking.endTime }}
    </div>
    <div class="bk-card__client">
      {{ clientName }}
    </div>
    <div class="bk-card__service">{{ booking.serviceName }}</div>
    <div v-if="booking.estimateTotal" class="bk-card__price">
      {{ priceLabel }}
    </div>
    <div v-if="booking.client.isNew" class="bk-card__new-badge">
      Новый
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Booking } from '@/types/booking';
import { BOOKING_STATUS_COLORS } from '@/types/booking';

const props = defineProps<{
  booking: Booking;
  gridStartHour: number;
  slotHeight: number;
}>();

defineEmits<{ click: [] }>();

const cardStyle = computed(() => {
  const [sh, sm] = props.booking.startTime.split(':').map(Number);
  const [eh, em] = props.booking.endTime.split(':').map(Number);
  const startMinutes = sh * 60 + sm - props.gridStartHour * 60;
  const endMinutes = eh * 60 + em - props.gridStartHour * 60;
  const top = (startMinutes / 60) * props.slotHeight;
  const height = Math.max(((endMinutes - startMinutes) / 60) * props.slotHeight, 28);
  const color = BOOKING_STATUS_COLORS[props.booking.status];
  return {
    position: 'absolute' as const,
    top: `${top}px`,
    left: '3px',
    right: '3px',
    height: `${height}px`,
    background: `color-mix(in srgb, ${color} 18%, transparent)`,
    borderLeft: `3px solid ${color}`,
    borderRadius: '6px',
    overflow: 'hidden',
    zIndex: 1,
    cursor: 'pointer',
  };
});

const clientName = computed(() =>
  props.booking.client.name ||
  props.booking.client.phone ||
  'Клиент не указан'
);

const priceLabel = computed(() => {
  const n = props.booking.estimateTotal;
  if (n == null) return '';
  return `${n.toLocaleString('ru-RU')}\u00a0\u20bd`;
});
</script>

<style scoped>
.bk-card {
  padding: 3px 5px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.bk-card__time {
  font-size: 9px;
  font-weight: 700;
  color: var(--dm-text-secondary, #888);
  white-space: nowrap;
}
.bk-card__client {
  font-size: 11px;
  font-weight: 600;
  color: var(--dm-text-primary, #fff);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bk-card__service {
  font-size: 10px;
  color: var(--dm-text-secondary, #888);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bk-card__price {
  font-size: 10px;
  font-weight: 600;
  color: var(--dm-accent, #a0e040);
}
.bk-card__new-badge {
  position: absolute;
  top: 3px;
  right: 4px;
  font-size: 8px;
  font-weight: 700;
  background: var(--dm-accent, #a0e040);
  color: #000;
  padding: 1px 5px;
  border-radius: 6px;
}
</style>
