/**
 * Shared multi-dent aggregation: applies discount factor to 2nd+ dents (by price).
 * Single source of truth for Quick, Detail, and History.
 *
 * Rules:
 * - Most expensive dent (max total) → weight 1.0
 * - Others: discount based on same/different element (discountSamePart vs discountDiffPart)
 * - Ties: first max index wins (deterministic)
 *
 * @param {Array<number|{ total: number, panelElement?: string, dent?: { panelElement?: string } }>} dentItems - per-dent totals (number[]) or items with total+panelElement
 * @param {object} settings
 * @returns {{ total: number, weightedTotals: number[], factorForSecond: number }}
 */
export function calculateSessionTotalWithMultiDentRule(dentItems, settings = {}) {
  const raw = Array.isArray(dentItems) ? dentItems : [];
  const arr = raw.map((it) => (typeof it === 'number' ? { total: it } : it)).filter((it) => {
    const t = Number(it?.total) ?? (typeof it === 'number' ? it : NaN);
    return Number.isFinite(t);
  });
  if (arr.length === 0) return { total: 0, weightedTotals: [], factorForSecond: 0.5 };

  const totals = arr.map((it) => Number(it?.total) ?? 0);
  if (totals.some((v) => !Number.isFinite(v))) return { total: 0, weightedTotals: [], factorForSecond: 0.5 };

  const maxVal = Math.max(...totals);
  const maxIdx = totals.findIndex((v) => v === maxVal);
  const primaryItem = arr[maxIdx];

  const getFactor = (item, idx) => {
    if (idx === maxIdx) return 1.0;
    const el = item?.panelElement ?? item?.dent?.panelElement ?? null;
    const primaryEl = primaryItem?.panelElement ?? primaryItem?.dent?.panelElement ?? null;

    if (el != null && primaryEl != null) {
      const samePart = String(el) === String(primaryEl);
      if (samePart) {
        return settings.discountSamePartEnabled
          ? Math.max(0, 1 - (Number(settings.discountSamePartValue) || 0) / 100)
          : 0.5;
      }
      return settings.discountDiffPartEnabled
        ? Math.max(0, 1 - (Number(settings.discountDiffPartValue) || 0) / 100)
        : 0.5;
    }
    if (settings.discountSamePartEnabled !== undefined) {
      return settings.discountSamePartEnabled
        ? Math.max(0, 1 - (Number(settings.discountSamePartValue) || 0) / 100)
        : 0.5;
    }
    return settings.enableSecondDentDiscount
      ? Math.max(0, 1 - (Number(settings.secondDentDiscountPercent) || 0) / 100)
      : 0.5;
  };

  const firstNonMaxIdx = arr.findIndex((_, i) => i !== maxIdx);
  const factorForSecond = firstNonMaxIdx >= 0 ? getFactor(arr[firstNonMaxIdx], firstNonMaxIdx) : 0.5;
  const weightedTotals = totals.map((v, i) => {
    if (i === maxIdx) return Math.max(0, v);
    return Math.max(0, v * getFactor(arr[i], i));
  });
  const total = weightedTotals.reduce((s, x) => s + x, 0);
  return { total, weightedTotals, factorForSecond };
}
