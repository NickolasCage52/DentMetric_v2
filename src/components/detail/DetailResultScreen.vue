<template>
  <div class="result-screen">
    <!-- Та же структура, что quickStep === 3 в App.vue: ClientInfoBlock + StandardQuickFinalScreen -->
    <div
      class="result-screen__body result-screen__body--detail-scroll qc-step3 qc-step3--tabbed flex flex-col min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y"
    >
      <ClientInfoBlock
        :client="clientForDisplay"
        :editable="true"
        @edit="$emit('edit-client')"
        @edit-field="$emit('edit-client-field', $event)"
      />
      <StandardQuickFinalScreen
        class="w-full shrink-0"
        :unified-parent-scroll="true"
        :draft="estimateDraft"
        :engine-line-items="lineItems"
        :client-display="clientForDisplay"
        :user-settings="userSettings"
        :build-detailed-breakdown="runBuildDetailedBreakdown"
        :engine-dents-total="engineDentsTotal"
        :detail-photo-data-url="session.photoDataUrl || null"
        @open-discount="$emit('open-discount', $event)"
        @open-comment="$emit('open-comment')"
      />
    </div>

    <div
      class="graphics-action-bar flex gap-0 shrink-0 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-white/10"
    >
      <button
        type="button"
        class="qc-s3-btn qc-s3-btn--left flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-300 border border-white/10 min-h-[40px]"
        @click="$emit('back')"
      >
        Назад
      </button>
      <button
        type="button"
        class="qc-s3-btn qc-s3-btn--mid flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white border border-white/15 min-h-[40px] transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="finalActionsDisabled"
        @click="$emit('save')"
      >
        {{ historySaving ? '...' : 'Сохранить' }}
      </button>
      <button
        type="button"
        class="qc-s3-btn qc-s3-btn--right flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest text-metric-green border border-metric-green/40 min-h-[40px] transition-colors hover:bg-metric-green/10 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="finalActionsDisabled"
        @click="$emit('record')"
      >
        {{ historySaving ? '...' : 'Записать' }}
      </button>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import ClientInfoBlock from '../ClientInfoBlock.vue';
import StandardQuickFinalScreen from '../result/StandardQuickFinalScreen.vue';
import { buildQuickFinalBreakdown } from '../../utils/buildQuickFinalBreakdown';
import { formatArmaturnayaSummary } from '../../data/armaturnayaWorks';

const props = defineProps({
  session: { type: Object, required: true },
  lineItems: { type: Array, default: () => [] },
  estimateDraft: { type: Object, required: true },
  userSettings: { type: Object, required: true },
  initialData: { type: Object, required: true },
  engineDentsTotal: { type: Number, default: 0 },
  historySaving: { type: Boolean, default: false },
  finalActionsDisabled: { type: Boolean, default: false },
});

defineEmits(['back', 'save', 'record', 'open-discount', 'open-comment', 'edit-client', 'edit-client-field']);

/** Разбор цены здесь, без передачи Function через пропсы (надёжно в Telegram WebView). */
function runBuildDetailedBreakdown(dentItem) {
  return buildQuickFinalBreakdown(dentItem, props.initialData, formatArmaturnayaSummary);
}

const clientForDisplay = computed(() => {
  const c = props.session.client;
  const d = props.estimateDraft;
  return {
    name: c?.name ?? d?.clientName ?? '',
    phone: c?.phone ?? d?.clientPhone ?? '',
    brand: c?.carBrand ?? d?.carBrand ?? '',
    model: c?.carModel ?? d?.carModel ?? '',
    company: c?.company ?? d?.clientCompany ?? '',
  };
});
</script>

<style scoped>
.result-screen {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  background: var(--dm-bg, #0f0f0f);
  overflow: hidden;
  /* Не даём нижней таб-панели приложения перекрывать «Назад / Сохранить / Записать» */
  padding-bottom: var(--app-footer-height, calc(56px + env(safe-area-inset-bottom, 0px)));
  box-sizing: border-box;
}
.result-screen__body {
  padding: 0 14px;
  min-height: 0;
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
}
.result-screen__body--detail-scroll {
  -webkit-overflow-scrolling: touch;
}
.result-screen__body :deep(.sqf) {
  min-height: 0;
}
.result-screen__body--detail-scroll :deep(.sqf) {
  min-height: auto;
  flex: 0 0 auto;
}
</style>
