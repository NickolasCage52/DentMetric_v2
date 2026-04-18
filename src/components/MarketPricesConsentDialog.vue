<template>
  <Teleport to="body">
    <Transition name="dm-fade">
      <div
        v-if="visible"
        class="consent-overlay"
        @click.self="$emit('dismiss')"
      >
        <div class="consent-dialog" role="dialog" aria-modal="true" aria-labelledby="mp-consent-title">
          <div class="consent-dialog__icon" aria-hidden="true">{{ '\u{1F4CA}' }}</div>
          <div id="mp-consent-title" class="consent-dialog__title">
            Помогите улучшить рыночные цены
          </div>
          <div class="consent-dialog__body">
            DentMetric может анонимно собирать данные о ценах,
            чтобы показывать вам рыночные ориентиры.

            <div class="consent-dialog__guarantees">
              <div class="consent-dialog__guarantee">{{ check }} Никаких личных данных — только элемент + цена + город</div>
              <div class="consent-dialog__guarantee">{{ check }} Данные клиентов не передаются никогда</div>
              <div class="consent-dialog__guarantee">{{ check }} Можно отключить в настройках в любое время</div>
              <div class="consent-dialog__guarantee">{{ check }} Цены округляются до 100 {{ rub }}</div>
            </div>
          </div>

          <div class="consent-dialog__preview">
            <div class="consent-dialog__preview-label">
              Вы будете видеть:
            </div>
            <div class="consent-dialog__preview-example">
              <span>Левая дверь передняя</span>
              <span class="consent-dialog__preview-range">
                Рынок СПб: 6 000 – 12 000 {{ rub }}
              </span>
            </div>
          </div>

          <div class="consent-dialog__actions">
            <button
              type="button"
              class="consent-dialog__accept"
              @click="$emit('accept')"
            >
              Участвовать и видеть цены
            </button>
            <button
              type="button"
              class="consent-dialog__decline"
              @click="$emit('decline')"
            >
              Не сейчас
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const check = '\u2713'
const rub = '\u20BD'

defineProps<{ visible: boolean }>()
defineEmits<{
  accept: []
  decline: []
  dismiss: []
}>()
</script>

<style scoped>
.consent-overlay {
  position: fixed;
  inset: 0;
  background: hsl(0 0% 0% / 0.7);
  z-index: 500;
  display: flex;
  align-items: flex-end;
}
.consent-dialog {
  width: 100%;
  background: var(--dm-surface, hsl(0 0% 9%));
  border-radius: 20px 20px 0 0;
  padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.consent-dialog__icon {
  font-size: 36px;
  text-align: center;
}
.consent-dialog__title {
  font-size: 18px;
  font-weight: 800;
  color: var(--dm-text-primary, hsl(0 0% 100%));
  text-align: center;
  line-height: 1.3;
}
.consent-dialog__body {
  font-size: 14px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  line-height: 1.6;
}
.consent-dialog__guarantees {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.consent-dialog__guarantee {
  font-size: 13px;
  color: var(--dm-text-primary, hsl(0 0% 100%));
}
.consent-dialog__preview {
  background: var(--dm-surface-2, hsl(0 0% 12%));
  border-radius: 12px;
  padding: 12px;
}
.consent-dialog__preview-label {
  font-size: 11px;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.consent-dialog__preview-example {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--dm-text-primary, hsl(0 0% 100%));
}
.consent-dialog__preview-range {
  font-size: 12px;
  color: var(--dm-accent, hsl(78 70% 45%));
  font-weight: 600;
}
.consent-dialog__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.consent-dialog__accept {
  min-height: 52px;
  background: var(--dm-accent, hsl(78 70% 45%));
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  color: hsl(0 0% 0%);
  cursor: pointer;
}
.consent-dialog__decline {
  min-height: 44px;
  background: transparent;
  border: none;
  color: var(--dm-text-secondary, hsl(0 0% 53%));
  font-size: 14px;
  cursor: pointer;
}
.dm-fade-enter-active,
.dm-fade-leave-active {
  transition: opacity 0.25s ease;
}
.dm-fade-enter-from,
.dm-fade-leave-to {
  opacity: 0;
}
</style>
