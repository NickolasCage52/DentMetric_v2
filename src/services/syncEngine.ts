import { supabase, isSupabaseConfigured } from '@/services/supabase';

// ============================================================
// TYPES
// ============================================================

export type SyncCollection = 'history' | 'bookings' | 'employees' | 'service_data';

export type SyncStatus =
  | 'idle'
  | 'syncing'
  | 'success'
  | 'error'
  | 'offline'
  | 'disabled';

export interface SyncResult {
  pushed: number;
  pulled: number;
  errors: string[];
  collection: SyncCollection;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncAt?: string;
  pendingCount: number;
  error?: string;
}

// ============================================================
// SYNC METADATA (localStorage — last pull timestamps)
// ============================================================

const SYNC_META_KEY = 'dm_sync_metadata_v1';

interface SyncMeta {
  [collection: string]: string;
}

function loadSyncMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    return raw ? (JSON.parse(raw) as SyncMeta) : {};
  } catch {
    return {};
  }
}

function saveSyncMeta(meta: SyncMeta): void {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
}

function getLastPullAt(collection: SyncCollection): string {
  return loadSyncMeta()[collection] || '2020-01-01T00:00:00.000Z';
}

function setLastPullAt(collection: SyncCollection, iso: string): void {
  const meta = loadSyncMeta();
  meta[collection] = iso;
  saveSyncMeta(meta);
}

// ============================================================
// CONNECTION
// ============================================================

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

let networkListenersBound = false;
const onlineCallbacks: Array<() => void> = [];
const offlineCallbacks: Array<() => void> = [];

function ensureNetworkListeners(): void {
  if (networkListenersBound || typeof window === 'undefined') return;
  networkListenersBound = true;
  window.addEventListener('online', () => {
    onlineCallbacks.forEach((fn) => fn());
  });
  window.addEventListener('offline', () => {
    offlineCallbacks.forEach((fn) => fn());
  });
}

export function onOnline(cb: () => void): () => void {
  ensureNetworkListeners();
  onlineCallbacks.push(cb);
  return () => {
    const i = onlineCallbacks.indexOf(cb);
    if (i >= 0) onlineCallbacks.splice(i, 1);
  };
}

export function onOffline(cb: () => void): () => void {
  ensureNetworkListeners();
  offlineCallbacks.push(cb);
  return () => {
    const i = offlineCallbacks.indexOf(cb);
    if (i >= 0) offlineCallbacks.splice(i, 1);
  };
}

// ============================================================
// HELPERS
// ============================================================

function isHistoryPending(r: Record<string, unknown>): boolean {
  const syncedAt = r.syncedAt != null ? String(r.syncedAt) : '';
  const cu = String(r.clientUpdatedAt || r.updatedAt || r.createdAt || '');
  return !syncedAt || !!(cu && syncedAt && cu > syncedAt);
}

function isBookingPending(b: Record<string, unknown>): boolean {
  const syncedAt = b.syncedAt != null ? String(b.syncedAt) : '';
  const u = String(b.updatedAt || b.createdAt || '');
  return !syncedAt || !!(u && syncedAt && u > syncedAt);
}

function isEmployeePending(e: Record<string, unknown>): boolean {
  return isBookingPending(e);
}

function getAnnotatedIdbKey(record: Record<string, unknown>): string | null {
  const att = record.attachments;
  if (!Array.isArray(att)) return null;
  for (const a of att) {
    if (a && typeof a === 'object' && (a as { idbKey?: string }).idbKey) {
      return String((a as { idbKey: string }).idbKey);
    }
  }
  return null;
}

async function blobToDataUrl(blob: Blob): Promise<string | null> {
  try {
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function syncSupabaseSession(userId: string, _accessToken?: string): Promise<void> {
  if (!supabase) return;
  try {
    if (import.meta.env.DEV) {
      console.info('[Sync] Session placeholder for user:', userId);
    }
    // TODO Stage 8+: supabase.auth.signInWithOtp / session from real JWT when backend is ready.
  } catch (err) {
    console.warn('[Sync] Session sync failed:', err);
  }
}

// ============================================================
// PHOTOS
// ============================================================

export async function uploadAnnotatedPhoto(
  recordId: string,
  userId: string,
  dataUrl: string
): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured() || !isOnline()) {
    return null;
  }

  try {
    const [header, base64] = dataUrl.split(',');
    const mimeMatch = header.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mime });
    const ext = (mime.split('/')[1] || 'jpg').replace(/\+xml$/, '');

    const filePath = `${userId}/${recordId}.${ext}`;

    const { error } = await supabase.storage.from('annotated-photos').upload(filePath, blob, {
      upsert: true,
      contentType: mime,
    });

    if (error) {
      console.warn('[Sync] Photo upload failed:', error.message);
      return null;
    }

    const { data: urlData } = await supabase.storage
      .from('annotated-photos')
      .createSignedUrl(filePath, 7 * 24 * 3600);

    return urlData?.signedUrl || null;
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : 'unknown';
    console.warn('[Sync] Photo upload error:', m);
    return null;
  }
}

export async function downloadAnnotatedPhoto(recordId: string, userId: string): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured() || !isOnline()) {
    return null;
  }

  try {
    for (const ext of ['jpg', 'png', 'jpeg', 'webp']) {
      const filePath = `${userId}/${recordId}.${ext}`;
      const { data, error } = await supabase.storage.from('annotated-photos').download(filePath);
      if (!error && data) {
        return blobToDataUrl(data);
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function uploadPendingHistoryPhotos(records: Record<string, unknown>[], userId: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured() || !isOnline()) return;

  const { getAttachment } = await import('@/utils/attachmentStorage.js');

  for (const record of records) {
    const id = record.id != null ? String(record.id) : '';
    if (!id) continue;
    const hasUrl = record.annotatedPhotoUrl != null && String(record.annotatedPhotoUrl).length > 0;
    if (hasUrl) continue;
    const idbKey = getAnnotatedIdbKey(record);
    if (!idbKey) continue;
    try {
      const blob = await getAttachment(idbKey);
      if (!blob || !(blob instanceof Blob)) continue;
      const dataUrl = await blobToDataUrl(blob);
      if (!dataUrl) continue;
      const cloudUrl = await uploadAnnotatedPhoto(id, userId, dataUrl);
      if (cloudUrl) {
        record.annotatedPhotoUrl = cloudUrl;
      }
    } catch {
      /* silent */
    }
  }
}

async function cachePulledPhotosToIdb(
  records: Record<string, unknown>[],
  userId: string
): Promise<void> {
  const { getAttachment, saveAttachment } = await import('@/utils/attachmentStorage.js');

  for (const record of records) {
    const id = record.id != null ? String(record.id) : '';
    if (!id) continue;
    const url =
      record.annotatedPhotoUrl != null && String(record.annotatedPhotoUrl).length > 0
        ? String(record.annotatedPhotoUrl)
        : null;
    if (!url || !url.startsWith('http')) continue;
    const idbKey = getAnnotatedIdbKey(record);
    if (!idbKey) continue;
    try {
      const existing = await getAttachment(idbKey);
      if (existing) continue;
      const dataUrl = await downloadAnnotatedPhoto(id, userId);
      if (!dataUrl) continue;
      const blob = await (await fetch(dataUrl)).blob();
      await saveAttachment(idbKey, blob);
    } catch {
      /* silent */
    }
  }
}

// ============================================================
// HISTORY
// ============================================================

export async function pushHistory(records: unknown[], userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    pushed: 0,
    pulled: 0,
    errors: [],
    collection: 'history',
  };

  if (!supabase || !isSupabaseConfigured()) {
    return result;
  }

  if (!isOnline()) {
    result.errors.push('offline');
    return result;
  }

  const pendingRecords = records.filter((r) => r && typeof r === 'object' && isHistoryPending(r as Record<string, unknown>));

  if (pendingRecords.length === 0) return result;

  const BATCH_SIZE = 50;
  for (let i = 0; i < pendingRecords.length; i += BATCH_SIZE) {
    const batch = pendingRecords.slice(i, i + BATCH_SIZE);
    const rows = batch.map((raw) => {
      const r = raw as Record<string, unknown>;
      const id = String(r.id || '');
      const clientUpdated = String(r.clientUpdatedAt || r.updatedAt || r.createdAt || new Date().toISOString());
      return {
        id,
        user_id: userId,
        data: r,
        client_updated_at: clientUpdated,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      };
    });

    try {
      const { error } = await supabase.from('history_records').upsert(rows, { onConflict: 'id' });

      if (error) {
        result.errors.push(`Push batch ${i}: ${error.message}`);
      } else {
        result.pushed += batch.length;
      }
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'unknown';
      result.errors.push(`Push batch ${i}: ${m}`);
    }
  }

  return result;
}

export async function pullHistory(userId: string): Promise<{ records: Record<string, unknown>[]; result: SyncResult }> {
  const result: SyncResult = {
    pushed: 0,
    pulled: 0,
    errors: [],
    collection: 'history',
  };

  if (!supabase || !isSupabaseConfigured()) {
    return { records: [], result };
  }

  if (!isOnline()) {
    result.errors.push('offline');
    return { records: [], result };
  }

  const lastPullAt = getLastPullAt('history');

  try {
    const { data, error } = await supabase
      .from('history_records')
      .select('id, data, client_updated_at, deleted_at, updated_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gt('updated_at', lastPullAt)
      .order('updated_at', { ascending: true })
      .limit(500);

    if (error) {
      result.errors.push(`Pull history: ${error.message}`);
      return { records: [], result };
    }

    const rows = data || [];
    const records = rows.map((row: Record<string, unknown>) => {
      const payload = (row.data as Record<string, unknown>) || {};
      const id = String(row.id || payload.id || '');
      return {
        ...payload,
        id,
        syncedAt: row.updated_at,
        clientUpdatedAt: row.client_updated_at || payload.clientUpdatedAt,
      } as Record<string, unknown>;
    });

    if (rows.length > 0) {
      const last = rows[rows.length - 1] as { updated_at: string };
      setLastPullAt('history', last.updated_at);
    }

    result.pulled = records.length;
    return { records, result };
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : 'unknown';
    result.errors.push(`Pull history: ${m}`);
    return { records: [], result };
  }
}

// ============================================================
// BOOKINGS
// ============================================================

export async function pushBookings(bookings: unknown[], userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    pushed: 0,
    pulled: 0,
    errors: [],
    collection: 'bookings',
  };

  if (!supabase || !isSupabaseConfigured() || !isOnline()) {
    if (!isOnline()) result.errors.push('offline');
    return result;
  }

  const pending = bookings.filter((b) => b && typeof b === 'object' && isBookingPending(b as Record<string, unknown>));
  if (pending.length === 0) return result;

  const rows = pending.map((raw) => {
    const b = raw as Record<string, unknown>;
    const id = String(b.id || '');
    const clientUpdated = String(b.updatedAt || b.createdAt || new Date().toISOString());
    return {
      id,
      user_id: userId,
      data: b,
      client_updated_at: clientUpdated,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    };
  });

  try {
    const { error } = await supabase.from('bookings').upsert(rows, { onConflict: 'id' });

    if (error) {
      result.errors.push(error.message);
    } else {
      result.pushed = pending.length;
    }
  } catch (err: unknown) {
    result.errors.push(err instanceof Error ? err.message : 'unknown');
  }

  return result;
}

export async function pullBookings(
  userId: string
): Promise<{ bookings: Record<string, unknown>[]; result: SyncResult }> {
  const result: SyncResult = {
    pushed: 0,
    pulled: 0,
    errors: [],
    collection: 'bookings',
  };

  if (!supabase || !isSupabaseConfigured() || !isOnline()) {
    if (!isOnline()) result.errors.push('offline');
    return { bookings: [], result };
  }

  const lastPullAt = getLastPullAt('bookings');

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, data, updated_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gt('updated_at', lastPullAt)
      .order('updated_at', { ascending: true })
      .limit(200);

    if (error) {
      result.errors.push(error.message);
      return { bookings: [], result };
    }

    const rows = data || [];
    const bookings = rows.map((row: Record<string, unknown>) => {
      const payload = (row.data as Record<string, unknown>) || {};
      const id = String(row.id || payload.id || '');
      return {
        ...payload,
        id,
        syncedAt: row.updated_at,
      } as Record<string, unknown>;
    });

    if (rows.length > 0) {
      const last = rows[rows.length - 1] as { updated_at: string };
      setLastPullAt('bookings', last.updated_at);
    }

    result.pulled = bookings.length;
    return { bookings, result };
  } catch (err: unknown) {
    result.errors.push(err instanceof Error ? err.message : 'unknown');
    return { bookings: [], result };
  }
}

// ============================================================
// EMPLOYEES
// ============================================================

export async function pushEmployees(employees: unknown[], userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    pushed: 0,
    pulled: 0,
    errors: [],
    collection: 'employees',
  };

  if (!supabase || !isSupabaseConfigured() || !isOnline()) {
    if (!isOnline()) result.errors.push('offline');
    return result;
  }

  const pending = employees.filter((e) => e && typeof e === 'object' && isEmployeePending(e as Record<string, unknown>));
  if (pending.length === 0) return result;

  const rows = pending.map((raw) => {
    const e = raw as Record<string, unknown>;
    const id = String(e.id || '');
    const clientUpdated = String(e.updatedAt || e.createdAt || new Date().toISOString());
    return {
      id,
      user_id: userId,
      data: e,
      client_updated_at: clientUpdated,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    };
  });

  try {
    const { error } = await supabase.from('employees').upsert(rows, { onConflict: 'id' });

    if (error) {
      result.errors.push(error.message);
    } else {
      result.pushed = pending.length;
    }
  } catch (err: unknown) {
    result.errors.push(err instanceof Error ? err.message : 'unknown');
  }

  return result;
}

export async function pullEmployees(
  userId: string
): Promise<{ employees: Record<string, unknown>[]; result: SyncResult }> {
  const result: SyncResult = {
    pushed: 0,
    pulled: 0,
    errors: [],
    collection: 'employees',
  };

  if (!supabase || !isSupabaseConfigured() || !isOnline()) {
    if (!isOnline()) result.errors.push('offline');
    return { employees: [], result };
  }

  const lastPullAt = getLastPullAt('employees');

  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id, data, updated_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gt('updated_at', lastPullAt)
      .order('updated_at', { ascending: true })
      .limit(100);

    if (error) {
      result.errors.push(error.message);
      return { employees: [], result };
    }

    const rows = data || [];
    const employees = rows.map((row: Record<string, unknown>) => {
      const payload = (row.data as Record<string, unknown>) || {};
      const id = String(row.id || payload.id || '');
      return {
        ...payload,
        id,
        syncedAt: row.updated_at,
      } as Record<string, unknown>;
    });

    if (rows.length > 0) {
      const last = rows[rows.length - 1] as { updated_at: string };
      setLastPullAt('employees', last.updated_at);
    }

    result.pulled = employees.length;
    return { employees, result };
  } catch (err: unknown) {
    result.errors.push(err instanceof Error ? err.message : 'unknown');
    return { employees: [], result };
  }
}

// ============================================================
// MERGE
// ============================================================

export function mergeRecords(local: unknown[], remote: unknown[]): unknown[] {
  const map = new Map<string, Record<string, unknown>>();

  for (const raw of local) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const id = r.id != null ? String(r.id) : '';
    if (!id) continue;
    map.set(id, { ...r });
  }

  for (const raw of remote) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const id = r.id != null ? String(r.id) : '';
    if (!id) continue;
    const existing = map.get(id);
    if (!existing) {
      map.set(id, { ...r });
    } else {
      const localTime = new Date(
        String(existing.clientUpdatedAt || existing.updatedAt || 0)
      ).getTime();
      const remoteTime = new Date(String(r.clientUpdatedAt || r.updatedAt || 0)).getTime();
      if (remoteTime >= localTime) {
        map.set(id, {
          ...r,
          syncedAt: r.syncedAt || new Date().toISOString(),
        });
      }
    }
  }

  return Array.from(map.values());
}

function markSyncedIfOk<T extends Record<string, unknown>>(
  items: T[],
  pendingPred: (r: T) => boolean,
  ok: boolean,
  nowIso: string
): T[] {
  if (!ok) return items;
  return items.map((r) => (pendingPred(r) ? { ...r, syncedAt: nowIso } : r));
}

function combinePushPull(push: SyncResult, pull: SyncResult): SyncResult {
  return {
    collection: push.collection,
    pushed: push.pushed,
    pulled: pull.pulled,
    errors: [...push.errors, ...pull.errors],
  };
}

// ============================================================
// FULL SYNC
// ============================================================

export async function performFullSync(
  userId: string,
  data: {
    history: unknown[];
    bookings: unknown[];
    employees: unknown[];
  }
): Promise<{
  results: SyncResult[];
  mergedHistory: unknown[];
  mergedBookings: unknown[];
  mergedEmployees: unknown[];
}> {
  const results: SyncResult[] = [];

  if (!isSupabaseConfigured()) {
    return {
      results: [
        {
          pushed: 0,
          pulled: 0,
          errors: ['Supabase not configured'],
          collection: 'history',
        },
      ],
      mergedHistory: data.history,
      mergedBookings: data.bookings,
      mergedEmployees: data.employees,
    };
  }

  await syncSupabaseSession(userId);

  const historyWorking = data.history
    .filter((x) => x && typeof x === 'object')
    .map((x) => ({ ...(x as Record<string, unknown>) })) as Record<string, unknown>[];

  await uploadPendingHistoryPhotos(historyWorking, userId);

  const [historyPush, bookingsPush, employeesPush] = await Promise.all([
    pushHistory(historyWorking, userId),
    pushBookings(data.bookings, userId),
    pushEmployees(data.employees, userId),
  ]);

  const nowIso = new Date().toISOString();

  let historyAfterPush = historyWorking;
  if (historyPush.errors.length === 0) {
    historyAfterPush = markSyncedIfOk(
      historyWorking,
      (r) => isHistoryPending(r),
      true,
      nowIso
    );
  }

  const bookingsBase = data.bookings
    .filter((x) => x && typeof x === 'object')
    .map((x) => ({ ...(x as Record<string, unknown>) })) as Record<string, unknown>[];
  let bookingsAfterPush = bookingsBase;
  if (bookingsPush.errors.length === 0) {
    bookingsAfterPush = markSyncedIfOk(bookingsBase, (b) => isBookingPending(b), true, nowIso);
  }

  const employeesBase = data.employees
    .filter((x) => x && typeof x === 'object')
    .map((x) => ({ ...(x as Record<string, unknown>) })) as Record<string, unknown>[];
  let employeesAfterPush = employeesBase;
  if (employeesPush.errors.length === 0) {
    employeesAfterPush = markSyncedIfOk(employeesBase, (e) => isEmployeePending(e), true, nowIso);
  }

  const [historyPull, bookingsPull, employeesPull] = await Promise.all([
    pullHistory(userId),
    pullBookings(userId),
    pullEmployees(userId),
  ]);

  await cachePulledPhotosToIdb(historyPull.records as Record<string, unknown>[], userId);

  const mergedHistory = mergeRecords(historyAfterPush, historyPull.records);
  const mergedBookings = mergeRecords(bookingsAfterPush, bookingsPull.bookings);
  const mergedEmployees = mergeRecords(employeesAfterPush, employeesPull.employees);

  results.push(
    combinePushPull(historyPush, historyPull.result),
    combinePushPull(bookingsPush, bookingsPull.result),
    combinePushPull(employeesPush, employeesPull.result)
  );

  return {
    results,
    mergedHistory,
    mergedBookings,
    mergedEmployees,
  };
}
