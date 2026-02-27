/**
 * DEV self-checks for settings: stripe presets, price multipliers, discount logic, migration.
 * Runs only when import.meta.env.DEV.
 */
import { STRIPE_PRESETS_DISPLAY } from './stripeCalc';
import { getPriceMultiplier, migrateSettings, getDiscountRate } from './settingsUtils';

export function runDevAuditSettings() {
  if (!import.meta.env?.DEV) return;

  // 1. Stripe presets match PDF
  const expectedStripe = [
    [5, 4000],
    [18, 8000],
    [20, 9000],
    [21, 12000],
    [36, 15000],
    [50, 15000],
    [100, 22000]
  ];
  expectedStripe.forEach(([len, price]) => {
    const preset = STRIPE_PRESETS_DISPLAY.find((p) => p.lengthCm === len);
    if (preset?.base !== price) {
      console.assert(false, `[DM Settings] Stripe preset ${len}cm: expected ${price}, got ${preset?.base}`);
    }
  });
  console.log('[DM Settings] Stripe presets: OK');

  // 2. Price multipliers: both circle and stripe use direct price adjustment → 1.0
  const mockSettings = { priceAdjustmentStripe: 0.9 };
  console.assert(
    getPriceMultiplier('circle', mockSettings) === 1.0,
    '[DM Settings] Circle multiplier must be 1.0'
  );
  console.assert(
    getPriceMultiplier('stripe', mockSettings) === 1.0,
    '[DM Settings] Stripe multiplier must be 1.0 (direct price adjustment)'
  );
  console.log('[DM Settings] Price multipliers: OK');

  // 3. Discount same part (one element)
  const settingsA = {
    discountSamePartEnabled: true,
    discountSamePartValue: 50,
    discountDiffPartEnabled: false,
    discountDiffPartValue: 0
  };
  const dentSame1 = { element: 'door', price: 5000 };
  const dentSame2 = { element: 'door', price: 3000 };
  const rateA = getDiscountRate(dentSame2, dentSame1, settingsA);
  console.assert(rateA === 0.5, `[DM Settings] Same part discount: expected 0.5, got ${rateA}`);
  console.log('[DM Settings] Discount same part: OK');

  // 4. Discount diff part (different elements)
  const dentDiff1 = { element: 'door', price: 5000 };
  const dentDiff2 = { element: 'hood', price: 3000 };
  const settingsB = {
    discountSamePartEnabled: true,
    discountSamePartValue: 50,
    discountDiffPartEnabled: true,
    discountDiffPartValue: 30
  };
  const rateB = getDiscountRate(dentDiff2, dentDiff1, settingsB);
  console.assert(rateB === 0.3, `[DM Settings] Diff part discount: expected 0.3, got ${rateB}`);
  console.log('[DM Settings] Discount diff part: OK');

  // 5. Migration: old priceAdjustment → both
  const oldSettings = { priceAdjustment: 1.1 };
  const migrated = migrateSettings(oldSettings);
  console.assert(
    migrated.priceAdjustmentRoundOval === 1.1,
    'Migration RoundOval failed'
  );
  console.assert(migrated.priceAdjustmentStripe === 1.1, 'Migration Stripe failed');
  console.log('[DM Settings] Migration priceAdjustment: OK');

  // 6. Migration: old enableSecondDentDiscount → discountSamePart
  const oldDiscount = {
    enableSecondDentDiscount: true,
    secondDentDiscountPercent: 50
  };
  const migratedD = migrateSettings(oldDiscount);
  console.assert(
    migratedD.discountSamePartEnabled === true,
    'Migration discountSamePart failed'
  );
  console.assert(
    migratedD.discountSamePartValue === 50,
    'Migration discountSameValue failed'
  );
  console.assert(
    migratedD.discountDiffPartEnabled === false,
    'Migration discountDiffPart default failed'
  );
  console.log('[DM Settings] Migration discount: OK');
}
