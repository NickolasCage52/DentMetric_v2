/**
 * Unit tests for NEW stripe ("Полоса/Царапина") complexity coefficients.
 * Source of truth: official table for height = 2cm (20mm).
 */
import { describe, it, expect } from 'vitest';
import {
  getStripeCoefficient,
  getStripePresetLengthCm,
  STRIPE_COEFFICIENTS_H2CM
} from '../src/features/pricing/stripeCoefficients';

describe('stripeCoefficients', () => {
  it('preset selection uses ceil-to-next and clamps', () => {
    expect(getStripePresetLengthCm(0.1)).toBe(5);
    expect(getStripePresetLengthCm(5)).toBe(5);
    expect(getStripePresetLengthCm(5.01)).toBe(18);
    expect(getStripePresetLengthCm(19.9)).toBe(20);
    expect(getStripePresetLengthCm(999)).toBe(100);
  });

  it('height=20mm uses official table exactly', () => {
    const lengthCmRows = [5, 18, 20, 21, 36, 50, 100];
    /** @type {Array<'K1'|'K2'|'K3'|'K4'>} */
    const keys = ['K1', 'K2', 'K3', 'K4'];

    for (const lengthCm of lengthCmRows) {
      for (const kKey of keys) {
        const expected = STRIPE_COEFFICIENTS_H2CM[lengthCm][kKey];
        const got = getStripeCoefficient({ lengthMm: lengthCm * 10, heightMm: 20, kKey });
        expect(got).toBeCloseTo(expected, 6);
      }
    }
  });

  it('height!=20mm uses effective length mapping (no invented coefficients)', () => {
    // Example: L=50cm, H=10mm => equivLength = 500mm*(10/20)=250mm => 25cm => ceil => 36cm row
    const got = getStripeCoefficient({ lengthMm: 500, heightMm: 10, kKey: 'K2' });
    expect(got).toBeCloseTo(1.25, 6);
  });
});

