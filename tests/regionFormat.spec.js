import { describe, it, expect } from 'vitest';
import {
  BYN_PER_RUB,
  getRecordDisplayCurrency,
  formatRubForDisplay,
  formatMoneyWithCurrency,
  displayCurrencyForRegionCountry,
} from '../src/utils/regionFormat';

describe('regionFormat', () => {
  it('getRecordDisplayCurrency reads record fields', () => {
    expect(getRecordDisplayCurrency({})).toBe('RUB');
    expect(getRecordDisplayCurrency({ recordCountry: 'BY' })).toBe('BYN');
    expect(getRecordDisplayCurrency({ recordCurrency: 'BYN' })).toBe('BYN');
  });

  it('formatRubForDisplay divides by 27 for BYN', () => {
    expect(formatRubForDisplay(2700, 'BYN')).toBe('100,00');
    expect(BYN_PER_RUB).toBe(27);
  });

  it('formatMoneyWithCurrency appends suffix', () => {
    expect(formatMoneyWithCurrency(1000, 'RUB')).toContain('₽');
    expect(formatMoneyWithCurrency(2700, 'BYN')).toContain('BYN');
  });

  it('displayCurrencyForRegionCountry maps settings', () => {
    expect(displayCurrencyForRegionCountry('RU')).toBe('RUB');
    expect(displayCurrencyForRegionCountry('BY')).toBe('BYN');
    expect(displayCurrencyForRegionCountry(undefined)).toBe('RUB');
  });
});
