<template>
  <div class="dm-detail-screen detail-screen">
    <div class="detail-screen__content">

      <DetailProgressDots
        v-if="detailSteps?.length"
        :steps="detailSteps"
        :current-index="detailStepIndex"
      />

      <QuickStyleClientSection
        :model="localModel"
        :client-required="clientRequired"
        :can-next="isClientValid"
        :show-info-tooltips="showInfoTooltips"
        :history-enabled="historyEnabled"
        :found-client="foundClient"
        :on-next="handleConfirm"
        @next="handleConfirm"
        @back="$emit('back')"
        @open-field="onOpenField"
        @reset-client="resetClient"
        @open-history="$emit('open-history')"
        @autofill-client="onAutofillClient"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, inject, onMounted } from 'vue';
import QuickStyleClientSection from '../quickStyle/QuickStyleClientSection.vue';
import DetailProgressDots from './DetailProgressDots.vue';
import { normalizePhoneForInput } from '../../utils/phoneFormat';

const props = defineProps({
  detailSteps: { type: Array, default: () => [] },
  detailStepIndex: { type: Number, default: 0 },
  client: { type: Object, default: null },
  clientRequired: { type: Boolean, default: false },
  showInfoTooltips: { type: Boolean, default: true },
  historyEnabled: { type: Boolean, default: false },
  foundClient: { type: Object, default: null },
  onConfirm: { type: Function, default: null },
  searchByPhone: { type: Function, default: null },
  searchByName: { type: Function, default: null },
});

const emit = defineEmits(['client-confirmed', 'back', 'open-history']);

const openInputModal = inject('openInputModal');

const localModel = ref({
  clientName: '',
  clientPhone: '',
  clientCompany: '',
  carBrand: '',
  carModel: '',
  carPlate: '',
  inspectDate: '',
  inspectTime: '',
});

function ensureInspectDateTime() {
  const m = localModel.value;
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  if (!m.inspectDate || !m.inspectDate.trim()) {
    m.inspectDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }
  if (!m.inspectTime || !m.inspectTime.trim()) {
    m.inspectTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
}

watch(
  () => props.client,
  (c) => {
    if (!c) return;
    localModel.value = {
      clientName: c.name ?? '',
      clientPhone: c.phone ?? '',
      clientCompany: c.company ?? '',
      carBrand: c.carBrand ?? '',
      carModel: c.carModel ?? '',
      carPlate: c.plateNumber ?? '',
      inspectDate: c.inspectDate ?? '',
      inspectTime: c.inspectTime ?? '',
    };
    ensureInspectDateTime();
  },
  { immediate: true }
);

watch(
  () => localModel.value.clientPhone,
  (phone) => {
    props.searchByPhone?.(phone ?? '');
  },
  { immediate: true }
);

watch(
  () => localModel.value.clientName,
  (name) => {
    if (!props.foundClient) props.searchByName?.(name ?? '');
  },
  { immediate: true }
);

onMounted(() => {
  ensureInspectDateTime();
});

const isClientValid = computed(() => {
  if (props.clientRequired) {
    const c = localModel.value;
    const phone = String(c.clientPhone ?? '').trim();
    const name = String(c.clientName ?? '').trim();
    return !!(phone || name);
  }
  return true;
});

if (import.meta.env.DEV) {
  watch(
    [() => localModel.value, isClientValid],
    ([model, valid]) => {
      const c = model ?? {};
      const hasData = Object.values(c).some(
        (v) => typeof v === 'string' && String(v).trim().length > 0
      );
      if (hasData && !valid && props.clientRequired) {
        console.warn(
          '[CLIENT VALID ASSERT] Client has data but isClientValid=false.',
          'Model:',
          c,
          'Check validation logic.'
        );
      }
    },
    { deep: true }
  );
}

async function onOpenField(field, label, inputType, placeholder) {
  if (!openInputModal) return;
  let value = localModel.value[field] ?? '';
  if (field === 'clientPhone') {
    value = normalizePhoneForInput(value);
  }
  const mask = field === 'clientPhone' ? 'phone' : field === 'clientName' ? 'name' : null;
  const result = await openInputModal({
    title: 'Данные клиента',
    label,
    value,
    inputType,
    placeholder: placeholder || label,
    mask,
  });
  if (result !== undefined && result !== null) {
    localModel.value[field] = typeof result === 'string' ? result : String(result);
  }
}

function resetClient() {
  localModel.value = {
    clientName: '',
    clientPhone: '',
    clientCompany: '',
    carBrand: '',
    carModel: '',
    carPlate: '',
    inspectDate: '',
    inspectTime: '',
  };
  ensureInspectDateTime();
}

function onAutofillClient(fields) {
  if (!fields || typeof fields !== 'object') return;
  Object.assign(localModel.value, {
    clientName: fields.clientName ?? fields.name ?? localModel.value.clientName,
    clientPhone: fields.clientPhone ?? fields.phone ?? localModel.value.clientPhone,
    clientCompany: fields.clientCompany ?? fields.company ?? localModel.value.clientCompany,
    carBrand: fields.carBrand ?? fields.brand ?? localModel.value.carBrand,
    carModel: fields.carModel ?? fields.model ?? localModel.value.carModel,
    carPlate: fields.carPlate ?? fields.plateNumber ?? localModel.value.carPlate,
  });
}

function handleConfirm() {
  const m = localModel.value;
  const client = {
    name: m.clientName?.trim() ?? '',
    phone: m.clientPhone?.trim() ?? '',
    carBrand: m.carBrand?.trim() ?? '',
    carModel: m.carModel?.trim() ?? '',
    plateNumber: m.carPlate?.trim() ?? '',
    company: m.clientCompany?.trim() ?? '',
    inspectDate: m.inspectDate?.trim() || undefined,
    inspectTime: m.inspectTime?.trim() || undefined,
  };
  if (props.onConfirm) {
    props.onConfirm(client);
  }
  emit('client-confirmed', client);
}
</script>

<style scoped>
.dm-detail-screen,
.detail-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  pointer-events: auto;
}
.detail-screen__content {
  flex: 1 1 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  min-height: 0;
}
</style>
