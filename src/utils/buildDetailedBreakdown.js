import { buildQuickFinalBreakdown } from './buildQuickFinalBreakdown';

export function buildDetailedBreakdownRows(dentItem, initialData, formatArmaturnayaSummary) {
  return buildQuickFinalBreakdown(dentItem, initialData, formatArmaturnayaSummary);
}

export function formatBreakdownDelta(delta) {
  if (delta == null || delta === 0) return '0 ₽';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('ru-RU').format(delta)} ₽`;
}

export function deltaClass(delta) {
  if (delta > 0) return 'text-white';
  return 'text-gray-500';
}
