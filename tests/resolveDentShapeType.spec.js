/**
 * Тесты для resolveDentShapeType — тип формы ТОЛЬКО по размерам, не от пресета.
 */
import { describe, it, expect } from 'vitest';
import { resolveDentShapeType, getResolvedShapeDisplayLabel } from '../src/utils/resolveDentShapeType';

describe('resolveDentShapeType', () => {
  it('stripe: 300×40 → stripe', () => {
    expect(resolveDentShapeType(300, 40)).toBe('stripe');
  });
  it('stripe: 200×20 → stripe', () => {
    expect(resolveDentShapeType(200, 20)).toBe('stripe');
  });
  it('stripe: 80×20 → stripe', () => {
    expect(resolveDentShapeType(80, 20)).toBe('stripe');
  });
  it('stripe: 100×40 → stripe', () => {
    expect(resolveDentShapeType(100, 40)).toBe('stripe');
  });
  it('oval: 100×100 (ratio 1:1) → oval', () => {
    expect(resolveDentShapeType(100, 100)).toBe('oval');
  });
  it('oval: 50×50 → oval', () => {
    expect(resolveDentShapeType(50, 50)).toBe('oval');
  });
  it('oval: 80×70 (near-square) → oval', () => {
    expect(resolveDentShapeType(80, 70)).toBe('oval');
  });
  it('oval: 30×5 (ширина вне диапазона) → oval', () => {
    expect(resolveDentShapeType(30, 5)).toBe('oval');
  });
  it('oval: 0×0 fallback', () => {
    expect(resolveDentShapeType(0, 0)).toBe('oval');
  });
  it('одинаковые размеры дают одинаковый тип независимо от порядка аргументов', () => {
    expect(resolveDentShapeType(300, 40)).toBe(resolveDentShapeType(40, 300));
    expect(resolveDentShapeType(100, 100)).toBe(resolveDentShapeType(100, 100));
  });
});

describe('getResolvedShapeDisplayLabel', () => {
  it('100×100 → Круг', () => {
    expect(getResolvedShapeDisplayLabel(100, 100)).toBe('Круг');
  });
  it('300×40 → Полоса', () => {
    expect(getResolvedShapeDisplayLabel(300, 40)).toBe('Полоса');
  });
  it('80×70 → Овал', () => {
    expect(getResolvedShapeDisplayLabel(80, 70)).toBe('Овал');
  });
});
