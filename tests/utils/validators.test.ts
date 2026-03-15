import { describe, it, expect } from 'vitest';
import { validateInputs } from '../../src/utils/validators';
import { DEFAULT_INPUTS, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, DEFAULT_CONFIG } from '../../src/constants/finance';
import type { SimulationInputs, ScenarioTargets } from '../../src/types/inputs';

describe('validateInputs', () => {
  // Test 10: returns error for sharesOutstanding = 0
  it('returns error for sharesOutstanding = 0', () => {
    const inputs: SimulationInputs = { ...DEFAULT_INPUTS, sharesOutstanding: 0 };
    const result = validateInputs(inputs, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, DEFAULT_CONFIG);
    expect(result.valid).toBe(false);
    expect(result.errors['sharesOutstanding']).toBeDefined();
    expect(result.errors['sharesOutstanding']).toContain('Shares');
  });

  // Test 11: returns error for bear > base
  it('returns error when bear >= base', () => {
    const scenario: ScenarioTargets = { bear: 110, base: 100, bull: 130 };
    const result = validateInputs(DEFAULT_INPUTS, DEFAULT_STRESS_VARS, scenario, DEFAULT_CONFIG);
    expect(result.valid).toBe(false);
    expect(result.errors['bear']).toBeDefined();
  });

  it('returns error when base >= bull', () => {
    const scenario: ScenarioTargets = { bear: 80, base: 130, bull: 130 };
    const result = validateInputs(DEFAULT_INPUTS, DEFAULT_STRESS_VARS, scenario, DEFAULT_CONFIG);
    expect(result.valid).toBe(false);
    expect(result.errors['base']).toBeDefined();
  });

  it('returns valid: true for all default inputs', () => {
    const result = validateInputs(DEFAULT_INPUTS, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, DEFAULT_CONFIG);
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('returns error for currentPrice = 0', () => {
    const inputs: SimulationInputs = { ...DEFAULT_INPUTS, currentPrice: 0 };
    const result = validateInputs(inputs, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, DEFAULT_CONFIG);
    expect(result.valid).toBe(false);
    expect(result.errors['currentPrice']).toBeDefined();
  });

  it('returns error for ttmRevenue = 0', () => {
    const inputs: SimulationInputs = { ...DEFAULT_INPUTS, ttmRevenue: 0 };
    const result = validateInputs(inputs, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, DEFAULT_CONFIG);
    expect(result.valid).toBe(false);
    expect(result.errors['ttmRevenue']).toBeDefined();
  });

  it('returns blocking error (not warning) for WACC mean <= TGR mean', () => {
    // Modify stressVars so mean WACC (2%) < mean TGR (2.5%)
    const stressVars = DEFAULT_STRESS_VARS.map(v =>
      v.id === 'wacc' ? { ...v, mean: 0.02 } : v
    );
    const result = validateInputs(DEFAULT_INPUTS, stressVars, DEFAULT_SCENARIO, DEFAULT_CONFIG);
    // Should be a blocking error — all runs would be discarded as NaN
    expect(result.valid).toBe(false);
    expect(result.errors['wacc_tgr']).toBeDefined();
  });

  it('skips disabled variable validation errors', () => {
    const stressVars = DEFAULT_STRESS_VARS.map(v =>
      v.id === 'taxRate'
        ? { ...v, enabled: false, mean: 0.9 }
        : v
    );

    const result = validateInputs(DEFAULT_INPUTS, stressVars, DEFAULT_SCENARIO, DEFAULT_CONFIG);

    expect(result.errors['stressVar.taxRate.mean']).toBeUndefined();
    expect(result.valid).toBe(true);
  });

  it('does not warn on WACC <= TGR when one of them is disabled', () => {
    const stressVars = DEFAULT_STRESS_VARS.map(v => {
      if (v.id === 'wacc') return { ...v, mean: 0.02, enabled: false };
      if (v.id === 'tgr') return { ...v, mean: 0.03 };
      return v;
    });

    const result = validateInputs(DEFAULT_INPUTS, stressVars, DEFAULT_SCENARIO, DEFAULT_CONFIG);

    expect(result.warnings['wacc_tgr']).toBeUndefined();
  });

  it('returns error for invalid seed (float)', () => {
    const config = { ...DEFAULT_CONFIG, seed: 3.14 };
    const result = validateInputs(DEFAULT_INPUTS, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, config);
    expect(result.valid).toBe(false);
    expect(result.errors['seed']).toBeDefined();
  });

  it('returns error for all-zero fcfProjections in direct mode', () => {
    const inputs: SimulationInputs = {
      ...DEFAULT_INPUTS,
      projectionMode: 'direct',
      fcfProjections: [0, 0, 0, 0, 0],
      wacc: 0.10,
    };
    const result = validateInputs(inputs, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, DEFAULT_CONFIG);
    expect(result.valid).toBe(false);
    expect(result.errors['fcfProjections']).toBeDefined();
  });

  it('does not require ttmRevenue > 0 in direct mode', () => {
    const inputs: SimulationInputs = {
      ...DEFAULT_INPUTS,
      projectionMode: 'direct',
      fcfProjections: [100, 110, 120, 130, 140],
      wacc: 0.10,
      ttmRevenue: 0,
    };
    const result = validateInputs(inputs, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, DEFAULT_CONFIG);
    expect(result.errors['ttmRevenue']).toBeUndefined();
  });

  it('returns error for WACC out of bounds', () => {
    const inputs: SimulationInputs = { ...DEFAULT_INPUTS, wacc: 0.005 }; // 0.5% — below 1% minimum
    const result = validateInputs(inputs, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, DEFAULT_CONFIG);
    expect(result.valid).toBe(false);
    expect(result.errors['waccInput']).toBeDefined();
  });

  it('returns all errors at once (not fail-fast)', () => {
    const inputs: SimulationInputs = { ...DEFAULT_INPUTS, sharesOutstanding: 0, currentPrice: 0, ttmRevenue: 0 };
    const scenario: ScenarioTargets = { bear: 150, base: 100, bull: 80 };
    const result = validateInputs(inputs, DEFAULT_STRESS_VARS, scenario, DEFAULT_CONFIG);
    // Should have multiple errors simultaneously
    expect(Object.keys(result.errors).length).toBeGreaterThan(2);
  });
});
