<template>
  <div class="schedule-editor">
    <div class="schedule-editor__row schedule-editor__row--days">
      <span class="schedule-editor__label">Рабочие дни</span>
      <div class="schedule-editor__days">
        <button
          v-for="day in ALL_DAYS"
          :key="day.id"
          type="button"
          :class="[
            'schedule-editor__day',
            modelValue.workDays.includes(day.id) && 'schedule-editor__day--active',
          ]"
          :disabled="!editing"
          @click="editing && toggleDay(day.id)"
        >
          {{ day.short }}
        </button>
      </div>
    </div>

    <div class="schedule-editor__row">
      <span class="schedule-editor__label">Начало работы</span>
      <input
        v-if="editing"
        type="time"
        :value="modelValue.startTime"
        class="schedule-editor__time-input"
        @change="patch({ startTime: ($event.target as HTMLInputElement).value })"
      >
      <span v-else class="schedule-editor__value">{{ modelValue.startTime }}</span>
    </div>

    <div class="schedule-editor__row">
      <span class="schedule-editor__label">Конец работы</span>
      <input
        v-if="editing"
        type="time"
        :value="modelValue.endTime"
        class="schedule-editor__time-input"
        @change="patch({ endTime: ($event.target as HTMLInputElement).value })"
      >
      <span v-else class="schedule-editor__value">{{ modelValue.endTime }}</span>
    </div>

    <div class="schedule-editor__row">
      <span class="schedule-editor__label">Слот записи</span>
      <div v-if="editing" class="schedule-editor__slots">
        <button
          v-for="min in SLOT_OPTIONS"
          :key="min"
          type="button"
          :class="[
            'schedule-editor__slot-btn',
            modelValue.slotDurationMinutes === min && 'schedule-editor__slot-btn--active',
          ]"
          @click="patch({ slotDurationMinutes: min })"
        >
          {{ min }} мин
        </button>
      </div>
      <span v-else class="schedule-editor__value">{{ modelValue.slotDurationMinutes }} мин</span>
    </div>

    <div class="schedule-editor__row">
      <span class="schedule-editor__label">График до</span>
      <input
        v-if="editing"
        type="date"
        :value="filledUntilInput"
        class="schedule-editor__date-input"
        @change="onFilledUntilChange"
      >
      <span v-else class="schedule-editor__value">{{ filledUntilDisplay }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { WorkSchedule, DayOfWeek } from '@/types/employee';

const props = defineProps<{
  modelValue: WorkSchedule;
  editing: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: WorkSchedule];
}>();

const ALL_DAYS = [
  { id: 'mon' as DayOfWeek, short: 'Пн' },
  { id: 'tue' as DayOfWeek, short: 'Вт' },
  { id: 'wed' as DayOfWeek, short: 'Ср' },
  { id: 'thu' as DayOfWeek, short: 'Чт' },
  { id: 'fri' as DayOfWeek, short: 'Пт' },
  { id: 'sat' as DayOfWeek, short: 'Сб' },
  { id: 'sun' as DayOfWeek, short: 'Вс' },
];

const SLOT_OPTIONS = [30, 60, 90, 120] as const;

function patch(part: Partial<WorkSchedule>) {
  emit('update:modelValue', { ...props.modelValue, ...part });
}

function toggleDay(day: DayOfWeek) {
  const days = props.modelValue.workDays.includes(day)
    ? props.modelValue.workDays.filter((d) => d !== day)
    : [...props.modelValue.workDays, day];
  patch({ workDays: days });
}

const filledUntilInput = computed(() => {
  const iso = props.modelValue.filledUntil;
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
});

const filledUntilDisplay = computed(() => {
  if (!props.modelValue.filledUntil) return '—';
  return new Date(props.modelValue.filledUntil).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'numeric',
    year: '2-digit',
  });
});

function onFilledUntilChange(e: Event) {
  const v = (e.target as HTMLInputElement).value;
  if (!v) {
    patch({ filledUntil: undefined });
    return;
  }
  const d = new Date(v + 'T12:00:00');
  patch({ filledUntil: Number.isNaN(d.getTime()) ? undefined : d.toISOString() });
}
</script>

<style scoped>
.schedule-editor__row {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 8px 16px;
  gap: 12px;
  border-bottom: 1px solid var(--dm-border);
  flex-wrap: wrap;
  box-sizing: border-box;
}

.schedule-editor__row--days {
  align-items: flex-start;
}

.schedule-editor__label {
  font-size: 14px;
  color: var(--dm-text-secondary);
  min-width: 120px;
  flex-shrink: 0;
}

.schedule-editor__value {
  font-size: 14px;
  color: var(--dm-text-primary);
  margin-left: auto;
  text-align: right;
}

.schedule-editor__days {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-left: auto;
  justify-content: flex-end;
  flex: 1;
  min-width: 0;
}

.schedule-editor__day {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--dm-surface-2);
  border: 1px solid var(--dm-border);
  color: var(--dm-text-secondary);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.schedule-editor__day--active {
  background: var(--dm-accent);
  border-color: var(--dm-accent);
  color: #000;
}

.schedule-editor__day:disabled {
  cursor: default;
  opacity: 0.85;
}

.schedule-editor__time-input,
.schedule-editor__date-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--dm-accent);
  color: var(--dm-text-primary);
  font-size: 15px;
  outline: none;
  min-height: 44px;
  margin-left: auto;
  padding: 4px 0;
  max-width: 160px;
  text-align: right;
  cursor: pointer;
}

.schedule-editor__slots {
  display: flex;
  gap: 6px;
  margin-left: auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: 1;
}

.schedule-editor__slot-btn {
  padding: 6px 10px;
  border: 1px solid var(--dm-border);
  border-radius: 20px;
  background: transparent;
  color: var(--dm-text-secondary);
  font-size: 12px;
  cursor: pointer;
  min-height: 36px;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.schedule-editor__slot-btn--active {
  border-color: var(--dm-accent);
  color: var(--dm-accent);
  background: color-mix(in srgb, var(--dm-accent) 10%, transparent);
}
</style>
