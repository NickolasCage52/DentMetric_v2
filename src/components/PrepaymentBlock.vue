<template>
  <div class="prepayment-block card-metallic rounded-xl">
    <div class="pb-title">ПРЕДОПЛАТА</div>

    <div class="pb-row">
      <span class="pb-label">Сумма предоплаты:</span>
      <button
        v-if="!readonly"
        type="button"
        class="pb-amount-value"
        @click="openAmountInput"
      >
        {{ (modelValue?.amount ?? 0) > 0
          ? (modelValue.amount).toLocaleString('ru-RU') + ' ₽'
          : '0 ₽' }}
      </button>
      <span v-else class="pb-amount-value pb-amount-value--readonly">
        {{ (modelValue?.amount ?? 0) > 0
          ? (modelValue.amount).toLocaleString('ru-RU') + ' ₽'
          : '0 ₽' }}
      </span>
    </div>

    <div class="pb-row pb-row--methods">
      <span class="pb-label">Способ оплаты:</span>
      <div class="pb-methods">
        <label
          v-for="method in PAYMENT_METHODS"
          :key="method.value"
          class="pb-method"
          :class="{ 'pb-method--active': modelValue?.method === method.value, 'pb-method--readonly': readonly }"
        >
          <input
            type="radio"
            :value="method.value"
            :checked="modelValue?.method === method.value"
            :disabled="readonly"
            @change="onMethodChange(method.value)"
            class="pb-radio-native"
          />
          <span class="pb-radio-custom"></span>
          <span class="pb-method-label">{{ method.label }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ amount: 0, method: null }),
  },
  readonly: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const openInputModal = inject('openInputModal');

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Наличные' },
  { value: 'transfer', label: 'Перевод' },
  { value: 'card', label: 'Карта' },
];

function onMethodChange(value) {
  emit('update:modelValue', { ...(props.modelValue || {}), method: value });
}

async function openAmountInput() {
  if (!openInputModal) return;
  const value = await openInputModal({
    title: 'Предоплата',
    label: 'Сумма предоплаты (₽)',
    value: props.modelValue?.amount > 0 ? String(props.modelValue.amount) : '',
    inputType: 'number',
    placeholder: '0',
    min: 0,
    allowDecimals: false,
  });
  if (value === undefined) return;
  const amount = Math.max(0, Math.round(Number(value) || 0));
  emit('update:modelValue', { ...(props.modelValue || {}), amount });
}
</script>

<style scoped>
.prepayment-block {
  padding: 14px 16px;
  margin-bottom: 12px;
}
.pb-title {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 12px;
}
.pb-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.pb-row--methods {
  align-items: flex-start;
  flex-direction: column;
}
.pb-label {
  font-size: 12px;
  color: #888;
}
.pb-amount-value {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 2px;
  min-width: 60px;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  text-align: left;
  font-family: inherit;
}
.pb-amount-value:not(.pb-amount-value--readonly) {
  cursor: pointer;
}
.pb-amount-value--readonly {
  cursor: default;
}
.pb-methods {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.pb-method {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.pb-radio-native {
  display: none;
}
.pb-radio-custom {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #555;
  flex-shrink: 0;
  transition: border-color 0.15s, background 0.15s;
}
.pb-method--active .pb-radio-custom {
  border-color: var(--metric-green);
  background: var(--metric-green);
  box-shadow: 0 0 6px var(--metric-green);
}
.pb-method-label {
  font-size: 13px;
  color: #ccc;
}
.pb-method--active .pb-method-label {
  color: #fff;
}
</style>
