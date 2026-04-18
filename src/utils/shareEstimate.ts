import {
  formatMoneyWithCurrency,
  type DisplayCurrency,
  getRecordDisplayCurrency,
} from './regionFormat';

export const SHARE_CLIPBOARD_SUCCESS = 'CLIPBOARD_SUCCESS';

export interface ShareableRecord {
  client?: {
    name?: string;
    phone?: string;
    brand?: string;
    model?: string;
    plate?: string;
  };
  total: number;
  currency?: string;
  dents?: Array<{
    panelElement?: string;
    length?: number;
    width?: number;
    total?: number;
  }>;
  repairTimeHours?: number;
  masterName?: string;
  comment?: string;
}

function formatPhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

function displayCurrency(record: ShareableRecord): DisplayCurrency {
  return getRecordDisplayCurrency({
    recordCurrency: record.currency,
    recordCountry: record.currency === 'BYN' ? 'BY' : undefined,
  });
}

function formatMoneyAmount(amount: number, record: ShareableRecord): string {
  return formatMoneyWithCurrency(Number(amount) || 0, displayCurrency(record));
}

function formatTime(hours: number): string {
  if (!hours || hours <= 0) return '';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

/** Exported for unit tests */
export function buildShareText(record: ShareableRecord): string {
  const lines: string[] = [];

  const clientName = record.client?.name;
  lines.push(clientName ? `${clientName}, добрый день!` : 'Добрый день!');

  lines.push('');
  lines.push('Ваша оценка по ремонту вмятин готова.');

  const car = [record.client?.brand, record.client?.model].filter(Boolean).join(' ');
  if (car) lines.push(`Автомобиль: ${car}`);
  if (record.client?.plate) lines.push(`Гос. номер: ${record.client.plate}`);

  if (record.dents && record.dents.length > 0) {
    lines.push('');
    lines.push(`Повреждений: ${record.dents.length}`);
  }

  const hours = record.repairTimeHours;
  if (hours != null && Number.isFinite(Number(hours)) && Number(hours) > 0) {
    const h = Number(hours);
    const readyTime = new Date(Date.now() + h * 3600 * 1000);
    const timeStr = readyTime.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    lines.push(`Ориентировочное время: ${formatTime(h)}`);
    lines.push(`Готово примерно к: ${timeStr}`);
  }

  lines.push('');
  lines.push(`Итого: ${formatMoneyAmount(record.total, record)}`);

  if (record.masterName?.trim()) {
    lines.push('');
    lines.push(`Мастер: ${record.masterName.trim()}`);
  }

  if (record.comment?.trim()) {
    lines.push('');
    lines.push(`Комментарий: ${record.comment.trim()}`);
  }

  return lines.join('\n');
}

export async function shareEstimate(record: ShareableRecord): Promise<void> {
  const text = buildShareText(record);
  const phone = record.client?.phone ? formatPhone(record.client.phone) : null;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'Оценка DentMetric',
        text,
      });
      return;
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'AbortError') return;
    }
  }

  if (phone && phone.length >= 10) {
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    throw new Error(SHARE_CLIPBOARD_SUCCESS);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === SHARE_CLIPBOARD_SUCCESS) throw err;
    window.prompt('Скопируйте текст оценки:', text);
  }
}
