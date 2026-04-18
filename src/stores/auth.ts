import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  getSavedUser,
  clearSession,
  isTokenValid,
  logout as logoutService,
  bootstrapAuthFromLegacyAccount,
  type AuthUserProfile,
} from '@/services/authService';
import { useAccount } from '@/modules/account/useAccount';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUserProfile | null>(getSavedUser());
  const isLoading = ref(false);
  const isInitialized = ref(false);

  const isAuthenticated = computed(() => isTokenValid() && user.value !== null);

  const displayName = computed(() => {
    if (!user.value) return '';
    return (
      user.value.name ||
      user.value.phone ||
      user.value.email ||
      'Мастер'
    );
  });

  const planId = computed(() => user.value?.planId || 'free');

  function setUser(profile: AuthUserProfile) {
    user.value = profile;
  }

  function initialize() {
    let ok = isTokenValid();
    if (!ok) {
      clearSession();
      user.value = null;
      if (bootstrapAuthFromLegacyAccount()) {
        ok = isTokenValid();
      }
    }
    if (ok) {
      user.value = getSavedUser();
      if (!user.value) {
        clearSession();
        user.value = null;
      }
    } else {
      user.value = null;
    }
    isInitialized.value = true;
  }

  function logoutLocally() {
    user.value = null;
  }

  async function logout() {
    isLoading.value = true;
    try {
      await logoutService();
    } catch {
      /* silent — всё равно чистим локально */
    } finally {
      clearSession();
      user.value = null;
      try {
        useAccount().logout();
      } catch {
        /* ignore */
      }
      isLoading.value = false;
    }
  }

  return {
    user,
    isLoading,
    isInitialized,
    isAuthenticated,
    displayName,
    planId,
    setUser,
    initialize,
    logoutLocally,
    logout,
  };
});
