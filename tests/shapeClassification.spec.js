/**
 * Unit tests for shape classification by width/height ratio.
 * L = max(w,h), H = min(w,h), r = L/H
 * r ≤ 1.20 → round; r ≥ 2.40 and L ≥ 50mm → stripe; else → oval
 */
import { describe, it, expect } from 'vitest';
import { classifyShapeByRatio } from '../src/utils/shapeClassification';

describe('classifyShapeByRatio', () => {
  describe('task examples', () => {
    it('5×2 cm (50×20 mm) r=2.5 → stripe', () => {
      expect(classifyShapeByRatio({ widthMm: 50, heightMm: 20 })).toBe('stripe');
    });
    it('6×4.5 cm (60×45 mm) → oval', () => {
      expect(classifyShapeByRatio({ widthMm: 60, heightMm: 45 })).toBe('oval');
    });
    it('18×8.5 cm → oval', () => {
      expect(classifyShapeByRatio({ widthMm: 180, heightMm: 85 })).toBe('oval');
    });
    it('20×2 cm (200×20 mm) → stripe', () => {
      expect(classifyShapeByRatio({ widthMm: 200, heightMm: 20 })).toBe('stripe');
    });
    it('3×1 cm (30×10 mm) r=3 but L<50mm → oval', () => {
      expect(classifyShapeByRatio({ widthMm: 30, heightMm: 10 })).toBe('oval');
    });
  });

  describe('round (r ≤ 1.20)', () => {
    it('square 30×30 → round', () => {
      expect(classifyShapeByRatio({ widthMm: 30, heightMm: 30 })).toBe('round');
    });
    it('near-square 36×30 (r=1.2) → round', () => {
      expect(classifyShapeByRatio({ widthMm: 36, heightMm: 30 })).toBe('round');
    });
    it('reversed 30×36 → round', () => {
      expect(classifyShapeByRatio({ widthMm: 30, heightMm: 36 })).toBe('round');
    });
    it('r=1.19 → round', () => {
      expect(classifyShapeByRatio({ widthMm: 119, heightMm: 100 })).toBe('round');
    });
  });

  describe('stripe (r ≥ 2.4 and L ≥ 50mm)', () => {
    it('50×20 r=2.5 exactly and L=50 → stripe', () => {
      expect(classifyShapeByRatio({ widthMm: 50, heightMm: 20 })).toBe('stripe');
    });
    it('20×50 reversed → stripe', () => {
      expect(classifyShapeByRatio({ widthMm: 20, heightMm: 50 })).toBe('stripe');
    });
    it('125×50 r=2.5 → stripe', () => {
      expect(classifyShapeByRatio({ widthMm: 125, heightMm: 50 })).toBe('stripe');
    });
    it('120×50 r=2.4 exactly and L>=50 → stripe', () => {
      expect(classifyShapeByRatio({ widthMm: 120, heightMm: 50 })).toBe('stripe');
    });
    it('60×24 r=2.5 and L>=50 → stripe', () => {
      expect(classifyShapeByRatio({ widthMm: 60, heightMm: 24 })).toBe('stripe');
    });
    it('30×10 r=3 but L<50 → oval', () => {
      expect(classifyShapeByRatio({ widthMm: 30, heightMm: 10 })).toBe('oval');
    });
  });

  describe('oval (1.2 < r < 2.4 OR L < 50mm)', () => {
    it('r between 1.2 and 2.5 → oval', () => {
      expect(classifyShapeByRatio({ widthMm: 60, heightMm: 45 })).toBe('oval');
    });
    it('r=2.39 → oval', () => {
      expect(classifyShapeByRatio({ widthMm: 100, heightMm: 42 })).toBe('oval');
    });
    it('r=1.21 → oval', () => {
      expect(classifyShapeByRatio({ widthMm: 121, heightMm: 100 })).toBe('oval');
    });
    it('r>=2.4 but L<50 → oval', () => {
      expect(classifyShapeByRatio({ widthMm: 48, heightMm: 20 })).toBe('oval');
    });
  });

  describe('edge cases', () => {
    it('zero width → oval (fallback)', () => {
      expect(classifyShapeByRatio({ widthMm: 0, heightMm: 50 })).toBe('oval');
    });
    it('zero height → oval (fallback)', () => {
      expect(classifyShapeByRatio({ widthMm: 50, heightMm: 0 })).toBe('oval');
    });
    it('negative treated as 0 → oval', () => {
      expect(classifyShapeByRatio({ widthMm: -10, heightMm: 50 })).toBe('oval');
    });
    it('r=2.5 exactly and L>=50 → stripe', () => {
      expect(classifyShapeByRatio({ widthMm: 50, heightMm: 20 })).toBe('stripe');
    });
  });
});
