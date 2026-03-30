/**
 * Human-readable repair duration from decimal hours (Detail / History parity).
 */
export function formatRepairTime(hours: number): string {
  const x = Number(hours);
  if (!Number.isFinite(x) || x < 0) return '0 мин';
  const h = Math.floor(x);
  let m = Math.round((x - h) * 60);
  if (m === 60) {
    return formatRepairTime(h + 1);
  }
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}
