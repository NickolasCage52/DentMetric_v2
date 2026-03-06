<template>
  <div class="quick-style-final flex flex-col min-h-0 flex-1 overflow-hidden">
    <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain qc-step3 space-y-2 p-3 pb-24">
      <!-- Данные клиента — первым блоком (PDF стр. 5-6) -->
      <ClientInfoBlock :client="clientForDisplay" />
      <template v-for="(dentItem, idx) in lineItems" :key="dentItem.dent?.id ?? idx">
        <div class="px-1">
          <div class="flex items-baseline gap-2 mb-0.5">
            <span class="text-white font-bold text-[15px]">Вмятина ‑{{ idx + 1 }}</span>
            <span class="text-gray-300 font-semibold text-[14px] truncate">{{ dentItem.dent?.panelElement || '—' }}</span>
          </div>
          <div class="text-[11px] text-gray-400 leading-snug">
            {{ getDentLabel(dentItem.dent) }}&ensp;длина: {{ formatDim(dentItem.dent?.sizeLengthMm ?? dentItem.dent?.bboxMm?.width) }}, Высота: {{ formatDim(dentItem.dent?.sizeWidthMm ?? dentItem.dent?.bboxMm?.height) }}
          </div>
        </div>

        <div class="card-metallic rounded-xl qc-breakdown-card">
          <div class="qc-bk-row qc-bk-row--base">
            <span class="qc-bk-label font-semibold text-white">Базовая стоимость:</span>
            <span class="qc-bk-delta text-metric-green font-bold">{{ formatPrice(dentItem.base) }} ₽</span>
          </div>
          <div class="qc-bk-sep"></div>
          <div v-for="(row, ri) in getDetailedRows(dentItem)" :key="ri" class="qc-bk-row">
            <span class="qc-bk-label">{{ row.label }}</span>
            <span class="qc-bk-value">{{ row.value }}</span>
            <span class="qc-bk-delta" :class="deltaClass(row.delta)">{{ formatDelta(row.delta) }}</span>
          </div>
          <div class="qc-bk-sep"></div>
          <div class="qc-bk-row">
            <span class="qc-bk-label">Скидка:</span>
            <button type="button" class="qc-discount-input" @click="$emit('open-discount')">
              <span>{{ discountPercent ?? '—' }}</span>
            </button>
            <span class="text-gray-500 text-[11px]">%</span>
            <span v-if="dentItem.discountPercent > 0" class="qc-bk-delta text-amber-400 text-[11px]">−{{ formatPrice((dentItem.preDiscountTotal || 0) - (dentItem.appliedTotal || 0)) }} ₽</span>
          </div>
          <div class="qc-bk-sep qc-bk-sep--strong"></div>
          <div class="qc-bk-row qc-bk-row--total">
            <span class="font-bold text-white text-[13px]">Итог по вмятине:</span>
            <span :data-testid="idx === 0 ? 'total-price-graphics' : undefined" class="text-metric-green font-bold text-[18px] tabular-nums">{{ formatPrice(dentItem.appliedTotal) }} ₽</span>
          </div>
        </div>
      </template>

      <!-- ПРЕДОПЛАТА (PDF стр. 5) -->
      <PrepaymentBlock :model-value="prepayment" @update:model-value="$emit('update:prepayment', $event)" />

      <div class="card-metallic rounded-xl" style="padding:10px 12px">
        <div class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Комментарий</div>
        <button
          type="button"
          class="w-full rounded-lg bg-[#0a0a0a] border border-white/10 text-left text-[13px] text-gray-300 touch-manipulation"
          style="padding:10px 12px;min-height:48px"
          @click="$emit('open-comment')"
        >
          <span class="block truncate">{{ comment || '—' }}</span>
        </button>
      </div>
      <div class="card-metallic rounded-xl p-3">
        <AttachmentPicker
          :record-id="recordId"
          :dent-index="0"
          :model-value="attachments || []"
          @update:model-value="$emit('update:attachments', $event)"
        />
      </div>
      <!-- Смайлики адекватности клиента (PDF стр. 6-7) -->
      <ClientMoodPicker :model-value="clientMood" @update:model-value="$emit('update:clientMood', $event)" />
    </div>
    <div class="graphics-action-bar flex gap-0 shrink-0 p-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-white/10">
      <button type="button" @click="$emit('back')" class="qc-s3-btn qc-s3-btn--left flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-300 border border-white/10 min-h-[40px]">Назад</button>
      <button type="button" @click="$emit('save')" :disabled="historySaving || !(lineItems?.length > 0)" class="qc-s3-btn qc-s3-btn--mid flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white border border-white/15 min-h-[40px] transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed">
        {{ historySaving ? '...' : 'Сохранить' }}
      </button>
      <button type="button" @click="$emit('book')" :disabled="historySaving || !(lineItems?.length > 0)" class="qc-s3-btn qc-s3-btn--right flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest text-metric-green border border-metric-green/40 min-h-[40px] transition-colors hover:bg-metric-green/10 disabled:opacity-50 disabled:cursor-not-allowed">
        {{ historySaving ? '...' : 'Записать' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { buildDetailedBreakdownRows, formatBreakdownDelta, deltaClass } from '../../utils/buildDetailedBreakdown';
import AttachmentPicker from '../AttachmentPicker.vue';
import ClientInfoBlock from '../ClientInfoBlock.vue';
import ClientMoodPicker from '../ClientMoodPicker.vue';
import PrepaymentBlock from '../PrepaymentBlock.vue';

const props = defineProps({
  lineItems: { type: Array, default: () => [] },
  initialData: { type: Object, default: () => ({}) },
  recordId: { type: String, default: '' },
  attachments: { type: Array, default: () => [] },
  formatArmaturnayaSummary: { type: Function, default: null },
  comment: { type: String, default: '' },
  discountPercent: { type: [Number, null], default: null },
  historySaving: { type: Boolean, default: false },
  showRepairTime: { type: Boolean, default: false },
  estimatedRepairTime: { type: String, default: '—' },
  client: { type: Object, default: () => ({}) },
  clientMood: { type: String, default: null },
  prepayment: { type: Object, default: () => ({ amount: 0, method: null }) }
});

defineEmits(['back', 'save', 'book', 'open-discount', 'open-comment', 'update:attachments', 'update:clientMood', 'update:prepayment']);

const clientForDisplay = computed(() => ({
  name: props.client?.name ?? props.client?.clientName ?? '',
  phone: props.client?.phone ?? props.client?.clientPhone ?? '',
  brand: props.client?.brand ?? props.client?.carBrand ?? '',
  model: props.client?.model ?? props.client?.carModel ?? '',
  company: props.client?.company ?? props.client?.clientCompany ?? ''
}));

const canSave = () => (props.lineItems?.length ?? 0) > 0;

function getDetailedRows(dentItem) {
  return buildDetailedBreakdownRows(dentItem, props.initialData, props.formatArmaturnayaSummary);
}

function getDentLabel(dent) {
  if (!dent) return '—';
  if (dent.type === 'freeform' || dent.shape === 'freeform') return 'Произвольная';
  return dent.shape === 'circle' || dent.type === 'circle' ? 'Круг/Овал' : 'Полоса';
}

function formatDim(v) {
  const n = Number(v) || 0;
  return n > 0 ? n.toFixed(0) + 'мм' : '—';
}

function formatPrice(v) {
  return new Intl.NumberFormat('ru-RU').format(v ?? 0);
}

function formatDelta(d) {
  return formatBreakdownDelta(d);
}
</script>
