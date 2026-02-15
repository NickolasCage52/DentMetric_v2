<template>
  <div class="wow-screen-shell">
    <AppWowBackground v-if="showBackground" />
    <TopBrandBar
      :show-profile-button="showProfileButton"
      :profile-aria-label="profileAriaLabel"
      @profile-click="$emit('profile-click')"
    >
      <template v-if="$slots.subtitle" #subtitle>
        <slot name="subtitle" />
      </template>
    </TopBrandBar>
    <main class="wow-screen-shell__content" :class="{ 'wow-screen-shell__content--with-subtitle': hasSubtitle }">
      <slot />
    </main>
  </div>
</template>

<script setup>
import AppWowBackground from './AppWowBackground.vue';
import TopBrandBar from './TopBrandBar.vue';

defineOptions({ name: 'WowScreenShell' });

defineProps({
  showBackground: { type: Boolean, default: true },
  showProfileButton: { type: Boolean, default: true },
  profileAriaLabel: { type: String, default: 'Профиль' },
  hasSubtitle: { type: Boolean, default: false }
});

defineEmits(['profile-click']);
</script>

<style scoped>
.wow-screen-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

.wow-screen-shell__content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--screen-gap-y) var(--screen-padding-x);
  padding-bottom: var(--bottom-nav-h);
  box-sizing: border-box;
}

.wow-screen-shell__content--with-subtitle {
  margin-top: calc(-1 * var(--topbar-subtitle-height) + 0.5rem);
}
</style>
