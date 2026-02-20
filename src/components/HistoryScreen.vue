<template>
  <div class="hs-root">
    <!-- Top bar -->
    <div class="hs-topbar">
      <button type="button" class="hs-back-btn" @click="$emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
      </button>
      <img src="/dm-small.png" alt="DM" class="hs-logo" onerror="this.style.display='none'">
      <div style="width:36px"></div>
    </div>

    <!-- Date range tabs -->
    <div class="hs-range-row">
      <div class="hs-range-tabs">
        <button
          v-for="t in rangeTabs"
          :key="t.key"
          type="button"
          class="hs-range-tab"
          :class="{ 'hs-range-tab--active': activeRange === t.key && !customRange }"
          @click="setRange(t.key)"
        >{{ t.label }}</button>
      </div>
      <button type="button" class="hs-cal-btn" :class="{ 'hs-cal-btn--active': !!customRange }" @click="openDateModal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </button>
    </div>

    <!-- Summary rows -->
    <div class="hs-summary">
      <div class="hs-sum-row">
        <span class="hs-sum-label">Оценок без записи</span>
        <span class="hs-sum-nums"><b>{{ summary.noBooking.count }}</b> {{ fmtK(summary.noBooking.sum) }} ₽</span>
      </div>
      <div class="hs-sum-row">
        <span class="hs-sum-label">Записаны на ремонт</span>
        <span class="hs-sum-nums"><b>{{ summary.booked.count }}</b> {{ fmtK(summary.booked.sum) }} ₽</span>
      </div>
      <div class="hs-sum-row">
        <span class="hs-sum-label">Выполнено</span>
        <span class="hs-sum-nums"><b>{{ summary.done.count }}</b> {{ fmtK(summary.done.sum) }} ₽</span>
      </div>
      <div class="hs-sum-row hs-sum-row--total">
        <span class="hs-sum-label" style="font-weight:700">Всего</span>
        <span class="hs-sum-nums hs-sum-nums--green"><b>{{ summary.all.count }}</b> {{ fmtK(summary.all.sum) }} ₽</span>
      </div>
    </div>

    <!-- Scrollable list -->
    <div ref="listWrapRef" class="hs-list-wrap">
      <div v-if="filteredItems.length === 0" class="hs-empty">
        <div style="font-size:28px;margin-bottom:6px">🗂️</div>
        <div v-if="totalItemCount === 0">История пуста</div>
        <div v-else>
          <div>Нет записей за выбранный период</div>
          <div style="margin-top:6px;font-size:11px;color:#6b7280">Всего записей: {{ totalItemCount }}</div>
          <button type="button" class="hs-show-all-btn" @click="setRange('month')">Показать за месяц</button>
        </div>
      </div>
      <div
        v-for="item in displayItems"
        :key="item.id"
        class="hs-card"
        @click="$emit('select', item.id)"
      >
        <div class="hs-card-avatar">
          <div class="hs-avatar-circle">{{ avatarInitial(item) }}</div>
        </div>
        <div class="hs-card-body">
          <div class="hs-card-name">{{ clientName(item) }}</div>
          <div class="hs-card-phone">
            {{ maskedPhone(item) }}<span class="hs-card-time">{{ relativeTime(item) }}</span>
          </div>
          <div class="hs-card-car">{{ carLine(item) }}</div>
          <div class="hs-card-total">Итого: {{ fmtPrice(item.total || 0) }} ₽ ·</div>
        </div>
        <div class="hs-card-right">
          <span class="hs-badge" :class="badgeClass(item)">{{ badgeText(item) }}</span>
          <button
            v-if="itemStatus(item) === 'no_booking'"
            type="button"
            class="hs-book-btn"
            @click.stop="bookItem(item)"
          >записать</button>
        </div>
      </div>
    </div>

    <!-- Search FAB -->
    <button type="button" class="hs-fab" :style="{ bottom: fabBottom }" @click="searchOpen = true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    </button>

    <!-- Search overlay -->
    <Teleport to="body">
      <Transition name="hs-fade">
        <div v-if="searchOpen" class="hs-search-overlay" @click.self="searchOpen = false">
          <div class="hs-search-box">
            <div class="hs-search-title">Поиск</div>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="search"
              inputmode="search"
              class="hs-search-input"
              placeholder="Имя, телефон, марка…"
              @keydown.enter="searchInputRef?.blur()"
            >
            <div class="hs-search-results">
              <div v-if="searchResults.length === 0 && searchQuery.length > 0" class="hs-search-empty">Ничего не найдено</div>
              <button
                v-for="r in searchResults"
                :key="r.id"
                type="button"
                class="hs-search-item"
                @click="searchOpen = false; $emit('select', r.id)"
              >
                <span class="hs-search-item-name">{{ clientName(r) }}</span>
                <span class="hs-search-item-price">{{ fmtPrice(r.total || 0) }} ₽</span>
              </button>
            </div>
            <button type="button" class="hs-search-close" @click="searchOpen = false">Закрыть</button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Date range modal -->
    <Teleport to="body">
      <Transition name="hs-fade">
        <div v-if="dateModalOpen" class="hs-search-overlay" @click.self="dateModalOpen = false">
          <div class="hs-search-box" style="max-width:320px">
            <div class="hs-search-title">Выбрать период</div>
            <div style="display:flex;flex-direction:column;gap:8px;margin:8px 0">
              <label class="hs-date-label">
                <span>С:</span>
                <input v-model="dateFrom" type="date" class="hs-date-input">
              </label>
              <label class="hs-date-label">
                <span>По:</span>
                <input v-model="dateTo" type="date" class="hs-date-input">
              </label>
            </div>
            <div style="display:flex;gap:8px">
              <button type="button" class="hs-search-close" style="flex:1" @click="dateModalOpen = false">Отмена</button>
              <button type="button" class="hs-search-close hs-search-close--green" style="flex:1" @click="applyCustomRange">Применить</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';

const props = defineProps({
  historyItems: { type: Array, default: () => [] },
  footerHeight: { type: String, default: '64px' }
});

const emit = defineEmits(['back', 'select', 'update-status']);

const rangeTabs = [
  { key: 'today', label: 'Сегодня' },
  { key: 'yesterday', label: 'Вчера' },
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' }
];
const activeRange = ref('today');
const customRange = ref(null);
const dateModalOpen = ref(false);
const dateFrom = ref('');
const dateTo = ref('');
const searchOpen = ref(false);
const searchQuery = ref('');
const searchInputRef = ref(null);
const listWrapRef = ref(null);

watch(searchOpen, (v) => { if (v) nextTick(() => searchInputRef.value?.focus()); });

onMounted(() => {
  nextTick(() => {
    if (listWrapRef.value?.scrollTo) listWrapRef.value.scrollTo({ top: 0, behavior: 'auto' });
  });
});

const fabBottom = computed(() => `calc(${props.footerHeight} + 16px)`);

function dayStart(d) { const r = new Date(d); r.setHours(0,0,0,0); return r; }
function dayEnd(d) { const r = new Date(d); r.setHours(23,59,59,999); return r; }

function normalizeItem(item) {
  if (!item || typeof item !== 'object') return null;
  const normalized = { ...item };
  if (!normalized.id) normalized.id = `legacy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  if (!normalized.createdAt) normalized.createdAt = new Date().toISOString();
  if (typeof normalized.total === 'string') normalized.total = parseFloat(normalized.total) || 0;
  if (typeof normalized.rawTotal === 'string') normalized.rawTotal = parseFloat(normalized.rawTotal) || 0;
  return normalized;
}

const normalizedItems = computed(() => {
  return props.historyItems.map(normalizeItem).filter(Boolean);
});

const dateFilter = computed(() => {
  if (customRange.value) return customRange.value;
  const now = new Date();
  const today = dayStart(now);
  if (activeRange.value === 'today') return { from: today, to: dayEnd(now) };
  if (activeRange.value === 'yesterday') {
    const y = new Date(today); y.setDate(y.getDate() - 1);
    return { from: y, to: dayEnd(y) };
  }
  if (activeRange.value === 'week') {
    const w = new Date(today); w.setDate(w.getDate() - 7);
    return { from: w, to: dayEnd(now) };
  }
  const m = new Date(today); m.setMonth(m.getMonth() - 1);
  return { from: m, to: dayEnd(now) };
});

const filteredItems = computed(() => {
  const { from, to } = dateFilter.value;
  return normalizedItems.value.filter((item) => {
    const d = new Date(item.createdAt);
    return d >= from && d <= to;
  });
});

const displayItems = computed(() => filteredItems.value);

const totalItemCount = computed(() => normalizedItems.value.length);

function itemStatus(item) {
  return item.status || 'no_booking';
}

const summary = computed(() => {
  const s = { noBooking: { count: 0, sum: 0 }, booked: { count: 0, sum: 0 }, done: { count: 0, sum: 0 }, all: { count: 0, sum: 0 } };
  for (const item of filteredItems.value) {
    const st = itemStatus(item);
    const t = item.total || 0;
    s.all.count++; s.all.sum += t;
    if (st === 'booked') { s.booked.count++; s.booked.sum += t; }
    else if (st === 'done') { s.done.count++; s.done.sum += t; }
    else { s.noBooking.count++; s.noBooking.sum += t; }
  }
  return s;
});

const searchResults = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return [];
  return normalizedItems.value.filter((item) => {
    const haystack = [
      item.client?.name, item.client?.phone, item.client?.brand,
      item.client?.model, item.element, item.comment
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  }).slice(0, 20);
});

function setRange(key) {
  activeRange.value = key;
  customRange.value = null;
}

function openDateModal() {
  const now = new Date();
  dateTo.value = now.toISOString().slice(0, 10);
  const week = new Date(now); week.setDate(week.getDate() - 7);
  dateFrom.value = week.toISOString().slice(0, 10);
  dateModalOpen.value = true;
}

function applyCustomRange() {
  if (dateFrom.value && dateTo.value) {
    customRange.value = { from: dayStart(new Date(dateFrom.value)), to: dayEnd(new Date(dateTo.value)) };
  }
  dateModalOpen.value = false;
}

function bookItem(item) {
  emit('update-status', { id: item.id, status: 'booked', bookingAt: new Date().toISOString() });
}

function clientName(item) {
  return item.client?.name || 'Клиент без имени';
}

function avatarInitial(item) {
  const name = item.client?.name || '';
  return name.charAt(0).toUpperCase() || '?';
}

function maskedPhone(item) {
  const raw = (item.client?.phone || '').replace(/\D/g, '');
  if (raw.length < 4) return item.client?.phone || '—';
  const last2 = raw.slice(-2);
  if (raw.length >= 11) {
    const code = raw.slice(1, 4);
    return `+7 (${code}) ***-**-${last2}`;
  }
  if (raw.length >= 10) {
    const code = raw.slice(0, 3);
    return `+7 (${code}) ***-**-${last2}`;
  }
  return `***-${last2}`;
}

function relativeTime(item) {
  const d = new Date(item.createdAt);
  const now = new Date();
  const today = dayStart(now);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (d >= today) return `Сегодня ${time}`;
  if (d >= yesterday) return `Вчера ${time}`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ' ' + time;
}

function carLine(item) {
  const parts = [];
  if (item.client?.brand) parts.push(item.client.brand);
  if (item.client?.model) parts.push(item.client.model);
  const car = parts.join(' ') || '';
  const el = extractElement(item);
  if (car && el) return `${car} · ${el}`;
  return car || el || '—';
}

function extractElement(item) {
  if (item.element) {
    const e = item.element;
    return e.includes(':') ? e.split(':').pop() : e;
  }
  const dents = item.dents?.items || item.quickDents || [];
  if (dents.length > 0) {
    const first = dents[0];
    const el = first.panelElement || '';
    if (dents.length > 1) return `${el} +${dents.length - 1}`;
    return el;
  }
  return '';
}

function badgeText(item) {
  const st = itemStatus(item);
  if (st === 'booked') return 'записан';
  if (st === 'done') return 'Выполнено';
  return 'Без записи';
}

function badgeClass(item) {
  const st = itemStatus(item);
  if (st === 'booked') return 'hs-badge--booked';
  if (st === 'done') return 'hs-badge--done';
  return 'hs-badge--none';
}

const fmtPrice = (v) => new Intl.NumberFormat('ru-RU').format(Math.round(v));
const fmtK = (v) => {
  if (v >= 1000) return new Intl.NumberFormat('ru-RU').format(Math.round(v));
  return String(Math.round(v));
};
</script>

<style scoped>
.hs-root {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  color: #e5e7eb;
}

.hs-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 6px;
  flex-shrink: 0;
}
.hs-back-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);
  background: transparent; color: #9ca3af;
}
.hs-back-btn:active { background: rgba(255,255,255,0.05); }
.hs-logo { height: 28px; width: auto; }

.hs-range-row {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 16px 8px; flex-shrink: 0;
}
.hs-range-tabs {
  display: flex; flex: 1; gap: 0;
  border-radius: 10px; overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
}
.hs-range-tab {
  flex: 1; padding: 7px 2px; font-size: 11px; font-weight: 700;
  text-transform: none; background: rgba(0,0,0,0.4); color: #9ca3af;
  border: none; transition: all 0.15s;
}
.hs-range-tab--active {
  background: #88e523; color: #000;
}
.hs-cal-btn {
  width: 36px; height: 36px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);
  background: transparent; color: #9ca3af;
}
.hs-cal-btn--active { border-color: rgba(136,229,35,0.4); color: #88e523; }

.hs-summary {
  padding: 0 16px 6px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: 3px;
}
.hs-sum-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 7px 12px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.06);
  background: linear-gradient(180deg, #1a1a1a 0%, #111 100%);
  font-size: 12px;
}
.hs-sum-row--total { border-color: rgba(136,229,35,0.15); }
.hs-sum-label { color: #9ca3af; }
.hs-sum-nums { color: #e5e7eb; font-variant-numeric: tabular-nums; }
.hs-sum-nums b { color: #fff; font-weight: 800; margin-right: 4px; font-size: 14px; }
.hs-sum-nums--green { color: #88e523; }
.hs-sum-nums--green b { color: #88e523; }

.hs-list-wrap {
  flex: 1; overflow-y: auto; padding: 8px 16px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  display: flex; flex-direction: column; gap: 8px;
}
.hs-empty {
  text-align: center; color: #6b7280; padding: 40px 0; font-size: 13px;
}

.hs-card {
  display: flex; gap: 10px; padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.06);
  background: linear-gradient(180deg, #1e1e1e 0%, #121212 100%);
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  cursor: pointer; transition: border-color 0.15s;
}
.hs-card:active { border-color: rgba(136,229,35,0.3); }

.hs-card-avatar { flex-shrink: 0; }
.hs-avatar-circle {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  border: 1px solid rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 700; color: #9ca3af;
}

.hs-card-body { flex: 1; min-width: 0; }
.hs-card-name { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 1px; }
.hs-card-phone { font-size: 11px; color: #6b7280; margin-bottom: 2px; }
.hs-card-time { margin-left: 4px; color: #88e523; font-size: 10px; }
.hs-card-car { font-size: 11px; color: #9ca3af; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hs-card-total { font-size: 12px; color: #e5e7eb; font-weight: 600; }

.hs-card-right {
  display: flex; flex-direction: column; align-items: flex-end;
  gap: 6px; flex-shrink: 0;
}
.hs-badge {
  font-size: 10px; font-weight: 700; padding: 3px 10px;
  border-radius: 6px; white-space: nowrap;
}
.hs-badge--none { background: #2a2a2a; color: #9ca3af; border: 1px solid rgba(255,255,255,0.08); }
.hs-badge--booked { background: rgba(234,179,8,0.15); color: #eab308; border: 1px solid rgba(234,179,8,0.25); }
.hs-badge--done { background: rgba(59,130,246,0.12); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }

.hs-book-btn {
  font-size: 10px; font-weight: 700; padding: 4px 12px;
  border-radius: 6px; border: none;
  background: #88e523; color: #000;
  cursor: pointer;
}
.hs-book-btn:active { opacity: 0.85; }

.hs-fab {
  position: fixed; right: 20px; z-index: 210;
  width: 56px; height: 56px; border-radius: 50%;
  background: #88e523; border: none;
  box-shadow: 0 4px 20px rgba(136,229,35,0.4);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.hs-fab:active { transform: scale(0.93); }

/* Overlays */
.hs-search-overlay {
  position: fixed; inset: 0; z-index: 11000;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center; padding: 0;
}
.hs-search-box {
  width: 100%; max-width: 448px;
  background: #0b0f14; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px 20px 0 0; padding: 20px 20px calc(20px + env(safe-area-inset-bottom, 0px));
  max-height: 80vh; display: flex; flex-direction: column;
}
.hs-search-title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 10px; }
.hs-search-input {
  width: 100%; padding: 10px 14px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.12); background: #151515;
  color: #fff; font-size: 15px; outline: none;
}
.hs-search-input:focus { border-color: rgba(136,229,35,0.4); }
.hs-search-input::placeholder { color: #6b7280; }
.hs-search-results {
  flex: 1; overflow-y: auto; margin-top: 10px;
  display: flex; flex-direction: column; gap: 4px;
}
.hs-search-empty { color: #6b7280; font-size: 13px; text-align: center; padding: 16px 0; }
.hs-search-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.06); background: #1a1a1a;
  color: #e5e7eb; font-size: 13px; text-align: left; cursor: pointer;
}
.hs-search-item:active { border-color: rgba(136,229,35,0.3); }
.hs-search-item-name { font-weight: 600; }
.hs-search-item-price { color: #88e523; font-weight: 700; flex-shrink: 0; }
.hs-search-close {
  margin-top: 10px; padding: 10px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1); background: transparent;
  color: #9ca3af; font-size: 13px; font-weight: 600; cursor: pointer;
}
.hs-search-close:active { background: rgba(255,255,255,0.05); }
.hs-search-close--green { color: #88e523; border-color: rgba(136,229,35,0.3); }

.hs-date-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: #9ca3af;
}
.hs-date-input {
  flex: 1; padding: 8px 10px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12); background: #151515;
  color: #fff; font-size: 14px; outline: none;
  color-scheme: dark;
}

.hs-show-all-btn {
  margin-top: 10px; padding: 6px 18px; border-radius: 8px;
  border: 1px solid rgba(136,229,35,0.3); background: transparent;
  color: #88e523; font-size: 12px; font-weight: 600; cursor: pointer;
}
.hs-show-all-btn:active { background: rgba(136,229,35,0.08); }

.hs-fade-enter-active, .hs-fade-leave-active { transition: opacity 0.2s; }
.hs-fade-enter-from, .hs-fade-leave-to { opacity: 0; }
</style>
