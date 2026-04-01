<template>
  <div class="sqf" :class="{ 'sqf--unified-parent-scroll': unifiedParentScroll }">
    <ResultFourTabs v-model="activeTab" :unified-parent-scroll="unifiedParentScroll">
      <div class="sqf-scroll">
        <!-- Расчёт -->
        <div v-show="activeTab === 'calculation'" class="sqf-panel space-y-2">
          <div
            v-if="detailPhotoDataUrl"
            class="card-metallic rounded-xl overflow-hidden sqf-detail-photo"
          >
            <p class="sqf-detail-photo__label">Фото повреждения</p>
            <button
              type="button"
              class="sqf-detail-photo__btn"
              @click="detailPhotoOpen = true"
            >
              <img :src="detailPhotoDataUrl" class="sqf-detail-photo__img" alt="" />
            </button>
            <p class="sqf-detail-photo__hint">Нажмите, чтобы увеличить</p>
          </div>
          <div class="card-metallic rounded-xl sqf-section">
            <div class="sqf-row">
              <span class="sqf-row__label">Дата:</span>
              <span class="sqf-row__val">{{ metaDate }}</span>
            </div>
            <div class="sqf-row">
              <span class="sqf-row__label">Время:</span>
              <span class="sqf-row__val">{{ metaTime }}</span>
            </div>
            <div class="sqf-row">
              <span class="sqf-row__label">Общее кол-во повреждений:</span>
              <span class="sqf-row__val">{{ engineLineItems.length }}</span>
            </div>
            <div class="sqf-row">
              <span class="sqf-row__label">Ориентировочное время ремонта:</span>
              <div class="sqf-row__val sqf-row__val--edit">
                <template v-if="!editingRepair">
                  <button type="button" class="sqf-edit-hit" @click="startRepairEdit">
                    {{ repairTimeLabel }} <span class="sqf-pen">✎</span>
                  </button>
                </template>
                <div v-else class="sqf-inline">
                  <input
                    ref="repairInputRef"
                    v-model.number="repairEditVal"
                    type="number"
                    step="0.05"
                    min="0"
                    class="sqf-num-input"
                    @blur="saveRepair"
                    @keyup.enter="saveRepair"
                  >
                  <span class="sqf-unit">ч</span>
                </div>
              </div>
            </div>
            <div class="sqf-row">
              <span class="sqf-row__label">Расчёт произвёл мастер:</span>
              <span class="sqf-row__val">{{ draft.masterName?.trim() ? draft.masterName : '—' }}</span>
            </div>
          </div>

          <div class="card-metallic rounded-xl sqf-section">
            <div class="sqf-block-title">Список работ</div>
            <div class="sqf-row">
              <span class="sqf-row__label">Удаление вмятин:</span>
              <span class="sqf-row__val sqf-row__val--price">{{ fmt(dentRemovalTotal) }} ₽</span>
            </div>
            <div v-if="(draft.additionalWorks || []).length" class="sqf-extra">
              <div class="sqf-extra-label">Доп. работы:</div>
              <div
                v-for="w in draft.additionalWorks"
                :key="w.id"
                class="sqf-row sqf-row--sub"
              >
                <span class="sqf-row__label">{{ w.title }}:</span>
                <span class="sqf-row__val sqf-row__val--row">
                  <span class="sqf-row__val--price">{{ fmt(w.price || 0) }} ₽</span>
                  <button type="button" class="sqf-x" aria-label="Удалить" @click="removeWork(w.id)">×</button>
                </span>
              </div>
            </div>
            <div v-if="!addingWork" class="sqf-add-wrap">
              <button type="button" class="sqf-add-btn" @click="addingWork = true">
                + Добавить работу
              </button>
            </div>
            <div v-else class="sqf-add-form">
              <input v-model="newWorkTitle" class="sqf-inp sqf-inp--grow" placeholder="Название работы" >
              <input v-model.number="newWorkPrice" type="number" min="0" class="sqf-inp sqf-inp--price" placeholder="Цена" >
              <button type="button" class="sqf-btn-save" @click="saveNewWork">OK</button>
              <button type="button" class="sqf-btn-cancel" @click="addingWork = false">Отмена</button>
            </div>
            <div class="sqf-row sqf-row--total">
              <span class="sqf-row__label">Итого:</span>
              <span
                class="sqf-row__val sqf-row__val--grand"
                :class="{ 'dm-total-price': detailUxParity }"
                data-testid="total-price-graphics"
              >{{ fmt(worksheetGrandTotal) }} ₽</span>
            </div>
          </div>

          <PerDentFinalCard
            v-for="(row, idx) in uiRows"
            :key="row.dent?.id ?? idx"
            :index="idx"
            :row="row"
            :breakdown-rows="buildDetailedBreakdown(row)"
            :user-settings="userSettings"
            :engine-line-items="engineLineItems"
            :read-only="false"
            :detail-ux-parity="detailUxParity"
            :estimate-draft="detailUxParity ? draft : null"
            @open-discount="$emit('open-discount', $event)"
          />

          <PrepaymentBlock v-model="prepaymentProxy" />
        </div>

        <!-- Клиент -->
        <div v-show="activeTab === 'client'" class="sqf-panel space-y-2">
          <div class="card-metallic rounded-xl sqf-section">
            <div class="sqf-client-head">
              <div class="sqf-block-title sqf-block-title--muted sqf-mb-0">Клиент</div>
              <div v-if="detailUxParity" class="sqf-client-head__actions">
                <button
                  v-if="!clientInlineEditing"
                  type="button"
                  class="sqf-link-btn"
                  @click="startClientInlineEdit"
                >Изменить</button>
                <template v-else>
                  <button type="button" class="sqf-link-btn sqf-link-btn--muted" @click="cancelClientInlineEdit">Отмена</button>
                  <button type="button" class="sqf-link-btn" @click="saveClientInlineEdit">Готово</button>
                </template>
              </div>
            </div>
            <template v-if="detailUxParity && clientInlineEditing">
              <label class="sqf-inp-label">Имя</label>
              <input v-model="clientEditBuffer.name" type="text" class="sqf-inp sqf-inp--block" placeholder="Имя" >
              <label class="sqf-inp-label">Телефон</label>
              <input v-model="clientEditBuffer.phone" type="tel" class="sqf-inp sqf-inp--block" placeholder="Телефон" >
              <label class="sqf-inp-label">Компания</label>
              <input v-model="clientEditBuffer.company" type="text" class="sqf-inp sqf-inp--block" placeholder="Компания" >
              <label class="sqf-inp-label">Марка</label>
              <input v-model="clientEditBuffer.brand" type="text" class="sqf-inp sqf-inp--block" placeholder="Марка" >
              <label class="sqf-inp-label">Модель</label>
              <input v-model="clientEditBuffer.model" type="text" class="sqf-inp sqf-inp--block" placeholder="Модель" >
              <label class="sqf-inp-label">Гос. номер</label>
              <input v-model="clientEditBuffer.plate" type="text" class="sqf-inp sqf-inp--block" placeholder="Гос. номер" >
            </template>
            <template v-else>
              <div class="sqf-row">
                <span class="sqf-row__label">Имя:</span>
                <span class="sqf-row__val">{{ clientDisplay.name || '—' }}</span>
              </div>
              <div class="sqf-row">
                <span class="sqf-row__label">Телефон:</span>
                <span class="sqf-row__val">{{ clientDisplay.phone || '—' }}</span>
              </div>
              <div class="sqf-row">
                <span class="sqf-row__label">Компания:</span>
                <span class="sqf-row__val">{{ clientDisplay.company || '—' }}</span>
              </div>
              <div class="sqf-row">
                <span class="sqf-row__label">Марка:</span>
                <span class="sqf-row__val">{{ clientDisplay.brand || '—' }}</span>
              </div>
              <div class="sqf-row">
                <span class="sqf-row__label">Модель:</span>
                <span class="sqf-row__val">{{ clientDisplay.model || '—' }}</span>
              </div>
              <div v-if="detailUxParity" class="sqf-row">
                <span class="sqf-row__label">Гос. номер:</span>
                <span class="sqf-row__val">{{ draft.carPlate || '—' }}</span>
              </div>
            </template>
          </div>
          <div class="card-metallic rounded-xl sqf-section sqf-section--mood">
            <template v-if="!detailUxParity">
              <div class="sqf-block-title sqf-block-title--muted">Адекватность клиента</div>
              <ClientMoodPicker v-model="moodProxy" :hide-block-label="false" />
            </template>
            <template v-else>
              <div class="sqf-mood-head">
                <button
                  type="button"
                  class="sqf-info-ico"
                  aria-label="Справка: адекватность клиента"
                  @click="adequacyInfoOpen = !adequacyInfoOpen"
                >ℹ️</button>
              </div>
              <p v-if="adequacyInfoOpen" class="sqf-info-tip">
                Оцените поведение клиента. Это поможет вам при повторных обращениях. Подробнее — в разделе «Инфо».
              </p>
              <ClientMoodPicker v-model="moodProxy" :hide-block-label="true" />
            </template>
          </div>
        </div>

        <!-- Файлы -->
        <div v-show="activeTab === 'files'" class="sqf-panel space-y-2">
          <div class="card-metallic rounded-xl sqf-section">
            <div class="sqf-block-title">Комментарий</div>
            <button
              type="button"
              class="sqf-comment-btn"
              @click="$emit('open-comment')"
            >
              {{ draft.comment || '—' }}
            </button>
          </div>
          <div class="card-metallic rounded-xl p-3">
            <AttachmentPicker
              :record-id="draft.id || ''"
              :dent-index="0"
              :model-value="draft.attachments || []"
              @update:model-value="onAttachments"
            />
          </div>
        </div>

        <!-- Демонстрация -->
        <div v-show="activeTab === 'demo'" class="sqf-panel sqf-demo">
          <p class="sqf-demo__t">Версия демонстрации</p>
          <p class="sqf-demo__sub">Будет реализовано позже</p>
        </div>
      </div>
    </ResultFourTabs>

    <Teleport to="body">
      <div
        v-if="detailPhotoOpen && detailPhotoDataUrl"
        class="sqf-photo-modal"
        @click="detailPhotoOpen = false"
      >
        <img :src="detailPhotoDataUrl" class="sqf-photo-modal__img" alt="" />
        <button type="button" class="sqf-photo-modal__close" @click.stop="detailPhotoOpen = false">✕</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, reactive, watch } from 'vue';
import { applyPriceRoundingCeil } from '../../utils/priceRounding';
import { formatRepairTime } from '../../utils/formatRepairTime';
import ResultFourTabs from './ResultFourTabs.vue';
import PerDentFinalCard from './PerDentFinalCard.vue';
import AttachmentPicker from '../AttachmentPicker.vue';
import ClientMoodPicker from '../ClientMoodPicker.vue';
import PrepaymentBlock from '../PrepaymentBlock.vue';

const props = defineProps({
  draft: { type: Object, required: true },
  engineLineItems: { type: Array, default: () => [] },
  clientDisplay: { type: Object, default: () => ({}) },
  userSettings: { type: Object, required: true },
  buildDetailedBreakdown: { type: Function, required: true },
  /** Сумма расчёта вмятин (движок), без доп. работ — для времени ремонта */
  engineDentsTotal: { type: Number, default: 0 },
  /** Режим детализации: превью снимка внутри вкладки «Расчёт» */
  detailPhotoDataUrl: { type: String, default: null },
  /** Родитель скроллит блок целиком (клиент + вкладки + контент) — экран результата детализации */
  unifiedParentScroll: { type: Boolean, default: false },
  /** Единый UX с историей: время, длина, скидка, итого, клиент, адекватность */
  detailUxParity: { type: Boolean, default: false }
});

const emit = defineEmits(['open-discount', 'open-comment', 'sync-detail-client']);

const activeTab = ref('calculation');
const detailPhotoOpen = ref(false);

const roundStep = computed(() => props.userSettings.priceRoundStep ?? 0);

function fmt(n) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(Number(n) || 0));
}

const metaDate = computed(() => {
  const d = props.draft.inspectDate;
  if (d && String(d).trim()) {
    const [y, m, day] = String(d).split('-');
    if (y && m && day) return `${day}.${m}.${y.slice(2)}`;
  }
  const now = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(now.getDate())}.${p(now.getMonth() + 1)}.${String(now.getFullYear()).slice(2)}`;
});

const metaTime = computed(() => {
  const t = props.draft.inspectTime;
  if (t && String(t).trim()) return String(t).slice(0, 5);
  const now = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(now.getHours())}:${p(now.getMinutes())}`;
});

const defaultRepairHours = computed(() => {
  const total = props.engineDentsTotal;
  const rate = props.userSettings.hourlyRate > 0 ? props.userSettings.hourlyRate : 4000;
  if (total <= 0 || rate <= 0) return 0;
  return Math.round((total / rate) * 100) / 100;
});

const displayRepairHours = computed(() => {
  const m = props.draft.repairTimeHours;
  if (m != null && m !== '' && Number.isFinite(Number(m))) return Number(m);
  return defaultRepairHours.value;
});

const repairTimeLabel = computed(() => formatRepairTime(displayRepairHours.value));

const editingRepair = ref(false);
const repairEditVal = ref(0);
const repairInputRef = ref(null);

function startRepairEdit() {
  repairEditVal.value = displayRepairHours.value;
  editingRepair.value = true;
  nextTick(() => repairInputRef.value?.focus?.());
}

function saveRepair() {
  const n = Number(repairEditVal.value);
  props.draft.repairTimeHours = Number.isFinite(n) && n >= 0 ? n : null;
  editingRepair.value = false;
}

const uiRows = computed(() => {
  const step = roundStep.value;
  return props.engineLineItems.map((item) => {
    const dent = item.dent;
    const dm = item.appliedTotal ?? 0;
    const rawM = dent?.manualLineTotal;
    const manual =
      rawM != null && rawM !== '' && Number.isFinite(Number(rawM))
        ? applyPriceRoundingCeil(Number(rawM), step)
        : null;
    const displayTotal = manual != null ? manual : dm;
    const market =
      dent?.marketLinePrice != null && Number.isFinite(Number(dent.marketLinePrice))
        ? Number(dent.marketLinePrice)
        : displayTotal;
    return {
      ...item,
      dmTotal: dm,
      displayTotal,
      hasManual: manual != null,
      marketDisplay: market
    };
  });
});

const dentRemovalTotal = computed(() =>
  uiRows.value.reduce((s, r) => s + (r.displayTotal || 0), 0)
);

const additionalSum = computed(() =>
  (props.draft.additionalWorks || []).reduce((s, w) => s + (Number(w.price) || 0), 0)
);

const worksheetGrandTotal = computed(() => dentRemovalTotal.value + additionalSum.value);

const addingWork = ref(false);
const newWorkTitle = ref('');
const newWorkPrice = ref(0);

function saveNewWork() {
  const title = String(newWorkTitle.value || '').trim();
  if (!title) return;
  if (!Array.isArray(props.draft.additionalWorks)) props.draft.additionalWorks = [];
  props.draft.additionalWorks.push({
    id: `aw_${Date.now()}`,
    title,
    price: Math.max(0, Number(newWorkPrice.value) || 0)
  });
  newWorkTitle.value = '';
  newWorkPrice.value = 0;
  addingWork.value = false;
}

function removeWork(id) {
  const arr = props.draft.additionalWorks;
  if (!Array.isArray(arr)) return;
  const i = arr.findIndex((w) => w.id === id);
  if (i >= 0) arr.splice(i, 1);
}

const prepaymentProxy = computed({
  get() {
    return props.draft.prepayment ?? { amount: 0, method: null };
  },
  set(v) {
    props.draft.prepayment = v;
  }
});

const moodProxy = computed({
  get() {
    return props.draft.clientMood ?? null;
  },
  set(v) {
    props.draft.clientMood = v;
  }
});

function onAttachments(v) {
  props.draft.attachments = v;
}

const adequacyInfoOpen = ref(false);
const clientInlineEditing = ref(false);
const clientEditSnapshot = ref(null);
const clientEditBuffer = reactive({
  name: '',
  phone: '',
  company: '',
  brand: '',
  model: '',
  plate: ''
});

function fillClientEditBufferFromDraft() {
  clientEditBuffer.name = props.draft.clientName ?? props.clientDisplay.name ?? '';
  clientEditBuffer.phone = props.draft.clientPhone ?? props.clientDisplay.phone ?? '';
  clientEditBuffer.company = props.draft.clientCompany ?? props.clientDisplay.company ?? '';
  clientEditBuffer.brand = props.draft.carBrand ?? props.clientDisplay.brand ?? '';
  clientEditBuffer.model = props.draft.carModel ?? props.clientDisplay.model ?? '';
  clientEditBuffer.plate = props.draft.carPlate ?? '';
}

function startClientInlineEdit() {
  fillClientEditBufferFromDraft();
  clientEditSnapshot.value = JSON.stringify(clientEditBuffer);
  clientInlineEditing.value = true;
}

function cancelClientInlineEdit() {
  if (clientEditSnapshot.value) {
    try {
      const o = JSON.parse(clientEditSnapshot.value);
      Object.assign(clientEditBuffer, o);
      props.draft.clientName = o.name;
      props.draft.clientPhone = o.phone;
      props.draft.clientCompany = o.company;
      props.draft.carBrand = o.brand;
      props.draft.carModel = o.model;
      props.draft.carPlate = o.plate;
    } catch (_e) {
      /* ignore */
    }
  }
  clientInlineEditing.value = false;
  clientEditSnapshot.value = null;
}

function saveClientInlineEdit() {
  props.draft.clientName = clientEditBuffer.name;
  props.draft.clientPhone = clientEditBuffer.phone;
  props.draft.clientCompany = clientEditBuffer.company;
  props.draft.carBrand = clientEditBuffer.brand;
  props.draft.carModel = clientEditBuffer.model;
  props.draft.carPlate = clientEditBuffer.plate;
  emit('sync-detail-client', {
    name: clientEditBuffer.name,
    phone: clientEditBuffer.phone,
    company: clientEditBuffer.company,
    carBrand: clientEditBuffer.brand,
    carModel: clientEditBuffer.model,
    plateNumber: clientEditBuffer.plate
  });
  clientInlineEditing.value = false;
  clientEditSnapshot.value = null;
}

watch(
  () => props.detailUxParity,
  (v) => {
    if (!v) {
      clientInlineEditing.value = false;
      adequacyInfoOpen.value = false;
    }
  }
);
</script>

<style scoped>
.sqf {
  display: flex;
  flex-direction: column;
  min-height: 0;
  /* basis auto: при height:auto у родителя flex:1 1 0 даёт нулевую высоту и «пустой» экран */
  flex: 1 1 auto;
}
.sqf-scroll {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  padding-bottom: 12px;
}
.sqf--unified-parent-scroll {
  flex: none;
  width: 100%;
  min-height: auto;
}
.sqf--unified-parent-scroll .sqf-scroll {
  flex: none;
  overflow: visible;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: auto;
}
.sqf-detail-photo {
  background: rgba(0, 0, 0, 0.35);
}
.sqf-detail-photo__label {
  margin: 0;
  padding: 10px 14px 6px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ca3af;
}
.sqf-detail-photo__btn {
  display: block;
  width: 100%;
  padding: 0;
  margin: 0;
  border: none;
  background: #0a0a0a;
  cursor: pointer;
  line-height: 0;
}
.sqf-detail-photo__img {
  width: 100%;
  max-height: 160px;
  height: 140px;
  object-fit: cover;
  display: block;
}
.sqf-detail-photo__hint {
  margin: 0;
  padding: 6px 14px 10px;
  font-size: 11px;
  color: #6b7280;
  text-align: right;
}
.sqf-photo-modal {
  position: fixed;
  inset: 0;
  z-index: 10050;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
}
.sqf-photo-modal__img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.sqf-photo-modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: none;
  background: #1e1e1e;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
}
.sqf-panel {
  min-height: 120px;
}
.sqf-section {
  padding: 12px 14px;
}
.sqf-block-title {
  font-size: 10px;
  font-weight: 800;
  color: #88e523;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}
.sqf-block-title--muted {
  color: #9ca3af;
}
.sqf-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 13px;
}
.sqf-row:last-child {
  border-bottom: none;
}
.sqf-row--sub {
  padding-left: 8px;
}
.sqf-row--total {
  border-top: 2px solid rgba(255, 255, 255, 0.1);
  margin-top: 6px;
  padding-top: 10px;
  border-bottom: none;
  font-weight: 800;
}
.sqf-row__label {
  color: #9ca3af;
  flex: 1;
  min-width: 0;
  text-align: left;
}
.sqf-row__val {
  color: #e5e7eb;
  text-align: right;
  flex-shrink: 0;
  max-width: 52%;
}
.sqf-row__val--wrap {
  white-space: normal;
  text-align: right;
}
.sqf-row__val--price {
  font-weight: 700;
  color: #88e523;
}
.sqf-row__val--grand {
  font-size: 17px;
  font-weight: 800;
  color: #88e523;
}
.sqf-row__val--row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sqf-row__val--edit {
  max-width: 55%;
}
.sqf-row__val--adj {
  color: #f59e0b;
  font-weight: 700;
}
.sqf-row__val--muted {
  color: #6b7280;
  font-style: italic;
}
.sqf-edit-hit {
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  font-weight: 700;
  padding: 0;
  cursor: pointer;
  text-align: right;
}
.sqf-pen {
  font-size: 11px;
  opacity: 0.45;
  margin-left: 4px;
}
.sqf-inline {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}
.sqf-num-input {
  width: 72px;
  height: 32px;
  border-radius: 8px;
  border: 1.5px solid #88e523;
  background: #0a0a0a;
  color: #fff;
  text-align: right;
  font-size: 14px;
  font-weight: 700;
  padding: 0 6px;
}
.sqf-num-input--wide {
  width: 96px;
}
.sqf-unit {
  font-size: 12px;
  color: #9ca3af;
}
.sqf-extra-label {
  font-size: 11px;
  color: #6b7280;
  margin: 4px 0 2px;
}
.sqf-add-wrap {
  margin: 8px 0 4px;
}
.sqf-add-btn {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1.5px dashed rgba(255, 255, 255, 0.12);
  background: transparent;
  color: #9ca3af;
  font-size: 13px;
  cursor: pointer;
}
.sqf-add-form {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
  align-items: center;
}
.sqf-inp {
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #151515;
  color: #fff;
  padding: 0 10px;
  font-size: 13px;
}
.sqf-inp--grow {
  flex: 1;
  min-width: 120px;
}
.sqf-inp--price {
  width: 88px;
}
.sqf-btn-save {
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: none;
  background: #88e523;
  color: #000;
  font-weight: 800;
  font-size: 12px;
}
.sqf-btn-cancel {
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: #9ca3af;
  font-size: 12px;
}
.sqf-x {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
}
.sqf-comment-btn {
  width: 100%;
  text-align: left;
  padding: 12px;
  border-radius: 10px;
  background: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  font-size: 14px;
  min-height: 48px;
}
.sqf-demo {
  text-align: center;
  padding: 48px 20px;
  color: #9ca3af;
}
.sqf-demo__t {
  font-size: 15px;
  margin: 0;
}
.sqf-demo__sub {
  font-size: 12px;
  margin: 10px 0 0;
  opacity: 0.65;
}
.dm-total-price {
  color: var(--dm-accent, #a0e040) !important;
  font-size: 19px !important;
  font-weight: 700 !important;
}
.sqf-client-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.sqf-mb-0 {
  margin-bottom: 0;
}
.sqf-client-head__actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.sqf-link-btn {
  min-height: 44px;
  padding: 0 8px;
  border: none;
  background: none;
  color: var(--dm-accent, #a0e040);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
}
.sqf-link-btn--muted {
  color: var(--dm-text-secondary, #888888);
}
.sqf-inp-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: var(--dm-text-secondary, #888888);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 8px 0 4px;
}
.sqf-inp--block {
  width: 100%;
  box-sizing: border-box;
  min-height: 44px;
}
.sqf-title-with-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sqf-info-ico {
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: none;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.85;
}
.sqf-info-tip {
  margin: 0 0 10px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--dm-text-secondary, #888888);
}
.sqf-section--mood {
  position: relative;
}
.sqf-mood-head {
  display: flex;
  justify-content: flex-end;
  margin: -4px 0 4px;
}
</style>
