<template>
  <div class="step1-panel quick-style-placement flex flex-col min-h-0 flex-1 overflow-hidden">
    <div class="flex-1 min-h-0 overflow-hidden step1-scroll">
      <div class="card-metallic rounded-2xl step1-card">
        <div class="qc-section-title text-[9px] font-bold text-gray-400 uppercase tracking-widest step1-title">РАЗМЕЩЕНИЕ ПОВРЕЖДЕНИЯ</div>
        <p class="text-[10px] text-gray-400 leading-tight step1-subtitle">
          Выберите тип вмятины и разместите её на элементе
        </p>
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
        <p v-if="!canNext" class="text-[10px] text-gray-500 text-center step1-hint">Добавьте хотя бы одну вмятину</p>
      </div>
    </div>
    <div class="graphics-action-bar shrink-0 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-white/10">
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
          class="flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
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
.step1-scroll {
  padding: 0.375rem 0 0.5rem;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}
.step1-card {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.step1-title {
  margin-bottom: 2px;
}
.step1-subtitle {
  margin-bottom: 0;
}
.step1-hint {
  margin-top: 2px;
  margin-bottom: 0;
}

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
  min-height: 64px;
  width: 100%;
  padding: 6px 6px;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 0.625rem;
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
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.dent-type-icon {
  flex-shrink: 0;
}

.dent-type-icon--circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #88e523;
  background: rgba(136, 229, 35, 0.2);
}

.dent-type-icon--strip {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 2px solid #88e523;
  background: rgba(136, 229, 35, 0.2);
  transform: rotate(45deg);
}

.dent-type-icon--freeform {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 2px solid #88e523;
  background: rgba(136, 229, 35, 0.2);
}

.dent-type-btn__title {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  font-weight: 600;
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
  font-size: 10px;
  line-height: 1.15;
  text-align: center;
  color: #6b7280;
  margin-top: 0;
  width: 100%;
}

@media (max-width: 480px) {
  .step1-card {
    padding: 10px 12px;
    gap: 8px;
  }
  .dent-type-grid {
    gap: 5px;
  }
  .dent-type-btn {
    min-height: 56px;
    padding: 5px 4px;
  }
  .dent-type-btn__icon {
    width: 18px;
    height: 18px;
    margin-bottom: 1px;
  }
  .dent-type-icon--circle,
  .dent-type-icon--strip,
  .dent-type-icon--freeform {
    width: 14px;
    height: 14px;
  }
  .dent-type-btn__title {
    font-size: 10px;
  }
  .dent-type-btn__subtitle {
    font-size: 9px;
  }
}

@media (max-width: 340px) {
  .dent-type-grid {
    gap: 4px;
  }
  .dent-type-btn {
    padding: 4px 3px;
    min-height: 52px;
  }
  .dent-type-btn__title {
    font-size: 9px;
  }
}
</style>
