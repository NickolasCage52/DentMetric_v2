<template>
  <Transition name="pwa-slide">
    <div v-if="showPrompt" class="pwa-prompt">
      <div class="pwa-prompt__content">
        <div class="pwa-prompt__icon">{{ installGlyph }}</div>
        <div class="pwa-prompt__text">
          <div class="pwa-prompt__title">Установить приложение</div>
          <div class="pwa-prompt__sub">
            Иконка на рабочем столе · Работает без интернета
          </div>
        </div>
      </div>
      <div class="pwa-prompt__actions">
        <button type="button" class="pwa-prompt__later" @click="dismiss">Позже</button>
        <button type="button" class="pwa-prompt__install" @click="install">Установить</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const installGlyph = '\u{1F4F2}';

const DISMISSED_KEY = 'dm_pwa_dismissed';
const SESSION_COUNT_KEY = 'dm_pwa_session_count';
const SESSION_LAST_KEY = 'dm_pwa_session_last';

const showPrompt = ref(false);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let deferredPrompt: any = null;

onMounted(() => {
  if (localStorage.getItem(DISMISSED_KEY) === 'true') return;
  if (window.matchMedia('(display-mode: standalone)').matches) return;

  const lastSession = parseInt(localStorage.getItem(SESSION_LAST_KEY) || '0', 10);
  let sessionCount = parseInt(localStorage.getItem(SESSION_COUNT_KEY) || '0', 10);
  const now = Date.now();

  if (now - lastSession > 30 * 60 * 1000) {
    sessionCount++;
    localStorage.setItem(SESSION_COUNT_KEY, String(sessionCount));
    localStorage.setItem(SESSION_LAST_KEY, String(now));
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e;
    if (sessionCount >= 3) {
      showPrompt.value = true;
    }
  });
});

function dismiss() {
  showPrompt.value = false;
  localStorage.setItem(DISMISSED_KEY, 'true');
}

async function install() {
  showPrompt.value = false;
  if (!deferredPrompt) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (deferredPrompt as any).prompt();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (deferredPrompt as any).userChoice;
  deferredPrompt = null;
}
</script>

<style scoped>
.pwa-prompt {
  position: fixed;
  bottom: calc(var(--tab-bar-height, 56px) + 12px);
  left: 12px;
  right: 12px;
  background: var(--dm-surface, #161616);
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 16px;
  padding: 16px;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.pwa-prompt__content {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.pwa-prompt__icon {
  font-size: 28px;
  flex-shrink: 0;
}
.pwa-prompt__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--dm-text-primary, #fff);
}
.pwa-prompt__sub {
  font-size: 12px;
  color: var(--dm-text-secondary, #888);
  margin-top: 2px;
}
.pwa-prompt__actions {
  display: flex;
  gap: 8px;
}
.pwa-prompt__later {
  flex: 1;
  height: 44px;
  background: transparent;
  border: 1px solid var(--dm-border, #2a2a2a);
  border-radius: 10px;
  color: var(--dm-text-secondary, #888);
  font-size: 14px;
  cursor: pointer;
}
.pwa-prompt__install {
  flex: 2;
  height: 44px;
  background: var(--dm-accent, #a0e040);
  border: none;
  border-radius: 10px;
  color: #000;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.pwa-slide-enter-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.pwa-slide-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}
.pwa-slide-enter-from,
.pwa-slide-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
