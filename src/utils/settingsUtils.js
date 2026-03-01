/**
 * Settings utilities: migration, validation, price multipliers, discount rates.
 * Single source of truth for settings-related logic used by Quick and Detail modes.
 */

export const SETTINGS_KEY = 'dentRepairSettings_v6';
export const SETTINGS_KEY_V5 = 'dentRepairSettings_v5';

/**
 * Migrate old settings keys to new schema (backward compatibility).
 * @param {object} raw - raw parsed settings
 * @returns {object} migrated settings
 */
export function migrateSettings(raw) {
  const settings = { ...(typeof raw === 'object' && raw !== null ? raw : {}) };

  // priceAdjustment (legacy) → priceAdjustmentRoundOval + priceAdjustmentStripe
  if ('priceAdjustment' in settings && !('priceAdjustmentRoundOval' in settings)) {
    const v = Number(settings.priceAdjustment);
    settings.priceAdjustmentRoundOval = Number.isFinite(v) ? v : 1.0;
    settings.priceAdjustmentStripe = Number.isFinite(v) ? v : 1.0;
  }
  if (!('priceAdjustmentRoundOval' in settings)) settings.priceAdjustmentRoundOval = 1.0;
  if (!('priceAdjustmentStripe' in settings)) settings.priceAdjustmentStripe = 1.0;

  // secondDentDiscountEnabled + secondDentDiscountValue → discountSamePart + discountDiffPart
  if ('secondDentDiscountEnabled' in settings && !('discountSamePartEnabled' in settings)) {
    settings.discountSamePartEnabled = Boolean(settings.secondDentDiscountEnabled);
    settings.discountSamePartValue = Math.max(0, Math.min(100, Number(settings.secondDentDiscountValue) || 50));
    settings.discountDiffPartEnabled = false;
    settings.discountDiffPartValue = 0;
  }
  if ('enableSecondDentDiscount' in settings && !('discountSamePartEnabled' in settings)) {
    settings.discountSamePartEnabled = Boolean(settings.enableSecondDentDiscount);
    settings.discountSamePartValue = Math.max(0, Math.min(100, Number(settings.secondDentDiscountPercent) || 50));
    settings.discountDiffPartEnabled = false;
    settings.discountDiffPartValue = 0;
  }
  if (!('discountSamePartEnabled' in settings)) settings.discountSamePartEnabled = true;
  if (!('discountSamePartValue' in settings)) settings.discountSamePartValue = 50;
  if (!('discountDiffPartEnabled' in settings)) settings.discountDiffPartEnabled = false;
  if (!('discountDiffPartValue' in settings)) settings.discountDiffPartValue = 0;

  return settings;
}

/**
 * Validate and clamp settings values.
 * @param {object} s
 * @returns {object}
 */
export function validateSettings(s) {
  const out = { ...s };
  out.priceAdjustmentRoundOval = Math.max(0.5, Math.min(2.0, Number(out.priceAdjustmentRoundOval) || 1.0));
  out.priceAdjustmentStripe = Math.max(0.5, Math.min(2.0, Number(out.priceAdjustmentStripe) || 1.0));
  out.discountSamePartValue = Math.max(0, Math.min(100, Number(out.discountSamePartValue) || 0));
  out.discountDiffPartValue = Math.max(0, Math.min(100, Number(out.discountDiffPartValue) || 0));
  return out;
}

/**
 * Get price multiplier for dent type.
 * isStripe → priceAdjustmentStripe; otherwise → priceAdjustmentRoundOval.
 */
export function getPriceMultiplier(dentType, settings = {}) {
  const s = settings || {};
  const isStripe = ['strip', 'stripe', 'scratch'].includes(String(dentType || '').toLowerCase());
  if (isStripe) return Number(s.priceAdjustmentStripe) || 1.0;
  return Number(s.priceAdjustmentRoundOval) || 1.0;
}

/**
 * Get discount rate for a non-primary dent based on same/different element.
 * @param {{ element?: string, panelElement?: string }} dent - current dent (not the most expensive)
 * @param {{ element?: string, panelElement?: string }} primaryDent - most expensive dent
 * @param {object} settings
 * @returns {number} 0..1 (e.g. 0.5 = 50% discount)
 */
export function getDiscountRate(dent, primaryDent, settings = {}) {
  const el = dent?.panelElement ?? dent?.element ?? null;
  const primaryEl = primaryDent?.panelElement ?? primaryDent?.element ?? null;
  const samePart = el && primaryEl && String(el) === String(primaryEl);

  if (samePart) {
    if (settings.discountSamePartEnabled !== undefined) {
      return settings.discountSamePartEnabled ? (Number(settings.discountSamePartValue) || 0) / 100 : 0;
    }
    if (settings.enableSecondDentDiscount) {
      return (Number(settings.secondDentDiscountPercent) || 50) / 100;
    }
    return 0;
  }
  if (el != null || primaryEl != null) {
    return settings.discountDiffPartEnabled ? (Number(settings.discountDiffPartValue) || 0) / 100 : 0;
  }
  if (settings.enableSecondDentDiscount) {
    return (Number(settings.secondDentDiscountPercent) || 50) / 100;
  }
  return settings.discountSamePartEnabled ? (Number(settings.discountSamePartValue) || 0) / 100 : 0;
}
