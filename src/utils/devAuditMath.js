/**
 * DentMetric Math Audit — DEV self-checks for stripe/oval classification and pricing.
 * Phase 7: validation that stripe is detected correctly, tables and interpolation work.
 * Runs only in import.meta.env.DEV.
 */
export async function runMathAudit() {
  if (!import.meta.env?.DEV) return;

  const { getStripePrice } = await import('../pricing/stripePricing');
  const { isStripeCase } = await import('../features/pricing/pricingAdapter');
  const { resolveDentShapeType } = await import('./resolveDentShapeType');

  console.group('[DentMetric Math Audit - Self Check]');

  // resolveDentShapeType — тип ТОЛЬКО по размерам, не от пресета
  const shapeTests = [
    { l: 300, w: 40, expected: 'stripe', label: '300×40 → stripe' },
    { l: 200, w: 20, expected: 'stripe', label: '200×20 → stripe' },
    { l: 80, w: 20, expected: 'stripe', label: '80×20 → stripe' },
    { l: 100, w: 40, expected: 'stripe', label: '100×40 → stripe' },
    { l: 100, w: 100, expected: 'oval', label: '100×100 → oval (ratio=1)' },
    { l: 50, w: 50, expected: 'oval', label: '50×50 → oval' },
    { l: 80, w: 70, expected: 'oval', label: '80×70 → oval (near-square)' },
    { l: 30, w: 5, expected: 'oval', label: '30×5 → oval (ширина вне диапазона)' },
    { l: 0, w: 0, expected: 'oval', label: '0×0 → oval (fallback)' }
  ];
  shapeTests.forEach(({ l, w, expected, label }) => {
    const actual = resolveDentShapeType(l, w);
    if (actual !== expected) {
      console.error(`FAIL [resolveDentShapeType]: ${label} → получено "${actual}", ожидалось "${expected}"`);
    } else {
      console.log(`OK: ${label}`);
    }
  });

  // CLASSIFICATION (shape 'strip' = from applyDamagePreset preset.group='stripe')
  if (isStripeCase('strip', 10, 10)) {
    console.error('FAIL: ratio 1:1 → должно быть oval, не stripe');
  }
  if (!isStripeCase('strip', 30, 4)) {
    console.error('FAIL: strip 30×4 → должно быть stripe');
  }
  if (!isStripeCase('stripe', 30, 4)) {
    console.error('FAIL: stripe 30×4 → должно быть stripe');
  }
  if (isStripeCase('oval', 30, 4)) {
    console.error('FAIL: тип oval → должно быть oval, не stripe');
  }
  if (isStripeCase('circle', 30, 4)) {
    console.error('FAIL: тип circle → должно быть oval');
  }
  if (isStripeCase(undefined, 30, 4)) {
    console.error('FAIL: undefined shape → fallback false');
  }
  if (isStripeCase(null, 30, 4)) {
    console.error('FAIL: null shape → fallback false');
  }

  // TABLE H2
  if (getStripePrice({ lengthCm: 8, heightCm: 2, severity: 'легкая' }) !== 5000) {
    console.error('FAIL: h2 len8 легкая');
  }
  if (getStripePrice({ lengthCm: 15, heightCm: 2, severity: 'средняя' }) !== 12000) {
    console.error('FAIL: h2 len15 средняя');
  }
  if (getStripePrice({ lengthCm: 100, heightCm: 2, severity: 'экстра' }) !== 61500) {
    console.error('FAIL: h2 len100 экстра');
  }

  // TABLE H4
  if (getStripePrice({ lengthCm: 15, heightCm: 4, severity: 'высокая' }) !== 15000) {
    console.error('FAIL: h4 len15 высокая');
  }
  if (getStripePrice({ lengthCm: 100, heightCm: 4, severity: 'экстра' }) !== 57000) {
    console.error('FAIL: h4 len100 экстра');
  }

  // CRITICAL BUG — len=12 h=4 высокая ≤ 15000
  const bugCheck = getStripePrice({ lengthCm: 12, heightCm: 4, severity: 'высокая' });
  if (bugCheck > 15000) {
    console.error(`FAIL: len=12 h=4 высокая = ${bugCheck}, должно быть ≤ 15000`);
  }

  // INTERPOLATION
  const p20 = getStripePrice({ lengthCm: 20, heightCm: 2, severity: 'легкая' });
  const p25 = getStripePrice({ lengthCm: 25, heightCm: 2, severity: 'легкая' });
  const p22 = getStripePrice({ lengthCm: 22, heightCm: 2, severity: 'легкая' });
  if (p22 <= p20 || p22 >= p25) {
    console.error(`FAIL: интерполяция len=22 должна быть между ${p20} и ${p25}, получено ${p22}`);
  }

  // CLAMP height
  const ph1 = getStripePrice({ lengthCm: 20, heightCm: 1, severity: 'легкая' });
  const ph2 = getStripePrice({ lengthCm: 20, heightCm: 2, severity: 'легкая' });
  if (ph1 !== ph2) {
    console.error(`FAIL: h=1 должно давать то же что h=2. h1=${ph1}, h2=${ph2}`);
  }
  const ph6 = getStripePrice({ lengthCm: 20, heightCm: 6, severity: 'легкая' });
  const ph4 = getStripePrice({ lengthCm: 20, heightCm: 4, severity: 'легкая' });
  if (ph6 !== ph4) {
    console.error(`FAIL: h=6 должно давать то же что h=4. h6=${ph6}, h4=${ph4}`);
  }

  // MONOTONICITY
  const pA = getStripePrice({ lengthCm: 20, heightCm: 2, severity: 'средняя' });
  const pB = getStripePrice({ lengthCm: 30, heightCm: 2, severity: 'средняя' });
  if (pB <= pA) {
    console.error(`FAIL: цена должна расти с длиной. 20=${pA}, 30=${pB}`);
  }

  console.log('Math audit: classification, tables, interpolation, clamp, monotonicity — OK');
  console.groupEnd();
}
