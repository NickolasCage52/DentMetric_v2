// ─────────────────────────────────────────────────────────────────────────────
// stripeCalc.js
// Unified calculation for dent type: Полоса / Царапина (stripe/scratch)
// DO NOT use this for other dent types.
// ─────────────────────────────────────────────────────────────────────────────

// ── Lookup table ──────────────────────────────────────────────────────────────
// Source of truth for height = 2 cm. PDF "доработки_240226_Раздел_настроек", стр. 3.
// Lengths in cm, prices in rubles (base from PDF; k2/k3/k4 для матрицы сложности).
const STRIPE_TABLE = [
  { length: 5, base: 4000, k2: 6000, k3: 9200, k4: 16000 },
  { length: 18, base: 8000, k2: 11040, k3: 16000, k4: 25600 },
  { length: 20, base: 9000, k2: 12150, k3: 17550, k4: 27450 },
  { length: 21, base: 12000, k2: 13300, k3: 19000, k4: 29500 },
  { length: 36, base: 15000, k2: 18000, k3: 23250, k4: 33000 },
  { length: 50, base: 15000, k2: 18000, k3: 25300, k4: 44000 },
  { length: 100, base: 22000, k2: 25300, k3: 31900, k4: 44000 }
];

/** Presets for display in settings (length, label, base). */
export const STRIPE_PRESETS_DISPLAY = STRIPE_TABLE.map((r) => ({
  lengthCm: r.length,
  label: `${r.length} см`,
  base: r.base
}));

// ── Height scaling parameters ─────────────────────────────────────────────────
// Sub-linear power law: scale = (h / H_REF) ^ EXPONENT
// H_REF: reference height where table is exact (2 cm)
// EXPONENT: controls sub-linearity. 0.5 = square root (conservative).
const HEIGHT_CONFIG = {
  H_REF: 2,
  EXPONENT: 0.5,
  H_MIN: 0.5,
  H_MAX: 30
};

// ── Class key mapping ─────────────────────────────────────────────────────────
// Maps app's matrixKey (K1/K2/K3/K4) to table column.
const CLASS_KEY_MAP = {
  base: 'base',
  k2: 'k2',
  k3: 'k3',
  k4: 'k4',
  Base: 'base',
  K2: 'k2',
  K3: 'k3',
  K4: 'k4',
  K1: 'base',
  1: 'base',
  2: 'k2',
  3: 'k3',
  4: 'k4'
};

/**
 * INTERNAL: Piecewise linear interpolation by length at h=2cm
 * @param {number} lengthCm - length in cm
 * @param {'base'|'k2'|'k3'|'k4'} classKey
 * @returns {number} price (unrounded)
 */
function interpolatePriceByLength(lengthCm, classKey) {
  const exact = STRIPE_TABLE.find((row) => row.length === lengthCm);
  if (exact) return exact[classKey];

  if (lengthCm <= STRIPE_TABLE[0].length) {
    return STRIPE_TABLE[0][classKey];
  }
  const last = STRIPE_TABLE[STRIPE_TABLE.length - 1];
  if (lengthCm >= last.length) {
    return last[classKey];
  }

  let lo = STRIPE_TABLE[0];
  let hi = STRIPE_TABLE[1];
  for (let i = 0; i < STRIPE_TABLE.length - 1; i++) {
    if (STRIPE_TABLE[i].length <= lengthCm && lengthCm <= STRIPE_TABLE[i + 1].length) {
      lo = STRIPE_TABLE[i];
      hi = STRIPE_TABLE[i + 1];
      break;
    }
  }
  const t = (lengthCm - lo.length) / (hi.length - lo.length);
  return lo[classKey] + t * (hi[classKey] - lo[classKey]);
}

/**
 * INTERNAL: Height scaling factor (sub-linear)
 * @param {number} heightCm
 * @returns {number} multiplier (1.0 when heightCm === H_REF)
 */
function heightScaleFactor(heightCm) {
  const { H_REF, EXPONENT, H_MIN, H_MAX } = HEIGHT_CONFIG;
  const h = Math.max(H_MIN, Math.min(H_MAX, heightCm));
  return Math.pow(h / H_REF, EXPONENT);
}

/**
 * Get complexity ratio for stripe (K2/K3/K4 vs base). Used when base comes from user prices.
 * @param {number} lengthCm
 * @param {'base'|'k2'|'k3'|'k4'} classKey
 * @returns {number} multiplier (1.0 for base)
 */
function getStripeComplexityRatio(lengthCm, classKey) {
  if (classKey === 'base') return 1.0;
  const tableBase = interpolatePriceByLength(lengthCm, 'base');
  if (!tableBase) return 1.0;
  const tableClass = interpolatePriceByLength(lengthCm, classKey);
  return tableClass / tableBase;
}

/**
 * PUBLIC API: calculate stripe/scratch price from user base (interpolated by area).
 * Use when basePriceK1 comes from userSettings.prices (via area interpolation).
 * @param {{ lengthCm: number, heightCm: number, coeffClass: string, basePriceK1: number }}
 * @returns {{ price: number, debug?: object }}
 */
export function calculateStripePriceFromUserBase({ lengthCm, heightCm, coeffClass, basePriceK1 }) {
  const raw = String(coeffClass || '').trim();
  const classKey = CLASS_KEY_MAP[raw] ?? CLASS_KEY_MAP[raw.toLowerCase()] ?? 'base';
  const ratio = getStripeComplexityRatio(lengthCm, classKey);
  const hScale = heightScaleFactor(heightCm);
  const price = (Number(basePriceK1) || 0) * ratio * hScale;
  return { price };
}

/**
 * PUBLIC API: calculate stripe/scratch price (uses internal STRIPE_TABLE).
 * @param {{ lengthCm: number, heightCm: number, coeffClass: string }}
 * @returns {{ price: number, debug?: object }}
 */
export function calculateStripePrice({ lengthCm, heightCm, coeffClass }) {
  const raw = String(coeffClass || '').trim();
  const classKey = CLASS_KEY_MAP[raw] ?? CLASS_KEY_MAP[raw.toLowerCase()] ?? 'base';
  if (!CLASS_KEY_MAP[raw] && raw && CLASS_KEY_MAP[raw.toLowerCase()] == null) {
    console.warn(`[stripeCalc] Unknown coeffClass: "${coeffClass}". Using "base".`);
  }

  const basePrice = interpolatePriceByLength(lengthCm, classKey);
  const hScale = heightScaleFactor(heightCm);
  const price = basePrice * hScale;

  const debug = { lengthCm, heightCm, resolvedKey: classKey, basePrice, hScale, price };
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV && import.meta.env?.MODE !== 'test') {
    console.log('[stripeCalc]', debug);
  }

  return { price, debug };
}
