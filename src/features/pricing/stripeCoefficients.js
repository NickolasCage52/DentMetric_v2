/**
 * Stripe / scratch ("Полоса / Царапина") — encoding/parsing of geometry for sizeCode.
 * Price calculation: use stripeCalc.js (piecewise linear + sub-linear height scaling).
 *
 * REMOVED: getStripeCoefficient, STRIPE_COEFFICIENTS_H2CM — replaced by stripeCalc.js
 */

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

