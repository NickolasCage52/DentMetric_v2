/**
 * Stripe / scratch ("Полоса / Царапина") complexity coefficients.
 *
 * Source of truth:
 * - The official table is provided only for stripe height H = 2cm (20mm).
 * - For other heights, we MUST NOT invent new coefficients.
 *
 * Strategy for heights != 20mm:
 * - Keep coefficient values from the official 2cm table.
 * - Adjust ONLY the "effective length" used to pick a preset row, via area conservation:
 *   equivLengthMm = lengthMm * (heightMm / 20)
 * - Then do preset lookup in the 2cm table.
 *
 * Preset row selection rule:
 * - "Ceil to next preset" (next greater-or-equal) to avoid underpricing.
 * - Clamp below min to min row; above max to max row.
 */

/** @typedef {'K1'|'K2'|'K3'|'K4'} KKey */

/** Official coefficients for H = 2cm (20mm). Keys: length in cm. */
export const STRIPE_COEFFICIENTS_H2CM = Object.freeze({
  5: Object.freeze({ K1: 1.0, K2: 1.5, K3: 2.3, K4: 4.0 }),
  18: Object.freeze({ K1: 1.0, K2: 1.38, K3: 2.0, K4: 3.2 }),
  20: Object.freeze({ K1: 1.0, K2: 1.35, K3: 1.95, K4: 3.05 }),
  21: Object.freeze({ K1: 1.0, K2: 1.33, K3: 1.9, K4: 2.95 }),
  36: Object.freeze({ K1: 1.0, K2: 1.25, K3: 1.7, K4: 2.55 }),
  50: Object.freeze({ K1: 1.0, K2: 1.2, K3: 1.55, K4: 2.2 }),
  100: Object.freeze({ K1: 1.0, K2: 1.15, K3: 1.45, K4: 2.0 })
});

const STRIPE_PRESET_LENGTHS_CM = Object.freeze(
  Object.keys(STRIPE_COEFFICIENTS_H2CM).map((v) => Number(v)).sort((a, b) => a - b)
);

const HEIGHT_2CM_MM = 20;
const HEIGHT_TOL_MM = 0.5;

/**
 * @param {number} lengthCm
 * @returns {number} preset length in cm
 */
export function getStripePresetLengthCm(lengthCm) {
  const v = Number(lengthCm);
  if (!Number.isFinite(v) || v <= 0) return STRIPE_PRESET_LENGTHS_CM[0];
  for (const preset of STRIPE_PRESET_LENGTHS_CM) {
    if (v <= preset) return preset; // ceil to next preset
  }
  return STRIPE_PRESET_LENGTHS_CM[STRIPE_PRESET_LENGTHS_CM.length - 1];
}

/**
 * Compute stripe complexity coefficient for given geometry + K level.
 *
 * @param {{ lengthMm: number, heightMm: number, kKey: KKey }} input
 * @returns {number}
 */
export function getStripeCoefficient({ lengthMm, heightMm, kKey }) {
  const L = Number(lengthMm) || 0;
  const H = Number(heightMm) || 0;
  if (L <= 0 || H <= 0) return 1.0;

  const length = Math.max(L, H);
  const height = Math.min(L, H);

  const isH2 = Math.abs(height - HEIGHT_2CM_MM) <= HEIGHT_TOL_MM;
  const effectiveLengthMm = isH2 ? length : (length * (height / HEIGHT_2CM_MM));

  const presetCm = getStripePresetLengthCm(effectiveLengthMm / 10);
  const row = STRIPE_COEFFICIENTS_H2CM[presetCm];
  const coeff = row?.[kKey];
  return Number.isFinite(coeff) ? coeff : 1.0;
}

/**
 * Encodes stripe geometry into a synthetic sizeCodeForMatrix.
 * Used to keep the rest of the pricing pipeline stable while allowing
 * stripe complexity to depend on length/height.
 *
 * @param {number} widthMm
 * @param {number} heightMm
 * @returns {string} e.g. "STRIPE_80x10"
 */
export function encodeStripeMatrixKey(widthMm, heightMm) {
  const w = Math.max(0, Number(widthMm) || 0);
  const h = Math.max(0, Number(heightMm) || 0);
  const L = Math.round(Math.max(w, h));
  const H = Math.round(Math.min(w, h));
  return `STRIPE_${L}x${H}`;
}

/**
 * @param {string} sizeCodeForMatrix
 * @returns {{ lengthMm: number, heightMm: number } | null}
 */
export function parseStripeMatrixKey(sizeCodeForMatrix) {
  const s = String(sizeCodeForMatrix || '');
  const m = /^STRIPE_(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/.exec(s);
  if (!m) return null;
  const lengthMm = Number(m[1]);
  const heightMm = Number(m[2]);
  if (!Number.isFinite(lengthMm) || !Number.isFinite(heightMm) || lengthMm <= 0 || heightMm <= 0) return null;
  return { lengthMm, heightMm };
}

