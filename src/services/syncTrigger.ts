/**
 * Debounced background sync — avoids Pinia circular imports with history/bookings stores.
 */
let syncTimer: ReturnType<typeof setTimeout> | null = null;

/** Дебаунс: серия сохранений не дергает sync на каждый чих. */
export function scheduleBackgroundSync(delayMs = 3000): void {
  if (typeof window === 'undefined') return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void import('@/stores/sync').then(({ useSyncStore }) => {
      const sync = useSyncStore();
      sync.updatePendingCount();
      if (sync.canSync) void sync.sync();
    });
  }, delayMs);
}
