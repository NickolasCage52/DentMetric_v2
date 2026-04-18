<template>
  <div
    ref="graphicsRoot"
    class="graphics-fullscreen-wrapper"
    :class="graphicsRootClass"
    :style="matrixSafeTopStyle"
  >
    <StepHeader
      v-if="!(useNewDetailFlow && detailSession.currentStep === 'client')"
      :selected-class-id="selectedClassId"
      :selected-part-id="selectedPartId"
      :car-classes="carClasses"
      :parts-list="partsList"
      :lock-selection="wizardStep >= (usePhotoBasedFlow ? 4 : 4)"
      :hide-vehicle-select="usePhotoBasedFlow"
      :show-reset="true"
      :current-step="wizardStep"
      @home="$emit('home')"
      @client="showClientInfo = true"
      @update:selected-class-id="$emit('update:selectedClassId', $event)"
      @update:selected-part-id="$emit('update:selectedPartId', $event)"
      @reset-dents="resetDentsOnly"
    />
    <!-- Hint: фиксированная высота, не влияет на позицию матрицы -->
    <div class="graphics-hint-area">
      <div
        v-if="stepHintText && wizardStep >= (usePhotoBasedFlow ? 3 : 2) && wizardStep <= (usePhotoBasedFlow ? 4 : 3)"
        ref="hintRef"
        class="step-hint-block w-full px-2.5 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border pointer-events-none"
        :class="wizardStep === 2 ? 'border-metric-green/40' : 'border-metric-green/40'"
      >
        <p class="step-hint-text text-[12px] font-medium leading-tight text-gray-200 mb-0">
          {{ stepHintText }}
        </p>
      </div>
    </div>
    <!-- Stage: матрица всегда в одном месте, фиксированная позиция на всех этапах -->
    <div class="graphics-stage-area flex flex-col flex-1 min-h-0">
      <div
        id="canvas-wrapper"
        class="canvas-editor-wrap relative overflow-hidden matrix-container flex-1 min-h-0 w-full"
        style="background-color: #0b0f14"
      >
        <div
          ref="konvaContainer"
          id="konva-container"
          data-testid="graphics-konva"
          :data-ready="konvaReady ? '1' : '0'"
          class="absolute inset-0 w-full h-full"
          style="background-color: #0b0f14; padding: 0; margin: 0"
        ></div>
        <!-- Кнопка удаления вмятины на этапах 1–3 (HUD): активна только при выбранной вмятине -->
        <button
          v-if="wizardStep <= (usePhotoBasedFlow ? 4 : 3)"
          type="button"
          data-testid="btn-delete-dent"
          class="hud-delete-btn"
          :class="{ 'hud-delete-btn--active': selectedDentSize }"
          :disabled="!selectedDentSize"
          :aria-label="selectedDentSize ? 'Удалить вмятину' : 'Выберите вмятину для удаления'"
          @click="selectedDentSize && deleteCurrent()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>
    <!-- Controls: z-index выше stage, чтобы селекты всегда были кликабельны -->
    <div
      ref="controlsAreaRef"
      class="graphics-controls-area shrink-0 border-t border-white/10 bg-black/80 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[env(safe-area-inset-bottom,0px)] relative z-10 pointer-events-auto"
      :style="controlsAreaKeyboardStyle"
    >
      <!-- NEW Detail flow: client → camera → marking → dimensions → parameters → result -->
      <DetailClientScreen
        v-if="useNewDetailFlow && detailSession.currentStep === 'client'"
        :client="detailSession.client"
        :client-required="clientRequired"
        :history-enabled="props.historyEnabled"
        :found-client="detailFoundClient"
        :search-by-phone="searchByPhone"
        :phone-region="phoneInputRegion"
        :on-confirm="onDetailClientConfirmed"
        @client-confirmed="onDetailClientConfirmed"
        @back="goBack"
        @open-history="(p) => openClientHistorySheet(p)"
      />
      <DetailCameraScreen
        v-else-if="useNewDetailFlow && detailSession.currentStep === 'camera'"
        :detail-steps="DETAIL_STEPS"
        :detail-step-index="detailStepIndex"
        @photo-captured="onDetailPhotoCaptured"
        @back="detailGoToStep('client')"
      />
      <DetailMarkingScreen
        v-else-if="useNewDetailFlow && (detailSession.currentStep === 'marking' || detailSession.currentStep === 'dimensions')"
        :detail-steps="DETAIL_STEPS"
        :detail-step-index="detailStepIndex"
        :photo-data-url="detailSession.photoDataUrl"
        :dents="detailSession.dents"
        :current-step="detailSession.currentStep"
        :selected-dent-id="detailSession.selectedDentId"
        :current-dent-index="detailSession.currentDentIndex"
        :all-dimensions-filled="detailAllDimensionsFilled"
        @dent-added="(pts) => detailAddDent(pts)"
        @update:currentDentIndex="(v) => (detailSession.currentDentIndex = v)"
        @secondary-added="(p) => detailAddSecondaryDeformation(p.parentDentId, p.points)"
        @dimensions-set="(e) => detailSetDentDimensions(e.dentId, e.dims, e.shapeType)"
        @secondary-dimensions-set="(e) => detailSetSecondaryDimensions(e.dentId, e.dims)"
        @dent-deleted="detailDeleteDent"
        @dent-selected="detailSetSelectedDentId"
        @dent-moved="(e) => detailSetDentOutline(e.dentId, e.newPoints)"
        @go-to-dimensions="detailGoToStep('dimensions')"
        @annotated-photo="detailSetAnnotatedPhoto"
        @proceed="onDetailMarkingComplete"
        @reset-drawing="handleDetailResetDrawing"
        @back="detailSession.currentStep === 'dimensions' ? detailGoToStep('marking') : detailGoToStep('camera')"
      />
      <DetailParameterScreen
        v-else-if="useNewDetailFlow && detailSession.currentStep === 'parameters' && detailCurrentDent"
        :detail-steps="DETAIL_STEPS"
        :detail-step-index="detailStepIndex"
        :dent="detailCurrentDent"
        :dents="detailSession.dents"
        :dent-count="detailSession.dents.length"
        :current-index="detailSession.currentDentIndex"
        :photo-data-url="detailSession.photoDataUrl"
        :annotated-photo-url="detailSession.annotatedPhotoDataUrl"
        :is-last-dent="detailSession.currentDentIndex === detailSession.dents.length - 1"
        :initial-data="initialData"
        :user-settings="userSettings"
        :selected-part-name="selectedPart?.name"
        @next="onDetailParameterNext"
        @go-to-index="onDetailParameterGoToIndex"
        @apply-to-all="detailApplyParametersToAll"
        @prev="onDetailParameterPrev"
        @back="detailGoToStep('dimensions')"
        @update-size="onDetailParamUpdateSize"
        @update-conditions="onDetailParamUpdateConditions"
        @preset-selected="onDetailParamPresetSelected"
      />
      <DetailResultScreen
        v-else-if="useNewDetailFlow && detailSession.currentStep === 'result'"
        :session="detailSession"
        :line-items="detailLineItemsForNewFlow"
        :estimate-draft="estimateDraft"
        :user-settings="userSettings"
        :initial-data="initialData"
        :engine-dents-total="detailEngineDentsSubtotal"
        :history-saving="historySaving"
        :final-actions-disabled="detailFinalActionsDisabled"
        @back="onDetailResultBack"
        @save="onDetailSave"
        @record="onDetailBook"
        @sync-detail-client="onDetailResultSyncClient"
        @open-discount="(d) => openDetailDiscountModal(d)"
        @open-comment="openDetailCommentModal"
        @open-order-document="(doc) => emit('open-order-document', doc)"
      />
      <!-- LEGACY / non-new flow: original photo-based Detail -->
      <QuickStyleClientSection
        v-else-if="!useNewDetailFlow && wizardStep === 1 && props.showClientStep"
        :model="props.estimateDraft"
        :client-required="clientRequired"
        :can-next="clientValid"
        :show-info-tooltips="userSettings?.showInfoTooltips !== false"
        :history-enabled="props.historyEnabled"
        :found-client="detailFoundClient"
        @next="() => goToStep(2)"
        @back="goBack"
        @open-field="onQuickStyleOpenField"
        @reset-client="resetClientFields"
        @open-history="(p) => openClientHistorySheet(p)"
        @autofill-client="handleAutofillClient"
      />
      <StepPhotoSelect
        v-else-if="!useNewDetailFlow && usePhotoBasedFlow && ((props.showClientStep && wizardStep === 2) || (!props.showClientStep && wizardStep === 1))"
        :model-value="photoAsset"
        @back="goBack"
        @next="onPhotoSelectNextPhotoFirst"
        @update:model-value="onPhotoAssetUpdate"
      />
      <Step1PlacementPanel
        v-else-if="!useNewDetailFlow && usePhotoBasedFlow && ((props.showClientStep && wizardStep === 3) || (!props.showClientStep && wizardStep === 2))"
        :can-next="dents.length >= 1"
        @add-type="onAddType"
        @add-freeform="onAddFreeform"
        @next="() => goToStep(usePhotoBasedFlow ? 4 : 3)"
        @back="goBack"
      />
      <Step1PlacementPanel
        v-else-if="!usePhotoBasedFlow && (wizardStep === 2 || (wizardStep === 1 && !props.showClientStep)) && !freeformPhotoMode"
        :can-next="dents.length >= 1"
        @add-type="onAddType"
        @add-freeform="onAddFreeform"
        @next="() => goToStep(3)"
        @back="goBack"
      />
      <StepPhotoSelect
        v-else-if="!usePhotoBasedFlow && (wizardStep === 2 || (wizardStep === 1 && !props.showClientStep)) && freeformPhotoMode"
        :model-value="photoAsset"
        @back="freeformPhotoMode = false"
        @next="onPhotoSelectNext"
        @update:model-value="onPhotoAssetUpdate"
      />
      <!-- Photo flow step 4: Quick screen 2 repeated per dent — same UI, logic, validation as Quick mode. Dimensions prefilled from placement, editable. -->
      <template v-else-if="!useNewDetailFlow && usePhotoBasedFlow && wizardStep === 4">
        <div class="detail-per-dent-combined detail-step4-wrap flex flex-col min-h-0 flex-1 overflow-hidden qc-compact relative">
          <div class="detail-step4-content flex-1 min-h-0 overflow-y-auto overscroll-contain pt-3" style="display:flex;flex-direction:column;gap:var(--qc-section-gap);-webkit-overflow-scrolling:touch;padding-bottom:calc(72px + env(safe-area-inset-bottom,0px) + 16px)">
            <QuickStyleStep2Section
              :active-dent="detailActiveDentForStep2"
              :active-dent-id="currentDetailDent?.id ?? null"
              :dents="detailDentsForStep2"
              :initial-data="initialData"
              :user-settings="userSettings"
              :selected-part-name="selectedPart?.name"
              :hide-add-remove="true"
              :hide-reset="true"
              @set-active="onDetailStep2SetActive"
              @update-size="onDetailStep2UpdateSize"
              @update-conditions="onDetailStep2UpdateConditions"
              @update-panel-element="onDetailStep2UpdatePanelElement"
              @update-panel-side="onDetailStep2UpdatePanelSide"
              @preset-selected="onDetailStep2PresetSelected"
            />
          </div>
          <div class="graphics-action-bar shrink-0 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-white/10 pl-4 pr-4" style="background: var(--dm-surface, #161616)">
            <div class="grid gap-2 w-full" style="grid-template-columns: auto 1fr auto; align-items: center;">
              <button
                type="button"
                @click="onStep4Back"
                class="step-nav-back-btn shrink-0 py-2.5 px-3 rounded-xl text-xs font-medium text-gray-400 hover:text-white border border-white/15 hover:border-white/25 transition-all touch-manipulation min-h-[44px]"
              >
                Назад
              </button>
              <div class="detail-step4-price text-center overflow-hidden px-1 min-w-0 flex items-center justify-center">
                <span class="text-[15px] font-bold text-metric-green tabular-nums truncate">{{ formatMoneyWithCurrency(displayTotal, detailUiDisplayCurrency) }}</span>
              </div>
              <button
                type="button"
                :disabled="detailStep4NextDisabled"
                @click="onStep4Next"
                class="shrink-0 py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
                :class="!detailStep4NextDisabled ? 'bg-metric-green text-black shadow-[0_0_15px_rgba(136,229,35,0.4)] hover:opacity-95 active:opacity-90' : 'bg-white/10 text-gray-500 cursor-not-allowed'"
              >
                <span>{{ detailDentIndex < (dents?.length ?? 0) - 1 ? 'Следующая вмятина →' : 'Рассчитать → Итог' }}</span>
              </button>
            </div>
          </div>
        </div>
      </template>
      <!-- Non-photo flow: geometry only step -->
      <Step2SizePanel
        v-else-if="!usePhotoBasedFlow && wizardStep === 3"
        :selected-dent-size="selectedDentSize"
        :shape-variant="selectedDentSize?.shapeVariant ?? (selectedDentSize?.type === 'circle' ? 'oval' : 'strip')"
        :size-width-mm="sizeWidthMm"
        :size-height-mm="sizeHeightMm"
        :free-stretch="freeStretchMode"
        :area-mm2="selectedDentSize?.areaMm2 ?? null"
        :can-next="dentsValid"
        :dent-index="detailDentIndex + 1"
        :dent-total="dents.length"
        @update:shape-variant="onShapeVariantChange"
        @update:free-stretch="onFreeStretchChange"
        @update:size-width-mm="onSizeWidthInput"
        @update:size-height-mm="onSizeHeightInput"
        @dimensions-focus="onDimensionsInputFocus"
        @fix-freeform="onFixFreeformShape"
        @next="onStep4Next"
        @back="onStep4Back"
      />
      <!-- Non-photo flow: conditions step (legacy vehicle-based flow keeps separate step) -->
      <!-- Non-photo flow: conditions — always Quick-style for visual parity with Quick mode -->
      <QuickStyleConditionsSection
        v-else-if="!usePhotoBasedFlow && wizardStep === 4"
        :model="form"
        :initial-data="initialData"
        :selected-part-name="selectedPart?.name"
        :total-price="displayTotal"
        :display-currency="detailUiDisplayCurrency"
        :show-paint-material="userSettings?.showPaintMaterial !== false"
        :show-sound-insulation="userSettings?.showSoundInsulation !== false"
        :armature-summary="detailArmatureSummary"
        @back="goBack"
        @calculate="() => goToStep(5)"
        @pick="onQuickStylePickParam"
        @pick-armature="onQuickStylePickArmature"
      />
      <QuickStyleFinalSection
        v-else-if="!useNewDetailFlow && wizardStep === 5"
        :line-items="detailLineItems"
        :initial-data="initialData"
        :display-currency="detailUiDisplayCurrency"
        :detail-photo-url="detailPhotoDisplayUrl"
        :format-armaturnaya-summary="formatArmaturnayaSummary"
        :comment="estimateDraft.comment"
        :discount-percent="undefined"
        :history-saving="historySaving"
        :record-id="estimateDraft.id || ''"
        :attachments="estimateDraft.attachments || []"
        :client="detailClientForDisplay"
        :client-mood="estimateDraft.clientMood ?? null"
        :prepayment="estimateDraft.prepayment ?? { amount: 0, method: null }"
        :repair-time-hours="legacyFinalRepairHours"
        :master-name="estimateDraft.masterName || ''"
        :car-plate="estimateDraft.carPlate || ''"
        @back="goBack"
        @save="onSaveHistory"
        @book="onSaveHistory"
        @open-discount="(dentItem) => openDetailDiscountModal(dentItem)"
        @open-comment="openDetailCommentModal"
        @update:attachments="(v) => (estimateDraft.attachments = v)"
        @update:client-mood="(v) => (estimateDraft.clientMood = v)"
        @update:prepayment="(v) => (estimateDraft.prepayment = v)"
      />
    </div>
    <!-- Size menu modal -->
    <Teleport :to="sizeMenuPortalTarget" :disabled="!sizeMenuPortalTarget">
      <div
        v-if="showSizeMenu"
        class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click.self="showSizeMenu = false"
      >
        <div class="bg-[#0b0f14] w-full max-w-md rounded-2xl p-5 border border-white/10 shadow-2xl space-y-4 pb-8 max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 class="text-white font-bold text-lg pl-1">
              Выберите размер ({{ activeToolType === 'circle' ? 'Круг/Овал' : 'Полоса' }})
            </h3>
            <button @click="showSizeMenu = false" class="text-gray-400 p-2 text-xl">✕</button>
          </div>
          <div class="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
            <button
              v-for="s in (activeToolType === 'circle' ? circleSizes : stripSizes)"
              :key="s.code"
              :data-testid="`size-option-${s.code}`"
              @click="confirmAddShape(s.code)"
              class="card-metallic p-3 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all hover:border-metric-green/50"
            >
              <span class="text-metric-green font-bold text-base">{{ s.code }}</span>
              <span class="text-gray-400 text-xs text-center leading-tight">{{ s.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <Teleport :to="sizeMenuPortalTarget" :disabled="!sizeMenuPortalTarget">
      <div
        v-if="showClientInfo"
        class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click.self="showClientInfo = false"
      >
        <div class="bg-[#0b0f14] w-full max-w-md rounded-2xl p-5 border border-white/10 shadow-2xl space-y-3 pb-6 max-h-[85vh] overflow-y-auto">
          <div class="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 class="text-white font-bold text-lg pl-1">Данные клиента</h3>
            <button @click="showClientInfo = false" class="text-gray-400 p-2 text-xl">✕</button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openClientField('clientName', 'Имя', 'text')">
              <span class="truncate">{{ estimateDraft.clientName || 'Имя' }}</span><span class="text-gray-500 shrink-0">✎</span>
            </button>
            <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openClientField('clientCompany', 'Компания', 'text')">
              <span class="truncate">{{ estimateDraft.clientCompany || 'Компания' }}</span><span class="text-gray-500 shrink-0">✎</span>
            </button>
            <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openClientField('clientPhone', 'Тел', 'tel')">
              <span class="truncate">{{ estimateDraft.clientPhone || 'Тел' }}</span><span class="text-gray-500 shrink-0">✎</span>
            </button>
            <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openClientField('carBrand', 'Марка', 'text')">
              <span class="truncate">{{ estimateDraft.carBrand || 'Марка' }}</span><span class="text-gray-500 shrink-0">✎</span>
            </button>
            <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openClientField('carModel', 'Модель', 'text')">
              <span class="truncate">{{ estimateDraft.carModel || 'Модель' }}</span><span class="text-gray-500 shrink-0">✎</span>
            </button>
            <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openClientField('carPlate', 'Гос.номер', 'text')">
              <span class="truncate">{{ estimateDraft.carPlate || 'Гос.номер' }}</span><span class="text-gray-500 shrink-0">✎</span>
            </button>
            <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openClientField('inspectDate', 'Дата', 'date')">
              <span class="truncate">{{ estimateDraft.inspectDate || 'Дата' }}</span><span class="text-gray-500 shrink-0">✎</span>
            </button>
            <button type="button" class="input-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 bg-[#151515] border border-[#333] text-left text-[16px] text-white min-h-[48px]" @click="openClientField('inspectTime', 'Время', 'time')">
              <span class="truncate">{{ estimateDraft.inspectTime || 'Время' }}</span><span class="text-gray-500 shrink-0">✎</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <FreeformDrawModal
      :open="showFreeformModal"
      :canvas-size="freeformCanvasSize"
      :photo-url="freeformPhotoUrl"
      @confirm="onFreeformConfirm"
      @cancel="closeFreeformModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount, inject } from 'vue';

const emit = defineEmits([
  'update:selectedClassId',
  'update:selectedPartId',
  'close',
  'dents-change',
  'home',
  'save-history',
  'book-history',
  'open-record',
  'open-client-history',
  'open-order-document',
]);
import {
  initKonva,
  destroyKonva,
  addDent,
  addFreeformDentFromPoints,
  resetDents,
  deleteSelected,
  scheduleFit,
  setSelectedDentSizeMm,
  setSelectedDentUserDimensions,
  setDentShapeVariant,
  setKeepRatio,
  setEditable,
  setHideGridOnMobile,
  setSelectedDentFreeStretch,
  setSelectedDentShapeFixed,
  convertSelectedDentToType,
  setDisplayUnit,
  exportStageAsBlob,
  setPhotoBackground,
  clearPhotoBackground,
  selectDentById,
  getDents
} from '../../graphics/konvaEditor';
import { calcBasePriceFromDents, calcTotalPrice, buildBreakdown, roundPrice, getPerDentCoresAndAddons } from '../../utils/priceCalc';
import { normalizeGraphicsDentsForPricing, isRatioOneToOne, isStripeCase } from '../../features/pricing/pricingAdapter';
import { applyPriceRoundingCeil } from '../../utils/priceRounding';
import { applyDiscount, clampDiscount } from '../../utils/discount';
import { calculateEstimateTotals } from '../../utils/calculateEstimateTotals';
import { calculateSessionTotalWithMultiDentRule } from '../../utils/multiDentAggregation';
import { getPriceMultiplier } from '../../utils/settingsUtils';
import StepHeader from './StepHeader.vue';
import Step0ClientPanel from './Step0ClientPanel.vue';
import Step1PlacementPanel from './Step1PlacementPanel.vue';
import StepPhotoSelect from './StepPhotoSelect.vue';
import Step2SizePanel from './Step2SizePanel.vue';
import FreeformDrawModal from './FreeformDrawModal.vue';
import QuickStyleClientSection from '../quickStyle/QuickStyleClientSection.vue';
import QuickStyleConditionsSection from '../quickStyle/QuickStyleConditionsSection.vue';
import QuickStyleFinalSection from '../quickStyle/QuickStyleFinalSection.vue';
import QuickStyleStep2Section from '../quickStyle/QuickStyleStep2Section.vue';
import { calculateDentPrice as calcDentViaAdapter } from '../../features/pricing/pricingAdapter';
import { resolveDentShapeType } from '../../utils/resolveDentShapeType';
import { formatArmaturnayaSummary, getArmaturnayaWorksForElement } from '../../data/armaturnayaWorks';
import { normalizeArmatureWorkIds, toggleArmatureWorkIds } from '../../utils/armatureSelection';
import { generateRecordId, loadHistory } from '../../features/history/historyStore';
import { circleSizesWithArea, stripSizesWithArea } from '../../data/dentSizes';
import { applyClientFields } from '../../utils/clientSearch';
import { useClientSearch } from '../../composables/useClientSearch';
import { getAttachment, saveAttachment, generateMatrixAttachmentKey } from '../../utils/attachmentStorage';
import { useDetailSession } from '../../composables/useDetailSession';
import DetailClientScreen from '../detail/DetailClientScreen.vue';
import DetailCameraScreen from '../detail/DetailCameraScreen.vue';
import DetailMarkingScreen from '../detail/DetailMarkingScreen.vue';
import DetailParameterScreen from '../detail/DetailParameterScreen.vue';
import DetailResultScreen from '../detail/DetailResultScreen.vue';
import { DETAIL_STEPS } from '../../types/detailSession';
import { formatMoneyWithCurrency, displayCurrencyForRegionCountry } from '../../utils/regionFormat';
import { normalizePhoneForInput } from '../../utils/phoneFormat';

/** New photo-based Detail flow: client → camera → marking → dimensions → parameters → result */
const useNewDetailFlow = true;

const props = defineProps({
  form: { type: Object, required: true },
  conditionsForCalc: { type: Object, default: null },
  initialData: { type: Object, required: true },
  userSettings: { type: Object, required: true },
  carClasses: { type: Array, default: () => [] },
  partsList: { type: Array, default: () => [] },
  selectedClassId: { type: String, required: true },
  selectedPartId: { type: String, required: true },
  selectedPart: { type: Object, default: null },
  circleSizes: { type: Array, default: () => [] },
  stripSizes: { type: Array, default: () => [] },
  estimateDraft: { type: Object, required: true },
  historySaving: { type: Boolean, default: false },
  clientRequired: { type: Boolean, default: false },
  clientValid: { type: Boolean, default: true },
  showClientStep: { type: Boolean, default: true },
  autoSave: { type: Boolean, default: false },
  useQuickUiInDetail: { type: Boolean, default: true },
  historyEnabled: { type: Boolean, default: false }
});

const openInputModal = inject('openInputModal');
const openSelectModal = inject('openSelectModal');

const { foundClient: detailFoundClient, searchByPhone } = useClientSearch(() => loadHistory());

const detailSessionApi = useDetailSession();
const {
  session: detailSessionRef,
  goToStep: detailGoToStep,
  setClient: detailSetClient,
  setPhoto: detailSetPhoto,
  setAnnotatedPhoto: detailSetAnnotatedPhoto,
  setSelectedDentId: detailSetSelectedDentId,
  addDent: detailAddDent,
  addSecondaryDeformation: detailAddSecondaryDeformation,
  setDentDimensions: detailSetDentDimensions,
  setSecondaryDimensions: detailSetSecondaryDimensions,
  setDentOutline: detailSetDentOutline,
  deleteDent: detailDeleteDent,
  clearDents: detailClearDents,
  applyParametersToAll: detailApplyParametersToAll,
  allDimensionsFilled: detailAllDimensionsFilled,
  currentDent: detailCurrentDent,
  resetSession: detailResetSession,
} = detailSessionApi;
const detailSession = detailSessionRef;

watch(() => props.estimateDraft?.clientPhone, (phone) => {
  searchByPhone(phone ?? '');
}, { immediate: true });

function openClientHistorySheet(payload) {
  const fromPayload =
    payload && typeof payload === 'object' && payload.phone != null
      ? String(payload.phone)
      : '';
  let phone = fromPayload.trim() || String(props.estimateDraft?.clientPhone || '').trim();
  if (!phone && detailFoundClient.value?.allRecords?.length) {
    const r = detailFoundClient.value.allRecords[0];
    phone = String(r?.client?.phone ?? r?.clientPhone ?? '').trim();
  }
  emit('open-client-history', { phone });
}

async function openClientField(field, label, inputType) {
  const mask = field === 'clientPhone' ? 'phone' : field === 'clientName' ? 'name' : null;
  const pr = phoneInputRegion.value;
  let val = props.estimateDraft[field] ?? '';
  if (field === 'clientPhone') val = normalizePhoneForInput(val, pr);
  const value = await openInputModal({
    title: 'Данные клиента',
    label,
    value: val,
    inputType,
    placeholder: label,
    mask,
    phoneRegion: mask === 'phone' ? pr : undefined
  });
  if (value !== undefined && value !== null) {
    props.estimateDraft[field] = typeof value === 'string' ? value : String(value);
  }
}

/** Photo-first flow: детализация начинается с фото/галереи, без выбора машины */
const usePhotoBasedFlow = true;

const wizardStep = ref(1);

function initWizardStep() {
  if (!props.showClientStep) {
    wizardStep.value = usePhotoBasedFlow ? 1 : 2;
  }
}

watch(
  () => props.showClientStep,
  (show) => {
    if (!show && wizardStep.value === 1) {
      wizardStep.value = usePhotoBasedFlow ? 1 : 2;
    }
  }
);
const graphicsRoot = ref(null);
const konvaContainer = ref(null);
const controlsAreaRef = ref(null);
const hintRef = ref(null);
const showSizeMenu = ref(false);
const showClientInfo = ref(false);
const activeToolType = ref(null);
const konvaReady = ref(false);
const selectedDentSize = ref(null);
const sizeWidthMm = ref(0);
const sizeHeightMm = ref(0);
const freeStretchMode = ref(true);
const sizeEditAxis = ref(null);
const sizeAdjusting = ref(false);
const dents = ref([]);
const showFreeformModal = ref(false);
const freeformPhotoMode = ref(false);
const photoAsset = ref(null);
const freeformPhotoUrl = ref('');
const freeformCanvasSize = ref({ width: 320, height: 240 });
/** Индекс вмятины при пошаговом редактировании на экране 4 (0-based). */
const detailDentIndex = ref(0);
/** Per-dent conditions for photo flow (Quick-style step 2). Map dentId -> { repairCode, riskCode, materialCode, carClassCode, disassemblyCodes, ... } */
const detailDentConditions = ref({});
let sizeApplyTimeout = null;
let sizeEditByUser = false;

const keyboardInset = ref(0);
let keyboardInsetRaf = null;

const MIN_SAFE_TOP = 44;
const SAFE_OVERLAP = 24;
const matrixSafeTop = ref(MIN_SAFE_TOP);
const matrixSafeTopStyle = computed(() => ({
  '--matrixSafeTop': `${matrixSafeTop.value}px`
}));
let hintObserver = null;

function updateMatrixSafeTop() {
  if (wizardStep.value <= (usePhotoBasedFlow ? 4 : 3)) {
    if (matrixSafeTop.value !== MIN_SAFE_TOP) matrixSafeTop.value = MIN_SAFE_TOP;
    return;
  }
  const hintEl = hintRef.value;
  if (!hintEl) {
    matrixSafeTop.value = Math.max(matrixSafeTop.value, MIN_SAFE_TOP);
    return;
  }
  const height = hintEl.getBoundingClientRect().height || 0;
  const next = Math.max(MIN_SAFE_TOP, Math.round(height - SAFE_OVERLAP));
  if (next !== matrixSafeTop.value) matrixSafeTop.value = next;
}
function updateKeyboardInset() {
  if (keyboardInsetRaf) return;
  keyboardInsetRaf = requestAnimationFrame(() => {
    keyboardInsetRaf = null;
    const vv = window.visualViewport;
    const vvh = vv ? vv.height * 0.01 : window.innerHeight * 0.01;
    if (!vv) {
      keyboardInset.value = 0;
      graphicsRoot.value?.style?.setProperty('--vvh', `${vvh}px`);
      graphicsRoot.value?.style?.setProperty('--keyboard-offset', '0px');
      return;
    }
    const inset = window.innerHeight - vv.height - (vv.offsetTop || 0);
    const nextInset = Math.max(0, Math.round(inset));
    keyboardInset.value = nextInset;
    graphicsRoot.value?.style?.setProperty('--vvh', `${vvh}px`);
    graphicsRoot.value?.style?.setProperty('--keyboard-offset', `${nextInset}px`);
  });
}
let dimensionsScrollGuard = false;
function onDimensionsInputFocus(panelEl) {
  const el = panelEl?.scrollIntoView ? panelEl : panelEl?.$el;
  if (!el?.scrollIntoView) return;
  if (dimensionsScrollGuard) return;
  dimensionsScrollGuard = true;
  requestAnimationFrame(() => {
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      setTimeout(() => {
        const headerEl = graphicsRoot.value?.querySelector('.graphics-header');
        const hintEl = hintRef.value;
        const actionBarEl = graphicsRoot.value?.querySelector('.graphics-action-bar');
        const headerH = headerEl?.getBoundingClientRect().height || 0;
        const hintH = hintEl?.getBoundingClientRect().height || 0;
        const actionBarH = actionBarEl?.getBoundingClientRect().height || 0;
        const keyboardH = keyboardInset.value || 0;
        const offset = Math.round(headerH + hintH + actionBarH + Math.max(12, keyboardH * 0.6));
        window.scrollBy({ top: -offset, left: 0, behavior: 'smooth' });
      }, 180);
      setTimeout(() => { dimensionsScrollGuard = false; }, 900);
    }, 150);
  });
}

const graphicsRootClass = computed(() => {
  const detailSteps = ['client', 'camera', 'marking', 'dimensions', 'parameters', 'result'];
  const stepNum = useNewDetailFlow
    ? Math.min(6, Math.max(1, detailSteps.indexOf(detailSession.value.currentStep) + 1))
    : wizardStep.value;
  const photo = useNewDetailFlow || freeformPhotoMode || (usePhotoBasedFlow && ((props.showClientStep && wizardStep.value === 2) || (!props.showClientStep && wizardStep.value === 1)));
  const fullscreen = useNewDetailFlow && detailSession.value.currentStep !== 'client';
  return [
    `graphics-step-${stepNum}`,
    {
      'graphics-step-photo': photo,
      'graphics-detail-fullscreen': fullscreen,
    },
  ];
});

const controlsAreaKeyboardStyle = computed(() => ({
  '--keyboard-offset': `${keyboardInset.value}px`
}));

const sizeMenuPortalTarget = computed(() => {
  if (graphicsRoot.value) return graphicsRoot.value;
  return typeof document !== 'undefined' ? document.body : null;
});

/** URL фото для отображения на финальном экране (photo-first flow) */
const detailPhotoDisplayUrl = computed(() => freeformPhotoUrl.value || null);

const detailStepIndex = computed(() =>
  Math.max(0, DETAIL_STEPS.indexOf(detailSession.value.currentStep))
);
/** Валюта подписей в мастере детализации (настройки приложения, не запись истории). */
const detailUiDisplayCurrency = computed(() => displayCurrencyForRegionCountry(props.userSettings?.regionCountry));
/** Маска телефона в модалках клиента (+375 при выборе Беларуси в настройках). */
const phoneInputRegion = computed(() => (props.userSettings?.regionCountry === 'BY' ? 'BY' : 'RU'));
const dentsForPricing = computed(() => {
  const ctx = {
    circleSizes: props.circleSizes,
    stripSizes: props.stripSizes,
    prices: props.userSettings.prices,
    initialData: props.initialData,
    conditions: conditionsForCalc.value
  };
  const normalized = normalizeGraphicsDentsForPricing(dents.value, ctx);
  return normalized.map((d) => {
    const bbox = d?.bboxMm || {};
    const w = Number(bbox.width) || 0;
    const h = Number(bbox.height) || 0;
    const resolved = w > 0 && h > 0 ? resolveDentShapeType(w, h) : null;
    const t = String(d?.type || '').toLowerCase();
    const wantsStrip = ['strip', 'stripe', 'scratch'].some((k) => t.includes(k));
    const shape = d?.type === 'freeform' ? 'circle' : wantsStrip || resolved === 'stripe' ? 'strip' : 'circle';
    const multType = isStripeCase(shape, w, h) ? 'strip' : 'circle';
    const mult = getPriceMultiplier(multType, props.userSettings || {});
    return { ...d, price: (d.price || 0) * mult };
  });
});
const basePrice = computed(() => calcBasePriceFromDents(dentsForPricing.value));
/** Conditions for pricing: per-dent when available (photo flow), else shared form. */
const conditionsForCalc = computed(() => props.conditionsForCalc || props.form);
const totalPriceRaw = computed(() => {
  const dents = dentsForPricing.value;
  const cond = conditionsForCalc.value;
  if (!dents?.length) return 0;
  const { perDentCores, disCost, soundCost } = getPerDentCoresAndAddons(dents, cond, props.initialData);
  if (perDentCores.length <= 1) {
    return Math.max(0, (perDentCores[0] ?? 0) + disCost + soundCost);
  }
  const dentItems = dents.map((d, i) => ({
    total: perDentCores[i] ?? 0,
    panelElement: props.selectedPart?.name ?? d?.panelElement ?? null,
    dent: d
  }));
  const { total: aggregated } = calculateSessionTotalWithMultiDentRule(dentItems, {
    discountSamePartEnabled: props.userSettings?.discountSamePartEnabled,
    discountSamePartValue: props.userSettings?.discountSamePartValue,
    discountDiffPartEnabled: props.userSettings?.discountDiffPartEnabled,
    discountDiffPartValue: props.userSettings?.discountDiffPartValue,
    enableSecondDentDiscount: props.userSettings?.enableSecondDentDiscount,
    secondDentDiscountPercent: props.userSettings?.secondDentDiscountPercent
  });
  return Math.max(0, aggregated + disCost + soundCost);
});
function detailEffectiveDentLineTotal(item) {
  const dent = item?.dent;
  const step = props.userSettings?.priceRoundStep ?? 0;
  const rawM = dent?.manualLineTotal;
  if (rawM != null && rawM !== '' && Number.isFinite(Number(rawM))) {
    return applyPriceRoundingCeil(Number(rawM), step);
  }
  return item?.appliedTotal ?? item?.total ?? 0;
}

const totalPrice = computed(() => {
  if (useNewDetailFlow && detailLineItemsForNewFlow.value?.length > 0) {
    let s = 0;
    for (const item of detailLineItemsForNewFlow.value) {
      s += detailEffectiveDentLineTotal(item);
    }
    for (const w of props.estimateDraft.additionalWorks || []) {
      s += Number(w.price) || 0;
    }
    return s;
  }
  const hasPerDentDiscounts = props.estimateDraft?.dentDiscounts && Object.keys(props.estimateDraft.dentDiscounts).some((k) => props.estimateDraft.dentDiscounts[k] != null && props.estimateDraft.dentDiscounts[k] > 0);
  if (hasPerDentDiscounts && detailLineItems.value?.length > 0) {
    return detailLineItems.value.reduce((s, d) => s + (d.rawDiscounted ?? 0), 0);
  }
  return applyDiscount(totalPriceRaw.value, clampDiscount(props.estimateDraft?.discountPercent));
});
const preDiscountTotal = computed(() =>
  applyPriceRoundingCeil(totalPriceRaw.value, props.userSettings?.priceRoundStep ?? 0)
);
const displayTotal = computed(() =>
  applyPriceRoundingCeil(totalPrice.value, props.userSettings?.priceRoundStep ?? 0)
);

/** Время ремонта для шаринга на legacy-финале (шаг 5). */
const legacyFinalRepairHours = computed(() => {
  const d = props.estimateDraft;
  const m = d?.repairTimeHours;
  if (m != null && m !== '' && Number.isFinite(Number(m))) return Number(m);
  const total = displayTotal.value;
  const rate = props.userSettings?.hourlyRate > 0 ? props.userSettings.hourlyRate : 4000;
  if (total <= 0 || rate <= 0) return null;
  return Math.round((total / rate) * 100) / 100;
});

const breakdown = computed(() => {
  const sizeCode = dentsForPricing.value?.[0]?.sizeCode ?? 'STRIP_DEFAULT';
  const items = buildBreakdown(basePrice.value, conditionsForCalc.value, props.initialData, sizeCode);
  props.estimateDraft.breakdown = items;
  return items;
});

/** Клиент для ClientInfoBlock на финальном шаге Detail. */
const detailClientForDisplay = computed(() => {
  const d = props.estimateDraft;
  return {
    name: d?.clientName ?? '',
    phone: d?.clientPhone ?? '',
    brand: d?.carBrand ?? '',
    model: d?.carModel ?? '',
    company: d?.clientCompany ?? ''
  };
});

/** Per-dent line items for Quick-style final (Detail mode) */
const detailLineItems = computed(() => {
  const dents = dentsForPricing.value;
  const cond = conditionsForCalc.value;
  if (!dents?.length || !cond) return [];
  // FIX: Detail итог брали initialData.circleSizes без areaMm2 → интерполяция уходила в экстраполяцию и раздувала суммы. Те же таблицы мм², что в Quick (dentSizes).
  const ctx = {
    sizesWithArea: circleSizesWithArea,
    circleSizesWithArea,
    stripSizesWithArea,
    prices: props.userSettings?.prices ?? {},
    initialData: props.initialData,
    roundStep: props.userSettings?.priceRoundStep ?? 0
  };
  const condMap = detailDentConditions.value;
  const list = dents.map((dent) => {
    const bbox = dent?.bboxMm || {};
    const w = Number(bbox.width) || 0;
    const h = Number(bbox.height) || 0;
    const resolved = w > 0 && h > 0 ? resolveDentShapeType(w, h) : null;
    const dt = String(dent?.type || '').toLowerCase();
    const wantsStrip = ['strip', 'stripe', 'scratch'].some((k) => dt.includes(k));
    const shape = dent?.type === 'freeform' ? 'circle' : wantsStrip || resolved === 'stripe' ? 'strip' : 'circle';
    const perDent = condMap[dent?.id] ? { ...cond, ...condMap[dent.id] } : cond;
    const conditions = props.userSettings?.showPaintMaterial !== false ? perDent : { ...perDent, paintMaterialCode: null };
    const pe = perDent.panelElement ?? props.selectedPart?.name ?? null;
    const result = calcDentViaAdapter(
      { shape, widthMm: w, heightMm: h, conditions, panelElement: pe },
      ctx
    );
    const multType = isStripeCase(shape, w, h) ? 'strip' : 'circle';
    const mult = getPriceMultiplier(multType, props.userSettings || {});
    const dentDisplay = {
      ...dent,
      conditions: { ...conditions, panelElement: conditions.panelElement ?? pe },
      panelElement: pe,
      bboxMm: dent.bboxMm,
      sizeLengthMm: w,
      sizeWidthMm: h
    };
    return { dent: dentDisplay, sizeCode: result.sizeCode, base: result.base * mult, total: result.total * mult, breakdown: result.breakdown };
  });
  const filtered = list.filter((d) => d.total > 0).sort((a, b) => b.total - a.total);
  if (filtered.length === 0) return [];
  const dentItems = filtered.map((d) => ({ total: d.total, panelElement: d.dent?.panelElement ?? props.selectedPart?.name ?? null, dent: d.dent }));
  const { weightedTotals } = calculateSessionTotalWithMultiDentRule(dentItems, {
    discountSamePartEnabled: props.userSettings?.discountSamePartEnabled,
    discountSamePartValue: props.userSettings?.discountSamePartValue,
    discountDiffPartEnabled: props.userSettings?.discountDiffPartEnabled,
    discountDiffPartValue: props.userSettings?.discountDiffPartValue,
    enableSecondDentDiscount: props.userSettings?.enableSecondDentDiscount,
    secondDentDiscountPercent: props.userSettings?.secondDentDiscountPercent
  });
  const roundStep = props.userSettings?.priceRoundStep ?? 0;
  const dentInputs = filtered.map((item, idx) => {
    const dentPct = clampDiscount(
      props.estimateDraft?.dentDiscounts?.[item.dent?.id] ?? item.dent?.discountPercent ?? props.estimateDraft?.discountPercent ?? 0
    );
    return {
      id: item.dent?.id ?? `d${idx}`,
      basePrice: item.base ?? 0,
      subtotal: weightedTotals[idx] ?? item.total,
      discountPercent: dentPct
    };
  });
  const totals = calculateEstimateTotals(dentInputs, 0);
  return filtered.map((item, idx) => {
    const t = totals.dents[idx];
    const applied = roundStep > 0
      ? applyPriceRoundingCeil(t?.final ?? 0, roundStep)
      : Math.round(t?.final ?? 0);
    const dentPct = clampDiscount(
      props.estimateDraft?.dentDiscounts?.[item.dent?.id] ?? item.dent?.discountPercent ?? props.estimateDraft?.discountPercent ?? 0
    );
    return {
      ...item,
      appliedTotal: applied,
      rawDiscounted: t?.final ?? 0,
      preDiscountTotal: t?.subtotal ?? 0,
      discount: idx > 0,
      discountPercent: dentPct,
      discountAmount: t?.discountAmount ?? 0
    };
  });
});

const detailArmatureSummary = computed(() =>
  formatArmaturnayaSummary(props.form?.disassemblyCodes, props.selectedPart?.name) || ''
);

/** Current dent in photo flow step 4. */
const currentDetailDent = computed(() => {
  const arr = dents.value || [];
  const idx = detailDentIndex.value;
  return arr[idx] ?? null;
});

/** Dents in Quick-style shape for step 2 chips (id only for chips). */
const detailDentsForStep2 = computed(() => (dents.value || []).map((d) => ({ id: d?.id })));

/** Active dent view model for QuickStyleStep2Section: dimensions from placement (bboxMm), conditions from detailDentConditions or form. */
const detailActiveDentForStep2 = computed(() => {
  const d = currentDetailDent.value;
  if (!d) return null;
  const bbox = d.bboxMm || {};
  const w = Number(bbox.width) || 0;
  const h = Number(bbox.height) || 0;
  const condMap = detailDentConditions.value;
  const fallback = props.form || {};
  const cond = condMap[d.id]
    ? { ...fallback, ...condMap[d.id] }
    : { ...fallback };
  if (!cond.disassemblyCodes?.length) cond.disassemblyCodes = ['Z0'];
  return {
    id: d.id,
    sizeLengthMm: w,
    sizeWidthMm: h,
    panelSide: cond.panelSide ?? 'left',
    panelElement: cond.panelElement ?? props.selectedPart?.name ?? null,
    conditions: cond
  };
});

/** Photo flow step 4: all dents have complete conditions (same validation as Quick step 2). */
const detailConditionsComplete = computed(() => {
  const arr = dents.value || [];
  if (arr.length === 0) return false;
  const condMap = detailDentConditions.value;
  const fallback = props.form || {};
  return arr.every((d) => {
    const c = condMap[d.id] ? { ...fallback, ...condMap[d.id] } : fallback;
    return !!(
      c.repairCode &&
      c.riskCode &&
      c.materialCode &&
      c.carClassCode &&
      (c.disassemblyCodes?.length ?? 0) > 0
    );
  });
});

/** Photo flow step 4: кнопка «Следующая вмятина» — всегда активна при наличии следующей вмятины. «Рассчитать → Итог» — только при заполненных условиях. */
const detailStep4NextDisabled = computed(() => {
  const arr = dents.value || [];
  const idx = detailDentIndex.value;
  const hasNextDent = arr.length > 1 && idx < arr.length - 1;
  if (hasNextDent) return false;
  return !detailConditionsComplete.value;
});

function resetClientFields() {
  props.estimateDraft.clientName = '';
  props.estimateDraft.clientCompany = '';
  props.estimateDraft.clientPhone = '';
  props.estimateDraft.carBrand = '';
  props.estimateDraft.carModel = '';
  props.estimateDraft.carPlate = '';
}

function handleDetailResetDrawing() {
  detailClearDents();
  if (detailSession.currentStep === 'dimensions') {
    detailGoToStep('marking');
  }
}

/** Photo flow step 4: switch active dent by chip click. */
function onDetailStep2SetActive(dentId) {
  const arr = dents.value || [];
  const idx = arr.findIndex((d) => d?.id === dentId);
  if (idx >= 0) {
    detailDentIndex.value = idx;
    selectDentById(dentId);
  }
}

/** Photo flow step 4: user edited size via modal — update Konva. */
async function onDetailStep2UpdateSize({ field, value }) {
  const d = currentDetailDent.value;
  if (!d || !selectedDentSize.value) return;
  const bbox = d.bboxMm || {};
  let w = Number(bbox.width) || 0;
  let h = Number(bbox.height) || 0;
  if (field === 'sizeLengthMm') w = value;
  else if (field === 'sizeWidthMm') h = value;
  if (w > 0 && h > 0) {
    if (d.type === 'freeform') setSelectedDentUserDimensions(w, h);
    else setSelectedDentSizeMm(w, h);
  }
}

/** Photo flow step 4: user picked condition — store per dent. */
function onDetailStep2UpdateConditions({ field, value }) {
  const d = currentDetailDent.value;
  if (!d?.id) return;
  const map = detailDentConditions.value;
  if (!map[d.id]) map[d.id] = {};
  map[d.id][field] = value;
  detailDentConditions.value = { ...map };
  if (props.estimateDraft) props.estimateDraft.detailDentConditions = { ...map };
}

/** Photo flow step 4: user picked panel element. */
function onDetailStep2UpdatePanelElement(value) {
  onDetailStep2UpdateConditions({ field: 'panelElement', value });
}

/** Photo flow step 4: user picked panel side. */
function onDetailStep2UpdatePanelSide(value) {
  onDetailStep2UpdateConditions({ field: 'panelSide', value });
}

/** Photo flow step 4: user selected preset — update Konva dimensions. */
function onDetailStep2PresetSelected(preset) {
  const d = currentDetailDent.value;
  if (!d || !preset?.widthMm || !preset?.heightMm) return;
  const w = Number(preset.widthMm) || 0;
  const h = Number(preset.heightMm) || 0;
  if (w > 0 && h > 0) {
    if (d.type === 'freeform') setSelectedDentUserDimensions(w, h);
    else setSelectedDentSizeMm(w, h);
  }
}

function handleAutofillClient(fields) {
  if (!fields || typeof fields !== 'object') return;
  applyClientFields(props.estimateDraft, fields);
}

/** New Detail flow handlers */
function onDetailClientConfirmed(client) {
  detailSetClient(client);
  applyClientFields(props.estimateDraft, {
    clientName: client.name,
    clientPhone: client.phone,
    carBrand: client.carBrand,
    carModel: client.carModel,
    carPlate: client.plateNumber,
    clientCompany: client.company,
  });
  detailGoToStep('camera');
}

const MAX_PHOTO_PX = 1920;
const JPEG_QUALITY = 0.88;

function compressPhotoIfNeeded(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      if (w <= MAX_PHOTO_PX && h <= MAX_PHOTO_PX) {
        resolve(dataUrl);
        return;
      }
      const scale = Math.min(1, MAX_PHOTO_PX / Math.max(w, h));
      const cw = Math.round(w * scale);
      const ch = Math.round(h * scale);
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0, cw, ch);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function onDetailPhotoCaptured(dataUrl) {
  const compressed = await compressPhotoIfNeeded(dataUrl);
  let assetKey = null;
  try {
    const res = await fetch(compressed);
    const blob = await res.blob();
    assetKey = `dm_photo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await saveAttachment(assetKey, blob);
  } catch (e) {
    console.warn('[Detail] Photo save failed', e);
  }
  detailSetPhoto(compressed, assetKey);
  detailGoToStep('marking');
}

function onDetailMarkingComplete() {
  if (!detailAllDimensionsFilled.value) return;
  detailSession.value.currentDentIndex = 0;
  detailGoToStep('parameters');
}

watch(
  () => [detailSession.value.currentStep, detailSession.value.currentDentIndex, detailSession.value.dents.length],
  () => {
    if (detailSession.value.currentStep !== 'parameters') return;
    const len = detailSession.value.dents.length;
    if (len === 0) {
      detailGoToStep('dimensions');
      return;
    }
    const idx = detailSession.value.currentDentIndex;
    if (idx < 0 || idx >= len) {
      detailSession.value.currentDentIndex = Math.max(0, len - 1);
    }
  }
);

function onDetailParameterNext() {
  const idx = detailSession.value.currentDentIndex;
  const len = detailSession.value.dents.length;
  if (idx < len - 1) {
    detailSession.value.currentDentIndex = idx + 1;
  } else {
    detailGoToStep('result');
  }
}

function onDetailParameterPrev() {
  if (detailSession.value.currentDentIndex > 0) {
    detailSession.value.currentDentIndex--;
  } else {
    detailGoToStep('dimensions');
  }
}

function onDetailParameterGoToIndex(index) {
  const idx = Math.max(0, Math.min(index, detailSession.value.dents.length - 1));
  detailSession.value.currentDentIndex = idx;
}

function onDetailResultBack() {
  detailSession.value.currentDentIndex = Math.max(0, detailSession.value.dents.length - 1);
  detailGoToStep('parameters');
}

function onDetailResultSyncClient(payload) {
  const cur = detailSession.value.client || {};
  const p = payload || {};
  detailSetClient({
    name: String(p.name ?? cur.name ?? ''),
    phone: String(p.phone ?? cur.phone ?? ''),
    company: String(p.company ?? cur.company ?? ''),
    carBrand: String(p.carBrand ?? cur.carBrand ?? ''),
    carModel: String(p.carModel ?? cur.carModel ?? ''),
    plateNumber: String(p.plateNumber ?? cur.plateNumber ?? ''),
    inspectDate: cur.inspectDate,
    inspectTime: cur.inspectTime
  });
}

async function onDetailResultEditClientField(key) {
  const c = detailSession.value.client;
  const base = {
    name: c?.name ?? props.estimateDraft.clientName ?? '',
    phone: c?.phone ?? props.estimateDraft.clientPhone ?? '',
    carBrand: c?.carBrand ?? props.estimateDraft.carBrand ?? '',
    carModel: c?.carModel ?? props.estimateDraft.carModel ?? '',
    plateNumber: c?.plateNumber ?? props.estimateDraft.carPlate ?? '',
    company: c?.company ?? props.estimateDraft.clientCompany ?? '',
  };
  if (key === 'name') {
    const value = await openInputModal({
      title: 'Данные клиента',
      label: 'Имя клиента',
      value: base.name,
      inputType: 'text',
      placeholder: 'Имя клиента',
      mask: 'name',
    });
    if (value !== undefined && value !== null) {
      const name = typeof value === 'string' ? value : String(value);
      detailSetClient({ ...base, name });
      props.estimateDraft.clientName = name;
    }
    return;
  }
  if (key === 'phone') {
    const pr = phoneInputRegion.value;
    const value = await openInputModal({
      title: 'Данные клиента',
      label: 'Телефон',
      value: normalizePhoneForInput(base.phone, pr),
      inputType: 'tel',
      placeholder: 'Телефон',
      mask: 'phone',
      phoneRegion: pr
    });
    if (value !== undefined && value !== null) {
      const phone = typeof value === 'string' ? value : String(value);
      detailSetClient({ ...base, phone });
      props.estimateDraft.clientPhone = phone;
    }
    return;
  }
  if (key === 'company') {
    const value = await openInputModal({
      title: 'Данные клиента',
      label: 'Компания (необязательно)',
      value: base.company,
      inputType: 'text',
      placeholder: 'Компания',
    });
    if (value !== undefined && value !== null) {
      const company = typeof value === 'string' ? value : String(value);
      detailSetClient({ ...base, company });
      props.estimateDraft.clientCompany = company;
    }
    return;
  }
  if (key === 'car') {
    const value = await openInputModal({
      title: 'Данные клиента',
      label: 'Марка автомобиля',
      value: base.carBrand,
      inputType: 'text',
      placeholder: 'Марка',
    });
    if (value !== undefined && value !== null) {
      const carBrand = typeof value === 'string' ? value : String(value);
      detailSetClient({ ...base, carBrand });
      props.estimateDraft.carBrand = carBrand;
    }
  }
}

function onDetailParamUpdateSize({ dentId, field, value }) {
  const dent = detailSession.value.dents.find((d) => d.id === dentId);
  if (!dent?.dimensions) return;
  const dims = { ...dent.dimensions };
  if (field === 'sizeLengthMm') dims.lengthMm = value;
  else if (field === 'sizeWidthMm') dims.widthMm = value;
  detailSetDentDimensions(dentId, dims);
}

function onDetailParamUpdateConditions({ dentId, field, value }) {
  const dent = detailSession.value.dents.find((d) => d.id === dentId);
  if (!dent) return;
  if (!dent.conditions) dent.conditions = {};
  dent.conditions[field] = value;
}

function onDetailParamPresetSelected({ dentId, preset }) {
  if (dentId && preset?.widthMm && preset?.heightMm) {
    const shapeType = preset.group === 'stripe' ? 'strip' : 'circle';
    detailSetDentDimensions(
      dentId,
      {
        lengthMm: preset.widthMm,
        widthMm: preset.heightMm,
      },
      shapeType
    );
  }
}

function syncDetailSessionToEstimateDraft() {
  if (detailSession.value.dents.length === 0 || !props.estimateDraft) return;
  if (!props.estimateDraft.id) props.estimateDraft.id = generateRecordId();
  applyClientFields(props.estimateDraft, {
    clientName: detailSession.value.client?.name,
    clientPhone: detailSession.value.client?.phone,
    carBrand: detailSession.value.client?.carBrand,
    carModel: detailSession.value.client?.carModel,
    carPlate: detailSession.value.client?.plateNumber,
    clientCompany: detailSession.value.client?.company,
  });
  const convertedDents = detailSession.value.dents.map((d) => {
    const row = {
      id: d.id,
      type: d.shapeType || 'circle',
      bboxMm: {
        width: d.dimensions?.lengthMm ?? 0,
        height: d.dimensions?.widthMm ?? 0,
      },
      conditions: d.conditions || {},
      panelElement: d.conditions?.panelElement ?? null,
      photoAssetKey: detailSession.value.photoAssetKey ?? null,
    };
    if (d.manualLineTotal != null && d.manualLineTotal !== '' && Number.isFinite(Number(d.manualLineTotal))) {
      row.manualLineTotal = Number(d.manualLineTotal);
    }
    if (
      d.manualRepairTimeHours != null &&
      d.manualRepairTimeHours !== '' &&
      Number.isFinite(Number(d.manualRepairTimeHours))
    ) {
      row.manualRepairTimeHours = Number(d.manualRepairTimeHours);
    }
    return row;
  });
  emit('dents-change', convertedDents);
  props.estimateDraft.detailDentConditions = {};
  detailSession.value.dents.forEach((d) => {
    props.estimateDraft.detailDentConditions[d.id] = d.conditions || {};
  });
  if (detailSession.value.photoAssetKey && !props.estimateDraft.photoAssetKey) {
    props.estimateDraft.photoAssetKey = detailSession.value.photoAssetKey;
  }
  const attachments = props.estimateDraft.attachments || [];
  if (detailSession.value.photoAssetKey) {
    const hasDetailPhoto = attachments.some(
      (a) => a?.idbKey === detailSession.value.photoAssetKey
    );
    if (!hasDetailPhoto) {
      props.estimateDraft.attachments = [
        ...attachments,
        { dentIndex: 0, idbKey: detailSession.value.photoAssetKey }
      ];
    }
  }
}

async function onDetailSave() {
  syncDetailSessionToEstimateDraft();
  const snapshot = (detailLineItemsForNewFlow.value || []).map((item) => {
    const clone = JSON.parse(JSON.stringify(item));
    clone.dmCalculatedLineTotal = item.appliedTotal;
    clone.appliedTotal = detailEffectiveDentLineTotal(item);
    return clone;
  });
  emit('save-history', { lineItems: snapshot });
}

async function onDetailBook() {
  syncDetailSessionToEstimateDraft();
  const snapshot = (detailLineItemsForNewFlow.value || []).map((item) => {
    const clone = JSON.parse(JSON.stringify(item));
    clone.dmCalculatedLineTotal = item.appliedTotal;
    clone.appliedTotal = detailEffectiveDentLineTotal(item);
    return clone;
  });
  emit('book-history', { lineItems: snapshot });
}

/** Line items for new Detail flow result screen */
const detailLineItemsForNewFlow = computed(() => {
  const dents = detailSession.value.dents;
  if (!dents?.length) return [];
  // FIX: см. detailLineItems — единые таблицы с areaMm2 как в Quick, иначе завышение базы.
  const ctx = {
    sizesWithArea: circleSizesWithArea,
    circleSizesWithArea,
    stripSizesWithArea,
    prices: props.userSettings?.prices ?? {},
    initialData: props.initialData,
    roundStep: props.userSettings?.priceRoundStep ?? 0
  };
  const list = dents.map((dent) => {
    const w = Number(dent.dimensions?.lengthMm) || 0;
    const h = Number(dent.dimensions?.widthMm) || 0;
    const cond = dent.conditions || {};
    const resolved = w > 0 && h > 0 ? resolveDentShapeType(w, h) : null;
    const st = String(dent.shapeType || '').toLowerCase();
    const wantsStrip = ['strip', 'stripe', 'scratch'].some((k) => st.includes(k));
    const shape = wantsStrip || resolved === 'stripe' ? 'strip' : 'circle';
    const conditions = props.userSettings?.showPaintMaterial !== false ? { ...cond } : { ...cond, paintMaterialCode: null };
    if (!conditions.disassemblyCodes?.length) conditions.disassemblyCodes = ['Z0'];
    const panelEl = cond.panelElement ?? props.selectedPart?.name ?? null;
    const result = calcDentViaAdapter(
      { shape, widthMm: w, heightMm: h, conditions, panelElement: panelEl },
      ctx
    );
    const multType = isStripeCase(shape, w, h) ? 'strip' : 'circle';
    const mult = getPriceMultiplier(multType, props.userSettings || {});
    const dentForRow = {
      ...dent,
      panelElement: panelEl,
      conditions: { ...conditions, panelElement: conditions.panelElement ?? panelEl },
      sizeLengthMm: dent.sizeLengthMm ?? w,
      sizeWidthMm: dent.sizeWidthMm ?? h,
      bboxMm: { width: w, height: h }
    };
    return { dent: dentForRow, sizeCode: result.sizeCode, base: result.base * mult, total: result.total * mult, breakdown: result.breakdown };
  });
  const filtered = list.filter((d) => d.total > 0).sort((a, b) => b.total - a.total);
  if (filtered.length === 0) return [];
  const dentItems = filtered.map((d) => ({
    total: d.total,
    panelElement: d.dent?.conditions?.panelElement ?? props.selectedPart?.name ?? null,
    dent: d.dent,
  }));
  const { weightedTotals } = calculateSessionTotalWithMultiDentRule(dentItems, {
    discountSamePartEnabled: props.userSettings?.discountSamePartEnabled,
    discountSamePartValue: props.userSettings?.discountSamePartValue,
    discountDiffPartEnabled: props.userSettings?.discountDiffPartEnabled,
    discountDiffPartValue: props.userSettings?.discountDiffPartValue,
    enableSecondDentDiscount: props.userSettings?.enableSecondDentDiscount,
    secondDentDiscountPercent: props.userSettings?.secondDentDiscountPercent,
  });
  const roundStep = props.userSettings?.priceRoundStep ?? 0;
  const dentInputs = filtered.map((item, idx) => {
    const dentPct = clampDiscount(
      props.estimateDraft?.dentDiscounts?.[item.dent?.id] ?? item.dent?.discountPercent ?? props.estimateDraft?.discountPercent ?? 0
    );
    return {
      id: item.dent?.id ?? `d${idx}`,
      basePrice: item.base ?? 0,
      subtotal: weightedTotals[idx] ?? item.total,
      discountPercent: dentPct,
    };
  });
  const totals = calculateEstimateTotals(dentInputs, 0);
  return filtered.map((item, idx) => {
    const t = totals.dents[idx];
    const applied = roundStep > 0 ? applyPriceRoundingCeil(t?.final ?? 0, roundStep) : Math.round(t?.final ?? 0);
    const dentPct = clampDiscount(props.estimateDraft?.dentDiscounts?.[item.dent?.id] ?? item.dent?.discountPercent ?? props.estimateDraft?.discountPercent ?? 0);
    return {
      ...item,
      appliedTotal: applied,
      rawDiscounted: t?.final ?? 0,
      preDiscountTotal: t?.subtotal ?? 0,
      discount: idx > 0,
      discountPercent: dentPct,
      discountAmount: t?.discountAmount ?? 0,
    };
  });
});

const detailWorksheetGrandTotal = computed(() => {
  let s = 0;
  for (const item of detailLineItemsForNewFlow.value || []) {
    s += detailEffectiveDentLineTotal(item);
  }
  for (const w of props.estimateDraft.additionalWorks || []) {
    s += Number(w.price) || 0;
  }
  return s;
});

const detailEngineDentsSubtotal = computed(() =>
  (detailLineItemsForNewFlow.value || []).reduce((sum, d) => sum + (d.appliedTotal ?? d.total ?? 0), 0)
);

const detailFinalActionsDisabled = computed(
  () =>
    props.historySaving ||
    !(detailLineItemsForNewFlow.value?.length > 0) ||
    detailWorksheetGrandTotal.value <= 0
);

async function onQuickStyleOpenField(field, label, inputType, placeholder) {
  const mask = field === 'clientPhone' ? 'phone' : field === 'clientName' ? 'name' : null;
  const pr = phoneInputRegion.value;
  let val = props.estimateDraft[field] ?? '';
  if (field === 'clientPhone') val = normalizePhoneForInput(val, pr);
  const value = await openInputModal({
    title: 'Данные клиента',
    label,
    value: val,
    inputType,
    placeholder: placeholder || label,
    mask,
    phoneRegion: mask === 'phone' ? pr : undefined
  });
  if (value !== undefined && value !== null) {
    props.estimateDraft[field] = typeof value === 'string' ? value : String(value);
  }
}

async function onQuickStylePickParam(field, title, options) {
  if (!openSelectModal || !props.form) return;
  const selected = await openSelectModal({
    title,
    options: options || [],
    value: props.form[field] ?? null
  });
  if (selected === undefined) return;
  props.form[field] = selected || null;
}

async function onQuickStylePickArmature() {
  if (!openSelectModal || !props.form) return;
  const works = getArmaturnayaWorksForElement(props.selectedPart?.name);
  const cur = normalizeArmatureWorkIds(props.form.disassemblyCodes);
  const selected = await openSelectModal({
    title: 'Арматурные работы',
    multiple: true,
    toggleMultipleValue: (current, toggled) => toggleArmatureWorkIds(current, toggled),
    options: works.map((w) => ({
      value: w.code,
      label: w.name,
      rightText: w.price > 0 ? formatMoneyWithCurrency(w.price, detailUiDisplayCurrency.value) : ''
    })),
    value: cur,
    confirmText: 'Готово'
  });
  if (selected === undefined) return;
  props.form.disassemblyCodes = normalizeArmatureWorkIds(selected);
}

async function openDetailDiscountModal(dentItem) {
  const dent = dentItem?.dent;
  const dentId = dent?.id;
  const currentVal = dentId
    ? (props.estimateDraft.dentDiscounts?.[dentId] ?? dent.discountPercent ?? '')
    : (props.estimateDraft.discountPercent ?? '');
  const value = await openInputModal({
    title: 'Скидка',
    label: dentId ? 'Скидка для вмятины (%)' : 'Скидка (%)',
    value: currentVal,
    inputType: 'number',
    placeholder: '0',
    min: 0,
    max: 100
  });
  if (value === undefined) return;
  if (!props.estimateDraft.dentDiscounts) props.estimateDraft.dentDiscounts = {};
  if (dentId) {
    props.estimateDraft.dentDiscounts[dentId] =
      value === '' || value === null ? null : clampDiscount(value);
  } else {
    props.estimateDraft.discountPercent = value === '' || value === null ? null : clampDiscount(value);
  }
}

async function openDetailCommentModal() {
  const value = await openInputModal({
    title: 'Комментарий',
    label: 'Комментарий к оценке (необязательно)',
    value: props.estimateDraft.comment ?? '',
    multiline: true,
    placeholder: 'Введите комментарий...'
  });
  if (value !== undefined) props.estimateDraft.comment = value ?? '';
}
const freeformUsed = computed(() => dents.value?.some((d) => d?.type === 'freeform'));
const freeformAreaMm2 = computed(() => dents.value.reduce((sum, d) => {
  if (d?.type !== 'freeform') return sum;
  const area = Number(d?.areaMm2);
  return sum + (Number.isFinite(area) ? area : 0);
}, 0));
const dentsValid = computed(() => {
  if (dents.value.length === 0) return false;
  if (!selectedDentSize.value) return true;
  const w = Number(sizeWidthMm.value);
  const h = Number(sizeHeightMm.value);
  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0;
});

const stepHintText = computed(() => {
  if (freeformPhotoMode.value && wizardStep.value === 2) return 'Добавьте фото повреждения для обводки вмятины.';
  switch (wizardStep.value) {
    case 2:
      return 'Выберите деталь. Добавьте вмятины и перетащите на место.';
    case 3:
      return 'Размер повреждения в мм. Геометрия: круг/овал или полоса/царапина.';
    default:
      return '';
  }
});

watch(selectedDentSize, (info, oldInfo) => {
  if (info) {
    const w = Number(info.widthMm);
    const h = Number(info.heightMm);
    sizeWidthMm.value = Number.isFinite(w) && w > 0 ? Math.round(w * 10) / 10 : 0;
    sizeHeightMm.value = Number.isFinite(h) && h > 0 ? Math.round(h * 10) / 10 : 0;
    if (info.type === 'freeform') {
      freeStretchMode.value = !!info.freeStretchEnabled;
    }
  }
  sizeEditByUser = false;
  const panelToggled = (info && !oldInfo) || (!info && oldInfo);
  if (panelToggled) nextTick(() => setTimeout(() => scheduleFit('controls-resize'), 50));
}, { immediate: true });

watch([sizeWidthMm, sizeHeightMm], () => {
  if (!selectedDentSize.value) return;
  if (!sizeEditByUser) return;
  if (sizeAdjusting.value) return;
  if (sizeApplyTimeout) clearTimeout(sizeApplyTimeout);
  sizeApplyTimeout = setTimeout(() => {
    const cur = selectedDentSize.value;
    let w = Number(sizeWidthMm.value);
    let h = Number(sizeHeightMm.value);
    // Если изменена только одна ось — используем текущее значение второй из выбранной вмятины
    if (Number.isFinite(w) && w > 0 && (!Number.isFinite(h) || h <= 0) && cur?.heightMm > 0) {
      h = cur.heightMm;
    }
    if (Number.isFinite(h) && h > 0 && (!Number.isFinite(w) || w <= 0) && cur?.widthMm > 0) {
      w = cur.widthMm;
    }
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      sizeEditByUser = false;
      sizeApplyTimeout = null;
      return;
    }
    const isFreeform = selectedDentSize.value?.type === 'freeform';
    const shouldKeepRatio = isFreeform && (selectedDentSize.value?.isShapeFixed || !selectedDentSize.value?.freeStretchEnabled);
    if (shouldKeepRatio) {
      const ratio = Number(selectedDentSize.value?.fixedAspectRatio) || (h ? w / h : null);
      if (ratio && ratio > 0) {
        if (sizeEditAxis.value === 'width') {
          h = w / ratio;
        } else if (sizeEditAxis.value === 'height') {
          w = h * ratio;
        }
        sizeAdjusting.value = true;
        sizeWidthMm.value = Math.round(w * 10) / 10;
        sizeHeightMm.value = Math.round(h * 10) / 10;
        sizeAdjusting.value = false;
      }
    }
    if (cur && Math.abs(cur.widthMm - w) < 0.01 && Math.abs(cur.heightMm - h) < 0.01) {
      sizeEditByUser = false;
      sizeApplyTimeout = null;
      return;
    }
    const curType = cur?.type;
    if (curType === 'freeform' && freeformPhotoMode.value) {
      setSelectedDentUserDimensions(w, h);
    } else {
      setSelectedDentSizeMm(w, h);
    }
    // Business rule: Stripe ONLY when user explicitly chose Полоса. Never convert circle→strip by ratio.
    // Only convert strip→circle when ratio 1:1 (square → treat as circle).
    if (curType === 'strip' && isRatioOneToOne(w, h)) {
      convertSelectedDentToType('circle');
    }
    sizeEditByUser = false;
    sizeApplyTimeout = null;
  }, 150);
});

if (import.meta.env?.DEV) {
  watch(
    () => [wizardStep.value, dents.value?.length],
    ([step, len]) => {
      if (usePhotoBasedFlow && step > 3 && (len ?? 0) === 0) {
        console.error('[DETAIL ASSERT] dents[] is empty after placement step — propagation broken!');
      }
    }
  );
}

watch(dents, (val) => {
  emit('dents-change', val);
  const sizeStep = usePhotoBasedFlow ? 4 : 3;
  const placementStep = usePhotoBasedFlow ? 3 : 2;
  if (wizardStep.value === sizeStep && val.length === 0) {
    goToStep(placementStep);
  } else if (wizardStep.value === sizeStep && val.length > 0) {
    const idx = detailDentIndex.value;
    if (idx >= val.length) {
      detailDentIndex.value = Math.max(0, val.length - 1);
      selectDentById(val[detailDentIndex.value]?.id);
    }
  }
}, { deep: true });

watch(wizardStep, (step, prev) => {
  const finalStep = usePhotoBasedFlow ? 5 : 5;
  const stepBeforeFinal = usePhotoBasedFlow ? 4 : 4;
  if (step === finalStep && props.estimateDraft && !props.estimateDraft.id) {
    props.estimateDraft.id = generateRecordId();
  }
  if (step === finalStep && props.estimateDraft) {
    syncFreeformPhotosToAttachments();
  }
  if (props.autoSave && step === finalStep && prev === stepBeforeFinal && totalPrice.value > 0 && !props.historySaving) {
    nextTick(() => onSaveHistory());
  }
});

/**
 * Кнопка "Назад" в шапке.
 * Step 1: закрыть графический режим.
 * Step 2: → Step 1 (вмятины остаются, editable остаётся).
 * Step 3: → Step 2 (условия не сбрасывать, editable=true).
 * Step 4: → Step 3.
 */
function goBack() {
  if (useNewDetailFlow) {
    const step = detailSession.value.currentStep;
    if (step === 'client') emit('close');
    else if (step === 'camera') detailGoToStep('client');
    else if (step === 'marking' || step === 'dimensions') detailGoToStep('camera');
    else if (step === 'parameters') detailGoToStep('dimensions');
    else if (step === 'result') detailGoToStep('parameters');
    return;
  }
  const step = wizardStep.value;
  if (usePhotoBasedFlow) {
    switch (step) {
      case 1:
        emit('close');
        break;
      case 2:
        if (props.showClientStep) goToStep(1);
        else emit('close');
        break;
      case 3:
        goToStep(props.showClientStep ? 2 : 1);
        break;
      case 4:
        goToStep(3);
        break;
      case 5:
        goToStep(4);
        break;
      default:
        goToStep(1);
    }
  } else {
    switch (step) {
      case 1:
        emit('close');
        break;
      case 2:
        if (props.showClientStep) goToStep(1);
        else emit('close');
        break;
      case 3:
        goToStep(2);
        break;
      case 4:
        goToStep(3);
        break;
      case 5:
        goToStep(4);
        break;
      default:
        goToStep(1);
    }
  }
}

/**
 * Переход на шаг. Step 1–2: editable=true, Step 3–4: editable=false.
 * Контроль editable — в watch(wizardStep).
 */
function goToStep(step) {
  wizardStep.value = step;
  const sizeStepNum = usePhotoBasedFlow ? 4 : 3;
  if (step === sizeStepNum && dents.value?.length > 0) {
    detailDentIndex.value = 0;
    nextTick(() => selectDentById(dents.value[0]?.id));
  }
}

/** Экран 4: назад — предыдущая вмятина или на экран размещения. */
function onStep4Back() {
  const arr = dents.value || [];
  const idx = detailDentIndex.value;
  if (arr.length <= 0) return;
  if (idx > 0) {
    detailDentIndex.value = idx - 1;
    selectDentById(arr[idx - 1]?.id);
  } else {
    goBack();
  }
}

/** Экран 4: вперёд — следующая вмятина или на экран условий (non-photo) / Final (photo). */
function onStep4Next() {
  const arr = dents.value || [];
  const idx = detailDentIndex.value;
  if (arr.length <= 0) return;
  if (idx < arr.length - 1) {
    detailDentIndex.value = idx + 1;
    selectDentById(arr[idx + 1]?.id);
  } else {
    goToStep(usePhotoBasedFlow ? 5 : 4);
  }
}


/**
 * Сохранить в историю: добавляет скриншот матрицы в вложения, затем эмитит save-history.
 */
async function onSaveHistory() {
  const draft = props.estimateDraft;
  const hasDents = (useNewDetailFlow && detailSession.value.dents?.length > 0) || (dents.value?.length > 0);
  if (draft && hasDents) {
    const blob = await exportStageAsBlob();
    if (blob) {
      const recordId = draft.id || generateRecordId();
      if (!draft.id) draft.id = recordId;
      const key = generateMatrixAttachmentKey(recordId);
      try {
        await saveAttachment(key, blob);
        const attachments = draft.attachments || [];
        const hasMatrix = attachments.some((a) => a?.idbKey?.startsWith('dm_matrix_'));
        if (!hasMatrix) {
          draft.attachments = [...attachments, { dentIndex: 0, idbKey: key }];
        }
      } catch (e) {
        console.warn('[DentMetric] Matrix screenshot save failed', e);
      }
    }
  }
  emit('save-history');
}

/**
 * Синхронизирует фото из freeform-вмятин в estimateDraft.attachments.
 * Фото, добавленные через режим произвольной формы (галерея/камера), отображаются в панели «прикрепить файл».
 */
function syncFreeformPhotosToAttachments() {
  const draft = props.estimateDraft;
  if (!draft) return;
  const keys = new Set((dents.value || []).map((d) => d?.photoAssetKey).filter(Boolean));
  if (usePhotoBasedFlow && photoAsset.value?.key && !keys.has(photoAsset.value.key)) {
    keys.add(photoAsset.value.key);
  }
  if (keys.size === 0) return;
  const current = draft.attachments || [];
  const currentKeys = new Set(current.map((a) => a?.idbKey).filter(Boolean));
  const toAdd = [];
  for (const key of keys) {
    if (!currentKeys.has(key)) {
      toAdd.push({ dentIndex: 0, idbKey: key });
      currentKeys.add(key);
    }
  }
  if (toAdd.length > 0) {
    draft.attachments = [...current, ...toAdd];
  }
}

/**
 * Сброс только вмятин и шага (данные клиента в estimateDraft не трогаем).
 * Вызывается из App при нажатии «Сброс вмятин».
 */
function resetDentsOnly() {
  if (useNewDetailFlow) {
    if (detailSessionRef.value.dents.length > 0 && !confirm('Сбросить вмятины и расчёт? Данные клиента сохранятся.')) return;
    detailResetSession();
    emit('dents-change', []);
    return;
  }
  if (dents.value.length > 0 && !confirm('Сбросить вмятины и расчёт? Данные клиента сохранятся.')) return;
  if (sizeApplyTimeout) {
    clearTimeout(sizeApplyTimeout);
    sizeApplyTimeout = null;
  }
  resetDents();
  dents.value = [];
  selectedDentSize.value = null;
  sizeWidthMm.value = 0;
  sizeHeightMm.value = 0;
  dimensionsScrollGuard = false;
  activeToolType.value = null;
  freeStretchMode.value = true;
  setKeepRatio(false);
  showSizeMenu.value = false;
  freeformPhotoMode.value = false;
  photoAsset.value = null;
  if (freeformPhotoUrl.value) {
    URL.revokeObjectURL(freeformPhotoUrl.value);
    freeformPhotoUrl.value = '';
  }
  if (usePhotoBasedFlow) {
    clearPhotoBackground();
  }
  props.form.repairCode = null;
  props.form.riskCode = null;
  props.form.materialCode = null;
  props.form.carClassCode = null;
  props.form.disassemblyCodes = ['Z0'];
  props.form.paintMaterialCode = null;
  props.form.soundInsulationCode = null;
  detailDentConditions.value = {};
  if (props.estimateDraft) props.estimateDraft.detailDentConditions = {};
  initWizardStep();
  emit('dents-change', []);
}

/**
 * Полный сброс: wizardStep=1, все вмятины, условия, цены, UI-флаги.
 * Состояние как при первом заходе в графический режим.
 */
function resetAll() {
  if (dents.value.length > 0 && !confirm('Сбросить все вмятины и начать заново?')) return;
  resetDentsOnly();
}

/** Геометрия: 20×20 мм. displayScale 5 — фигуры крупнее на экране. В фото-режиме — мин. 100px круг, 120×50 полоса. */
const QUICK_ADD_SIZE_MM = { w: 20, h: 20 };
const QUICK_ADD_DISPLAY_SCALE = 5;

function onAddType(type) {
  if (type === 'circle' || type === 'strip') {
    const sizes = type === 'circle' ? props.circleSizes : props.stripSizes;
    const sizeCode = sizes[0]?.code ?? (type === 'circle' ? 'S2' : 'L5');
    addDent(type, sizeCode, sizes, {
      sizeMmOverride: QUICK_ADD_SIZE_MM,
      displayScale: QUICK_ADD_DISPLAY_SCALE
    });
    return;
  }
  activeToolType.value = type;
  showSizeMenu.value = true;
}

function openSizeMenu(type) {
  activeToolType.value = type;
  showSizeMenu.value = true;
}

function confirmAddShape(sizeCode) {
  if (!props.selectedPart) return;
  showSizeMenu.value = false;
  const type = activeToolType.value;
  const sizes = type === 'circle' ? props.circleSizes : props.stripSizes;
  addDent(type, sizeCode, sizes);
}

function deleteCurrent() {
  deleteSelected(selectedDentSize.value?.id);
}

function onShapeVariantChange(variant) {
  setDentShapeVariant(variant);
}

function onFreeStretchChange(checked) {
  if (selectedDentSize.value?.type === 'freeform') {
    setSelectedDentFreeStretch(!!checked);
    freeStretchMode.value = !!checked;
    return;
  }
  setKeepRatio(!checked);
}

function onSizeWidthInput(val) {
  sizeEditByUser = true;
  sizeEditAxis.value = 'width';
  sizeWidthMm.value = val;
}

function onSizeHeightInput(val) {
  sizeEditByUser = true;
  sizeEditAxis.value = 'height';
  sizeHeightMm.value = val;
}

function onFixFreeformShape() {
  setSelectedDentShapeFixed();
}

function updateFreeformCanvasSize() {
  const rect = konvaContainer.value?.getBoundingClientRect?.();
  if (!rect?.width || !rect?.height) {
    freeformCanvasSize.value = { width: 320, height: 240 };
    return;
  }
  freeformCanvasSize.value = { width: Math.round(rect.width), height: Math.round(rect.height) };
}

function openFreeformModal() {
  updateFreeformCanvasSize();
  showFreeformModal.value = true;
}

function onAddFreeform() {
  if (usePhotoBasedFlow && freeformPhotoUrl.value) {
    updateFreeformCanvasSize();
    showFreeformModal.value = true;
    return;
  }
  if (freeformPhotoMode.value && freeformPhotoUrl.value) {
    updateFreeformCanvasSize();
    showFreeformModal.value = true;
    return;
  }
  freeformPhotoMode.value = true;
}

function onPhotoAssetUpdate(v) {
  photoAsset.value = v;
}

async function onPhotoSelectNext() {
  if (!photoAsset.value?.key) return;
  try {
    const blob = await getAttachment(photoAsset.value.key);
    if (blob) {
      if (freeformPhotoUrl.value) URL.revokeObjectURL(freeformPhotoUrl.value);
      freeformPhotoUrl.value = URL.createObjectURL(blob);
    }
  } catch (e) {
    console.error('[DentMetric] Photo load for modal failed', e);
  }
  updateFreeformCanvasSize();
  showFreeformModal.value = true;
}

/** Photo-first: загрузить фото в canvas и перейти к разметке (без модалки) */
async function onPhotoSelectNextPhotoFirst() {
  const key = photoAsset.value?.key;
  if (!key) return;

  try {
    const blob = await getAttachment(key);
    if (blob) {
      if (freeformPhotoUrl.value) URL.revokeObjectURL(freeformPhotoUrl.value);
      freeformPhotoUrl.value = URL.createObjectURL(blob);
      try {
        await setPhotoBackground(blob);
      } catch (bgErr) {
        console.warn('[DentMetric] setPhotoBackground failed, continuing:', bgErr);
      }
    }
    updateFreeformCanvasSize();
  } catch (e) {
    console.error('[DentMetric] Photo load for canvas failed', e);
    return;
  }
  goToStep(props.showClientStep ? 3 : 2);
}

/** На экране размещения: применить user photo как фон матрицы (если ещё не применён). */
async function applyPhotoBackgroundIfNeeded() {
  const key = photoAsset.value?.key;
  if (!key) return;
  try {
    const blob = await getAttachment(key);
    if (blob) await setPhotoBackground(blob);
  } catch (_) {
    /* ignore */
  }
}

function closeFreeformModal() {
  showFreeformModal.value = false;
  /* Не отзываем freeformPhotoUrl — кнопка «Произвольная форма» может вызываться повторно */
}

function onFreeformConfirm(points) {
  if (!Array.isArray(points) || points.length < 3) {
    closeFreeformModal();
    return;
  }
  addFreeformDentFromPoints(points, props.circleSizes, photoAsset.value?.key ?? null);
  closeFreeformModal();
  if (freeformPhotoMode.value) goToStep(3);
}


const initKonvaEditor = async () => {
  if (!konvaContainer.value || !props.selectedPart) return;
  konvaReady.value = false;
  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '';
  /** Photo-first: user photo имеет приоритет над vehicle-матрицей. Если фото выбрано — передаём blob. */
  let photoBlob = null;
  if (usePhotoBasedFlow && photoAsset.value?.key) {
    try {
      photoBlob = await getAttachment(photoAsset.value.key);
    } catch (_) {
      /* ignore */
    }
  }
  if (import.meta.env?.DEV) {
    console.log('[WIZARD] initKonvaEditor, usePhotoBasedFlow:', usePhotoBasedFlow, 'photoAsset:', photoAsset.value?.key, 'photoBlob loaded:', !!photoBlob);
  }
  try {
    await initKonva(
      konvaContainer.value,
      props.selectedPart,
      props.userSettings.prices,
      (newDents) => {
        dents.value = newDents;
        emit('dents-change', newDents);
      },
      baseUrl,
      (info) => { selectedDentSize.value = info; },
      { photoBlob: photoBlob ?? undefined }
    );
    konvaReady.value = true;
  } catch (e) {
    konvaReady.value = false;
    throw e;
  }
  /* Применить текущий шаг (draggable формы vs handle) после init */
  const editableMaxStep = usePhotoBasedFlow ? 4 : 3;
  setEditable(wizardStep.value >= 1 && wizardStep.value <= editableMaxStep, wizardStep.value);
  setDisplayUnit(props.userSettings?.sizeUnit || 'mm');
  updateMobileGrid();
  /* Повторный fit после layout: контейнер мог иметь 0 размер при init */
  nextTick(() => setTimeout(() => scheduleFit('init-layout'), 150));
};

function updateMobileGrid() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 480;
  setHideGridOnMobile(isMobile);
}

watch(
  () => wizardStep.value,
  (step) => {
    nextTick(() => {
      updateMatrixSafeTop();
      const editableMaxStep = usePhotoBasedFlow ? 4 : 3;
      /** Этапы 1–4: canvas интерактивен (выбор/удаление вмятин). Шаг 1 включён — на нём может быть placement при !showClientStep. */
      setEditable(step >= 1 && step <= editableMaxStep, step);
      updateMobileGrid();
      if (step === (usePhotoBasedFlow ? 4 : 3)) {
        setKeepRatio(!freeStretchMode.value);
        setTimeout(() => scheduleFit('step2-show'), 200);
      }
      if (step >= 4) setTimeout(() => scheduleFit('resize'), 150);
      /** Step after placement: sync dents from konvaEditor (canonical source) to ensure all placed dents propagate to the next screen (multi-dent fix). */
      const calcStep = usePhotoBasedFlow ? 4 : 3;
      if (step === calcStep) {
        const konvaDents = getDents();
        if (Array.isArray(konvaDents) && konvaDents.length > 0) {
          const needSync = (dents.value?.length ?? 0) !== konvaDents.length || (dents.value || []).some((d, i) => d?.id !== konvaDents[i]?.id);
          if (needSync) {
            dents.value = konvaDents;
            emit('dents-change', konvaDents);
            if (detailDentIndex.value >= konvaDents.length) {
              detailDentIndex.value = Math.max(0, konvaDents.length - 1);
              nextTick(() => selectDentById(konvaDents[detailDentIndex.value]?.id));
            }
          }
        }
      }
      /** Photo-first: на экране размещения (step 3) гарантируем фон = user photo. Задержка для готовности Konva. */
      if (usePhotoBasedFlow && step === (props.showClientStep ? 3 : 2) && photoAsset.value?.key) {
        setTimeout(() => applyPhotoBackgroundIfNeeded(), 50);
      }
    });
  },
  { immediate: true }
);

watch(() => hintRef.value, (el) => {
  if (hintObserver) {
    hintObserver.disconnect();
    hintObserver = null;
  }
  if (el) {
    hintObserver = new ResizeObserver(() => updateMatrixSafeTop());
    hintObserver.observe(el);
  }
  nextTick(() => updateMatrixSafeTop());
});

watch(
  () => props.userSettings?.sizeUnit,
  (unit) => {
    if (unit) setDisplayUnit(unit);
  }
);

if (import.meta.env.DEV) {
  watch(
    () => selectedDentSize.value?.id,
    (id) => {
      if (id && dents.value?.some((d) => String(d?.id) === String(id))) return;
      if (id && !dents.value?.some((d) => String(d?.id) === String(id))) {
        console.error('[DELETE ASSERT] selectedDentSize.id points to non-existent dent:', id);
      }
    }
  );
  watch(
    () => dents.value,
    (list) => {
      if (!list?.length) return;
      const ids = (list || []).map((d) => d?.id).filter(Boolean);
      const unique = new Set(ids.map(String));
      if (unique.size !== ids.length) {
        console.error('[DELETE ASSERT] Duplicate dent ids in dents:', ids);
      }
    },
    { deep: true }
  );
}

watch(
  () => [props.selectedClassId, props.selectedPartId, props.selectedPart],
  (newVal, oldVal) => {
    /* При смене элемента кузова или класса — полный сброс, новый расчёт */
    const partChanged = oldVal && (newVal[1] !== oldVal[1] || newVal[0] !== oldVal[0]);
    if (partChanged) {
      resetAll();
    }
    nextTick(() => setTimeout(initKonvaEditor, 50));
  },
  { deep: true }
);

onMounted(() => {
  initWizardStep();
  nextTick(() => setTimeout(initKonvaEditor, 100));
  updateMobileGrid();
  window.addEventListener('resize', updateMobileGrid);
  window.addEventListener('resize', updateMatrixSafeTop);
  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', updateKeyboardInset);
    vv.addEventListener('scroll', updateKeyboardInset);
    updateKeyboardInset();
  }
  updateKeyboardInset();
  updateMatrixSafeTop();
});

onBeforeUnmount(() => {
  konvaReady.value = false;
  if (useNewDetailFlow) detailResetSession();
  window.removeEventListener('resize', updateMobileGrid);
  window.removeEventListener('resize', updateMatrixSafeTop);
  const vv = window.visualViewport;
  if (vv) {
    vv.removeEventListener('resize', updateKeyboardInset);
    vv.removeEventListener('scroll', updateKeyboardInset);
  }
  if (hintObserver) {
    hintObserver.disconnect();
    hintObserver = null;
  }
  destroyKonva();
});

defineExpose({
  resetDentsOnly,
  totalPrice,
  getPhotoAssetKey: () => photoAsset.value?.key ?? null,
  getDetailSession: () => detailSessionRef.value,
});
</script>

<style scoped>
/* Layout графики: fullscreen overlay, матрица занимает максимум */
.graphics-fullscreen-wrapper {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  min-height: 100dvh;
  max-height: 100dvh;
  width: 100vw;
  max-width: none;
  overflow: hidden;
  overflow-x: hidden;
  padding: 0 0 var(--app-footer-height, 0px) 0;
  margin: 0;
  background: #000;
  --bottomH: 30%;
  --matrixSafeTop: 60px;
  --matrixHeight: auto;
  --actionbar-height: calc(100px + env(safe-area-inset-bottom, 0px) + var(--app-footer-height, 0px));
  --controlsMaxH: clamp(190px, 24vh, 300px);
}

/* Верхняя панель: flex 0 0 auto, safe area */
.graphics-header {
  flex: 0 0 auto;
  padding-top: env(safe-area-inset-top, 0);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
}

/* Подсказка: фиксированная высота, отдельный слой над матрицей */
.graphics-hint-area {
  position: relative;
  flex: 0 0 0;
  min-height: 0;
  max-height: 0;
  padding: 0;
  z-index: 20;
}

/* Матрица: фиксированная доля экрана, не меняется между этапами */
.graphics-stage-area {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: none;
  padding: 0;
  margin: 0;
  overflow: hidden;
  padding-top: var(--matrixSafeTop);
  box-sizing: border-box;
}

/* Контейнер Konva: width 100vw, без max-width, padding 0 */
.matrix-container {
  width: 100vw;
  max-width: none;
  padding: 0;
  margin: 0;
}

.graphics-stage-area .canvas-editor-wrap {
  flex: 1 1 0;
  min-height: 120px;
}

/* Нижняя панель: фиксированная доля экрана — одинаковая высота на этапах 1 и 2, без прыжков матрицы */
.graphics-controls-area {
  position: relative;
  flex: 0 0 auto;
  min-height: 0;
  max-height: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Кнопка удаления вмятины на HUD (этап 1) */
.hud-delete-btn {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  background: rgba(20, 20, 20, 0.85);
  color: #88e523;
  opacity: 0.35;
  filter: grayscale(1);
  cursor: default;
  pointer-events: none;
  transition: opacity 0.2s, filter 0.2s, background 0.2s;
}

@media (max-width: 480px) {
  .hud-delete-btn {
    right: 8px;
    bottom: 8px;
  }
  /* Мобильные: фиксированная доля для стабильной высоты матрицы */
  .graphics-controls-area {
    flex: 0 0 var(--bottomH);
    min-height: 140px;
    max-height: var(--bottomH);
  }
}

.hud-delete-btn--active {
  opacity: 1;
  filter: none;
  cursor: pointer;
  pointer-events: auto;
}

.hud-delete-btn--active:hover {
  background: rgba(30, 30, 30, 0.95);
  border-color: rgba(136, 229, 35, 0.4);
}

.hud-delete-btn--active:active {
  transform: scale(0.96);
}

/* Подсказка этапа: читабельный шрифт, без наложения */
.step-hint-block {
  max-width: min(90%, 520px);
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 6px;
}
.step-hint-text {
  word-wrap: break-word;
  hyphens: auto;
}

.graphics-step-2 .graphics-controls-area,
.graphics-step-3 .graphics-controls-area {
  flex: 0 0 auto;
  min-height: 0;
  height: var(--controlsMaxH);
  max-height: var(--controlsMaxH);
}
/* Step 3 (placement): больше высоты для блока без скролла на мобильных */
.graphics-step-3 .graphics-controls-area {
  --controlsMaxH: clamp(200px, 26vh, 320px);
}

.graphics-step-2 :deep(.graphics-panel-content),
.graphics-step-3 :deep(.graphics-panel-content) {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
}

.graphics-step-1 .graphics-stage-area,
.graphics-step-4 .graphics-stage-area,
.graphics-step-5 .graphics-stage-area,
.graphics-step-6 .graphics-stage-area,
.graphics-step-2.graphics-step-photo .graphics-stage-area {
  display: none;
}
/* New Detail flow: camera/marking/dimensions take full screen */
.graphics-detail-fullscreen .graphics-stage-area,
.graphics-detail-fullscreen .graphics-hint-area {
  display: none;
}
.graphics-detail-fullscreen .graphics-controls-area {
  position: absolute;
  inset: 0;
  padding: 0;
  border: none;
  background: transparent;
}

.graphics-step-1 .graphics-controls-area,
.graphics-step-2.graphics-step-photo .graphics-controls-area {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  height: auto;
  border-top: none;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
}

/* Этап 4 (условия и коэффициенты): контент по высоте без пустого чёрного полотна, кнопки вплотную к контенту и к меню */
.graphics-step-4 .graphics-controls-area {
  flex: 1 1 0;
  min-height: 0;
  max-height: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0;
}
.graphics-step-4 :deep(.step3-panel) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  justify-content: flex-start;
  /* Критично: без min-height:0 flex-ребёнок не сожмётся и скролл не появится */
}
/* Область контента — занимает всё место до кнопок, скролл внутри; min-height:0 критично для flex+scroll */
.graphics-step-4 :deep(.step3-params-wrap) {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: scroll;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  display: flex;
  flex-direction: column;
}
.graphics-step-4 :deep(.step3-scroll-wrap) {
  flex: 0 0 auto;
  padding-bottom: 1.25rem;
}
.graphics-step-4 :deep(.graphics-action-bar),
.detail-step4-wrap :deep(.graphics-action-bar) {
  position: relative;
  flex-shrink: 0;
  margin-top: 0;
  padding-top: 0.5rem;
  padding-bottom: 0.25rem;
  background: transparent;
}

.graphics-step-1 :deep(.graphics-panel-content) {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  overflow: visible;
}
/* Step 4: panel content = step3-params-wrap, overflow-y:scroll нужен для скролла — не перезаписываем overflow */
.graphics-step-4 :deep(.graphics-panel-content) {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
}


.graphics-step-1 .graphics-hint-area,
.graphics-step-4 .graphics-hint-area {
  flex: 0 0 0;
  min-height: 0;
  max-height: 0;
  padding: 0;
}

.graphics-step-5 .graphics-stage-area {
  flex: 0 0 22%;
  min-height: 90px;
  max-height: 22%;
}

.graphics-step-5 .graphics-controls-area {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  height: auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}


.graphics-step-5 .graphics-hint-area {
  flex: 0 0 0;
  min-height: 0;
  max-height: 0;
  padding: 0;
}

.graphics-step-5 {
  --actionbar-height: calc(160px + env(safe-area-inset-bottom, 0px) + var(--app-footer-height, 0px));
}

.graphics-step-5 :deep(.graphics-panel-content) {
  padding-bottom: calc(var(--actionbar-height) + 8px);
}

/* Step 6 (new Detail flow result): controls fill space, stage hidden */
.graphics-step-6 .graphics-controls-area {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  height: auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.graphics-step-6 .graphics-hint-area {
  flex: 0 0 0;
  min-height: 0;
  max-height: 0;
  padding: 0;
}
.graphics-step-6 {
  --actionbar-height: calc(160px + env(safe-area-inset-bottom, 0px) + var(--app-footer-height, 0px));
}
.graphics-step-6 :deep(.graphics-panel-content) {
  padding-bottom: calc(var(--actionbar-height) + 8px);
}

:deep(.graphics-panel-content) {
  padding-bottom: var(--actionbar-height);
  max-width: 100%;
  box-sizing: border-box;
}

/* Action bar: relative (in-flow) to avoid content overlap. QuickStyle components use flex + shrink-0. */
:deep(.graphics-action-bar) {
  position: relative;
  flex-shrink: 0;
  z-index: 30;
}

:deep(.actionbar-total-btn) {
  width: 100%;
  min-height: 44px;
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: opacity 0.2s ease;
}

:deep(.actionbar-total-btn--active) {
  background: #88e523;
  color: #000;
  box-shadow: 0 0 15px rgba(136, 229, 35, 0.35);
}

:deep(.actionbar-total-btn--idle) {
  background: rgba(255, 255, 255, 0.08);
  color: #9aa3ad;
  cursor: default;
}
</style>
