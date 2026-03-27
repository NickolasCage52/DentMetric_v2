/**
 * Разбор строки вмятины для итогового экрана (быстрый расчёт и детализация).
 * Единая реализация — не передавать функцию через цепочку пропсов.
 */
export function buildQuickFinalBreakdown(dentItem, initialData, formatArmaturnayaSummary) {
  const dent = dentItem?.dent;
  if (!dent) return [];
  const c = dent.conditions || {};
  const base = dentItem.base || 0;
  const pipeBreakdown = dentItem.breakdown || [];
  const rows = [];

  const categoryMap = [
    { key: 'repairCode', label: 'Технология ремонта:', lookup: initialData?.repairTypes },
    { key: 'materialCode', label: 'Материал панели:', lookup: initialData?.materials },
    { key: 'riskCode', label: 'Сложность выполнения:', lookup: initialData?.risks },
    { key: 'carClassCode', label: 'Класс автомобиля:', lookup: initialData?.carClasses },
  ];

  for (const cat of categoryMap) {
    const code = c[cat.key];
    const obj = code ? cat.lookup?.find((o) => o.code === code) : null;
    const valueName = obj?.name || '—';
    const pipeLine = pipeBreakdown.find((l) => l.name === valueName);
    let delta = 0;
    if (pipeLine) {
      const v = pipeLine.value || '';
      if (v.startsWith('×')) {
        const mult = parseFloat(v.replace('×', ''));
        delta = Math.round(base * ((mult || 1) - 1));
      }
    }
    rows.push({ label: cat.label, value: valueName, delta });
  }

  const disCodes = Array.isArray(c.disassemblyCodes) ? c.disassemblyCodes : [];
  const disLine = pipeBreakdown.find(
    (l) => l.value?.includes('₽') && !l.name.toLowerCase().includes('баз') && !l.name.toLowerCase().includes('шумо')
  );
  const disCost = disLine ? parseInt(disLine.value.replace(/[^\d-]/g, ''), 10) || 0 : 0;
  const panelEl = dent.panelElement ?? c.panelElement ?? null;
  const fmtArm = typeof formatArmaturnayaSummary === 'function' ? formatArmaturnayaSummary : () => '—';
  const disLabel =
    disCodes.length > 0 ? fmtArm(disCodes, panelEl) || 'Без арматурных работ' : 'Без арматурных работ';
  rows.push({ label: 'Арматурные работы:', value: disLabel, delta: disCost });

  const soundObj = c.soundInsulationCode
    ? initialData?.soundInsulation?.find((s) => s.code === c.soundInsulationCode)
    : null;
  const soundLine = pipeBreakdown.find((l) => l.name?.toLowerCase().includes('шумо'));
  const soundCost = soundLine ? parseInt(soundLine.value.replace(/[^\d-]/g, ''), 10) || 0 : soundObj?.price ?? 0;
  rows.push({ label: 'Дополнительная шумоизоляция:', value: soundObj?.name || '—', delta: soundCost });

  return rows;
}
