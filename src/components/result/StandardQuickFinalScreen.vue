<template>
  <div class="sqf">
    <ResultFourTabs v-model="activeTab">
      <div class="sqf-scroll">
        <!-- Расчёт -->
        <div v-show="activeTab === 'calculation'" class="sqf-panel space-y-2">
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
                    {{ displayRepairHours }} ч <span class="sqf-pen">✎</span>
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
              <span class="sqf-row__val sqf-row__val--grand">{{ fmt(worksheetGrandTotal) }} ₽</span>
            </div>
          </div>

          <template v-for="(row, idx) in uiRows" :key="row.dent?.id ?? idx">
            <div class="sqf-dent-head">
              <span class="sqf-dent-title">Вмятина ‑{{ idx + 1 }}</span>
              <span class="sqf-dent-el">{{ row.dent?.panelElement || '—' }}</span>
            </div>
            <div class="card-metallic rounded-xl sqf-section sqf-dent-card">
              <div class="sqf-row">
                <span class="sqf-row__label">Форма:</span>
                <span class="sqf-row__val">{{ dentLabel(row.dent) }}</span>
              </div>
              <div class="sqf-row">
                <span class="sqf-row__label">Ориентировочное время:</span>
                <div class="sqf-row__val sqf-row__val--edit">
                  <template v-if="editingDentTime !== row.dent?.id">
                    <button type="button" class="sqf-edit-hit" @click="startDentTimeEdit(row.dent)">
                      {{ dentRepairHours(row) }} ч <span class="sqf-pen">✎</span>
                    </button>
                  </template>
                  <div v-else class="sqf-inline">
                    <input
                      v-model.number="dentTimeEditVal"
                      type="number"
                      step="0.05"
                      min="0"
                      class="sqf-num-input"
                      @blur="saveDentTime(row.dent)"
                      @keyup.enter="saveDentTime(row.dent)"
                    >
                    <span class="sqf-unit">ч</span>
                  </div>
                </div>
              </div>
              <div class="sqf-row">
                <span class="sqf-row__label">Диаметр:</span>
                <span class="sqf-row__val">{{ dim(row.dent?.sizeLengthMm) }}</span>
              </div>
              <div class="sqf-row">
                <span class="sqf-row__label">Ширина:</span>
                <span class="sqf-row__val">{{ dim(row.dent?.sizeWidthMm) }}</span>
              </div>
              <div class="sqf-row">
                <span class="sqf-row__label">Базовая стоимость:</span>
                <span class="sqf-row__val sqf-row__val--price">{{ fmt(row.base) }} ₽</span>
              </div>
              <div
                v-for="(br, ri) in buildDetailedBreakdown(row)"
                :key="ri"
                class="sqf-row"
              >
                <span class="sqf-row__label">{{ br.label }}</span>
                <span class="sqf-row__val sqf-row__val--wrap">{{ br.value }}</span>
              </div>
              <div class="sqf-row sqf-row--discount">
                <span class="sqf-row__label">Скидка:</span>
                <div class="sqf-row__val">
                  <button type="button" class="sqf-disc-btn" @click="$emit('open-discount', row.dent)">
                    {{ row.discountPercent ? row.discountPercent : '—' }}
                  </button>
                  <span class="sqf-pct">%</span>
                </div>
              </div>

              <div class="sqf-price-block">
                <div class="sqf-row sqf-row--strong">
                  <span class="sqf-row__label">Итого по вмятине по системе DentMetric:</span>
                  <div class="sqf-row__val sqf-row__val--edit">
                    <template v-if="row.hasManual">
                      <span class="sqf-strike">{{ fmt(row.dmTotal) }} ₽</span>
                    </template>
                    <template v-if="editingPrice !== row.dent?.id">
                      <button type="button" class="sqf-edit-hit" @click="startPriceEdit(row)">
                        {{ fmt(row.displayTotal) }} ₽ <span class="sqf-pen">✎</span>
                      </button>
                    </template>
                    <div v-else class="sqf-inline">
                      <input
                        v-model.number="priceEditVal"
                        type="number"
                        min="0"
                        class="sqf-num-input sqf-num-input--wide"
                        @blur="savePriceEdit(row)"
                        @keyup.enter="savePriceEdit(row)"
                      >
                      <span>₽</span>
                    </div>
                  </div>
                </div>
                <div v-if="row.hasManual" class="sqf-row">
                  <span class="sqf-row__label">Индивидуальная корректировка стоимости:</span>
                  <span class="sqf-row__val sqf-row__val--adj">
                    {{ row.displayTotal > row.dmTotal ? '+' : '' }}{{ fmt(row.displayTotal - row.dmTotal) }} ₽
                  </span>
                </div>
                <div class="sqf-row">
                  <span class="sqf-row__label">Итоговая среднерыночная стоимость:</span>
                  <span class="sqf-row__val sqf-row__val--muted">{{ fmt(row.marketDisplay) }} ₽</span>
                </div>
              </div>
            </div>
          </template>

          <PrepaymentBlock v-model="prepaymentProxy" />
        </div>

        <!-- Клиент -->
        <div v-show="activeTab === 'client'" class="sqf-panel space-y-2">
          <div class="card-metallic rounded-xl sqf-section">
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
          </div>
          <div class="card-metallic rounded-xl sqf-section">
            <div class="sqf-block-title sqf-block-title--muted">Адекватность клиента</div>
            <ClientMoodPicker v-model="moodProxy" />
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
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { applyPriceRoundingCeil } from '../../utils/priceRounding';
import { resolveDentShapeType } from '../../utils/resolveDentShapeType';
import ResultFourTabs from './ResultFourTabs.vue';
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
  engineDentsTotal: { type: Number, default: 0 }
});

const emit = defineEmits(['open-discount', 'open-comment']);

const activeTab = ref('calculation');

const roundStep = computed(() => props.userSettings.priceRoundStep ?? 0);

function fmt(n) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(Number(n) || 0));
}

function dim(mm) {
  const v = Number(mm) || 0;
  if (props.userSettings.sizeUnit === 'cm') return `${(v / 10).toFixed(1)} см`;
  return `${v.toFixed(0)} мм`;
}

function dentLabel(dent) {
  const l = Number(dent?.sizeLengthMm) || 0;
  const w = Number(dent?.sizeWidthMm) || 0;
  if (l > 0 && w > 0) {
    return resolveDentShapeType(l, w) === 'stripe' ? 'Полоса' : 'Круг/овал';
  }
  return dent?.shape === 'circle' ? 'Круг/овал' : 'Полоса';
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

const editingPrice = ref(null);
const priceEditVal = ref(0);

function startPriceEdit(row) {
  editingPrice.value = row.dent?.id;
  priceEditVal.value = row.displayTotal;
  nextTick(() => {
    /* focus optional */
  });
}

function savePriceEdit(row) {
  const dent = row.dent;
  if (!dent) {
    editingPrice.value = null;
    return;
  }
  const n = Number(priceEditVal.value);
  if (!Number.isFinite(n) || n < 0) {
    editingPrice.value = null;
    return;
  }
  const rounded = roundStep.value > 0 ? applyPriceRoundingCeil(n, roundStep.value) : Math.round(n);
  if (rounded === row.dmTotal) {
    dent.manualLineTotal = null;
  } else {
    dent.manualLineTotal = rounded;
  }
  editingPrice.value = null;
}

/** Per-dent repair time override (hours), stored on dent */
const editingDentTime = ref(null);
const dentTimeEditVal = ref(0);

function dentRepairHours(dent) {
  const o = dent?.manualRepairTimeHours;
  if (o != null && o !== '' && Number.isFinite(Number(o))) return Number(o);
  const line = props.engineLineItems.find((i) => i.dent?.id === dent?.id);
  const price = line?.appliedTotal ?? 0;
  const rate = props.userSettings.hourlyRate > 0 ? props.userSettings.hourlyRate : 4000;
  if (price <= 0 || rate <= 0) return 0;
  return Math.round((price / rate) * 100) / 100;
}

function startDentTimeEdit(dent) {
  editingDentTime.value = dent?.id;
  dentTimeEditVal.value = dentRepairHours(dent);
}

function saveDentTime(dent) {
  if (!dent) {
    editingDentTime.value = null;
    return;
  }
  const n = Number(dentTimeEditVal.value);
  const defH = (() => {
    const line = props.engineLineItems.find((i) => i.dent?.id === dent?.id);
    const price = line?.appliedTotal ?? 0;
    const rate = props.userSettings.hourlyRate > 0 ? props.userSettings.hourlyRate : 4000;
    if (price <= 0 || rate <= 0) return 0;
    return Math.round((price / rate) * 100) / 100;
  })();
  if (!Number.isFinite(n) || n < 0) {
    editingDentTime.value = null;
    return;
  }
  if (Math.abs(n - defH) < 0.001) dent.manualRepairTimeHours = null;
  else dent.manualRepairTimeHours = n;
  editingDentTime.value = null;
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
</script>

<style scoped>
.sqf {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}
.sqf-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 8px;
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
.sqf-row--strong .sqf-row__label {
  font-weight: 600;
  color: #fff;
}
.sqf-row--discount {
  align-items: center;
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
.sqf-strike {
  text-decoration: line-through;
  color: #6b7280;
  font-size: 12px;
  margin-right: 6px;
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
.sqf-disc-btn {
  min-width: 36px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #151515;
  color: #fff;
  font-weight: 600;
}
.sqf-pct {
  margin-left: 4px;
  color: #6b7280;
  font-size: 12px;
}
.sqf-price-block {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.sqf-dent-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 4px 0;
}
.sqf-dent-title {
  font-size: 15px;
  font-weight: 800;
  color: #fff;
}
.sqf-dent-el {
  font-size: 14px;
  font-weight: 600;
  color: #d1d5db;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sqf-dent-card {
  margin-bottom: 4px;
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
</style>
