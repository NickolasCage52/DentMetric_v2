<template>
  <transition name="client-card-fade">
    <div v-if="client" class="client-found-card">
      <div class="client-found-card__header">
        <span class="client-found-card__icon">👤</span>
        <span class="client-found-card__title">Клиент найден</span>
      </div>
      <div class="client-found-card__divider" />
      <div class="client-found-card__info">
        <span class="client-found-card__stat">{{ visitLabel }}</span>
        <span class="client-found-card__stat">
          Последний визит: {{ lastVisit }}
        </span>
        <span class="client-found-card__stat">
          Средний чек: {{ avgPrice }}
        </span>
      </div>
      <div class="client-found-card__actions">
        <button
          v-if="hasAutofillData"
          class="client-found-card__btn client-found-card__btn--autofill"
          type="button"
          @click="handleAutofill"
        >
          Подставить данные
        </button>
        <button
          class="client-found-card__btn client-found-card__btn--history"
          type="button"
          @click="$emit('open-history')"
        >
          Открыть историю &rsaquo;
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatVisitDate, formatPrice, extractClientFields, type ClientAggregation, type ClientFields } from '../utils/clientSearch';

const props = defineProps<{ client: ClientAggregation | null }>();
const emit = defineEmits<{ 'open-history': []; 'autofill-client': [fields: ClientFields] }>();

const autofillFields = computed(() => {
  if (!props.client?.allRecords) return null;
  return extractClientFields(props.client.allRecords);
});

const hasAutofillData = computed(() => autofillFields.value !== null);

function handleAutofill() {
  if (autofillFields.value) {
    emit('autofill-client', autofillFields.value);
  }
}

const visitLabel = computed(() => {
  const n = props.client?.totalVisits ?? 0;
  if (n === 1) return '1 обращение';
  if (n >= 2 && n <= 4) return `${n} обращения`;
  return `${n} обращений`;
});

const lastVisit = computed(() =>
  formatVisitDate(props.client?.lastVisitDate ?? null)
);

const avgPrice = computed(() =>
  formatPrice(props.client?.avgCompletedPrice ?? null)
);
</script>

<style scoped>
/* Цвета: нейтральный серо-графитовый, фон на 5% светлее основного — PDF стр. 5, анти-якорение */
.client-found-card {
  background: #2a2a2a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px 14px;
  margin-top: 6px;
  margin-bottom: 2px;
}
.client-found-card__header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
}
.client-found-card__icon {
  font-size: 14px;
  opacity: 0.7;
}
.client-found-card__divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 7px 0;
}
.client-found-card__info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.client-found-card__stat {
  font-size: 12px;
  color: #9e9e9e;
  /* Анти-якорение: сумма НЕ выделяется жирным/цветом — PDF стр. 5 */
}
.client-found-card__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
  flex-wrap: wrap;
}
.client-found-card__btn {
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid #444;
  color: #e0e0e0;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s, border-color 0.2s;
}
.client-found-card__btn--history {
  border-color: #444;
  color: #e0e0e0;
}
.client-found-card__btn--autofill {
  border-color: #555;
  color: #aaa;
}
.client-found-card__btn:hover {
  color: #fff;
  border-color: #555;
}
.client-found-card__btn--autofill:hover {
  color: #ccc;
  border-color: #666;
}
@media (max-width: 320px) {
  .client-found-card__actions {
    flex-direction: column;
    align-items: flex-end;
  }
}
/* Transition */
.client-card-fade-enter-active,
.client-card-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.client-card-fade-enter-from,
.client-card-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
