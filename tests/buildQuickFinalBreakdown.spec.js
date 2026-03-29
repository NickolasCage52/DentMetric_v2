import { describe, it, expect } from 'vitest';
import { buildQuickFinalBreakdown } from '../src/utils/buildQuickFinalBreakdown';
import { initialData } from '../src/data/initialData';

describe('buildQuickFinalBreakdown', () => {
  it('computes risk delta on running total after repair, not on base only', () => {
    const dentItem = {
      base: 7000,
      sizeCode: 'S2',
      dent: {
        type: 'circle',
        sizeLengthMm: 85,
        sizeWidthMm: 180,
        panelElement: 'Капот',
        conditions: {
          repairCode: 'R1',
          riskCode: 'RK2',
          materialCode: 'M1',
          carClassCode: 'CLASS_STD',
          disassemblyCodes: ['Z0'],
          paintMaterialCode: null,
          soundInsulationCode: null
        }
      }
    };
    const rows = buildQuickFinalBreakdown(dentItem, initialData, () => 'Без доп. работ');
    const risk = rows.find((r) => r.label === 'Сложность выполнения:');
    const repMult = initialData.repairTypes.find((r) => r.code === 'R1')?.mult ?? 1;
    const afterRep = 7000 * repMult;
    const riskObj = initialData.risks.find((r) => r.code === 'RK2');
    const compMult = initialData.complexityMatrix?.S2?.[riskObj?.matrixKey ?? 'K2'] ?? 1;
    expect(risk?.delta).toBe(Math.round(afterRep * (compMult - 1)));
  });

  it('class delta uses running total after repair, complexity and material', () => {
    const dentItem = {
      base: 7000,
      sizeCode: 'S2',
      dent: {
        type: 'circle',
        sizeLengthMm: 85,
        sizeWidthMm: 180,
        panelElement: 'Капот',
        conditions: {
          repairCode: 'R1',
          riskCode: 'RK2',
          materialCode: 'M2',
          carClassCode: 'CLASS_PREM',
          disassemblyCodes: ['Z0'],
          paintMaterialCode: null,
          soundInsulationCode: null
        }
      }
    };
    const rows = buildQuickFinalBreakdown(dentItem, initialData, () => 'Без доп. работ');
    const carRow = rows.find((r) => r.label === 'Класс автомобиля:');
    const repMult = initialData.repairTypes.find((r) => r.code === 'R1')?.mult ?? 1;
    const riskObj = initialData.risks.find((r) => r.code === 'RK2');
    const compMult = initialData.complexityMatrix?.S2?.[riskObj?.matrixKey ?? 'K2'] ?? 1;
    const matMult = initialData.materials.find((m) => m.code === 'M2')?.mult ?? 1;
    const carMult = initialData.carClasses.find((c) => c.code === 'CLASS_PREM')?.mult ?? 1;
    let running = 7000;
    running *= repMult;
    running *= compMult;
    running *= matMult;
    const expectedCarDelta = Math.round(running * (carMult - 1));
    expect(carRow?.delta).toBe(expectedCarDelta);
    const naiveFromBase = Math.round(7000 * (carMult - 1));
    expect(carRow?.delta).not.toBe(naiveFromBase);
  });
});
