/**
 * Shared multi-dent aggregation: applies discount factor to 2nd+ dents (by price).
 * Single source of truth for Quick, Detail, and History.
 *
 * Rules:
 * - Most expensive dent (max total) → weight 1.0
 * - All others: factor = enableSecondDentDiscount ? (1 - secondDentDiscountPercent/100) : 0.5
 * - Ties: first max index wins (deterministic)
 *
 * @param {number[]} dentTotals - per-dent totals (before multi-dent rule)
 * @param {{ enableSecondDentDiscount?: boolean, secondDentDiscountPercent?: number }} settings
 * @returns {{ total: number, weightedTotals: number[], factorForSecond: number }}
 */
export function calculateSessionTotalWithMultiDentRule(dentTotals, settings = {}) {
  const arr = Array.isArray(dentTotals) ? dentTotals.filter((v) => Number.isFinite(Number(v))) : [];
  if (arr.length === 0) return { total: 0, weightedTotals: [], factorForSecond: 0.5 };

  const maxVal = Math.max(...arr);
  const maxIdx = arr.findIndex((v) => v === maxVal);
  const factorForSecond = settings.enableSecondDentDiscount
    ? Math.max(0, Math.min(1, 1 - (Number(settings.secondDentDiscountPercent) || 0) / 100))
    : 0.5;

  const weightedTotals = arr.map((v, i) => {
    if (i === maxIdx) return Math.max(0, v);
    return Math.max(0, v * factorForSecond);
  });
  const total = weightedTotals.reduce((s, x) => s + x, 0);
  return { total, weightedTotals, factorForSecond };
}
