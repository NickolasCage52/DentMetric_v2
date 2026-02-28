<template>
  <div class="step1-panel flex flex-col min-h-0">
    <div class="graphics-panel-content p-2 space-y-2">
      <div class="flex items-center justify-between gap-2">
        <div class="text-[11px] text-gray-300 text-left">
          Выберите тип вмятины и разместите её на элементе
        </div>
      </div>
      <!-- Выбор типа вмятины -->
      <div class="dent-type-grid">
        <button
          data-testid="add-type-circle"
          @click="$emit('add-type', 'circle')"
          class="dent-type-btn card-metallic"
        >
          <span class="dent-type-btn__icon">
            <div class="dent-type-icon dent-type-icon--circle"></div>
          </span>
          <span class="dent-type-btn__title">Вмятина</span>
          <span class="dent-type-btn__subtitle">Круг/Овал</span>
        </button>
        <button
          @click="$emit('add-type', 'strip')"
          class="dent-type-btn card-metallic"
        >
          <span class="dent-type-btn__icon">
            <div class="dent-type-icon dent-type-icon--strip"></div>
          </span>
          <span class="dent-type-btn__title">Полоса</span>
          <span class="dent-type-btn__subtitle">Царапина</span>
        </button>
        <button
          data-testid="add-freeform"
          @click="$emit('add-freeform')"
          class="dent-type-btn card-metallic"
        >
          <span class="dent-type-btn__icon">
            <div class="dent-type-icon dent-type-icon--freeform"></div>
          </span>
          <span class="dent-type-btn__title">Произвольная</span>
          <span class="dent-type-btn__subtitle">Форма</span>
        </button>
      </div>
      <p v-if="!canNext" class="text-[10px] text-gray-500 text-center">Добавьте хотя бы одну вмятину</p>
    </div>
    <div class="graphics-action-bar wizard-step-controls space-y-2">
      <div class="flex items-center gap-2 w-full">
        <button
          type="button"
          @click="$emit('back')"
          class="step-nav-back-btn shrink-0 py-2.5 px-3 rounded-xl text-xs font-medium text-gray-400 hover:text-white border border-white/15 hover:border-white/25 transition-all touch-manipulation min-h-[44px]"
        >
          Назад
        </button>
        <button
          type="button"
          @click="$emit('next')"
          :disabled="!canNext"
          :title="canNext ? '' : 'Добавьте хотя бы одну вмятину'"
          class="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 min-h-[40px]"
          :class="canNext ? 'bg-metric-green text-black shadow-[0_0_15px_rgba(136,229,35,0.4)] hover:opacity-95 active:opacity-90' : 'bg-white/10 text-gray-500 cursor-not-allowed'"
        >
          <span>Продолжить → Размер повреждения</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  canNext: { type: Boolean, default: false }
});

defineEmits(['add-type', 'add-freeform', 'next', 'back']);
</script>

<style scoped>
.dent-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  width: 100%;
  overflow: hidden;
}

.dent-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 72px;
  width: 100%;
  padding: 8px 6px;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: border-color 0.2s, transform 0.1s;
}

.dent-type-btn:active {
  transform: scale(0.95);
}

.dent-type-btn:hover {
  border-color: rgba(136, 229, 35, 0.3);
}

.dent-type-btn__icon {
  flex-shrink: 0;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.dent-type-icon {
  flex-shrink: 0;
}

.dent-type-icon--circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #88e523;
  background: rgba(136, 229, 35, 0.2);
}

.dent-type-icon--strip {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid #88e523;
  background: rgba(136, 229, 35, 0.2);
  transform: rotate(45deg);
}

.dent-type-icon--freeform {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid #88e523;
  background: rgba(136, 229, 35, 0.2);
}

.dent-type-btn__title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.25;
  text-align: center;
  color: #ffffff;
  width: 100%;
  word-break: break-word;
  hyphens: auto;
}

.dent-type-btn__subtitle {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 9px;
  line-height: 1.2;
  text-align: center;
  color: #6b7280;
  margin-top: 1px;
  width: 100%;
}

@media (max-width: 340px) {
  .dent-type-grid {
    gap: 5px;
  }
  .dent-type-btn {
    padding: 6px 4px;
    min-height: 66px;
  }
  .dent-type-btn__title {
    font-size: 9px;
  }
  .dent-type-btn__subtitle {
    font-size: 8px;
  }
}
</style>
