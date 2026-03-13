/**
 * DentMetric Full Audit — self-checks for all critical paths.
 * Runs only in import.meta.env.DEV.
 */
import {
  safeLoadHistory,
  safeSaveHistory,
  loadHistory,
  normalizeRecord,
  STORAGE_KEY
} from '../features/history/historyStore';
import { calculateStripePrice, STRIPE_PRESETS_DISPLAY } from './stripeCalc';
import { migrateSettings, getDiscountRate } from './settingsUtils';
import { saveAttachment, getAttachment, deleteAttachment } from './attachmentStorage';

export async function runFullAudit() {
  if (!import.meta.env?.DEV) return;
  console.group('[DentMetric Full Audit]');

  // === ИСТОРИЯ ===
  // КРИТИЧНО: не перезаписывать историю пользователя! Тест выполняется на копии, затем восстанавливаем оригинал.
  let historyBackup = null;
  try {
    historyBackup = localStorage.getItem(STORAGE_KEY);
    const r10 = Array.from({ length: 10 }, (_, i) =>
      normalizeRecord({ client: { name: `C${i}` }, total: i * 1000, totalEstimate: i * 1000 })
    ).filter(Boolean);
    safeSaveHistory(r10);
    const loaded = safeLoadHistory();
    if (loaded.length !== 10) throw new Error(`History: expected 10, got ${loaded.length}`);
    if (!loaded.every((r) => r?.id)) throw new Error('History: not all have id');
    if (!loaded.every((r) => r?.status)) throw new Error('History: not all have status');
    console.log('History 10 records: OK');
    // Восстановить оригинальную историю пользователя и синхронизировать store
    if (historyBackup !== null) localStorage.setItem(STORAGE_KEY, historyBackup);
    else localStorage.removeItem(STORAGE_KEY);
    loadHistory(true);
  } catch (e) {
    console.error('History 10 records FAILED:', e);
    // При ошибке тоже восстановить
    if (historyBackup !== null) localStorage.setItem(STORAGE_KEY, historyBackup);
    else localStorage.removeItem(STORAGE_KEY);
    loadHistory(true);
  }

  try {
    const backup = localStorage.getItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, 'x');
    const broken = safeLoadHistory();
    if (backup !== null) localStorage.setItem(STORAGE_KEY, backup);
    else localStorage.removeItem(STORAGE_KEY);
    if (!Array.isArray(broken)) throw new Error('Broken history: expected array');
    console.log('Broken history: OK');
  } catch (e) {
    console.error('Broken history FAILED:', e);
  }

  // === STRIPE MATH ===
  try {
    const S = (l, h, cls) => calculateStripePrice({ lengthCm: l, heightCm: h, coeffClass: cls }).price;
    if (Math.abs(S(8, 2, 'base') - 5000) >= 1) throw new Error('Stripe L=8 h=2');
    if (Math.abs(S(18, 2, 'base') - 11000) >= 1) throw new Error('Stripe L=18 h=2');
    if (Math.abs(S(20, 2, 'base') - 12000) >= 1) throw new Error('Stripe L=20 h=2');
    if (Math.abs(S(50, 2, 'base') - 18000) >= 1) throw new Error('Stripe L=50 h=2');
    if (Math.abs(S(100, 2, 'base') - 28000) >= 1) throw new Error('Stripe L=100 h=2');
    if (S(10, 2, 'base') < 6000 || S(10, 2, 'base') > 11000) throw new Error('Stripe interpolation L=10');
    if (S(18, 4, 'base') <= 11000 || S(18, 4, 'base') >= 20000) throw new Error('Stripe h=4');
    if (S(2, 2, 'base') !== S(8, 2, 'base')) throw new Error('Stripe clamp min');
    if (S(150, 2, 'base') !== S(100, 2, 'base')) throw new Error('Stripe clamp max');
    if (S(12, 4, 'k3') > 15000) throw new Error('Stripe BUG: len=12 h=4 высокая must be ≤15000');
    if (!isFinite(S(18, 0.1, 'base')) || !isFinite(S(18, 100, 'base'))) throw new Error('Stripe NaN');
    console.log('Stripe math: OK');
  } catch (e) {
    console.error('Stripe math FAILED:', e);
  }

  // === НАСТРОЙКИ ===
  try {
    const ms1 = migrateSettings({ priceAdjustment: 1.1 });
    if (ms1.priceAdjustmentRoundOval !== 1.1 || ms1.priceAdjustmentStripe !== 1.1) {
      throw new Error('Migrate price adj');
    }
    const ms2 = migrateSettings({ secondDentDiscountEnabled: true, secondDentDiscountValue: 50 });
    if (ms2.discountSamePartEnabled !== true || ms2.discountDiffPartEnabled !== false) {
      throw new Error('Migrate discount');
    }
    console.log('Settings migration: OK');
  } catch (e) {
    console.error('Settings migration FAILED:', e);
  }

  // === СКИДКИ A/B ===
  try {
    const setts = {
      discountSamePartEnabled: true,
      discountSamePartValue: 50,
      discountDiffPartEnabled: true,
      discountDiffPartValue: 30
    };
    const d1 = { element: 'door' };
    const d2same = { element: 'door' };
    const d2diff = { element: 'hood' };
    if (getDiscountRate(d2same, d1, setts) !== 0.5) throw new Error('Discount same part');
    if (getDiscountRate(d2diff, d1, setts) !== 0.3) throw new Error('Discount diff part');
    console.log('Discounts A/B: OK');
  } catch (e) {
    console.error('Discounts A/B FAILED:', e);
  }

  // === INDEXEDDB ===
  try {
    const testBlob = new Blob(['test'], { type: 'image/png' });
    const key = `audit_key_${Date.now()}`;
    await saveAttachment(key, testBlob);
    const got = await getAttachment(key);
    if (got === null) throw new Error('IDB: save/get');
    await deleteAttachment(key);
    const gone = await getAttachment(key).catch(() => null);
    if (gone != null) throw new Error('IDB: delete');
    console.log('IndexedDB: OK');
  } catch (e) {
    console.error('IndexedDB FAILED:', e);
  }

  // === ПРАЙС ПОЛОС ===
  try {
    const expected = [
      [8, 5000],
      [18, 11000],
      [20, 12000],
      [50, 18000],
      [100, 28000]
    ];
    for (const [l, p] of expected) {
      const row = STRIPE_PRESETS_DISPLAY.find((r) => r.lengthCm === l);
      if (row?.base !== p) throw new Error(`Preset ${l}cm = ${p}`);
    }
    console.log('Stripe presets: OK');
  } catch (e) {
    console.error('Stripe presets FAILED:', e);
  }

  console.groupEnd();
}
