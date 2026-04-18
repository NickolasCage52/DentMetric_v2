<template>
  <div class="journal">
    <div class="journal__header">
      <button type="button" class="journal__back" @click="$emit('back')">← Назад</button>
      <div class="journal__title">Журнал записи</div>
      <div class="journal__header-actions" />
    </div>

    <div class="journal__date-bar">
      <button type="button" class="journal__date-view-btn" disabled>День &#9660;</button>
      <div class="journal__date-display">{{ formattedSelectedDate }}</div>
      <button type="button" class="journal__date-nav" @click="navigateDate(-1)">←</button>
      <button type="button" class="journal__date-nav" @click="navigateDate(1)">→</button>
    </div>

    <div class="journal__day-strip">
      <button
        v-for="day in dayStrip"
        :key="day.date"
        type="button"
        class="journal__day-chip"
        :class="{
          'journal__day-chip--selected': day.date === selectedDate,
          'journal__day-chip--today': day.isToday,
        }"
        @click="selectedDate = day.date"
      >
        <span class="journal__day-chip-num">{{ day.dayNum }}</span>
        <span class="journal__day-chip-name">{{ day.dayName }}</span>
        <span v-if="day.bookingCount > 0" class="journal__day-chip-dot" />
      </button>
    </div>

    <div v-if="selectedDayBookings.length > 0" class="journal__day-summary">
      <span>{{ selectedDayBookings.length }} {{ pluralBookings(selectedDayBookings.length) }}</span>
      <span class="journal__day-summary-amount">{{ formatMoney(selectedDayTotal) }}</span>
    </div>

    <div class="journal__grid-wrap">
      <div class="journal__hdr-row">
        <div class="journal__time-gutter-header" />
        <div
          v-for="col in columnDefs"
          :key="col.masterId ?? '__none__'"
          class="journal__master-header"
        >
          <div
            v-if="col.master"
            class="journal__master-avatar"
            :style="{ background: masterColor(col.master.id) }"
          >
            <span>{{ masterInitials(col.master) }}</span>
          </div>
          <div v-else class="journal__master-avatar journal__master-avatar--none">
            <span>—</span>
          </div>
          <span class="journal__master-name">{{
            col.master?.name ?? 'Не назначен'
          }}</span>
        </div>
      </div>

      <div class="journal__grid-scroll">
        <div class="journal__body-row" :style="{ minHeight: gridHeightPx + 'px' }">
          <div class="journal__time-axis">
            <div
              v-for="slot in timeSlots"
              :key="slot"
              class="journal__time-slot"
            >
              {{ slot }}
            </div>
          </div>
          <div class="journal__cols-wrap" :style="{ minHeight: gridHeightPx + 'px' }">
            <div
              v-for="col in columnDefs"
              :key="(col.masterId ?? '__none__') + '-col'"
              class="journal__column"
              @click="handleColumnClick($event, col.masterId ?? undefined)"
            >
              <div
                v-for="slot in timeSlots"
                :key="slot + '-line'"
                class="journal__grid-line"
              />
              <BookingCard
                v-for="booking in getColumnBookings(col.masterId)"
                :key="booking.id"
                :booking="booking"
                :grid-start-hour="GRID_START_HOUR"
                :slot-height="SLOT_HEIGHT"
                @click="openBooking(booking.id)"
              />
            </div>
            <div
              v-if="isToday"
              class="journal__now-line"
              :style="nowLineStyle"
            />
          </div>
        </div>
      </div>
    </div>

    <button type="button" class="journal__fab" @click="openCreateBooking">+</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useBookingsStore } from '@/stores/bookings';
import { useEmployeesStore } from '@/stores/employees';
import BookingCard from '@/components/journal/BookingCard.vue';
import type { Employee } from '@/types/employee';
import type { Booking } from '@/types/booking';

const emit = defineEmits<{
  back: [];
  'open-booking': [id: string];
  'create-booking': [date: string, time: string, masterId?: string];
}>();

const bookingsStore = useBookingsStore();
const employeesStore = useEmployeesStore();

const GRID_START_HOUR = 8;
const GRID_END_HOUR = 21;
const SLOT_HEIGHT = 60;

function localYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const today = localYmd(new Date());
const selectedDate = ref(today);

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const dayStrip = computed(() => {
  const result: Array<{
    date: string;
    dayNum: number;
    dayName: string;
    isToday: boolean;
    bookingCount: number;
  }> = [];
  const base = new Date();
  for (let i = -3; i <= 10; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dateStr = localYmd(d);
    const bookings = bookingsStore.getByDate(dateStr);
    result.push({
      date: dateStr,
      dayNum: d.getDate(),
      dayName: DAY_NAMES[d.getDay()],
      isToday: dateStr === today,
      bookingCount: bookings.length,
    });
  }
  return result;
});

function navigateDate(delta: number) {
  const [y, m, day] = selectedDate.value.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  d.setDate(d.getDate() + delta);
  selectedDate.value = localYmd(d);
}

const formattedSelectedDate = computed(() => {
  const [y, m, day] = selectedDate.value.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
});

const isToday = computed(() => selectedDate.value === today);

const selectedDayBookings = computed(() => bookingsStore.getByDate(selectedDate.value));

const selectedDayTotal = computed(() =>
  selectedDayBookings.value
    .filter((b) => b.status !== 'cancelled' && b.status !== 'no_show')
    .reduce((sum, b) => sum + (b.payment.total || 0), 0)
);

const visibleMasters = computed(() =>
  employeesStore.activeEmployees.filter((e) => e.isVisibleInJournal)
);

const noMasterBookings = computed(() =>
  selectedDayBookings.value.filter((b) => !b.masterId)
);

const columnDefs = computed(() => {
  const masters = visibleMasters.value;
  const needUnassigned =
    noMasterBookings.value.length > 0 || masters.length === 0;
  const cols: Array<{ masterId: string | null; master: Employee | null }> =
    masters.map((m) => ({ masterId: m.id, master: m }));
  if (needUnassigned) cols.push({ masterId: null, master: null });
  return cols;
});

function getColumnBookings(masterId: string | null): Booking[] {
  if (masterId === null) {
    return bookingsStore.getByDate(selectedDate.value).filter((b) => !b.masterId);
  }
  return bookingsStore.getByDateAndMaster(selectedDate.value, masterId);
}

const timeSlots = computed(() => {
  const slots: string[] = [];
  for (let h = GRID_START_HOUR; h <= GRID_END_HOUR; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
  }
  return slots;
});

const gridHeightPx = computed(
  () => (GRID_END_HOUR - GRID_START_HOUR + 1) * SLOT_HEIGHT
);

const nowMinutes = ref(0);
function updateNow() {
  const now = new Date();
  nowMinutes.value = now.getHours() * 60 + now.getMinutes();
}
let nowTimer: ReturnType<typeof setInterval>;
onMounted(() => {
  if (!employeesStore.isLoaded) employeesStore.loadEmployees();
  updateNow();
  nowTimer = setInterval(updateNow, 60000);
});
onUnmounted(() => clearInterval(nowTimer));

const nowLineStyle = computed(() => {
  const fromStartMinutes = nowMinutes.value - GRID_START_HOUR * 60;
  if (fromStartMinutes < 0 || fromStartMinutes > (GRID_END_HOUR - GRID_START_HOUR + 1) * 60) {
    return { display: 'none' };
  }
  const top = (fromStartMinutes / 60) * SLOT_HEIGHT;
  return { top: `${top}px` };
});

function handleColumnClick(e: MouseEvent, masterId?: string) {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const relY = e.clientY - rect.top;
  const hoursFromStart = relY / SLOT_HEIGHT;
  const totalMinutes = GRID_START_HOUR * 60 + hoursFromStart * 60;
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor((totalMinutes % 60) / 30) * 30;
  const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  emit('create-booking', selectedDate.value, time, masterId);
}

function openBooking(id: string) {
  emit('open-booking', id);
}

function openCreateBooking() {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:00`;
  emit('create-booking', selectedDate.value, time);
}

function formatMoney(amount: number): string {
  return `${amount.toLocaleString('ru-RU')}\u00a0\u20bd`;
}

function pluralBookings(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'запись';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'записи';
  return 'записей';
}

const MASTER_COLORS = [
  'hsl(228 88% 66%)',
  'hsl(343 75% 64%)',
  'hsl(38 92% 50%)',
  'hsl(160 84% 39%)',
  'hsl(258 90% 66%)',
  'hsl(188 94% 42%)',
  'hsl(24 95% 53%)',
  'hsl(84 81% 44%)',
];

function masterColor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return MASTER_COLORS[Math.abs(hash) % MASTER_COLORS.length];
}

function masterInitials(emp: Employee): string {
  const n = emp.name?.trim() || '';
  if (!n) return '?';
  const parts = n.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return n[0].toUpperCase();
}
</script>

<style scoped>
.journal {
  position: fixed;
  inset: 0;
  background: var(--dm-bg, #0f0f0f);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 210;
}

.journal__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 10px;
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
  flex-shrink: 0;
  gap: 8px;
}
.journal__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary, #888);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}
.journal__title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary, #fff);
}

.journal__date-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  flex-shrink: 0;
}
.journal__date-view-btn {
  background: var(--dm-accent, #a0e040);
  border: none;
  border-radius: 8px;
  color: #000;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 12px;
  cursor: default;
  min-height: 36px;
  opacity: 0.85;
}
.journal__date-display {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--dm-text-primary, #fff);
  text-align: center;
}
.journal__date-nav {
  background: transparent;
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 8px;
  color: var(--dm-text-primary, #fff);
  font-size: 16px;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
}

.journal__day-strip {
  display: flex;
  overflow-x: auto;
  gap: 4px;
  padding: 6px 16px;
  flex-shrink: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.journal__day-strip::-webkit-scrollbar {
  display: none;
}
.journal__day-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  min-height: 56px;
  border-radius: 12px;
  background: transparent;
  border: 1px solid var(--dm-border, #2a2a2a);
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
  transition: all 0.15s;
}
.journal__day-chip--selected {
  background: var(--dm-accent, #a0e040);
  border-color: var(--dm-accent, #a0e040);
}
.journal__day-chip--today:not(.journal__day-chip--selected) {
  border-color: var(--dm-accent, #a0e040);
}
.journal__day-chip-num {
  font-size: 16px;
  font-weight: 700;
  color: var(--dm-text-primary, #fff);
  line-height: 1;
}
.journal__day-chip--selected .journal__day-chip-num,
.journal__day-chip--selected .journal__day-chip-name {
  color: #000;
}
.journal__day-chip-name {
  font-size: 10px;
  color: var(--dm-text-secondary, #888);
  margin-top: 2px;
}
.journal__day-chip-dot {
  position: absolute;
  bottom: 5px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--dm-accent, #a0e040);
}
.journal__day-chip--selected .journal__day-chip-dot {
  background: #000;
}

.journal__day-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  font-size: 13px;
  color: var(--dm-text-secondary, #888);
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
  flex-shrink: 0;
}
.journal__day-summary-amount {
  font-weight: 600;
  color: var(--dm-accent, #a0e040);
}

.journal__grid-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.journal__hdr-row {
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
  overflow-x: auto;
  scrollbar-width: none;
}
.journal__hdr-row::-webkit-scrollbar {
  display: none;
}
.journal__time-gutter-header {
  width: 56px;
  flex-shrink: 0;
}
.journal__master-header {
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  gap: 4px;
  border-left: 1px solid var(--dm-border, #2a2a2a);
}
.journal__master-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}
.journal__master-avatar--none {
  background: var(--dm-surface-2, #1e1e1e);
  color: var(--dm-text-secondary, #888);
}
.journal__master-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--dm-text-primary, #fff);
  text-align: center;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.journal__grid-scroll {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.journal__body-row {
  display: flex;
  flex-direction: row;
  align-items: stretch;
}

.journal__time-axis {
  width: 56px;
  flex-shrink: 0;
  background: var(--dm-bg, #0f0f0f);
  z-index: 2;
  border-right: 1px solid var(--dm-border, #2a2a2a);
}
.journal__time-slot {
  height: 60px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 4px 8px 0 0;
  font-size: 11px;
  color: var(--dm-text-secondary, #888);
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
  box-sizing: border-box;
}

.journal__cols-wrap {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  position: relative;
  min-width: 0;
}

.journal__column {
  position: relative;
  flex: 1;
  min-width: 120px;
  border-left: 1px solid var(--dm-border, #2a2a2a);
  cursor: pointer;
}
.journal__grid-line {
  height: 60px;
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
  box-sizing: border-box;
}

.journal__now-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--dm-danger, #e53935);
  z-index: 3;
  pointer-events: none;
}
.journal__now-line::before {
  content: '';
  position: absolute;
  left: 0;
  top: -4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--dm-danger, #e53935);
}

.journal__fab {
  position: fixed;
  bottom: calc(var(--tab-bar-height, 56px) + 16px + env(safe-area-inset-bottom, 0px));
  right: 16px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--dm-accent, #a0e040);
  border: none;
  font-size: 28px;
  color: #000;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(160, 224, 64, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 220;
  min-width: 56px;
  min-height: 56px;
}
</style>
