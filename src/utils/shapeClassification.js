/**
 * Automatic damage shape classification by aspect ratio.
 * USE FOR DISPLAY/LABELS ONLY. Do NOT use for pricing routing.
 *
 * Pricing routing: use isStripeCase() from pricingAdapter — requires explicit user choice (strip type) + ratio > 1.
 * Rule: Stripe tables ONLY when user explicitly chose Полоса/Царапина. Ratio-based "stripe" here must NOT override.
 *
 * Compute R = L/H, where L = max(w,h), H = min(w,h).
 * Boundaries:
 * - R < 1.40 → round (Круг)
 * - 1.40 ≤ R < 3.00 → oval (Овал)
 * - R ≥ 3.00 → stripe (Полоса) — display label only
 *
 * @param {number} widthMm
 * @param {number} heightMm
 * @returns {'round' | 'oval' | 'stripe'}
 */
export function classifyDamageShapeByRatio(widthMm, heightMm) {
  const w = Number(widthMm);
  const h = Number(heightMm);

  // Safe default only when data is missing/invalid.
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 'round';

  const L = Math.max(w, h);
  const H = Math.min(w, h);
  if (!Number.isFinite(L) || !Number.isFinite(H) || H <= 0) return 'round';

  const R = L / H;
  if (!Number.isFinite(R) || R <= 0) return 'round';

  if (R < 1.4) return 'round';
  if (R < 3.0) return 'oval';
  return 'stripe';
}

/**
 * Back-compat alias: previous name used across the app.
 * @param {{ widthMm: number, heightMm: number }} size
 * @returns {'round' | 'oval' | 'stripe'}
 */
export function classifyShapeByRatio(size) {
  const w = size?.widthMm;
  const h = size?.heightMm;
  return classifyDamageShapeByRatio(w, h);
}

/**
 * Back-compat alias: older name used across the app.
 * @param {{ widthMm: number, heightMm: number }} size
 * @returns {'round' | 'oval' | 'stripe'}
 */
export function classifyShapeByAspectRatio({ widthMm, heightMm }) {
  return classifyDamageShapeByRatio(widthMm, heightMm);
}
