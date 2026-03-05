// ─────────────────────────────────────────────────────────────────────────────
// stripeCalc.js — Адаптер для совместимости. Математика в stripePricing.ts
// Unified calculation for dent type: Полоса / Царапина (stripe/scratch)
// DO NOT use this for other dent types.
// ─────────────────────────────────────────────────────────────────────────────

import {
  getStripePrice,
  mapCoeffClassToSeverity,
  STRIPE_PRESETS_DISPLAY
} from '../pricing/stripePricing';

export { STRIPE_PRESETS_DISPLAY };

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
 * @param {string} coeffClass
 * @returns {'base'|'k2'|'k3'|'k4'}
 */
function resolveCoeffClass(coeffClass) {
  const raw = String(coeffClass || '').trim();
  return CLASS_KEY_MAP[raw] ?? CLASS_KEY_MAP[raw.toLowerCase()] ?? 'base';
}

/**
 * Get complexity ratio for stripe (K2/K3/K4 vs base). Used when base comes from user prices.
 * For new table-based pricing this ratio is derived from table columns.
 * @param {number} lengthCm
 * @param {'base'|'k2'|'k3'|'k4'} classKey
 * @returns {number} multiplier (1.0 for base)
 */
export function getStripeComplexityRatio(lengthCm, classKey) {
  if (classKey === 'base') return 1.0;
  const sevMap = { base: 'легкая', k2: 'средняя', k3: 'высокая', k4: 'экстра' };
  const basePrice = getStripePrice({
    lengthCm,
    heightCm: 2,
    severity: 'легкая'
  });
  const classPrice = getStripePrice({
    lengthCm,
    heightCm: 2,
    severity: sevMap[classKey]
  });
  return basePrice > 0 ? classPrice / basePrice : 1.0;
}

/**
 * PUBLIC API: calculate stripe/scratch price from user base.
 * Цены строго по таблицам — basePriceK1 не используется для stripe.
 * @param {{ lengthCm: number, heightCm: number, coeffClass: string, basePriceK1: number }}
 * @returns {{ price: number }}
 */
export function calculateStripePriceFromUserBase({
  lengthCm,
  heightCm,
  coeffClass
}) {
  const severity = mapCoeffClassToSeverity(resolveCoeffClass(coeffClass));
  const price = getStripePrice({ lengthCm, heightCm, severity });
  return { price };
}

/**
 * PUBLIC API: calculate stripe/scratch price (uses stripePricing tables).
 * @param {{ lengthCm: number, heightCm: number, coeffClass: string }}
 * @returns {{ price: number, debug?: object }}
 */
export function calculateStripePrice({ lengthCm, heightCm, coeffClass }) {
  const classKey = resolveCoeffClass(coeffClass);
  const severity = mapCoeffClassToSeverity(classKey);
  const price = getStripePrice({ lengthCm, heightCm, severity });

  const debug = {
    lengthCm,
    heightCm,
    resolvedKey: classKey,
    severity,
    price
  };
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env?.DEV &&
    import.meta.env?.MODE !== 'test'
  ) {
    console.log('[stripeCalc]', debug);
  }

  return { price, debug };
}
