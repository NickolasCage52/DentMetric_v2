/**
 * Региональное отображение: BYN = RUB / 27 (временный курс, без внешнего API).
 * Суммы в данных истории хранятся в RUB; recordCurrency определяет подпись и деление при показе.
 */

export const BYN_PER_RUB = 27;

export type DisplayCurrency = 'RUB' | 'BYN';

export function getRecordDisplayCurrency(record: {
  recordCurrency?: string;
  recordCountry?: string;
} | null | undefined): DisplayCurrency {
  if (!record) return 'RUB';
  if (record.recordCurrency === 'BYN' || record.recordCountry === 'BY') return 'BYN';
  return 'RUB';
}

/** Формат числа для UI (без суффикса валюты). */
export function formatRubForDisplay(amountRub: number, currency: DisplayCurrency = 'RUB'): string {
  const n = Number(amountRub);
  if (!Number.isFinite(n)) return '0';
  if (currency === 'BYN') {
    const byn = n / BYN_PER_RUB;
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(byn);
  }
  return new Intl.NumberFormat('ru-RU').format(Math.round(n));
}

export function currencySuffix(currency: DisplayCurrency): string {
  return currency === 'BYN' ? 'BYN' : '₽';
}

export function formatMoneyWithCurrency(amountRub: number, currency: DisplayCurrency = 'RUB'): string {
  return `${formatRubForDisplay(amountRub, currency)} ${currencySuffix(currency)}`;
}

/** Валюта интерфейса по текущим настройкам приложения (не по записи истории). */
export function displayCurrencyForRegionCountry(regionCountry: string | undefined | null): DisplayCurrency {
  return regionCountry === 'BY' ? 'BYN' : 'RUB';
}
