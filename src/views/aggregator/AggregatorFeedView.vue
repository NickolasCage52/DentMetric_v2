<template>
  <div class="aggr-feed">
    <div class="aggr-feed__header">
      <button type="button" class="aggr-feed__back" @click="$emit('back')">← Назад</button>
      <div class="aggr-feed__title">Заявки</div>
      <div class="aggr-feed__badge">{{ openJobs.length }}</div>
    </div>

    <div v-if="!isAvailable" class="aggr-feed__paywall">
      <div class="aggr-feed__paywall-icon" aria-hidden="true">{{ '\u{1F3E2}' }}</div>
      <div class="aggr-feed__paywall-title">Входящие заявки — Corporate</div>
      <div class="aggr-feed__paywall-sub">
        Получайте работу от страховых компаний и корпоративных автопарков
      </div>
      <button type="button" class="aggr-feed__paywall-btn" @click="$emit('navigate', 'tariffs')">
        Подключить →
      </button>
    </div>

    <div v-else class="aggr-feed__main">
      <div class="aggr-feed__tabs">
        <button
          v-for="tab in TABS"
          :key="tab.value"
          type="button"
          :class="['aggr-feed__tab', activeTab === tab.value && 'aggr-feed__tab--active']"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
          <span v-if="countByTab(tab.value) > 0" class="aggr-feed__tab-count">{{ countByTab(tab.value) }}</span>
        </button>
      </div>

      <div v-if="isLoading" class="aggr-feed__hint">Загрузка заявок...</div>

      <div v-else-if="filteredJobs.length === 0" class="aggr-feed__empty">
        <div class="aggr-feed__empty-icon" aria-hidden="true">{{ '\u{1F4CB}' }}</div>
        <div class="aggr-feed__empty-title">Нет заявок</div>
        <div class="aggr-feed__empty-sub">Заявки для вашего города появятся здесь</div>
      </div>

      <div v-else class="aggr-feed__list">
        <button
          v-for="job in filteredJobs"
          :key="job.id"
          type="button"
          class="aggr-feed__card"
          @click="openJob(job)"
        >
          <div class="aggr-feed__card-source">
            <span aria-hidden="true">{{ sourceIcon(job.sourceType) }}</span>
            <span class="aggr-feed__src-name">{{ job.sourceName }}</span>
            <span class="aggr-feed__commission">-{{ job.commissionPercent }}%</span>
          </div>
          <div class="aggr-feed__card-car">
            {{ [job.carBrand, job.carModel].filter(Boolean).join(' ') }}
            <span v-if="job.carClass" class="aggr-feed__class">{{ job.carClass }}</span>
          </div>
          <div class="aggr-feed__card-damage">{{ job.damageDescription }}</div>
          <div v-if="job.damageElements?.length" class="aggr-feed__chips">
            <span v-for="el in job.damageElements.slice(0, 3)" :key="el" class="aggr-feed__chip">{{ el }}</span>
          </div>
          <div class="aggr-feed__card-foot">
            <div class="aggr-feed__budget">
              <div class="aggr-feed__budget-lbl">Бюджет</div>
              <div class="aggr-feed__budget-val">
                {{ formatMoney(job.budgetMin) }} – {{ formatMoney(job.budgetMax) }}
              </div>
            </div>
            <div class="aggr-feed__city">{{ '\u{1F4CD}' }} {{ job.city.toUpperCase() }}</div>
            <div v-if="job.expiresAt" class="aggr-feed__exp">до {{ formatExpiry(job.expiresAt) }}</div>
          </div>
        </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="dm-fade">
        <div
          v-if="selectedJob"
          class="aggr-feed__overlay"
          @click.self="selectedJob = null"
        >
          <div class="aggr-feed__sheet" role="dialog" aria-modal="true">
            <div class="aggr-feed__sheet-head">
              <div class="aggr-feed__sheet-title">
                {{ selectedJob.carBrand }} {{ selectedJob.carModel }}
              </div>
              <button type="button" class="aggr-feed__close" @click="selectedJob = null">✕</button>
            </div>
            <div class="aggr-feed__sheet-body">
              <div class="aggr-feed__row"><span>Источник</span><span>{{ selectedJob.sourceName }}</span></div>
              <div class="aggr-feed__row"><span>Повреждение</span><span>{{ selectedJob.damageDescription }}</span></div>
              <div class="aggr-feed__row"><span>Клиент</span><span>{{ selectedJob.clientNameMasked || '—' }}</span></div>
              <div class="aggr-feed__row">
                <span>Бюджет</span>
                <span>{{ formatMoney(selectedJob.budgetMin) }} – {{ formatMoney(selectedJob.budgetMax) }}</span>
              </div>
              <div class="aggr-feed__row"><span>Комиссия</span><span>{{ selectedJob.commissionPercent }}%</span></div>
              <div class="aggr-feed__row">
                <span>Истекает</span><span>{{ selectedJob.expiresAt ? formatExpiry(selectedJob.expiresAt) : '—' }}</span>
              </div>
            </div>
            <div class="aggr-feed__sheet-actions">
              <button
                type="button"
                class="aggr-feed__accept"
                :disabled="isAccepting"
                @click="acceptJob(selectedJob)"
              >
                {{ isAccepting ? 'Принимаем...' : `${'\u2713'} Принять заявку` }}
              </button>
              <button type="button" class="aggr-feed__skip" @click="selectedJob = null">Пропустить</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBookingsStore } from '@/stores/bookings'
import { canUse } from '@/modules/account/planFeatures'
import type { PlanId } from '@/modules/account/types'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { normalizeCitySlug } from '@/services/marketPricesService'
import { useAggregatorFeedStore } from '@/stores/aggregatorFeed'

const emit = defineEmits<{
  back: []
  navigate: [section: string]
}>()

const authStore = useAuthStore()
const bookingsStore = useBookingsStore()
const aggregatorMeta = useAggregatorFeedStore()

const isAvailable = computed(() =>
  canUse('aggregatorFeed', (authStore.planId || 'free') as PlanId),
)

const TABS = [
  { value: 'all', label: 'Все' },
  { value: 'insurance', label: 'Страховые' },
  { value: 'fleet', label: 'Автопарки' },
] as const

const activeTab = ref<(typeof TABS)[number]['value']>('all')
const isLoading = ref(false)
const jobs = ref<AggregatorJob[]>([])
const selectedJob = ref<AggregatorJob | null>(null)
const isAccepting = ref(false)

interface AggregatorJob {
  id: string
  sourceId: string
  sourceName: string
  sourceType: string
  commissionPercent: number
  city: string
  carBrand?: string
  carModel?: string
  carClass?: string
  damageDescription: string
  damageElements?: string[]
  budgetMin: number
  budgetMax: number
  clientNameMasked?: string
  clientPhoneMasked?: string
  expiresAt?: string
  status: string
}

const openJobs = computed(() => jobs.value.filter((j) => j.status === 'open'))

const filteredJobs = computed(() => {
  const userCity = authStore.user?.city?.trim()
    ? normalizeCitySlug(String(authStore.user.city))
    : ''
  const cityFiltered = userCity
    ? openJobs.value.filter((j) => j.city === userCity)
    : openJobs.value
  if (activeTab.value === 'all') return cityFiltered
  return cityFiltered.filter((j) => j.sourceType === activeTab.value)
})

function countByTab(tab: string): number {
  const list =
    authStore.user?.city?.trim()
      ? openJobs.value.filter((j) => j.city === normalizeCitySlug(String(authStore.user!.city)))
      : openJobs.value
  if (tab === 'all') return list.length
  return list.filter((j) => j.sourceType === tab).length
}

function syncBadge(): void {
  if (!isAvailable.value) {
    aggregatorMeta.setOpenJobsCount(0)
    return
  }
  aggregatorMeta.setOpenJobsCount(filteredJobs.value.length)
}

watch([filteredJobs, isAvailable], syncBadge, { immediate: true })

onMounted(() => {
  if (isAvailable.value) void loadJobs()
})

watch(isAvailable, (ok) => {
  if (ok) void loadJobs()
})

async function loadJobs(): Promise<void> {
  if (!isAvailable.value) return
  isLoading.value = true
  try {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('aggregator_jobs')
        .select(
          `
          *,
          aggregator_sources ( name, type, commission_percent )
        `,
        )
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(50)

      const now = Date.now()
      const rows = !error && data?.length
        ? data.filter(
            (j: Record<string, unknown>) =>
              j.expires_at == null || new Date(String(j.expires_at)).getTime() > now,
          )
        : []

      if (rows.length > 0) {
        jobs.value = rows.map(mapRow)
        syncBadge()
        return
      }
    }
    jobs.value = getDemoJobs()
    syncBadge()
  } finally {
    isLoading.value = false
  }
}

function mapRow(j: Record<string, unknown>): AggregatorJob {
  const src = j.aggregator_sources as Record<string, unknown> | null | undefined
  return {
    id: String(j.id),
    sourceId: String(j.source_id ?? ''),
    sourceName: src?.name != null ? String(src.name) : 'Неизвестно',
    sourceType: src?.type != null ? String(src.type) : 'insurance',
    commissionPercent: Number(src?.commission_percent ?? j.commission_percent ?? 10) || 10,
    city: String(j.city ?? ''),
    carBrand: j.car_brand != null ? String(j.car_brand) : undefined,
    carModel: j.car_model != null ? String(j.car_model) : undefined,
    carClass: j.car_class != null ? String(j.car_class) : undefined,
    damageDescription: String(j.damage_description ?? ''),
    damageElements: Array.isArray(j.damage_elements) ? (j.damage_elements as string[]) : [],
    budgetMin: Number(j.estimated_budget_min) || 0,
    budgetMax: Number(j.estimated_budget_max) || 0,
    clientNameMasked: j.client_name_masked != null ? String(j.client_name_masked) : undefined,
    clientPhoneMasked: j.client_phone_masked != null ? String(j.client_phone_masked) : undefined,
    expiresAt: j.expires_at != null ? String(j.expires_at) : undefined,
    status: String(j.status ?? 'open'),
  }
}

function getDemoJobs(): AggregatorJob[] {
  return [
    {
      id: 'demo_1',
      sourceId: 'src_demo_1',
      sourceName: 'Росгосстрах',
      sourceType: 'insurance',
      commissionPercent: 10,
      city: 'spb',
      carBrand: 'Toyota',
      carModel: 'Camry',
      carClass: 'E',
      damageDescription: 'Вмятина на левой задней двери после парковки',
      damageElements: ['левая задняя дверь'],
      budgetMin: 8000,
      budgetMax: 15000,
      clientNameMasked: 'Михаил С.',
      expiresAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      status: 'open',
    },
    {
      id: 'demo_2',
      sourceId: 'src_demo_3',
      sourceName: 'АльфаСтрахование',
      sourceType: 'insurance',
      commissionPercent: 11,
      city: 'msk',
      carBrand: 'BMW',
      carModel: '3 Series',
      carClass: 'D',
      damageDescription: 'Вмятина на переднем бампере',
      damageElements: ['передний бампер'],
      budgetMin: 5000,
      budgetMax: 10000,
      clientNameMasked: 'Дмитрий П.',
      expiresAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      status: 'open',
    },
    {
      id: 'demo_4',
      sourceId: 'src_demo_4',
      sourceName: 'Корпоративный автопарк',
      sourceType: 'fleet',
      commissionPercent: 8,
      city: 'msk',
      carBrand: 'Lada',
      carModel: 'Vesta',
      carClass: 'B',
      damageDescription: 'Вмятина на крыше',
      damageElements: ['крыша'],
      budgetMin: 4000,
      budgetMax: 8000,
      clientNameMasked: 'ООО Транспорт',
      expiresAt: new Date(Date.now() + 4 * 86400000).toISOString(),
      status: 'open',
    },
  ]
}

function openJob(job: AggregatorJob): void {
  selectedJob.value = job
}

async function acceptJob(job: AggregatorJob): Promise<void> {
  isAccepting.value = true
  try {
    const today = new Date().toISOString().slice(0, 10)
    const mid = Math.round((job.budgetMin + job.budgetMax) / 2)
    bookingsStore.addBooking({
      date: today,
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      masterName: authStore.user?.name,
      client: {
        name: job.clientNameMasked,
        brand: job.carBrand,
        model: job.carModel,
        isNew: true,
      },
      serviceName: `${job.sourceName}: ${job.damageDescription}`.slice(0, 200),
      status: 'scheduled',
      payment: { total: mid, paid: 0 },
      comment: `Агрегатор ${job.id}. Комиссия ${job.commissionPercent}% (начисление — позже).`,
    })

    if (isSupabaseConfigured() && supabase && authStore.user?.id) {
      await supabase
        .from('aggregator_jobs')
        .update({
          status: 'assigned',
          assigned_master_id: authStore.user.id,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', job.id)
    }

    jobs.value = jobs.value.filter((j) => j.id !== job.id)
    selectedJob.value = null
    syncBadge()
  } finally {
    isAccepting.value = false
  }
}

function sourceIcon(type: string): string {
  const icons: Record<string, string> = {
    insurance: '\u{1F6E1}',
    fleet: '\u{1F697}',
    direct: '\u{1F464}',
  }
  return icons[type] || '\u{1F4CB}'
}

function formatMoney(amount: number): string {
  if (!amount) return '—'
  if (amount >= 1000) return `${Math.round(amount / 1000)} тыс. \u20BD`
  return `${amount.toLocaleString('ru-RU')} \u20BD`
}

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
.aggr-feed {
  position: fixed;
  inset: 0;
  background: var(--dm-bg, hsl(0 0% 6%));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 215;
}

.aggr-feed__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  padding-top: max(16px, env(safe-area-inset-top, 0px));
  border-bottom: 1px solid var(--dm-border, hsl(0 0% 16%));
  gap: 8px;
  flex-shrink: 0;
}

.aggr-feed__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}

.aggr-feed__title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary, hsl(0 0% 100%));
}

.aggr-feed__badge {
  background: var(--dm-accent, hsl(78 70% 45%));
  color: hsl(0 0% 0%);
  font-size: 12px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 10px;
}

.aggr-feed__paywall {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;
  gap: 12px;
}

.aggr-feed__paywall-icon {
  font-size: 56px;
}

.aggr-feed__paywall-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--dm-text-primary, hsl(0 0% 100%));
}

.aggr-feed__paywall-sub {
  font-size: 14px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  max-width: 260px;
  line-height: 1.5;
}

.aggr-feed__paywall-btn {
  padding: 14px 32px;
  background: var(--dm-accent, hsl(78 70% 45%));
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  color: hsl(0 0% 0%);
  cursor: pointer;
  margin-top: 8px;
}

.aggr-feed__main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.aggr-feed__tabs {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  overflow-x: auto;
  flex-shrink: 0;
}

.aggr-feed__tab {
  padding: 7px 14px;
  border-radius: 20px;
  flex-shrink: 0;
  background: var(--dm-surface, hsl(0 0% 9%));
  border: 1px solid var(--dm-border, hsl(0 0% 16%));
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  min-height: 36px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.aggr-feed__tab--active {
  background: var(--dm-accent, hsl(78 70% 45%));
  border-color: var(--dm-accent, hsl(78 70% 45%));
  color: hsl(0 0% 0%);
}

.aggr-feed__tab-count {
  background: hsl(0 0% 0% / 0.15);
  border-radius: 8px;
  padding: 1px 5px;
  font-size: 10px;
  font-weight: 700;
}

.aggr-feed__hint {
  padding: 32px;
  text-align: center;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
}

.aggr-feed__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  gap: 12px;
}

.aggr-feed__empty-icon {
  font-size: 48px;
}

.aggr-feed__empty-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--dm-text-primary, hsl(0 0% 100%));
}

.aggr-feed__empty-sub {
  font-size: 14px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  text-align: center;
}

.aggr-feed__list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 32px;
}

.aggr-feed__card {
  display: block;
  width: calc(100% - 24px);
  margin: 0 12px 10px;
  padding: 14px;
  text-align: left;
  background: var(--dm-surface, hsl(0 0% 9%));
  border: 1px solid var(--dm-border, hsl(0 0% 16%));
  border-radius: 14px;
  cursor: pointer;
  color: inherit;
  font: inherit;
  box-sizing: border-box;
}

.aggr-feed__card-source {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.aggr-feed__src-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  flex: 1;
}

.aggr-feed__commission {
  font-size: 11px;
  font-weight: 700;
  background: hsl(0 72% 55% / 0.12);
  color: var(--dm-danger, hsl(0 72% 55%));
  border: 1px solid hsl(0 72% 55% / 0.22);
  padding: 2px 7px;
  border-radius: 8px;
}

.aggr-feed__card-car {
  font-size: 16px;
  font-weight: 700;
  color: var(--dm-text-primary, hsl(0 0% 100%));
  margin-bottom: 4px;
}

.aggr-feed__class {
  font-size: 11px;
  font-weight: 600;
  background: var(--dm-surface-2, hsl(0 0% 12%));
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  padding: 1px 6px;
  border-radius: 6px;
  margin-left: 6px;
}

.aggr-feed__card-damage {
  font-size: 13px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  margin-bottom: 8px;
  line-height: 1.4;
}

.aggr-feed__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.aggr-feed__chip {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--dm-surface-2, hsl(0 0% 12%));
  border: 1px solid var(--dm-border, hsl(0 0% 16%));
  border-radius: 10px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
}

.aggr-feed__card-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.aggr-feed__budget {
  flex: 1;
  min-width: 0;
}

.aggr-feed__budget-lbl {
  font-size: 10px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.aggr-feed__budget-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--dm-accent, hsl(78 70% 45%));
}

.aggr-feed__city,
.aggr-feed__exp {
  font-size: 11px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
}

.aggr-feed__overlay {
  position: fixed;
  inset: 0;
  background: hsl(0 0% 0% / 0.7);
  z-index: 400;
  display: flex;
  align-items: flex-end;
}

.aggr-feed__sheet {
  width: 100%;
  background: var(--dm-surface, hsl(0 0% 9%));
  border-radius: 20px 20px 0 0;
  padding: 20px 20px calc(20px + env(safe-area-inset-bottom, 0px));
}

.aggr-feed__sheet-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.aggr-feed__sheet-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--dm-text-primary, hsl(0 0% 100%));
}

.aggr-feed__close {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  font-size: 18px;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
}

.aggr-feed__sheet-body {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.aggr-feed__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  min-height: 44px;
  border-bottom: 1px solid var(--dm-border, hsl(0 0% 16%));
  font-size: 14px;
}

.aggr-feed__row span:first-child {
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  flex-shrink: 0;
}

.aggr-feed__row span:last-child {
  color: var(--dm-text-primary, hsl(0 0% 100%));
  font-weight: 500;
  text-align: right;
  max-width: 58%;
}

.aggr-feed__sheet-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.aggr-feed__accept {
  min-height: 52px;
  background: var(--dm-accent, hsl(78 70% 45%));
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  color: hsl(0 0% 0%);
  cursor: pointer;
}

.aggr-feed__accept:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.aggr-feed__skip {
  min-height: 44px;
  background: transparent;
  border: none;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  font-size: 14px;
  cursor: pointer;
}

.dm-fade-enter-active,
.dm-fade-leave-active {
  transition: opacity 0.25s ease;
}

.dm-fade-enter-from,
.dm-fade-leave-to {
  opacity: 0;
}
</style>
