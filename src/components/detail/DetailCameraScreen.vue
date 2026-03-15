<template>
  <div class="camera-screen">
    <div class="camera-header">
      <button type="button" class="dm-back-btn" @click="$emit('back')">← Назад</button>
      <span class="camera-header__title">Сфотографируйте повреждение</span>
      <div style="width: 64px" />
    </div>
    <DetailProgressDots
      v-if="detailSteps?.length"
      :steps="detailSteps"
      :current-index="detailStepIndex"
    />
    <div class="camera-viewfinder">
      <video
        v-show="cameraAvailable"
        ref="videoEl"
        class="camera-video"
        autoplay
        playsinline
        muted
      />

      <div v-if="!cameraAvailable" class="camera-fallback">
        <div class="camera-fallback__icon">📷</div>
        <p class="camera-fallback__text">Камера недоступна</p>
        <p class="camera-fallback__sub">Выберите фото из галереи</p>
        <button
          type="button"
          class="camera-fallback__btn"
          @click="openGallery"
        >
          Выбрать из галереи
        </button>
      </div>

      <div class="camera-hint">
        <span class="camera-hint__icon">📐</span>
        Снимайте под прямым углом к повреждению
      </div>

      <div class="camera-controls">
        <button
          class="camera-btn-gallery"
          type="button"
          data-testid="btn-photo-from-gallery"
          @click="openGallery"
        >
          <span class="camera-btn-gallery__icon">🖼</span>
          <span class="camera-btn-gallery__label">Галерея</span>
        </button>

        <button
          class="camera-btn-capture"
          type="button"
          data-testid="btn-capture-photo"
          :disabled="!cameraAvailable"
          @click="capturePhoto"
        />

        <button
          v-if="hasMultipleCameras"
          class="camera-btn-flip"
          type="button"
          @click="flipCamera"
        >
          🔄
        </button>
        <div v-else class="camera-btn-spacer" />
      </div>
    </div>

    <input
      ref="galleryInput"
      type="file"
      accept="image/*"
      class="sr-only"
      aria-hidden="true"
      @change="handleFileSelected"
    />

    <canvas ref="captureCanvas" class="sr-only" />

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import DetailProgressDots from './DetailProgressDots.vue';

defineProps({
  detailSteps: { type: Array, default: () => [] },
  detailStepIndex: { type: Number, default: 0 },
});

const emit = defineEmits(['photo-captured', 'back']);

const videoEl = ref(null);
const galleryInput = ref(null);
const captureCanvas = ref(null);

const cameraAvailable = ref(false);
const hasMultipleCameras = ref(false);
const facingMode = ref('environment');

let stream = null;

onMounted(async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    hasMultipleCameras.value = devices.filter((d) => d.kind === 'videoinput').length > 1;
  } catch {
    hasMultipleCameras.value = false;
  }
  await startCamera();
});

onUnmounted(() => {
  stopCamera();
});

function stopCamera() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  cameraAvailable.value = false;
}

async function startCamera() {
  stopCamera();
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facingMode.value,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });
    if (videoEl.value) {
      videoEl.value.srcObject = stream;
      cameraAvailable.value = true;
    }
  } catch (e) {
    console.warn('[Camera] Not available:', e);
    cameraAvailable.value = false;
  }
}

async function flipCamera() {
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment';
  await startCamera();
}

function capturePhoto() {
  if (!videoEl.value || !captureCanvas.value || !cameraAvailable.value) return;
  const v = videoEl.value;
  const c = captureCanvas.value;
  const w = v.videoWidth || 1920;
  const h = v.videoHeight || 1080;
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (ctx) ctx.drawImage(v, 0, 0);
  const dataUrl = c.toDataURL('image/jpeg', 0.92);
  stopCamera();
  emit('photo-captured', dataUrl);
}

function openGallery() {
  const input = galleryInput.value;
  if (input) {
    input.value = '';
    input.click();
  }
}

async function handleFileSelected(e) {
  const file = e.target?.files?.[0];
  if (!file) return;
  const dataUrl = await readFileAsDataUrl(file);
  stopCamera();
  emit('photo-captured', dataUrl);
  e.target.value = '';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (ev) => resolve(ev.target.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
</script>

<style scoped>
.camera-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: var(--tab-bar-height, var(--app-footer-height, var(--bottom-nav-h, 64px)));
  background: var(--dm-bg, #0f0f0f);
  display: flex;
  flex-direction: column;
  z-index: 100;
}
.camera-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--dm-surface, #161616);
  border-bottom: 1px solid var(--dm-border, #2a2a2a);
}
.camera-header__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--dm-text-primary, #fff);
  flex: 1;
  text-align: center;
}
.dm-back-btn {
  min-height: 44px;
  padding: 0 12px;
  border-radius: 8px;
  background: transparent;
  color: var(--dm-text-secondary, #888);
  border: 1px solid var(--dm-border, #2a2a2a);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.camera-viewfinder {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}
.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.camera-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--dm-bg, #0f0f0f);
}
.camera-fallback__icon {
  font-size: 48px;
}
.camera-fallback__text {
  color: var(--dm-text-primary, #fff);
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.camera-fallback__sub {
  color: var(--dm-text-secondary, #888);
  font-size: 13px;
  margin: 0;
}
.camera-fallback__btn {
  padding: 12px 24px;
  min-height: 44px;
  border-radius: 12px;
  background: var(--dm-surface-2, #1e1e1e);
  color: var(--dm-text-primary, #fff);
  border: 1.5px solid var(--dm-border, #2a2a2a);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}
.camera-hint {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: var(--dm-text-primary, #fff);
  font-size: 13px;
  padding: 7px 16px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(6px);
  pointer-events: none;
  white-space: nowrap;
  max-width: 90vw;
}
.camera-hint__icon {
  font-size: 16px;
}
.camera-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  min-height: 110px;
  padding: 0 28px calc(16px + env(safe-area-inset-bottom, 0px));
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, transparent 100%);
  z-index: 2;
}
.camera-btn-gallery {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.15);
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  border-radius: 14px;
  padding: 10px 16px;
  color: var(--dm-text-primary, #fff);
  cursor: pointer;
  min-width: 80px;
  min-height: 64px;
  backdrop-filter: blur(4px);
}
.camera-btn-gallery__icon {
  font-size: 24px;
}
.camera-btn-gallery__label {
  font-size: 12px;
  font-weight: 600;
}
.camera-btn-capture {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fff;
  border: 5px solid rgba(255, 255, 255, 0.5);
  cursor: pointer;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.25);
  position: relative;
  transition: transform 0.1s;
}
.camera-btn-capture:active {
  transform: scale(0.94);
}
.camera-btn-capture::after {
  content: '';
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  background: #f0f0f0;
}
.camera-btn-capture:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.camera-btn-flip {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  font-size: 24px;
  cursor: pointer;
  color: var(--dm-text-primary, #fff);
}
.camera-btn-spacer {
  width: 80px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
