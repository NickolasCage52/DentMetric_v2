/**
 * Build detailed breakdown rows for dent pricing display.
 * Used by Quick step 3 and Detail Quick-style final section.
 *
 * @param {Object} dentItem - { dent, base, breakdown }
 * @param {Object} initialData
 * @param {Function} formatArmaturnayaSummary - (codes, panelElement) => string
 * @returns {Array<{label: string, value: string, delta: number}>}
 */
export function buildDetailedBreakdownRows(dentItem, initialData, formatArmaturnayaSummary) {
  const dent = dentItem?.dent;
  const c = dent?.conditions || {};
  const base = dentItem?.base || 0;
  const pipeBreakdown = dentItem?.breakdown || [];
  const rows = [];

  const categoryMap = [
    { key: 'repairCode', label: 'Технология ремонта:', lookup: initialData?.repairTypes },
    { key: 'materialCode', label: 'Материал панели:', lookup: initialData?.materials },
    { key: 'riskCode', label: 'Сложность выполнения:', lookup: initialData?.risks },
    { key: 'carClassCode', label: 'Класс автомобиля:', lookup: initialData?.carClasses }
  ];

  for (const cat of categoryMap) {
    const code = c[cat.key];
    const obj = code ? (cat.lookup || []).find((o) => o.code === code) : null;
    const valueName = obj?.name || '—';
    const pipeLine = pipeBreakdown.find((l) => l.name === valueName);
    let delta = 0;
    if (pipeLine?.value?.startsWith('×')) {
      const mult = parseFloat(String(pipeLine.value).replace('×', '')) || 1;
      delta = Math.round(base * (mult - 1));
    }
    rows.push({ label: cat.label, value: valueName, delta });
  }

  const disCodes = Array.isArray(c.disassemblyCodes) ? c.disassemblyCodes : [];
  const disLine = pipeBreakdown.find((l) => l.value?.includes?.('₽') && !String(l.name || '').toLowerCase().includes('баз') && !String(l.name || '').toLowerCase().includes('шумо'));
  const disCost = disLine ? parseInt(String(disLine.value || '').replace(/[^\d-]/g, ''), 10) || 0 : 0;
  const disLabel = formatArmaturnayaSummary ? formatArmaturnayaSummary(disCodes, dent?.panelElement) : (disCodes.length ? `${disCodes.length} выбрано` : 'Без арматурных работ');
  rows.push({ label: 'Арматурные работы:', value: disLabel || 'Без арматурных работ', delta: disCost });

  const soundObj = c.soundInsulationCode
    ? (initialData?.soundInsulation || []).find((s) => s.code === c.soundInsulationCode)
    : null;
  const soundLine = pipeBreakdown.find((l) => String(l.name || '').toLowerCase().includes('шумо'));
  const soundCost = soundLine ? parseInt(String(soundLine.value || '').replace(/[^\d-]/g, ''), 10) || 0 : (soundObj?.price ?? 0);
  rows.push({ label: 'Дополнительная шумоизоляция:', value: soundObj?.name || '—', delta: soundCost });

  return rows;
}

export function formatBreakdownDelta(delta) {
  if (!delta || delta === 0) return '0 ₽';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('ru-RU').format(delta)} ₽`;
}

export function deltaClass(delta) {
  if (delta > 0) return 'text-white';
  return 'text-gray-500';
}
