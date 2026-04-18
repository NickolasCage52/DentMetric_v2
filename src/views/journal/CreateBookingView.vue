<template>
  <div class="create-booking">
    <div class="create-booking__header">
      <button type="button" class="create-booking__back" @click="$emit('back')">← Назад</button>
      <div class="create-booking__title">Новая запись</div>
      <button
        type="button"
        class="create-booking__save"
        :disabled="!canSave"
        @click="handleSave"
      >
        Сохранить
      </button>
    </div>

    <div class="create-booking__scroll">
      <div class="create-booking__section-label">Дата и время</div>
      <div class="create-booking__row">
        <label class="create-booking__label">Дата</label>
        <input v-model="form.date" type="date" class="create-booking__input" />
      </div>
      <div class="create-booking__row">
        <label class="create-booking__label">Начало</label>
        <input v-model="form.startTime" type="time" class="create-booking__input" />
      </div>
      <div class="create-booking__row">
        <label class="create-booking__label">Длительность</label>
        <div class="create-booking__duration-row">
          <button
            v-for="min in [30, 60, 90, 120]"
            :key="min"
            type="button"
            :class="[
              'create-booking__dur-btn',
              form.durationMinutes === min && 'create-booking__dur-btn--active',
            ]"
            @click="setDuration(min)"
          >
            {{ min < 60 ? `${min}м` : `${min / 60}ч` }}
          </button>
        </div>
      </div>

      <div class="create-booking__section-label">Мастер</div>
      <div class="create-booking__row">
        <label class="create-booking__label">Назначить</label>
        <select v-model="form.masterId" class="create-booking__select">
          <option value="">Не назначен</option>
          <option v-for="emp in employeesStore.activeEmployees" :key="emp.id" :value="emp.id">
            {{ emp.name }}
          </option>
        </select>
      </div>

      <div class="create-booking__section-label">Клиент</div>
      <div class="create-booking__row">
        <label class="create-booking__label">Имя</label>
        <input
          v-model="form.client.name"
          type="text"
          placeholder="Имя клиента"
          class="create-booking__input"
        />
      </div>
      <div class="create-booking__row">
        <label class="create-booking__label">Телефон</label>
        <input
          v-model="form.client.phone"
          type="tel"
          placeholder="+7 900 000-00-00"
          class="create-booking__input"
        />
      </div>
      <div class="create-booking__row">
        <label class="create-booking__label">Автомобиль</label>
        <input
          v-model="form.client.brand"
          type="text"
          placeholder="Марка модель"
          class="create-booking__input"
        />
      </div>

      <div class="create-booking__section-label">Услуга</div>
      <div class="create-booking__row">
        <label class="create-booking__label">Название</label>
        <input v-model="form.serviceName" type="text" class="create-booking__input" />
      </div>
      <div class="create-booking__row">
        <label class="create-booking__label">Стоимость</label>
        <input
          v-model.number="form.payment.total"
          type="number"
          placeholder="0"
          class="create-booking__input"
        />
      </div>

      <div class="create-booking__section-label">Комментарий</div>
      <div class="create-booking__row create-booking__row--col">
        <textarea
          v-model="form.comment"
          class="create-booking__textarea"
          placeholder="Заметки о записи..."
          rows="3"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue';
import { useBookingsStore } from '@/stores/bookings';
import { useEmployeesStore } from '@/stores/employees';
import { createDefaultBooking, type Booking } from '@/types/booking';

const props = defineProps<{
  date: string;
  startTime: string;
  masterId?: string;
}>();

const emit = defineEmits<{
  back: [];
  saved: [id: string];
}>();

const bookingsStore = useBookingsStore();
const employeesStore = useEmployeesStore();

type FormShape = Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>;

const form = reactive<FormShape>({} as FormShape);

function resetForm() {
  const mn = props.masterId ? employeesStore.getById(props.masterId)?.name : undefined;
  const base = createDefaultBooking(props.date, props.startTime, props.masterId, mn);
  const next: FormShape = {
    ...base,
    masterId: props.masterId || undefined,
    masterName: mn,
    client: { name: '', phone: '', brand: '' },
    payment: { total: 0, paid: 0 },
    comment: '',
  };
  Object.assign(form, next);
  setDuration(base.durationMinutes);
}

watch(
  () => [props.date, props.startTime, props.masterId] as const,
  () => resetForm(),
  { immediate: true }
);

const canSave = computed(() => Boolean(form.date && form.startTime && form.serviceName));

function setDuration(minutes: number) {
  form.durationMinutes = minutes;
  const [h, m] = form.startTime.split(':').map(Number);
  const startMin = (Number.isFinite(h) ? h : 9) * 60 + (Number.isFinite(m) ? m : 0);
  const endTotal = Math.min(startMin + minutes, 23 * 60 + 59);
  const eh = Math.floor(endTotal / 60);
  const em = endTotal % 60;
  form.endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

function handleSave() {
  const mid = form.masterId && String(form.masterId).trim() ? String(form.masterId) : undefined;
  const masterEmp = mid ? employeesStore.getById(mid) : undefined;
  const booking = bookingsStore.addBooking({
    ...form,
    masterId: mid,
    masterName: masterEmp?.name ?? form.masterName,
  });
  emit('saved', booking.id);
}
</script>

<style scoped>
.create-booking {
  position: fixed;
  inset: 0;
  background: var(--dm-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 210;
}
.create-booking__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--dm-border);
  flex-shrink: 0;
  gap: 8px;
}
.create-booking__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}
.create-booking__title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary);
}
.create-booking__save {
  background: transparent;
  border: none;
  color: var(--dm-accent);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  min-height: 44px;
}
.create-booking__save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.create-booking__scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 32px;
}
.create-booking__section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--dm-text-secondary);
  padding: 14px 16px 4px;
}
.create-booking__row {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 0 16px;
  gap: 12px;
  border-bottom: 1px solid var(--dm-border);
}
.create-booking__row--col {
  flex-direction: column;
  align-items: stretch;
  padding: 12px 16px;
}
.create-booking__label {
  font-size: 14px;
  color: var(--dm-text-secondary);
  min-width: 100px;
  flex-shrink: 0;
}
.create-booking__input,
.create-booking__select {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--dm-border);
  color: var(--dm-text-primary);
  font-size: 15px;
  text-align: right;
  outline: none;
  padding: 4px 0;
  min-height: 44px;
  -webkit-appearance: none;
}
.create-booking__select option {
  background: var(--dm-surface);
}
.create-booking__duration-row {
  display: flex;
  gap: 6px;
  margin-left: auto;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.create-booking__dur-btn {
  padding: 6px 12px;
  border: 1px solid var(--dm-border);
  border-radius: 20px;
  background: transparent;
  color: var(--dm-text-secondary);
  font-size: 13px;
  cursor: pointer;
  min-height: 36px;
  transition: all 0.15s;
}
.create-booking__dur-btn--active {
  border-color: var(--dm-accent);
  color: var(--dm-accent);
}
.create-booking__textarea {
  background: var(--dm-surface);
  border: 1px solid var(--dm-border);
  border-radius: 10px;
  color: var(--dm-text-primary);
  font-size: 14px;
  padding: 10px 12px;
  outline: none;
  resize: none;
  width: 100%;
  box-sizing: border-box;
}
</style>
