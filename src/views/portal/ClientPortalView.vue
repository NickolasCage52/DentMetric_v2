<template>
  <div class="client-portal">
    <div v-if="isLoading" class="client-portal__state">
      <div class="client-portal__spinner" aria-hidden="true">{{ '\u27F3' }}</div>
      <div>Загрузка оценки...</div>
    </div>

    <div v-else-if="error" class="client-portal__state">
      <div class="client-portal__state-icon" aria-hidden="true">{{ '\u{1F517}' }}</div>
      <div class="client-portal__err-title">{{ error }}</div>
      <div class="client-portal__err-sub">
        Ссылка могла устареть или быть деактивирована. Попросите мастера выслать новую.
      </div>
    </div>

    <div v-else-if="link" class="client-portal__content">
      <div class="client-portal__brand">
        <div class="client-portal__brand-logo">DM</div>
        <div>
          <div class="client-portal__service-name">
            {{ link.snapshot.serviceName || 'DentMetric' }}
          </div>
          <div class="client-portal__service-sub">Оценка ремонта кузова</div>
        </div>
      </div>

      <div v-if="link.clientConfirmedAt" class="client-portal__confirmed">
        {{ '\u2713' }} Оценка подтверждена {{ formatShortDate(link.clientConfirmedAt) }}
      </div>

      <div
        v-if="link.snapshot.annotatedPhotoUrl"
        class="client-portal__photo-wrap"
        role="button"
        tabindex="0"
        @click="photoFullscreen = true"
        @keydown.enter.prevent="photoFullscreen = true"
      >
        <img
          :src="link.snapshot.annotatedPhotoUrl"
          class="client-portal__photo"
          alt="Фото повреждения"
        >
        <div class="client-portal__photo-hint">Нажмите для увеличения</div>
      </div>

      <div class="client-portal__section">
        <div v-if="clientName" class="client-portal__client-name">{{ clientName }}</div>
        <div v-if="carLine" class="client-portal__car">{{ carLine }}</div>
        <div class="client-portal__date">Оценка от {{ link.snapshot.estimateDate }}</div>
      </div>

      <div class="client-portal__section">
        <div class="client-portal__section-title">Повреждения</div>
        <div
          v-for="(dent, i) in link.snapshot.dents"
          :key="i"
          class="client-portal__dent-row"
        >
          <div class="client-portal__dent-num">{{ i + 1 }}</div>
          <div class="client-portal__dent-info">
            <div class="client-portal__dent-element">{{ dent.element }}</div>
            <div class="client-portal__dent-desc">{{ dent.description }}</div>
          </div>
          <div class="client-portal__dent-price">{{ formatMoney(dent.price) }}</div>
        </div>
      </div>

      <div v-if="link.snapshot.repairTimeHours" class="client-portal__section">
        <div class="client-portal__time-row">
          <span>{{ '\u23F1' }} Время ремонта</span>
          <span>{{ formatTime(link.snapshot.repairTimeHours) }}</span>
        </div>
      </div>

      <div class="client-portal__total">
        <div class="client-portal__total-label">ИТОГО</div>
        <div class="client-portal__total-value">{{ formatMoney(link.snapshot.total) }}</div>
      </div>

      <div v-if="link.snapshot.warrantyNote" class="client-portal__warranty">
        {{ '\u{1F6E1}' }} {{ link.snapshot.warrantyNote }}
      </div>

      <div v-if="link.snapshot.serviceName || link.snapshot.masterName" class="client-portal__section">
        <div class="client-portal__master-label">Мастер</div>
        <div class="client-portal__master-name">
          {{ link.snapshot.masterName || link.snapshot.serviceName }}
        </div>
        <div v-if="link.snapshot.serviceAddress" class="client-portal__master-address">
          {{ '\u{1F4CD}' }} {{ link.snapshot.serviceAddress }}
        </div>
        <a
          v-if="link.snapshot.masterPhone"
          :href="`tel:${link.snapshot.masterPhone}`"
          class="client-portal__master-phone"
        >
          {{ '\u{1F4DE}' }} {{ link.snapshot.masterPhone }}
        </a>
      </div>

      <div v-if="!link.clientConfirmedAt" class="client-portal__section client-portal__actions">
        <div class="client-portal__actions-title">Всё верно?</div>
        <textarea
          v-model="clientNote"
          class="client-portal__note"
          placeholder="Комментарий или вопрос мастеру (необязательно)"
          rows="3"
        />
        <button
          type="button"
          class="client-portal__confirm"
          :disabled="isConfirming"
          @click="handleConfirm"
        >
          {{ isConfirming ? '...' : `${'\u2713'} Подтвердить оценку` }}
        </button>
        <a
          v-if="link.snapshot.masterPhone"
          :href="buildWhatsAppUrl()"
          target="_blank"
          rel="noopener noreferrer"
          class="client-portal__wa"
        >
          {{ '\u{1F4AC}' }} Написать мастеру
        </a>
      </div>

      <div v-else class="client-portal__section client-portal__post">
        <div class="client-portal__post-icon" aria-hidden="true">{{ '\u{1F389}' }}</div>
        <div class="client-portal__post-text">
          Оценка подтверждена! Мастер свяжется для записи.
        </div>
        <a
          v-if="link.snapshot.masterPhone"
          :href="`tel:${link.snapshot.masterPhone}`"
          class="client-portal__call"
        >
          Позвонить мастеру
        </a>
      </div>

      <div class="client-portal__footer">Расчёт выполнен в DentMetric</div>
    </div>

    <Teleport to="body">
      <div
        v-if="photoFullscreen && link?.snapshot.annotatedPhotoUrl"
        class="client-portal__modal"
        role="button"
        tabindex="0"
        @click="photoFullscreen = false"
        @keydown.escape="photoFullscreen = false"
      >
        <img
          :src="link.snapshot.annotatedPhotoUrl"
          class="client-portal__modal-img"
          alt=""
        >
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onErrorCaptured } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPortalLink, confirmEstimate, type PortalLink } from '@/services/portalService'

const route = useRoute()
const token = computed(() => String(route.params.token || ''))

const isLoading = ref(true)
const error = ref('')
const link = ref<PortalLink | null>(null)
const clientNote = ref('')
const isConfirming = ref(false)
const photoFullscreen = ref(false)

onErrorCaptured((err) => {
  console.error('[ClientPortal]', err)
  error.value = 'Ошибка отображения страницы'
  isLoading.value = false
  return false
})

onMounted(async () => {
  if (!token.value) {
    error.value = 'Неверная ссылка'
    isLoading.value = false
    return
  }
  try {
    const data = await fetchPortalLink(token.value)
    if (!data) error.value = 'Ссылка не найдена или истекла'
    else link.value = data
  } catch {
    error.value = 'Ошибка загрузки'
  } finally {
    isLoading.value = false
  }
})

const clientName = computed(() => link.value?.snapshot.client?.name)
const carLine = computed(() => {
  const s = link.value?.snapshot
  if (!s?.client) return ''
  const parts = [s.client.brand, s.client.model].filter(Boolean)
  return [...parts, s.client.plate].filter(Boolean).join(' · ')
})

const rub = '\u20BD'

function formatMoney(amount: number): string {
  return `${Number(amount || 0).toLocaleString('ru-RU')} ${rub}`
}

function formatTime(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function buildWhatsAppUrl(): string {
  const phone = link.value?.snapshot.masterPhone?.replace(/\D/g, '') || ''
  if (!phone) return '#'
  const total = formatMoney(link.value?.snapshot.total || 0)
  const text = `Добрый день! Видел оценку на ${total}. Хотел бы записаться.`
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

async function handleConfirm(): Promise<void> {
  if (!token.value || isConfirming.value) return
  isConfirming.value = true
  try {
    const ok = await confirmEstimate(token.value, clientNote.value.trim() || undefined)
    if (ok && link.value) {
      link.value.clientConfirmedAt = new Date().toISOString()
      link.value.clientNote = clientNote.value
    }
  } finally {
    isConfirming.value = false
  }
}
</script>

<style scoped>
.client-portal {
  min-height: 100dvh;
  background: hsl(240 6% 96%);
  color: hsl(0 0% 10%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

.client-portal__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  gap: 16px;
  padding: 40px 24px;
  text-align: center;
}

.client-portal__spinner {
  font-size: 32px;
  animation: portal-spin 0.85s linear infinite;
}

@keyframes portal-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.client-portal__state-icon {
  font-size: 48px;
}

.client-portal__err-title {
  font-size: 18px;
  font-weight: 700;
}

.client-portal__err-sub {
  font-size: 14px;
  color: hsl(0 0% 40%);
  max-width: 280px;
  line-height: 1.6;
}

.client-portal__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px 12px;
  background: hsl(0 0% 10%);
}

.client-portal__brand-logo {
  font-size: 22px;
  font-weight: 900;
  color: hsl(78 70% 45%);
}

.client-portal__service-name {
  font-size: 15px;
  font-weight: 700;
  color: hsl(0 0% 100%);
}

.client-portal__service-sub {
  font-size: 12px;
  color: hsl(0 0% 55%);
  margin-top: 2px;
}

.client-portal__confirmed {
  background: hsl(160 50% 95%);
  color: hsl(160 84% 32%);
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid hsl(160 40% 88%);
}

.client-portal__photo-wrap {
  position: relative;
  cursor: pointer;
  background: hsl(0 0% 0%);
}

.client-portal__photo {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  display: block;
}

.client-portal__photo-hint {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 11px;
  color: hsl(0 0% 100% / 0.75);
  background: hsl(0 0% 0% / 0.45);
  padding: 3px 8px;
  border-radius: 10px;
}

.client-portal__section {
  background: hsl(0 0% 100%);
  margin-top: 8px;
  padding: 16px;
}

.client-portal__section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: hsl(0 0% 45%);
  margin-bottom: 12px;
}

.client-portal__client-name {
  font-size: 18px;
  font-weight: 700;
}

.client-portal__car {
  font-size: 14px;
  color: hsl(0 0% 40%);
  margin-top: 4px;
}

.client-portal__date {
  font-size: 12px;
  color: hsl(0 0% 60%);
  margin-top: 6px;
}

.client-portal__dent-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid hsl(0 0% 94%);
}

.client-portal__dent-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: hsl(78 70% 45%);
  color: hsl(0 0% 0%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
}

.client-portal__dent-info {
  flex: 1;
  min-width: 0;
}

.client-portal__dent-element {
  font-size: 14px;
  font-weight: 500;
}

.client-portal__dent-desc {
  font-size: 12px;
  color: hsl(0 0% 45%);
  margin-top: 2px;
}

.client-portal__dent-price {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.client-portal__time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: hsl(0 0% 35%);
  min-height: 44px;
}

.client-portal__total {
  background: hsl(0 0% 10%);
  margin-top: 8px;
  padding: 20px 16px;
  text-align: center;
}

.client-portal__total-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: hsl(0 0% 55%);
  margin-bottom: 6px;
}

.client-portal__total-value {
  font-size: 36px;
  font-weight: 900;
  color: hsl(78 70% 45%);
  letter-spacing: -0.5px;
}

.client-portal__warranty {
  padding: 12px 16px;
  font-size: 13px;
  color: hsl(0 0% 35%);
  background: hsl(0 0% 100%);
  margin-top: 8px;
}

.client-portal__master-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: hsl(0 0% 55%);
  margin-bottom: 6px;
}

.client-portal__master-name {
  font-size: 16px;
  font-weight: 700;
}

.client-portal__master-address {
  font-size: 13px;
  color: hsl(0 0% 40%);
  margin-top: 4px;
}

.client-portal__master-phone {
  display: block;
  font-size: 14px;
  color: hsl(211 100% 50%);
  text-decoration: none;
  margin-top: 8px;
  min-height: 44px;
  padding: 10px 0;
}

.client-portal__actions-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.client-portal__note {
  width: 100%;
  border: 1px solid hsl(0 0% 88%);
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  outline: none;
  resize: none;
  box-sizing: border-box;
  font-family: inherit;
  margin-bottom: 10px;
}

.client-portal__note:focus {
  border-color: hsl(78 70% 45%);
}

.client-portal__confirm {
  width: 100%;
  min-height: 52px;
  background: hsl(78 70% 45%);
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  color: hsl(0 0% 0%);
  cursor: pointer;
}

.client-portal__confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.client-portal__wa {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  margin-top: 8px;
  background: transparent;
  border: 1px solid hsl(142 70% 40%);
  border-radius: 12px;
  color: hsl(142 70% 32%);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.client-portal__post {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
}

.client-portal__post-icon {
  font-size: 48px;
}

.client-portal__post-text {
  font-size: 16px;
  line-height: 1.5;
}

.client-portal__call {
  display: block;
  width: 100%;
  min-height: 52px;
  line-height: 52px;
  background: hsl(78 70% 45%);
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  color: hsl(0 0% 0%);
  text-decoration: none;
  text-align: center;
}

.client-portal__footer {
  padding: 20px 16px;
  text-align: center;
  font-size: 11px;
  color: hsl(0 0% 60%);
}

.client-portal__modal {
  position: fixed;
  inset: 0;
  background: hsl(0 0% 0% / 0.96);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.client-portal__modal-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
