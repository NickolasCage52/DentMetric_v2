<template>
  <div class="detail-client-screen dm-detail-screen">
    <div class="detail-client-header dm-detail-screen__header">
      <div class="app-header-logo-bar">
        <div class="app-header-logo-bar__left"></div>
        <img src="/dm-small.png" alt="DentMetric" class="app-header-logo-bar__logo" onerror="this.style.display='none'" />
        <div class="app-header-logo-bar__right"></div>
      </div>
    </div>
    <div class="detail-client-dots dm-detail-screen__dots">
      <StepDots :current-step="1" :total-steps="6" />
    </div>
    <div class="dm-detail-screen__body">
      <QuickStyleClientSection
        :model="localModel"
        :client-required="clientRequired"
        :can-next="isClientValid"
        :show-info-tooltips="showInfoTooltips"
        :history-enabled="historyEnabled"
        :found-client="foundClient"
        :on-next="handleConfirm"
        :price="0"
        @next="handleConfirm"
        @back="$emit('back')"
        @open-field="onOpenField"
        @reset-client="resetClient"
        @open-history="emitOpenHistory"
        @autofill-client="onAutofillClient"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, inject, onMounted } from 'vue';
import QuickStyleClientSection from '../quickStyle/QuickStyleClientSection.vue';
import StepDots from '../graphics/StepDots.vue';
import { normalizePhoneForInput } from '../../utils/phoneFormat';

const props = defineProps({
  client: { type: Object, default: null },
  clientRequired: { type: Boolean, default: false },
  showInfoTooltips: { type: Boolean, default: true },
  historyEnabled: { type: Boolean, default: false },
  foundClient: { type: Object, default: null },
  onConfirm: { type: Function, default: null },
  searchByPhone: { type: Function, default: null },
  /** RU | BY — маска телефона в модалке (+7 / +375) */
  phoneRegion: { type: String, default: 'RU' },
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
  const phoneReg = props.phoneRegion === 'BY' ? 'BY' : 'RU';
  let value = localModel.value[field] ?? '';
  if (field === 'clientPhone') {
    value = normalizePhoneForInput(value, phoneReg);
  }
  const mask = field === 'clientPhone' ? 'phone' : field === 'clientName' ? 'name' : null;
  const result = await openInputModal({
    title: 'Данные клиента',
    label,
    value,
    inputType,
    placeholder: placeholder || label,
    mask,
    phoneRegion: mask === 'phone' ? phoneReg : undefined,
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

/** История по телефону: до «Далее» данные только в localModel, не в estimateDraft */
function emitOpenHistory() {
  emit('open-history', { phone: localModel.value.clientPhone ?? '' });
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
/* Полноэкранный слой над вьюпортом: низ = высота таб-бара (как в E2E / аудит) */
.dm-detail-screen {
  position: fixed;
  top: env(safe-area-inset-top, 0px);
  left: 0;
  right: 0;
  bottom: var(--tab-bar-height, var(--app-footer-height, var(--bottom-nav-h, 64px)));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #000;
  z-index: 120;
  min-height: 0;
}
.dm-detail-screen__header {
  flex-shrink: 0;
  padding: 16px 0 8px;
}
.dm-detail-screen__dots {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 8px;
}
/* Тело: форма + скролл (QuickStyleClientSection сам даёт overflow-y: auto внутри) */
.dm-detail-screen__body {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 16px;
  box-sizing: border-box;
}
</style>

