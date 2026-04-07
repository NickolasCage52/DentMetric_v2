/**
 * Нормализация телефона для ввода/отображения.
 * Поддержка старых форматов из истории: 89221661368, 8 922 166 13 68, +7...
 */

const DIGITS_ONLY = /\D/g;

/** Извлечь только цифры из строки */
export function digitsOnly(str: string | number | null | undefined): string {
  if (str == null) return '';
  return String(str).replace(DIGITS_ONLY, '');
}

/**
 * Нормализовать телефон в формат +7XXXXXXXXXX (10 цифр после +7).
 * Совместимо с историей: 8..., +7..., 7... → +79XXXXXXXXX
 */
export function normalizePhoneToStorage(phone: string | number | null | undefined): string {
  const d = digitsOnly(phone);
  if (d.length === 0) return '';
  // 11 цифр: 7 + 10 или 8 + 10
  if (d.startsWith('7') && d.length >= 11) {
    return '+' + d.slice(0, 11);
  }
  if (d.startsWith('8') && d.length >= 11) {
    return '+7' + d.slice(1, 11);
  }
  if (d.length >= 10) {
    return '+7' + d.slice(-10);
  }
  return '+7' + d;
}

export type PhoneInputRegion = 'RU' | 'BY';

/** 9 национальных цифр (после 375 / 80 / ведущей 8) для маски ввода BY */
function nationalDigitsForByInput(d: string): string {
  if (!d) return '';
  let rest = d;
  if (rest.startsWith('375')) rest = rest.slice(3);
  else if (rest.startsWith('80') && rest.length >= 2) rest = rest.slice(2);
  else if (rest.startsWith('8') && rest.length > 1) rest = rest.slice(1);
  return rest.slice(0, 9);
}

/**
 * Для поля ввода модалки: RU → +7 и 10 цифр; BY → +375 и 9 национальных цифр.
 */
export function normalizePhoneForInput(
  phone: string | number | null | undefined,
  region: PhoneInputRegion = 'RU'
): string {
  if (region === 'BY') {
    const d = digitsOnly(phone);
    const nat = nationalDigitsForByInput(d);
    if (!nat && d.length === 0) return '+375';
    return '+375' + nat;
  }
  const normalized = normalizePhoneToStorage(phone);
  if (normalized.length === 0) return '+7';
  return normalized;
}

/**
 * Отображение телефона: Беларусь +375 XX XXX-XX-XX
 */
export function formatPhoneDisplayBelarus(phone: string | number | null | undefined): string {
  const d = digitsOnly(phone);
  if (!d) return '';
  let rest = d;
  if (rest.startsWith('375') && rest.length >= 12) rest = rest.slice(3, 12);
  else if (rest.startsWith('80') && rest.length >= 11) rest = rest.slice(2, 11);
  else if (rest.length === 9) {
    /* уже без кода страны */
  } else if (rest.length > 9) rest = rest.slice(-9);
  if (rest.length < 9) return d.startsWith('375') ? `+${d}` : `+375 ${rest}`;
  const a = rest.slice(0, 2);
  const b = rest.slice(2, 5);
  const c = rest.slice(5, 7);
  const e = rest.slice(7, 9);
  return `+375 ${a} ${b}-${c}-${e}`;
}
