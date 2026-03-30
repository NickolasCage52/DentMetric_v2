/**
 * Разбор строки вмятины для итогового экрана (быстрый расчёт, детализация, история).
 * Дельты в ₽ — последовательное влияние множителей (как в applyConditionsToBase), не «base×(k−1)» для каждого.
 */
import { getComplexityCoeff } from './priceCalc';
import { getArmaturnayaTotalPrice, getArmatureWorkLineItems } from '../data/armaturnayaWorks';

function resolveDisassemblyCost(conditions, initialData, panelElement) {
  if (!conditions) return 0;
  if (typeof conditions.disassemblyCost === 'number') return conditions.disassemblyCost;
  if (Array.isArray(conditions.disassemblyCodes) && conditions.disassemblyCodes.length > 0) {
    return getArmaturnayaTotalPrice(conditions.disassemblyCodes, panelElement);
  }
  if (conditions.disassemblyCode) {
    return initialData?.disassembly?.find((d) => d.code === conditions.disassemblyCode)?.price ?? 0;
  }
  return 0;
}

function resolveSoundCost(conditions, initialData) {
  if (!conditions?.soundInsulationCode) return 0;
  return initialData?.soundInsulation?.find((s) => s.code === conditions.soundInsulationCode)?.price ?? 0;
}

/**
 * @param {object} dentItem
 * @param {object} initialData
 * @param {Function} formatArmaturnayaSummary
 * @param {{ namedArmatureLines?: boolean }} [opts]
 * @returns {Array<{ label: string, value: string, delta: number }>}
 */
export function buildQuickFinalBreakdown(dentItem, initialData, formatArmaturnayaSummary, opts = {}) {
  const namedArmature = Boolean(opts?.namedArmatureLines);
  const dent = dentItem?.dent;
  if (!dent) return [];
  const c = dent.conditions || {};
  const base = dentItem.base || 0;
  const panelEl = dent.panelElement ?? c.panelElement ?? null;
  const fmtArm = typeof formatArmaturnayaSummary === 'function' ? formatArmaturnayaSummary : () => '—';

  const sizeCode =
    dentItem.sizeCode ||
    dent.sizeCode ||
    'STRIP_DEFAULT';

  const repCoeff = initialData?.repairTypes?.find((r) => r.code === c.repairCode)?.mult ?? 1.0;
  const matCoeff = initialData?.materials?.find((m) => m.code === c.materialCode)?.mult ?? 1.0;
  const carClassCoeff = initialData?.carClasses?.find((cc) => cc.code === c.carClassCode)?.mult ?? 1.0;
  const paintCoeff = c.paintMaterialCode
    ? initialData?.paintMaterials?.find((p) => p.code === c.paintMaterialCode)?.mult ?? 1.0
    : 1.0;
  const riskObj = initialData?.risks?.find((r) => r.code === c.riskCode);
  const kKey = riskObj ? riskObj.matrixKey : 'K2';
  const compCoeff = initialData
    ? getComplexityCoeff(initialData, kKey, sizeCode, dent)
    : 1.0;

  const disCost = resolveDisassemblyCost(c, initialData, panelEl);
  const soundCost = resolveSoundCost(c, initialData);

  const repObj = initialData?.repairTypes?.find((r) => r.code === c.repairCode);
  const matObj = initialData?.materials?.find((m) => m.code === c.materialCode);
  const carObj = initialData?.carClasses?.find((cc) => cc.code === c.carClassCode);
  const paintObj = c.paintMaterialCode
    ? initialData?.paintMaterials?.find((p) => p.code === c.paintMaterialCode)
    : null;

  let running = base;
  const stepDelta = (mult) => {
    const m = mult > 0 ? mult : 1;
    const next = running * m;
    const d = Math.round(next - running);
    running = next;
    return d;
  };

  const dRepair = base > 0 ? stepDelta(repCoeff) : 0;
  const dRisk = base > 0 ? stepDelta(compCoeff) : 0;
  const dMat = base > 0 ? stepDelta(matCoeff) : 0;
  const dCar = base > 0 ? stepDelta(carClassCoeff) : 0;
  const dPaint = base > 0 && c.paintMaterialCode ? stepDelta(paintCoeff) : 0;

  const dDis = base > 0 ? Math.round(disCost) : 0;
  running += disCost;
  const dSound = base > 0 ? Math.round(soundCost) : 0;
  running += soundCost;

  const disCodes = Array.isArray(c.disassemblyCodes) ? c.disassemblyCodes : [];
  const disLabel =
    disCodes.length > 0 ? fmtArm(disCodes, panelEl) || 'Без арматурных работ' : 'Без арматурных работ';
  const armatureLineItems = namedArmature ? getArmatureWorkLineItems(disCodes, panelEl) : [];

  const soundObj = c.soundInsulationCode
    ? initialData?.soundInsulation?.find((s) => s.code === c.soundInsulationCode)
    : null;

  const rows = [
    { label: 'Технология ремонта:', value: repObj?.name || '—', delta: dRepair },
    { label: 'Материал панели:', value: matObj?.name || '—', delta: dMat },
    { label: 'Сложность выполнения:', value: riskObj?.name || '—', delta: dRisk },
    { label: 'Класс автомобиля:', value: carObj?.name || '—', delta: dCar }
  ];

  if (c.paintMaterialCode && paintObj && paintObj.mult !== 1.0) {
    rows.push({
      label: 'Материал ЛКП:',
      value: paintObj.name || '—',
      delta: dPaint
    });
  }

  if (namedArmature && armatureLineItems.length > 0) {
    armatureLineItems.forEach((aw, i) => {
      rows.push({
        label: i === 0 ? 'Арматурные работы:' : '',
        value: aw.name,
        delta: aw.price
      });
    });
    if (armatureLineItems.length > 1) {
      rows.push({ label: '', value: 'Итого арматура', delta: dDis });
    }
  } else {
    rows.push({ label: 'Арматурные работы:', value: disLabel, delta: dDis });
  }
  rows.push({
    label: 'Дополнительная шумоизоляция:',
    value: soundObj?.name || '—',
    delta: dSound
  });

  return rows;
}
