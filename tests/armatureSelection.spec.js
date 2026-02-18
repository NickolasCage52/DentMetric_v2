import { describe, it, expect } from 'vitest';
import { ARMATURE_NONE_CODE, normalizeArmatureWorkIds, toggleArmatureWorkIds } from '../src/utils/armatureSelection';

describe('armatureSelection', () => {
  it('normalize: empty -> [NONE]', () => {
    expect(normalizeArmatureWorkIds([])).toEqual([ARMATURE_NONE_CODE]);
    expect(normalizeArmatureWorkIds(null)).toEqual([ARMATURE_NONE_CODE]);
  });

  it('toggle NONE clears others', () => {
    expect(toggleArmatureWorkIds(['ZD1', 'ZD2'], ARMATURE_NONE_CODE)).toEqual([ARMATURE_NONE_CODE]);
  });

  it('toggle real removes NONE immediately', () => {
    expect(toggleArmatureWorkIds([ARMATURE_NONE_CODE], 'ZD1')).toEqual(['ZD1']);
  });

  it('toggle real on/off; empty falls back to NONE', () => {
    expect(toggleArmatureWorkIds([ARMATURE_NONE_CODE], 'ZD1')).toEqual(['ZD1']);
    expect(toggleArmatureWorkIds(['ZD1'], 'ZD1')).toEqual([ARMATURE_NONE_CODE]);
  });

  it('supports multi-select', () => {
    let ids = [ARMATURE_NONE_CODE];
    ids = toggleArmatureWorkIds(ids, 'ZD1');
    ids = toggleArmatureWorkIds(ids, 'ZD2');
    expect(ids.sort()).toEqual(['ZD1', 'ZD2'].sort());
  });
});

