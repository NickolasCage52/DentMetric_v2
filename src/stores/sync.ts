import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { isSupabaseConfigured } from '@/services/supabase';
import {
  performFullSync,
  isOnline,
  onOnline,
  onOffline,
  type SyncStatus,
  type SyncResult,
} from '@/services/syncEngine';
import { useAuthStore } from '@/stores/auth';
import { useHistoryPiniaStore } from '@/stores/history';
import { useBookingsStore } from '@/stores/bookings';
import { useEmployeesStore } from '@/stores/employees';
import type { Booking } from '@/types/booking';
import type { Employee } from '@/types/employee';

const LAST_SYNC_KEY = 'dm_last_sync_at';

export const useSyncStore = defineStore('sync', () => {
  const status = ref<SyncStatus>(isSupabaseConfigured() ? 'idle' : 'disabled');
  const lastSyncAt = ref<string | null>(localStorage.getItem(LAST_SYNC_KEY));
  const pendingCount = ref(0);
  const lastError = ref<string | null>(null);
  const isSyncing = ref(false);
  const lastResults = ref<SyncResult[]>([]);

  const isConfigured = computed(() => isSupabaseConfigured());
  const canSync = computed(() => isConfigured.value && isOnline() && !isSyncing.value);

  function updatePendingCount(): void {
    const bookingsStore = useBookingsStore();
    const employeesStore = useEmployeesStore();
    const historyStore = useHistoryPiniaStore();

    const historyPending = (historyStore.records || []).filter((r) => {
      const syncedAt = r?.syncedAt != null ? String(r.syncedAt) : '';
      const cu = String(r?.clientUpdatedAt || r?.updatedAt || r?.createdAt || '');
      return !syncedAt || (cu && syncedAt && cu > syncedAt);
    }).length;

    const bookingsPending = (bookingsStore.bookings || []).filter((b) => {
      const syncedAt = b.syncedAt != null ? String(b.syncedAt) : '';
      const u = String(b.updatedAt || b.createdAt || '');
      return !syncedAt || (u && syncedAt && u > syncedAt);
    }).length;

    const employeesPending = (employeesStore.employees || []).filter((e) => {
      const syncedAt = e.syncedAt != null ? String(e.syncedAt) : '';
      const u = String(e.updatedAt || e.createdAt || '');
      return !syncedAt || (u && syncedAt && u > syncedAt);
    }).length;

    pendingCount.value = historyPending + bookingsPending + employeesPending;
  }

  async function sync(): Promise<void> {
    const authStore = useAuthStore();
    const userId = authStore.user?.id;

    if (!userId) {
      lastError.value = 'Not authenticated';
      return;
    }
    if (!isConfigured.value) {
      status.value = 'disabled';
      return;
    }
    if (!isOnline()) {
      status.value = 'offline';
      return;
    }
    if (isSyncing.value) return;

    isSyncing.value = true;
    status.value = 'syncing';
    lastError.value = null;

    try {
      const bookingsStore = useBookingsStore();
      const employeesStore = useEmployeesStore();
      const historyStore = useHistoryPiniaStore();

      const { results, mergedHistory, mergedBookings, mergedEmployees } = await performFullSync(userId, {
        history: historyStore.records || [],
        bookings: [...bookingsStore.bookings],
        employees: [...employeesStore.employees],
      });

      lastResults.value = results;

      historyStore.safeSaveHistory(mergedHistory as any[], { allowEviction: true });
      bookingsStore.replaceAllFromSync(mergedBookings as Booking[]);
      employeesStore.replaceAllFromSync(mergedEmployees as Employee[]);

      const allErrors = results.flatMap((r) => r.errors);
      if (allErrors.length > 0) {
        lastError.value = allErrors[0] ?? 'Sync error';
        status.value = 'error';
      } else {
        status.value = 'success';
        const now = new Date().toISOString();
        lastSyncAt.value = now;
        localStorage.setItem(LAST_SYNC_KEY, now);
      }

      updatePendingCount();
    } catch (err: unknown) {
      lastError.value = err instanceof Error ? err.message : 'Sync failed';
      status.value = 'error';
    } finally {
      isSyncing.value = false;
    }
  }

  let autoInitDone = false;
  let periodicId: ReturnType<typeof setInterval> | null = null;
  let unsubOnline: (() => void) | null = null;

  function initAutoSync(): void {
    if (!isConfigured.value || autoInitDone) return;
    autoInitDone = true;

    unsubOnline = onOnline(() => {
      updatePendingCount();
      if (pendingCount.value > 0) {
        void sync();
      }
    });

    onOffline(() => {
      if (isConfigured.value) {
        status.value = 'offline';
      }
      updatePendingCount();
    });

    if (isOnline()) {
      setTimeout(() => {
        void sync();
      }, 2000);
    }

    periodicId = setInterval(() => {
      if (isOnline() && !isSyncing.value) {
        updatePendingCount();
        void sync();
      }
    }, 5 * 60 * 1000);
  }

  function resetSyncMeta(): void {
    localStorage.removeItem('dm_sync_metadata_v1');
    localStorage.removeItem(LAST_SYNC_KEY);
    lastSyncAt.value = null;
  }

  return {
    status,
    lastSyncAt,
    pendingCount,
    lastError,
    isSyncing,
    lastResults,
    isConfigured,
    canSync,
    sync,
    updatePendingCount,
    initAutoSync,
    resetSyncMeta,
  };
});
