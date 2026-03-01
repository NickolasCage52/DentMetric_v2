<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="paywall-overlay fixed inset-0 z-[12000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
        @click.self="$emit('close')"
      >
        <div
          class="paywall-modal card-metallic w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 flex flex-col items-center gap-3"
          @click.stop
        >
          <button
            type="button"
            class="paywall-close absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white"
            @click="$emit('close')"
            aria-label="Закрыть"
          >
            ✕
          </button>

          <div class="paywall-icon text-4xl">🔒</div>
          <div class="paywall-title font-bold text-lg text-center">Функция недоступна</div>
          <div class="paywall-desc text-sm text-gray-400 text-center">
            Эта возможность доступна начиная с тарифа
            <span class="paywall-plan text-metric-green font-semibold">{{ minPlan }}</span>
          </div>

          <div class="paywall-actions w-full flex flex-col gap-3 mt-2">
            <button
              type="button"
              class="btn-primary w-full py-3 rounded-xl font-semibold bg-metric-green text-black"
              @click="$emit('go-plans')"
            >
              Посмотреть тарифы
            </button>
            <button
              type="button"
              class="btn-ghost w-full py-3 rounded-xl font-medium border border-white/20 text-gray-400"
              @click="$emit('close')"
            >
              Продолжить без этой функции
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  minPlan: { type: String, default: '' },
})
defineEmits(['close', 'go-plans'])
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.paywall-modal {
  position: relative;
}
</style>
