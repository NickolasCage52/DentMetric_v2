import { buildQuickFinalBreakdown } from './buildQuickFinalBreakdown';
import { formatMoneyWithCurrency } from './regionFormat';

export function buildDetailedBreakdownRows(dentItem, initialData, formatArmaturnayaSummary) {
  return buildQuickFinalBreakdown(dentItem, initialData, formatArmaturnayaSummary);
}

/**
 * @param {number|null|undefined} delta
 * @param {'RUB'|'BYN'} [displayCurrency]
 */
export function formatBreakdownDelta(delta, displayCurrency = 'RUB') {
  const cur = displayCurrency === 'BYN' ? 'BYN' : 'RUB';
  if (delta == null || delta === 0) return formatMoneyWithCurrency(0, cur);
  const n = Number(delta);
  const core = formatMoneyWithCurrency(Math.abs(n), cur);
  if (n < 0) return `−${core}`;
  if (n > 0) return `+${core}`;
  return formatMoneyWithCurrency(0, cur);
}

export function deltaClass(delta) {
  if (delta > 0) return 'text-white';
  return 'text-gray-500';
}
