<template>
  <div v-if="booking" class="bk-detail">
    <div class="bk-detail__header">
      <button type="button" class="bk-detail__back" @click="$emit('back')">← Назад</button>
      <div class="bk-detail__title">Запись</div>
      <div class="bk-detail__header-actions">
        <button
          type="button"
          class="bk-detail__delete-btn"
          aria-label="Удалить"
          @click="handleDelete"
        >
          {{ glyphs.trash }}
        </button>
        <button type="button" class="bk-detail__edit-btn" @click="toggleEdit">
          {{ isEditing ? glyphs.check : glyphs.pencil }}
        </button>
      </div>
    </div>

    <div class="bk-detail__scroll">
      <div class="bk-detail__date-chip">
        <span>{{ formattedDate }}</span>
      </div>

      <div class="bk-detail__section bk-detail__client-block">
        <div class="bk-detail__client-row">
          <div class="bk-detail__client-avatar">{{ clientInitial }}</div>
          <div class="bk-detail__client-info">
            <div class="bk-detail__client-name">
              <input
                v-if="isEditing"
                v-model="draft.client.name"
                class="bk-detail__inline-input"
                placeholder="Имя клиента"
              />
              <template v-else>{{ booking.client.name || 'Клиент' }}</template>
            </div>
            <div class="bk-detail__client-phone">
              <input
                v-if="isEditing"
                v-model="draft.client.phone"
                type="tel"
                class="bk-detail__inline-input bk-detail__inline-input--sm"
                placeholder="+7 900 000-00-00"
              />
              <template v-else>{{ booking.client.phone || '' }}</template>
            </div>
            <span v-if="booking.client.isNew" class="bk-detail__new-badge">Новый клиент</span>
          </div>
          <span class="bk-detail__client-chevron" aria-hidden="true">›</span>
        </div>

        <div class="bk-detail__visit-chips">
          <button
            type="button"
            :class="['bk-detail__visit-chip', visitConfirmed && 'bk-detail__visit-chip--active']"
            @click="setVisitConfirmed(true)"
          >
            <span>{{ glyphs.check }}</span> Подтвердил визит
          </button>
          <button
            type="button"
            :class="[
              'bk-detail__visit-chip',
              booking.status === 'in_progress' && 'bk-detail__visit-chip--green',
            ]"
            @click="patchStatus('in_progress')"
          >
            Пришёл
          </button>
          <button
            type="button"
            :class="[
              'bk-detail__visit-chip',
              booking.status === 'no_show' && 'bk-detail__visit-chip--red',
            ]"
            @click="patchStatus('no_show')"
          >
            Не пришёл
          </button>
        </div>
      </div>

      <div class="bk-detail__section">
        <div class="bk-detail__section-label">СТАТУС</div>
        <div class="bk-detail__status-row">
          <button
            v-for="[key, label] in statusEntries"
            :key="key"
            type="button"
            :class="[
              'bk-detail__status-chip',
              booking.status === key && 'bk-detail__status-chip--active',
            ]"
            :style="
              booking.status === key
                ? {
                    borderColor: BOOKING_STATUS_COLORS[key],
                    color: BOOKING_STATUS_COLORS[key],
                  }
                : {}
            "
            @click="patchStatus(key)"
          >
            {{ label }}
          </button>
        </div>
      </div>

      <div class="bk-detail__section">
        <div class="bk-detail__info-row">
          <span class="bk-detail__info-icon" aria-hidden="true">{{ glyphs.clock }}</span>
          <div class="bk-detail__info-content">
            <template v-if="isEditing">
              <div class="bk-detail__time-edit-row">
                <input v-model="draft.date" type="date" class="bk-detail__time-input" />
                <input v-model="draft.startTime" type="time" class="bk-detail__time-input" />
                <span>–</span>
                <input v-model="draft.endTime" type="time" class="bk-detail__time-input" />
              </div>
            </template>
            <template v-else>
              <div class="bk-detail__info-main">{{ formattedDateTime }}</div>
              <div class="bk-detail__info-sub">{{ booking.durationMinutes }} мин</div>
            </template>
          </div>
        </div>

        <div class="bk-detail__info-row">
          <span class="bk-detail__info-icon" aria-hidden="true">{{ glyphs.person }}</span>
          <div class="bk-detail__info-content">
            <div class="bk-detail__info-main">{{ booking.masterName || 'Мастер не назначен' }}</div>
            <div class="bk-detail__info-sub">мастер</div>
          </div>
        </div>
      </div>

      <div class="bk-detail__section">
        <div class="bk-detail__info-row">
          <span class="bk-detail__info-icon" aria-hidden="true">{{ glyphs.wrench }}</span>
          <div class="bk-detail__info-content">
            <div class="bk-detail__info-main">{{ booking.serviceName }}</div>
            <div class="bk-detail__info-sub">
              <template v-if="booking.estimateTotal != null">
                от {{ money(booking.estimateTotal) }} · {{ booking.durationMinutes }} мин
              </template>
              <template v-else>{{ booking.durationMinutes }} мин</template>
            </div>
          </div>
          <button
            v-if="booking.estimateId"
            type="button"
            class="bk-detail__estimate-link"
            @click="$emit('open-estimate', booking.estimateId)"
          >
            Расчёт ›
          </button>
        </div>
        <div v-if="portalShareRecord" class="bk-detail__portal-row">
          <PortalShareButton
            :record="portalShareRecord"
            :estimate-id="booking.estimateId ?? null"
            :booking-id="booking.id"
          />
        </div>
      </div>

      <div class="bk-detail__section bk-detail__payment-block">
        <div class="bk-detail__payment-row">
          <span class="bk-detail__info-icon" aria-hidden="true">{{ glyphs.card }}</span>
          <div class="bk-detail__payment-info">
            <span class="bk-detail__payment-label">Оплачено {{ money(booking.payment.paid) }}</span>
          </div>
          <button
            v-if="booking.payment.paid < booking.payment.total"
            type="button"
            class="bk-detail__pay-btn"
            @click="handlePayment"
          >
            Оплатить
          </button>
          <span v-else class="bk-detail__paid-badge">{{ glyphs.check }} Оплачено</span>
        </div>
        <button type="button" class="bk-detail__complete-sale" @click="handleCompleteSale">
          Оформить продажу
        </button>
      </div>

      <div class="bk-detail__section bk-detail__colors">
        <button
          v-for="color in COLOR_TAGS"
          :key="color"
          type="button"
          class="bk-detail__color-dot"
          :class="draft.colorTag === color && 'bk-detail__color-dot--active'"
          :style="{ background: color }"
          @click="toggleColorTag(color)"
        />
      </div>

      <div class="bk-detail__section">
        <div class="bk-detail__info-row">
          <span class="bk-detail__info-icon" aria-hidden="true">{{ glyphs.chat }}</span>
          <textarea
            v-if="isEditing"
            v-model="draft.comment"
            class="bk-detail__comment-input"
            placeholder="Комментарий..."
            rows="2"
          />
          <div v-else class="bk-detail__comment-display">{{ booking.comment || 'Нет комментария' }}</div>
        </div>
      </div>

      <div class="bk-detail__section">
        <div class="bk-detail__info-row">
          <span class="bk-detail__info-icon" aria-hidden="true">{{ glyphs.clip }}</span>
          <span class="bk-detail__info-sub">Формат файлов для загрузки (PDF, PNG, JPG)</span>
        </div>
      </div>

      <div class="bk-detail__section">
        <div class="bk-detail__section-label">НАПОМИНАНИЯ КЛИЕНТУ (WhatsApp)</div>

        <div
          v-for="tmpl in availableTemplates"
          :key="tmpl.key"
          class="bk-detail__wa-row"
        >
          <span class="bk-detail__info-icon" aria-hidden="true">{{ glyphs.wa }}</span>
          <span class="bk-detail__wa-label">{{ tmpl.label }}</span>
          <button
            type="button"
            class="bk-detail__wa-send-btn"
            :disabled="!hasPhone"
            @click="sendWhatsApp(tmpl.key)"
          >
            Отправить
          </button>
        </div>

        <div v-if="!hasPhone" class="bk-detail__wa-nophone">
          Укажите телефон клиента для отправки
        </div>
      </div>
    </div>

    <div v-if="isEditing" class="bk-detail__save-bar">
      <button type="button" class="bk-detail__cancel-btn" @click="cancelEdit">Отмена</button>
      <button type="button" class="bk-detail__save-btn" @click="saveChanges">Сохранить</button>
    </div>
  </div>
  <div v-else class="bk-detail bk-detail--missing">
    <div class="bk-detail__header">
      <button type="button" class="bk-detail__back" @click="$emit('back')">← Назад</button>
      <div class="bk-detail__title">Запись</div>
    </div>
    <p class="bk-detail__missing-text">Запись не найдена</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { useBookingsStore } from '@/stores/bookings';
import { useServiceDataStore } from '@/stores/serviceData';
import { useNotificationsStore } from '@/stores/notifications';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import { useHistoryPiniaStore } from '@/stores/history';
import { buildOrderDocument } from '@/utils/buildOrderDocument';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  type BookingStatus,
  type Booking,
} from '@/types/booking';
import type { OrderDocument } from '@/types/orderDocument';
import PortalShareButton from '@/components/PortalShareButton.vue';
import { buildWhatsAppReminder } from '@/services/notificationEngine';

const glyphs = {
  trash: '\u{1F5D1}',
  check: '\u2713',
  pencil: '\u270f\ufe0f',
  clock: '\u{1F550}',
  person: '\u{1F464}',
  wrench: '\u{1F527}',
  card: '\u{1F4B3}',
  chat: '\u{1F4AC}',
  clip: '\u{1F4CE}',
  bell: '\u{1F514}',
  star: '\u2b50',
  wa: '\u{1F4AC}',
};

const props = defineProps<{ bookingId: string }>();
const emit = defineEmits<{
  back: [];
  'open-estimate': [id: string];
  'open-order-document': [doc: OrderDocument];
}>();

const store = useBookingsStore();
const serviceDataStore = useServiceDataStore();
const notifStore = useNotificationsStore();
const authStore = useAuthStore();
const historyPinia = useHistoryPiniaStore();
const { records: historyItems } = storeToRefs(historyPinia);
const isEditing = ref(false);

const booking = computed(() => store.getById(props.bookingId));

const historyRecordForPortal = computed(() => {
  const id = booking.value?.estimateId;
  if (!id) return null;
  return historyItems.value.find((h: { id?: string }) => h?.id === id) ?? null;
});

const portalShareRecord = computed((): Record<string, unknown> | null => {
  const b = booking.value;
  if (!b) return null;
  const hist = historyRecordForPortal.value;
  if (hist) return hist as Record<string, unknown>;
  if (!b.estimateId && b.estimateTotal == null) return null;
  return {
    id: b.estimateId || b.id,
    client: b.client,
    total: b.estimateTotal ?? b.payment.total,
    manualAdjustedPrice: b.estimateTotal ?? b.payment.total,
    dents: { items: [] },
    createdAt: b.createdAt,
  };
});

const hasPhone = computed(() => Boolean(booking.value?.client.phone?.replace(/\D/g, '')?.length));

type WaTemplateKey = 'day_before' | 'ready' | 'followup';

const availableTemplates: { key: WaTemplateKey; label: string }[] = [
  { key: 'day_before', label: 'Напоминание за день' },
  { key: 'ready', label: 'Автомобиль готов' },
  { key: 'followup', label: 'Пригласить снова' },
];

function sendWhatsApp(templateKey: WaTemplateKey) {
  const b = booking.value;
  if (!b) return;
  const tmpl = buildWhatsAppReminder(b, templateKey, authStore.user?.name, undefined);
  if (!tmpl) return;

  window.open(tmpl.url, '_blank', 'noopener');

  notifStore.addNotification({
    trigger: 'manual',
    recipient: 'client',
    channel: 'whatsapp',
    title: tmpl.name,
    body: tmpl.body.slice(0, 100),
    bookingId: b.id,
    whatsappUrl: tmpl.url,
    sent: true,
    sentAt: new Date().toISOString(),
  });
}

const draft = reactive({
  client: { name: '', phone: '', brand: '', model: '', plate: '' },
} as Booking);

function cloneDraftFrom(b: Booking) {
  Object.assign(draft, JSON.parse(JSON.stringify(b)) as Booking);
}

watch(
  () => booking.value,
  (b) => {
    if (b) cloneDraftFrom(b);
  },
  { immediate: true }
);

const statusEntries = computed(() =>
  Object.entries(BOOKING_STATUS_LABELS) as [BookingStatus, string][]
);

const visitConfirmed = computed(() => Boolean(booking.value?.confirmedVisit));

const formattedDate = computed(() => {
  if (!booking.value?.date) return '';
  const [y, m, d] = booking.value.date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
});

const formattedDateTime = computed(() => {
  if (!booking.value) return '';
  const [y, m, d] = booking.value.date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dateStr = dt.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  return `${dateStr}, ${booking.value.startTime} \u2013 ${booking.value.endTime}`;
});

const clientInitial = computed(
  () => booking.value?.client.name?.[0]?.toUpperCase() || '?'
);

const COLOR_TAGS = [
  'hsl(160 84% 39%)',
  'hsl(38 92% 50%)',
  'hsl(188 94% 42%)',
  'hsl(258 90% 66%)',
  'hsl(343 75% 64%)',
  'hsl(24 95% 53%)',
  'hsl(228 88% 66%)',
  'hsl(84 81% 44%)',
];

function money(n: number): string {
  return `${Number(n).toLocaleString('ru-RU')}\u00a0\u20bd`;
}

function patchStatus(status: BookingStatus) {
  store.updateStatus(props.bookingId, status);
}

function setVisitConfirmed(v: boolean) {
  store.updateBooking(props.bookingId, { confirmedVisit: v });
}

function toggleColorTag(color: string) {
  const next = draft.colorTag === color ? undefined : color;
  draft.colorTag = next;
  store.updateBooking(props.bookingId, { colorTag: next });
}

function toggleEdit() {
  if (isEditing.value) {
    saveChanges();
    return;
  }
  if (booking.value) cloneDraftFrom(booking.value);
  isEditing.value = true;
}

function cancelEdit() {
  if (booking.value) cloneDraftFrom(booking.value);
  isEditing.value = false;
}

function saveChanges() {
  if (!draft || !booking.value) return;
  store.updateBooking(props.bookingId, { ...draft });
  isEditing.value = false;
}

function handleDelete() {
  if (!confirm('Удалить эту запись?')) return;
  store.deleteBooking(props.bookingId);
  emit('back');
}

function handlePayment() {
  const b = booking.value;
  if (!b) return;
  const now = new Date().toISOString();
  store.updateBooking(props.bookingId, {
    status: 'paid',
    payment: {
      ...b.payment,
      paid: b.payment.total,
      paidAt: now,
    },
  });
}

function handleCompleteSale() {
  const b = booking.value;
  if (!b) return;
  historyPinia.loadHistory();
  const rec = b.estimateId
    ? historyItems.value.find((item) => item?.id === b.estimateId)
    : null;
  const fallbackClient = {
    name: b.client?.name,
    phone: b.client?.phone,
    brand: b.client?.brand,
    model: b.client?.model,
    plate: b.client?.plate,
  };
  const total = b.payment?.total ?? b.estimateTotal ?? 0;
  const doc = buildOrderDocument({
    serviceData: serviceDataStore.data,
    record: rec || {
      client: fallbackClient,
      total,
      masterName: b.masterName,
      id: b.estimateId,
    },
    bookingId: props.bookingId,
  });
  emit('open-order-document', doc);
}
</script>

<style scoped>
.bk-detail {
  position: fixed;
  inset: 0;
  background: var(--dm-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 210;
}
.bk-detail--missing {
  padding: 16px;
}
.bk-detail__missing-text {
  color: var(--dm-text-secondary);
  padding: 24px 16px;
  text-align: center;
}
.bk-detail__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--dm-border);
  flex-shrink: 0;
  gap: 8px;
}
.bk-detail__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}
.bk-detail__title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary);
}
.bk-detail__header-actions {
  display: flex;
  gap: 4px;
}
.bk-detail__delete-btn,
.bk-detail__edit-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
}
.bk-detail__scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 96px;
}
.bk-detail__date-chip {
  padding: 10px 16px 0;
  font-size: 13px;
  color: var(--dm-text-secondary);
}
.bk-detail__section {
  border-bottom: 1px solid var(--dm-border);
  padding: 12px 0;
}
.bk-detail__section-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
  color: var(--dm-text-secondary);
  padding: 0 16px 8px;
}
.bk-detail__client-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px 12px;
}
.bk-detail__client-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--dm-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: var(--dm-text-primary);
  flex-shrink: 0;
}
.bk-detail__client-info {
  flex: 1;
}
.bk-detail__client-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--dm-text-primary);
}
.bk-detail__client-phone {
  font-size: 13px;
  color: var(--dm-text-secondary);
  margin-top: 2px;
}
.bk-detail__new-badge {
  font-size: 10px;
  font-weight: 700;
  background: color-mix(in srgb, var(--dm-accent) 15%, transparent);
  color: var(--dm-accent);
  padding: 2px 7px;
  border-radius: 8px;
  margin-top: 4px;
  display: inline-block;
}
.bk-detail__client-chevron {
  color: var(--dm-text-secondary);
  font-size: 18px;
  min-width: 44px;
  text-align: center;
}
.bk-detail__visit-chips {
  display: flex;
  gap: 8px;
  padding: 0 16px;
  flex-wrap: wrap;
}
.bk-detail__visit-chip {
  padding: 6px 12px;
  border: 1px solid var(--dm-border);
  border-radius: 20px;
  background: transparent;
  color: var(--dm-text-secondary);
  font-size: 12px;
  cursor: pointer;
  min-height: 36px;
}
.bk-detail__visit-chip--active {
  border-color: var(--dm-accent);
  color: var(--dm-accent);
}
.bk-detail__visit-chip--green {
  border-color: hsl(160 84% 39%);
  color: hsl(160 84% 39%);
}
.bk-detail__visit-chip--red {
  border-color: var(--dm-danger);
  color: var(--dm-danger);
}
.bk-detail__status-row {
  display: flex;
  gap: 6px;
  padding: 0 16px;
  flex-wrap: wrap;
}
.bk-detail__status-chip {
  padding: 6px 12px;
  border: 1px solid var(--dm-border);
  border-radius: 20px;
  background: transparent;
  color: var(--dm-text-secondary);
  font-size: 12px;
  cursor: pointer;
  min-height: 36px;
  transition: all 0.15s;
}
.bk-detail__status-chip--active {
  background: color-mix(in srgb, white 5%, transparent);
}
.bk-detail__info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 16px;
  min-height: 44px;
}
.bk-detail__toggle-row {
  align-items: center;
}
.bk-detail__info-icon {
  font-size: 18px;
  width: 24px;
  flex-shrink: 0;
  margin-top: 2px;
}
.bk-detail__info-content {
  flex: 1;
}
.bk-detail__info-main {
  font-size: 15px;
  font-weight: 500;
  color: var(--dm-text-primary);
}
.bk-detail__info-sub {
  font-size: 12px;
  color: var(--dm-text-secondary);
  margin-top: 2px;
}
.bk-detail__info-sub-right {
  font-size: 13px;
  color: var(--dm-text-secondary);
  margin-left: auto;
}
.bk-detail__estimate-link {
  background: transparent;
  border: none;
  color: var(--dm-accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
  padding: 0;
}
.bk-detail__portal-row {
  padding: 4px 16px 10px;
}
.bk-detail__payment-block {
  padding: 8px 16px;
}
.bk-detail__payment-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
}
.bk-detail__payment-info {
  flex: 1;
}
.bk-detail__payment-label {
  font-size: 15px;
  color: var(--dm-text-primary);
}
.bk-detail__pay-btn {
  background: var(--dm-accent);
  border: none;
  border-radius: 10px;
  color: hsl(0 0% 0%);
  font-size: 13px;
  font-weight: 700;
  padding: 8px 16px;
  cursor: pointer;
  min-height: 44px;
}
.bk-detail__paid-badge {
  font-size: 13px;
  color: hsl(160 84% 39%);
  font-weight: 600;
}
.bk-detail__complete-sale {
  width: 100%;
  height: 44px;
  background: transparent;
  border: 1px solid var(--dm-border);
  border-radius: 10px;
  color: var(--dm-text-primary);
  font-size: 14px;
  cursor: pointer;
  margin-top: 8px;
}
.bk-detail__colors {
  display: flex;
  gap: 10px;
  padding: 12px 16px !important;
  flex-wrap: wrap;
}
.bk-detail__color-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s;
  min-width: 32px;
  min-height: 32px;
}
.bk-detail__color-dot--active {
  border-color: var(--dm-text-primary);
  transform: scale(1.2);
}
.bk-detail__comment-display {
  flex: 1;
  font-size: 14px;
  color: var(--dm-text-secondary);
}
.bk-detail__comment-input {
  flex: 1;
  background: var(--dm-surface);
  border: 1px solid var(--dm-accent);
  border-radius: 10px;
  color: var(--dm-text-primary);
  font-size: 14px;
  padding: 10px 12px;
  outline: none;
  resize: none;
  width: 100%;
  box-sizing: border-box;
}
.bk-detail__inline-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--dm-accent);
  color: var(--dm-text-primary);
  font-size: 16px;
  font-weight: 700;
  outline: none;
  padding: 2px 0;
  width: 100%;
  min-height: 44px;
}
.bk-detail__inline-input--sm {
  font-size: 13px;
  font-weight: 400;
}
.bk-detail__time-edit-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.bk-detail__time-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--dm-accent);
  color: var(--dm-text-primary);
  font-size: 14px;
  outline: none;
  padding: 2px 0;
  min-height: 44px;
}
.bk-detail__save-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 8px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  background: var(--dm-surface);
  border-top: 1px solid var(--dm-border);
}
.bk-detail__cancel-btn {
  flex: 1;
  height: 48px;
  background: transparent;
  border: 1px solid var(--dm-border);
  border-radius: 12px;
  color: var(--dm-text-secondary);
  font-size: 15px;
  cursor: pointer;
}
.bk-detail__save-btn {
  flex: 2;
  height: 48px;
  background: var(--dm-accent);
  border: none;
  border-radius: 12px;
  color: hsl(0 0% 0%);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.bk-detail__wa-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  min-height: 52px;
  border-bottom: 1px solid var(--dm-border);
}
.bk-detail__wa-label {
  flex: 1;
  font-size: 14px;
  color: var(--dm-text-primary);
}
.bk-detail__wa-send-btn {
  background: transparent;
  border: 1px solid hsl(142deg 70% 49%);
  border-radius: 10px;
  color: hsl(142deg 70% 49%);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  cursor: pointer;
  min-height: 44px;
}
.bk-detail__wa-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.bk-detail__wa-nophone {
  padding: 8px 16px;
  font-size: 12px;
  color: var(--dm-text-secondary);
}
</style>
