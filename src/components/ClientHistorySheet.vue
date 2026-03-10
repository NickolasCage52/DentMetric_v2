<template>
  <teleport to="body">
    <transition name="sheet-fade">
      <div v-if="isOpen" class="sheet-overlay" @click.self="close">
        <div class="sheet-container">
          <!-- Header -->
          <div class="sheet-header">
            <span class="sheet-title">История клиента</span>
            <button type="button" class="sheet-close" aria-label="Закрыть" @click="close">✕</button>
          </div>

          <!-- Table header -->
          <div class="sheet-table-header">
            <span>Дата</span>
            <span>Статус</span>
            <span>Сумма</span>
          </div>

          <!-- Records list -->
          <div class="sheet-list">
            <div
              v-for="(record, idx) in sortedRecords"
              :key="record.id ?? record.createdAt ?? idx"
              class="sheet-row"
              @click="openRecord(record)"
            >
              <span class="sheet-row__date">{{ formatDate(record) }}</span>
              <span class="sheet-row__status">{{ statusLabel(record.status) }}</span>
              <span class="sheet-row__price">
                {{ formatPrice(record) }}
                <span v-if="record.id" class="sheet-row__arrow">&rsaquo;</span>
              </span>
            </div>
            <div v-if="sortedRecords.length === 0" class="sheet-empty">
              Нет записей
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatVisitDate, type HistoryRecord } from '../utils/clientSearch';

const props = defineProps<{
  isOpen: boolean;
  records: HistoryRecord[];
}>();

const emit = defineEmits<{
  close: [];
  'open-record': [record: HistoryRecord];
}>();

const STATUS_LABELS: Record<string, string> = {
  estimate: 'Без записи',
  scheduled: 'Записан',
  done: 'Выполнено',
  rejected: 'Отказ'
};

function statusLabel(status?: string): string {
  if (!status) return '—';
  return STATUS_LABELS[status] ?? status;
}

function getRecordDate(r: HistoryRecord): string | null {
  return r?.createdAt ?? r?.date ?? null;
}

function getRecordTotal(r: HistoryRecord): number | null {
  const v = r?.total ?? r?.totalPrice;
  return typeof v === 'number' && !isNaN(v) ? v : null;
}

const sortedRecords = computed(() =>
  [...props.records]
    .filter((r) => r != null)
    .sort((a, b) => {
      try {
        const da = new Date(getRecordDate(a) ?? 0).getTime();
        const db = new Date(getRecordDate(b) ?? 0).getTime();
        return db - da;
      } catch {
        return 0;
      }
    })
);

function formatDate(r: HistoryRecord): string {
  return formatVisitDate(getRecordDate(r) ?? null);
}

function formatPrice(r: HistoryRecord): string {
  const p = getRecordTotal(r);
  return p !== null ? p.toLocaleString('ru-RU') + ' ₽' : '—';
}

function close() {
  emit('close');
}

function openRecord(record: HistoryRecord) {
  emit('open-record', record);
}
</script>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
}
.sheet-container {
  background: #1e1e1e;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 75vh;
  padding: 16px;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}
.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.sheet-title {
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
}
.sheet-close {
  background: none;
  border: none;
  color: #9e9e9e;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
}
.sheet-table-header {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  font-size: 11px;
  color: #666;
  padding: 0 4px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.sheet-list {
  overflow-y: auto;
  flex: 1;
}
.sheet-row {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  align-items: center;
  padding: 12px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  font-size: 13px;
  color: #e0e0e0;
}
.sheet-row:active {
  opacity: 0.7;
}
.sheet-row__price {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}
.sheet-row__arrow {
  color: #666;
  font-size: 14px;
}
.sheet-empty {
  text-align: center;
  color: #666;
  padding: 24px;
  font-size: 13px;
}
/* Transition */
.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.25s ease;
}
.sheet-fade-enter-active .sheet-container,
.sheet-fade-leave-active .sheet-container {
  transition: transform 0.25s ease;
}
.sheet-fade-enter-from .sheet-container,
.sheet-fade-leave-to .sheet-container {
  transform: translateY(100%);
}
.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}
</style>
