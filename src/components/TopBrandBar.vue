<template>
  <header class="top-brand-bar">
    <div class="top-brand-bar__logo-wrap">
      <img
        src="/logo.png"
        alt="DentMetric"
        class="top-brand-bar__logo"
        onerror="this.style.display='none'"
      >
      <div class="top-brand-bar__subtitle">
        <slot name="subtitle" />
      </div>
    </div>
    <button
      v-if="showProfileButton"
      type="button"
      class="top-brand-bar__profile-btn"
      :aria-label="profileAriaLabel"
      @click="onProfileClick"
    >
      👤
    </button>
    <div
      v-else
      class="top-brand-bar__profile-spacer"
      aria-hidden="true"
    />
  </header>
</template>

<script setup>
defineOptions({ name: 'TopBrandBar' });

const props = defineProps({
  showProfileButton: { type: Boolean, default: true },
  profileAriaLabel: { type: String, default: 'Профиль' }
});

const emit = defineEmits(['profile-click']);

function onProfileClick() {
  emit('profile-click');
}
</script>

<style scoped>
.top-brand-bar {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: max(var(--topbar-padding-top), var(--safe-top)) var(--screen-padding-x) var(--topbar-padding-bottom);
  padding-left: max(var(--screen-padding-x), env(safe-area-inset-left, 0px));
  padding-right: max(var(--screen-padding-x), env(safe-area-inset-right, 0px));
}

.top-brand-bar__logo-wrap {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 2 * var(--profile-btn-size) - 2 * var(--screen-padding-x));
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  pointer-events: none;
}

.top-brand-bar__logo-wrap > * {
  pointer-events: auto;
}

.top-brand-bar__subtitle {
  margin-top: 0.75rem;
  width: 100%;
  text-align: center;
}

.top-brand-bar__subtitle :deep(*) {
  margin: 0;
  width: 100%;
  text-align: inherit;
}

.top-brand-bar__logo {
  display: block;
  width: auto;
  max-width: var(--logo-max-w);
  max-height: var(--logo-h);
  height: auto;
  object-fit: contain;
  border: none;
  box-shadow: none;
  filter: none;
}

.top-brand-bar__profile-btn,
.top-brand-bar__profile-spacer {
  width: var(--profile-btn-size);
  min-width: 44px;
  min-height: 44px;
  height: var(--profile-btn-size);
  flex-shrink: 0;
}

.top-brand-bar__profile-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 1.125rem;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.top-brand-bar__profile-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(136, 229, 35, 0.3);
}

.top-brand-bar__profile-btn:active {
  transform: scale(0.96);
}
</style>
