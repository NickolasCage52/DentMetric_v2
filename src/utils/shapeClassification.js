/**
 * Automatic shape classification by aspect ratio.
 * L = max(w,h), H = min(w,h), r = L/H
 * - r ≤ 1.20 → round (Круг)
 * - r ≥ 2.40 and L ≥ 50 mm → stripe (Полоса)
 * - else → oval (Овал)
 *
 * @param {{ widthMm: number, heightMm: number }} size
 * @returns {'round' | 'oval' | 'stripe'}
 */
export function classifyShapeByRatio({ widthMm, heightMm }) {
  const w = Number(widthMm) || 0;
  const h = Number(heightMm) || 0;
  if (w <= 0 || h <= 0) return 'oval';
  const L = Math.max(w, h);
  const H = Math.min(w, h);
  const r = H > 0 ? L / H : 1;
  if (r <= 1.2) return 'round';
  if (r >= 2.4 && L >= 50) return 'stripe';
  return 'oval';
}
