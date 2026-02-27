<!-- Lightbox для полноэкранного просмотра фото вложений -->
<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="lightbox-overlay"
      @click.self="close"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <button type="button" class="lightbox-close" @click="close" aria-label="Закрыть">✕</button>
      <div class="lightbox-content">
        <img
          v-if="src"
          :src="src"
          class="lightbox-img"
          alt="Фото вмятины"
          draggable="false"
        >
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  src: { type: String, default: '' },
  visible: { type: Boolean, default: false }
});
const emit = defineEmits(['close']);

function close() {
  emit('close');
}

// Свайп вниз для закрытия
let touchStartY = 0;
function onTouchStart(e) {
  touchStartY = e.touches?.[0]?.clientY ?? 0;
}
function onTouchEnd(e) {
  const endY = e.changedTouches?.[0]?.clientY ?? 0;
  if (endY - touchStartY > 80) close();
}
</script>

<style scoped>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
           env(safe-area-inset-bottom) env(safe-area-inset-left);
}
.lightbox-close {
  position: absolute;
  top: max(16px, env(safe-area-inset-top, 0px));
  right: max(16px, env(safe-area-inset-right, 0px));
  background: rgba(255,255,255,0.15);
  border: none;
  color: #fff;
  font-size: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  -webkit-tap-highlight-color: transparent;
}
.lightbox-content {
  max-width: 100vw;
  max-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lightbox-img {
  max-width: 100vw;
  max-height: calc(100vh - 80px);
  object-fit: contain;
  border-radius: 4px;
  user-select: none;
  -webkit-user-drag: none;
}
</style>
