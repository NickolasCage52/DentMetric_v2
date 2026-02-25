/**
 * Unit tests for stripe ("Полоса/Царапина") encoding/parsing.
 * Price calculation: stripeCalc.test.js
 */
import { describe, it, expect } from 'vitest';
import { encodeStripeMatrixKey, parseStripeMatrixKey } from '../src/features/pricing/stripeCoefficients';

describe('stripeCoefficients', () => {
  describe('encodeStripeMatrixKey', () => {
    it('encodes L×H as STRIPE_LxH', () => {
      expect(encodeStripeMatrixKey(80, 10)).toBe('STRIPE_80x10');
      expect(encodeStripeMatrixKey(180, 20)).toBe('STRIPE_180x20');
    });
    it('uses max as length, min as height', () => {
      expect(encodeStripeMatrixKey(10, 80)).toBe('STRIPE_80x10');
    });
  });

  describe('parseStripeMatrixKey', () => {
    it('parses valid keys', () => {
      expect(parseStripeMatrixKey('STRIPE_80x10')).toEqual({ lengthMm: 80, heightMm: 10 });
      expect(parseStripeMatrixKey('STRIPE_180x20')).toEqual({ lengthMm: 180, heightMm: 20 });
    });
    it('returns null for invalid keys', () => {
      expect(parseStripeMatrixKey('STRIP_DEFAULT')).toBeNull();
      expect(parseStripeMatrixKey('S2')).toBeNull();
      expect(parseStripeMatrixKey('')).toBeNull();
    });
  });
});
