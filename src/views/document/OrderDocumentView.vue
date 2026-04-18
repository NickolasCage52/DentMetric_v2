<template>
  <div class="order-doc" data-order-doc>
    <div class="order-doc__header">
      <button type="button" class="order-doc__back" @click="$emit('back')">← Назад</button>
      <div class="order-doc__title">{{ doc.documentTitle }}</div>
      <div class="order-doc__header-actions">
        <button type="button" class="order-doc__action-btn" :aria-label="glyphs.share" @click="handleShare">
          {{ glyphs.share }}
        </button>
        <button type="button" class="order-doc__action-btn" :aria-label="glyphs.print" @click="handlePrint">
          {{ glyphs.print }}
        </button>
      </div>
    </div>

    <div v-if="mode === 'preview'" class="order-doc__scroll">
      <div class="order-doc__paper" ref="paperRef">
        <div class="order-doc__paper-header">
          <div class="order-doc__paper-service">
            <img
              v-if="doc.service.logoBase64"
              :src="doc.service.logoBase64"
              class="order-doc__paper-logo"
              alt=""
            />
            <div class="order-doc__paper-service-info">
              <div class="order-doc__paper-service-name">{{ doc.service.name }}</div>
              <div v-if="doc.service.address" class="order-doc__paper-service-detail">{{ doc.service.address }}</div>
              <div v-if="doc.service.phone" class="order-doc__paper-service-detail">{{ doc.service.phone }}</div>
              <div v-if="doc.service.inn" class="order-doc__paper-service-detail">ИНН: {{ doc.service.inn }}</div>
            </div>
          </div>
          <div class="order-doc__paper-doc-info">
            <div class="order-doc__paper-doc-title">{{ doc.documentTitle }}</div>
            <div class="order-doc__paper-doc-num">№ {{ doc.documentNumber }}</div>
            <div class="order-doc__paper-doc-date">от {{ doc.date }}</div>
          </div>
        </div>

        <div class="order-doc__paper-divider" />

        <div class="order-doc__paper-section">
          <div class="order-doc__paper-section-title">Клиент</div>
          <div class="order-doc__paper-row">
            <span class="order-doc__paper-label">Имя</span>
            <span class="order-doc__paper-value">{{ doc.client.name || '—' }}</span>
          </div>
          <div class="order-doc__paper-row">
            <span class="order-doc__paper-label">Телефон</span>
            <span class="order-doc__paper-value">{{ doc.client.phone || '—' }}</span>
          </div>
        </div>

        <div class="order-doc__paper-section">
          <div class="order-doc__paper-section-title">Автомобиль</div>
          <div class="order-doc__paper-row">
            <span class="order-doc__paper-label">Марка / Модель</span>
            <span class="order-doc__paper-value">{{
              [doc.vehicle.brand, doc.vehicle.model].filter(Boolean).join(' ') || '—'
            }}</span>
          </div>
          <div class="order-doc__paper-row">
            <span class="order-doc__paper-label">Гос. номер</span>
            <span class="order-doc__paper-value">{{ doc.vehicle.plate || '—' }}</span>
          </div>
          <div v-if="doc.vehicle.vin" class="order-doc__paper-row">
            <span class="order-doc__paper-label">VIN</span>
            <span class="order-doc__paper-value">{{ doc.vehicle.vin }}</span>
          </div>
        </div>

        <div class="order-doc__paper-divider" />

        <div class="order-doc__paper-section">
          <div class="order-doc__paper-section-title">Перечень работ</div>
          <table class="order-doc__table">
            <thead>
              <tr>
                <th class="order-doc__table-th order-doc__table-th--num">#</th>
                <th class="order-doc__table-th">Описание работы</th>
                <th class="order-doc__table-th order-doc__table-th--price">Стоимость</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="dent in doc.dents" :key="dent.number">
                <td class="order-doc__table-td order-doc__table-td--num">{{ dent.number }}</td>
                <td class="order-doc__table-td">
                  <div class="order-doc__work-name">{{ dent.element }}</div>
                  <div class="order-doc__work-desc">{{ dent.description }}</div>
                </td>
                <td class="order-doc__table-td order-doc__table-td--price">{{ formatRub(dent.price) }}</td>
              </tr>
              <tr v-for="work in doc.additionalWorks" :key="work.name + work.price">
                <td class="order-doc__table-td order-doc__table-td--num">+</td>
                <td class="order-doc__table-td">{{ work.name }}</td>
                <td class="order-doc__table-td order-doc__table-td--price">{{ formatRub(work.price) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="order-doc__paper-totals">
          <div v-if="doc.discount" class="order-doc__paper-total-row">
            <span>Скидка ({{ doc.discountPercent }}%)</span>
            <span>−{{ formatRub(doc.discount) }}</span>
          </div>
          <div class="order-doc__paper-total-row order-doc__paper-total-row--main">
            <span>ИТОГО</span>
            <span>{{ formatRub(doc.total) }}</span>
          </div>
          <div v-if="doc.prepayment" class="order-doc__paper-total-row">
            <span>Предоплата</span>
            <span>{{ formatRub(doc.prepayment) }}</span>
          </div>
          <div v-if="doc.balance !== undefined" class="order-doc__paper-total-row">
            <span>К доплате</span>
            <span>{{ formatRub(doc.balance) }}</span>
          </div>
        </div>

        <div v-if="doc.estimatedHours" class="order-doc__paper-time">
          Ориентировочное время выполнения: {{ formatTime(doc.estimatedHours) }}
        </div>

        <div v-if="doc.warrantyNote" class="order-doc__paper-warranty">{{ doc.warrantyNote }}</div>

        <div class="order-doc__paper-signatures">
          <div class="order-doc__paper-sig-block">
            <div class="order-doc__paper-sig-label">Исполнитель</div>
            <div class="order-doc__paper-sig-line" />
            <div class="order-doc__paper-sig-name">{{ doc.masterName || '_________________' }}</div>
          </div>
          <div class="order-doc__paper-sig-block">
            <div class="order-doc__paper-sig-label">Клиент</div>
            <div class="order-doc__paper-sig-area" @click="mode = 'signature'">
              <img
                v-if="doc.clientSignatureBase64"
                :src="doc.clientSignatureBase64"
                class="order-doc__paper-sig-img"
                alt=""
              />
              <div v-else class="order-doc__paper-sig-placeholder">Нажмите для подписи</div>
            </div>
            <div v-if="doc.signedAt" class="order-doc__paper-sig-date">{{ formatSignedAt(doc.signedAt) }}</div>
          </div>
        </div>

        <div v-if="doc.footerNote" class="order-doc__paper-footer">{{ doc.footerNote }}</div>
      </div>
    </div>

    <div v-else class="order-doc__signature-mode">
      <div class="order-doc__sig-header">
        <button type="button" class="order-doc__sig-cancel" @click="mode = 'preview'">Отмена</button>
        <div class="order-doc__sig-title">Подпись клиента</div>
        <button type="button" class="order-doc__sig-clear" @click="clearSignature">Очистить</button>
      </div>
      <div class="order-doc__sig-hint">Клиент расписывается на экране</div>
      <canvas
        ref="signatureCanvasRef"
        class="order-doc__sig-canvas"
        @touchstart.prevent="onSigStart"
        @touchmove.prevent="onSigMove"
        @touchend.prevent="onSigEnd"
        @mousedown="onSigStart"
        @mousemove="onSigMove"
        @mouseup="onSigEnd"
      />
      <div class="order-doc__sig-line-label">Подпись</div>
      <div class="order-doc__sig-footer">
        <button
          type="button"
          class="order-doc__sig-confirm"
          :disabled="!hasSignature"
          @click="confirmSignature"
        >
          Подтвердить подпись
        </button>
      </div>
    </div>

    <div v-if="mode === 'preview'" class="order-doc__action-bar">
      <button type="button" class="order-doc__btn order-doc__btn--secondary" @click="mode = 'signature'">
        {{ glyphs.pen }} Подпись
      </button>
      <button type="button" class="order-doc__btn order-doc__btn--secondary" @click="handlePdf">PDF</button>
      <button type="button" class="order-doc__btn order-doc__btn--primary" @click="handleShare">Отправить</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import type { OrderDocument } from '@/types/orderDocument';
import { generatePdf } from '@/utils/generatePdf';
import { useFeatureGate } from '@/modules/account/useFeatureGate';

const props = defineProps<{ doc: OrderDocument }>();
const emit = defineEmits<{
  back: [];
  signed: [signatureBase64: string];
}>();

const { requireFeature } = useFeatureGate();

const glyphs = {
  share: '\u2197',
  print: '\u{1F5B6}',
  pen: '\u270d\ufe0f',
};

const mode = ref<'preview' | 'signature'>('preview');
const paperRef = ref<HTMLElement | null>(null);
const signatureCanvasRef = ref<HTMLCanvasElement | null>(null);
const hasSignature = ref(false);
let isDrawing = false;
let lastX = 0;
let lastY = 0;

function formatRub(n: number): string {
  return `${Number(n).toLocaleString('ru-RU')}\u00a0\u20bd`;
}

function getPos(e: MouseEvent | TouchEvent): [number, number] {
  const canvas = signatureCanvasRef.value!;
  const rect = canvas.getBoundingClientRect();
  if ('touches' in e && e.touches[0]) {
    return [e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top];
  }
  const me = e as MouseEvent;
  return [me.clientX - rect.left, me.clientY - rect.top];
}

function initCanvas() {
  const canvas = signatureCanvasRef.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  canvas.width = Math.max(1, Math.floor(w * dpr));
  canvas.height = Math.max(1, Math.floor(h * dpr));
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.strokeStyle = 'hsl(0 0% 0%)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function onSigStart(e: MouseEvent | TouchEvent) {
  isDrawing = true;
  [lastX, lastY] = getPos(e);
}

function onSigMove(e: MouseEvent | TouchEvent) {
  if (!isDrawing) return;
  const canvas = signatureCanvasRef.value!;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const [x, y] = getPos(e);
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  [lastX, lastY] = [x, y];
  hasSignature.value = true;
}

function onSigEnd() {
  isDrawing = false;
}

function clearSignature() {
  initCanvas();
  hasSignature.value = false;
}

function confirmSignature() {
  const canvas = signatureCanvasRef.value;
  if (!canvas) return;
  const dataUrl = canvas.toDataURL('image/png');
  emit('signed', dataUrl);
  mode.value = 'preview';
}

function onWindowMouseUp() {
  isDrawing = false;
}

onMounted(() => {
  window.addEventListener('mouseup', onWindowMouseUp);
});
onUnmounted(() => {
  window.removeEventListener('mouseup', onWindowMouseUp);
});

watch(mode, async (val) => {
  if (val === 'signature') {
    await nextTick();
    initCanvas();
    hasSignature.value = false;
  }
});

function formatTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

function formatSignedAt(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildShareText(doc: OrderDocument): string {
  const lines: string[] = [
    doc.service.name ? `${doc.service.name}` : '',
    `${doc.documentTitle} № ${doc.documentNumber}`,
    `Дата: ${doc.date}`,
    '',
    doc.client.name ? `Клиент: ${doc.client.name}` : '',
    [doc.vehicle.brand, doc.vehicle.model].filter(Boolean).join(' ')
      ? `Авто: ${[doc.vehicle.brand, doc.vehicle.model].filter(Boolean).join(' ')}`
      : '',
    doc.vehicle.plate ? `Гос. номер: ${doc.vehicle.plate}` : '',
    '',
    'Работы:',
    ...doc.dents.map((d) => `  ${d.number}. ${d.element} — ${formatRub(d.price)}`),
    '',
    `ИТОГО: ${formatRub(doc.total)}`,
    doc.warrantyNote ? `\n${doc.warrantyNote}` : '',
  ];
  return lines.filter((l) => l !== undefined && l !== '').join('\n');
}

async function handleShare() {
  const text = buildShareText(props.doc);
  const phone = props.doc.client.phone?.replace(/\D/g, '');
  if (navigator.share) {
    try {
      await navigator.share({ title: props.doc.documentTitle, text });
      return;
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'name' in e && (e as { name: string }).name === 'AbortError') return;
    }
  }
  if (phone && phone.length >= 10) {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    alert('Текст скопирован в буфер обмена');
  } catch {
    window.prompt('Скопируйте текст:', text);
  }
}

async function handlePdf() {
  if (!requireFeature('exportPdf')) return;
  try {
    await generatePdf(props.doc);
  } catch (e) {
    console.error(e);
    alert('Не удалось сформировать PDF');
  }
}

function handlePrint() {
  window.print();
}
</script>

<style scoped>
.order-doc {
  position: fixed;
  inset: 0;
  background: var(--dm-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 220;
}
.order-doc__header {
  display: flex;
  align-items: center;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--dm-border);
  flex-shrink: 0;
  gap: 8px;
}
.order-doc__back {
  background: transparent;
  border: none;
  color: var(--dm-text-secondary);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 44px;
  padding: 0;
}
.order-doc__title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: var(--dm-text-primary);
}
.order-doc__header-actions {
  display: flex;
  gap: 4px;
}
.order-doc__action-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  color: var(--dm-text-secondary);
}
.order-doc__scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  padding-bottom: 88px;
  background: hsl(0 0% 91%);
}
.order-doc__paper {
  background: hsl(0 0% 100%);
  color: hsl(0 0% 10%);
  border-radius: 8px;
  padding: 24px 20px;
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0 2px 12px hsl(0 0% 0% / 0.15);
  font-size: 13px;
  line-height: 1.5;
}
.order-doc__paper-header {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 16px;
}
.order-doc__paper-service {
  display: flex;
  gap: 12px;
  flex: 1;
}
.order-doc__paper-logo {
  width: 60px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}
.order-doc__paper-service-name {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 2px;
}
.order-doc__paper-service-detail {
  font-size: 11px;
  color: hsl(0 0% 40%);
  line-height: 1.4;
}
.order-doc__paper-doc-info {
  text-align: right;
  flex-shrink: 0;
}
.order-doc__paper-doc-title {
  font-size: 16px;
  font-weight: 800;
  text-transform: uppercase;
}
.order-doc__paper-doc-num {
  font-size: 12px;
  color: hsl(0 0% 40%);
}
.order-doc__paper-doc-date {
  font-size: 12px;
  color: hsl(0 0% 40%);
}
.order-doc__paper-divider {
  height: 1px;
  background: hsl(0 0% 88%);
  margin: 12px 0;
}
.order-doc__paper-section {
  margin-bottom: 12px;
}
.order-doc__paper-section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: hsl(0 0% 53%);
  margin-bottom: 6px;
}
.order-doc__paper-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 3px 0;
  border-bottom: 1px solid hsl(0 0% 94%);
}
.order-doc__paper-label {
  color: hsl(0 0% 40%);
}
.order-doc__paper-value {
  font-weight: 500;
  text-align: right;
}
.order-doc__table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}
.order-doc__table-th {
  text-align: left;
  padding: 6px 8px;
  border-bottom: 2px solid hsl(0 0% 88%);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: hsl(0 0% 53%);
}
.order-doc__table-th--num {
  width: 32px;
}
.order-doc__table-th--price {
  text-align: right;
  white-space: nowrap;
}
.order-doc__table-td {
  padding: 8px;
  border-bottom: 1px solid hsl(0 0% 94%);
  vertical-align: top;
}
.order-doc__table-td--num {
  color: hsl(0 0% 53%);
  font-size: 12px;
  width: 32px;
}
.order-doc__table-td--price {
  text-align: right;
  font-weight: 600;
  white-space: nowrap;
}
.order-doc__work-name {
  font-weight: 500;
}
.order-doc__work-desc {
  font-size: 11px;
  color: hsl(0 0% 53%);
  margin-top: 2px;
}
.order-doc__paper-totals {
  border-top: 2px solid hsl(0 0% 10%);
  margin-top: 12px;
  padding-top: 10px;
}
.order-doc__paper-total-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
}
.order-doc__paper-total-row--main {
  font-size: 16px;
  font-weight: 800;
  margin: 6px 0;
}
.order-doc__paper-time {
  margin-top: 10px;
  font-size: 12px;
  color: hsl(0 0% 40%);
}
.order-doc__paper-warranty {
  margin-top: 6px;
  font-size: 11px;
  color: hsl(0 0% 53%);
  border: 1px solid hsl(0 0% 88%);
  border-radius: 6px;
  padding: 8px;
}
.order-doc__paper-signatures {
  display: flex;
  gap: 24px;
  margin-top: 28px;
}
.order-doc__paper-sig-block {
  flex: 1;
}
.order-doc__paper-sig-label {
  font-size: 11px;
  color: hsl(0 0% 53%);
  margin-bottom: 8px;
}
.order-doc__paper-sig-line {
  height: 1px;
  background: hsl(0 0% 10%);
  margin-bottom: 4px;
}
.order-doc__paper-sig-name {
  font-size: 11px;
  color: hsl(0 0% 53%);
}
.order-doc__paper-sig-area {
  height: 60px;
  border: 1px dashed hsl(0 0% 80%);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  margin-bottom: 4px;
}
.order-doc__paper-sig-placeholder {
  font-size: 11px;
  color: hsl(0 0% 67%);
}
.order-doc__paper-sig-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.order-doc__paper-sig-date {
  font-size: 10px;
  color: hsl(0 0% 67%);
}
.order-doc__paper-footer {
  margin-top: 16px;
  padding-top: 10px;
  border-top: 1px solid hsl(0 0% 88%);
  font-size: 11px;
  color: hsl(0 0% 53%);
  text-align: center;
}
.order-doc__signature-mode {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: hsl(0 0% 97%);
  overflow: hidden;
}
.order-doc__sig-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid hsl(0 0% 88%);
  background: hsl(0 0% 100%);
}
.order-doc__sig-cancel,
.order-doc__sig-clear {
  background: transparent;
  border: none;
  color: hsl(0 0% 40%);
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
  min-width: 60px;
}
.order-doc__sig-clear {
  color: var(--dm-danger);
}
.order-doc__sig-title {
  font-size: 16px;
  font-weight: 700;
  color: hsl(0 0% 10%);
}
.order-doc__sig-hint {
  text-align: center;
  padding: 10px;
  font-size: 13px;
  color: hsl(0 0% 53%);
  background: hsl(0 0% 100%);
}
.order-doc__sig-canvas {
  flex: 1;
  touch-action: none;
  cursor: crosshair;
  background: hsl(0 0% 100%);
  border-top: 1px solid hsl(0 0% 88%);
  border-bottom: 1px solid hsl(0 0% 88%);
  min-height: 200px;
}
.order-doc__sig-line-label {
  text-align: center;
  font-size: 11px;
  color: hsl(0 0% 67%);
  padding: 4px;
  background: hsl(0 0% 100%);
  border-bottom: 1px solid hsl(0 0% 88%);
}
.order-doc__sig-footer {
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  background: hsl(0 0% 100%);
}
.order-doc__sig-confirm {
  width: 100%;
  height: 52px;
  background: var(--dm-accent);
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  color: hsl(0 0% 0%);
  cursor: pointer;
}
.order-doc__sig-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.order-doc__action-bar {
  display: flex;
  gap: 8px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  background: var(--dm-surface);
  border-top: 1px solid var(--dm-border);
  flex-shrink: 0;
}
.order-doc__btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.order-doc__btn--secondary {
  background: var(--dm-surface-2);
  border: 1px solid var(--dm-border);
  color: var(--dm-text-primary);
}
.order-doc__btn--primary {
  background: var(--dm-accent);
  border: none;
  color: hsl(0 0% 0%);
  flex: 2;
}
</style>
