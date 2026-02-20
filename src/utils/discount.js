/**
 * Clamp a raw discount input to a valid 0–100 range.
 * Accepts string or number; returns a number.
 */
export function clampDiscount(raw) {
  if (raw === null || raw === undefined || raw === '') return 0;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n * 100) / 100;
}

/**
 * Post-processing discount: `final = amount * (1 - discountPercent / 100)`.
 * Applied AFTER the full per-dent pipeline (coefficients + armature + extras).
 * Rounding is applied separately after this function.
 */
export function applyDiscount(amount, discountPercent) {
  if (!Number.isFinite(amount) || amount < 0) return amount || 0;
  const pct = clampDiscount(discountPercent);
  if (pct === 0) return amount;
  return amount * (1 - pct / 100);
}
