import { describe, expect, it } from 'vitest';
import { normalizePhoneForInput } from '../src/utils/phoneFormat';

describe('normalizePhoneForInput', () => {
  it('RU: пусто → +7', () => {
    expect(normalizePhoneForInput('', 'RU')).toBe('+7');
    expect(normalizePhoneForInput(null, 'RU')).toBe('+7');
  });

  it('RU: 8 и 10 цифр → +7', () => {
    expect(normalizePhoneForInput('89001234567', 'RU')).toBe('+79001234567');
  });

  it('BY: пусто → +375', () => {
    expect(normalizePhoneForInput('', 'BY')).toBe('+375');
  });

  it('BY: полный 375 и национальные 9 цифр', () => {
    expect(normalizePhoneForInput('375291112233', 'BY')).toBe('+375291112233');
    expect(normalizePhoneForInput('+375 29 111-22-33', 'BY')).toBe('+375291112233');
  });

  it('BY: формат 80…', () => {
    expect(normalizePhoneForInput('80291112233', 'BY')).toBe('+375291112233');
  });
});
