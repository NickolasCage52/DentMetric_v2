import { encodeStripeMatrixKey } from '../features/pricing/stripeCoefficients';

export function ellipseAreaMm2(w, h) {
  return Math.PI * (w / 2) * (h / 2);
}

export function rectAreaMm2(w, h) {
  return w * h;
}

export function getShapeAreaMm2(shape, widthMm, heightMm) {
  const w = Number(widthMm) || 0;
  const h = Number(heightMm) || 0;
  if (shape === 'circle') return ellipseAreaMm2(w, h);
  return rectAreaMm2(w, h);
}

export function getClosestSizeCodeByAreaMm2(areaMm2, sizes) {
  if (!sizes || sizes.length === 0 || !Number.isFinite(areaMm2)) return null;
  let closest = sizes[0];
  let minDist = Math.abs((closest.areaMm2 ?? 0) - areaMm2);
  for (const s of sizes) {
    const dist = Math.abs((s.areaMm2 ?? 0) - areaMm2);
    if (dist < minDist) {
      minDist = dist;
      closest = s;
    }
  }
  return closest?.code || null;
}

export function getInterpolatedPriceByAreaMm2(areaMm2, sizes, prices) {
  if (!sizes || sizes.length === 0 || !Number.isFinite(areaMm2)) return 0;
  const sorted = [...sizes].sort((a, b) => a.areaMm2 - b.areaMm2);
  if (areaMm2 <= sorted[0].areaMm2) return prices[sorted[0].code] ?? 0;
  const last = sorted[sorted.length - 1];
  const areaS11 = last.areaMm2 ?? 0;
  const priceS11 = prices[last.code] ?? 15000;
  if (areaMm2 <= areaS11) {
    for (let i = 0; i < sorted.length - 1; i++) {
      const s1 = sorted[i];
      const s2 = sorted[i + 1];
      if (areaMm2 >= s1.areaMm2 && areaMm2 <= s2.areaMm2) {
        const p1 = prices[s1.code] ?? 0;
        const p2 = prices[s2.code] ?? 0;
        const ratio = (areaMm2 - s1.areaMm2) / (s2.areaMm2 - s1.areaMm2);
        return p1 + (p2 - p1) * ratio;
      }
    }
    return priceS11;
  }
  const extraArea = areaMm2 - areaS11;
  const markup = Math.max(500, 3500 * Math.log(1 + extraArea / 50000));
  return priceS11 + markup;
}

export function getSizeCodeForMatrix(shape, widthMm, heightMm, sizes) {
  if (shape === 'strip') {
    // Stripe/царапина: synthetic sizeCode encodes geometry for new coefficient lookup.
    // (Do NOT rely on complexityMatrix.STRIP_DEFAULT anymore for stripe.)
    return encodeStripeMatrixKey(widthMm, heightMm);
  }
  if (shape !== 'circle') return 'STRIP_DEFAULT';
  const areaMm2 = getShapeAreaMm2('circle', widthMm, heightMm);
  return getClosestSizeCodeByAreaMm2(areaMm2, sizes) || 'S2';
}

export function getBasePriceByMm(shape, widthMm, heightMm, sizesWithArea, prices) {
  const areaMm2 = getShapeAreaMm2(shape, widthMm, heightMm);
  return getInterpolatedPriceByAreaMm2(areaMm2, sizesWithArea, prices);
}
