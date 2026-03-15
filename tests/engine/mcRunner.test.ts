import { describe, it, expect } from 'vitest';
import { runMonteCarlo } from '../../src/engine/mcRunner';
import { DEFAULT_INPUTS, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, DEFAULT_CONFIG } from '../../src/constants/finance';

describe('mcRunner', () => {
  // Test 12: runMonteCarlo with 1,000 runs returns valid SimulationOutput
  it('returns valid SimulationOutput for 1,000 runs with default inputs', () => {
    const config = { ...DEFAULT_CONFIG, numRuns: 1000 as const };
    const output = runMonteCarlo(DEFAULT_INPUTS, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, config);

    // Should return approximately 1,000 valid results (some NaN may be filtered)
    expect(output.results.length).toBeGreaterThan(950); // Allow for small NaN count
    expect(output.results.length + output.discardedCount).toBe(1000);

    // All required fields populated
    expect(output.mean).not.toBeNaN();
    expect(output.median).not.toBeNaN();
    expect(output.stdDev).toBeGreaterThanOrEqual(0);
    expect(output.percentiles[5]).not.toBeNaN();
    expect(output.percentiles[25]).not.toBeNaN();
    expect(output.percentiles[75]).not.toBeNaN();
    expect(output.percentiles[95]).not.toBeNaN();

    // Probabilities should be in [0, 1]
    expect(output.probAboveBear).toBeGreaterThanOrEqual(0);
    expect(output.probAboveBear).toBeLessThanOrEqual(1);
    expect(output.probAboveBull).toBeGreaterThanOrEqual(0);

    // Histogram bins should be present
    expect(output.histogramBins.length).toBeGreaterThan(0);
    expect(output.histogramBins.length).toBeLessThanOrEqual(50);

    // Tornado data should have entries
    expect(output.tornadoData.length).toBeGreaterThan(0);
    expect(output.activeVariableIds).toHaveLength(11);

    // Results should be sorted ascending
    for (let i = 1; i < output.results.length; i++) {
      expect(output.results[i]).toBeGreaterThanOrEqual(output.results[i - 1]);
    }
  });

  it('seeded simulation produces identical results when run twice', () => {
    const config = { ...DEFAULT_CONFIG, numRuns: 500 as const, seed: 42 };
    const output1 = runMonteCarlo(DEFAULT_INPUTS, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, config);
    const output2 = runMonteCarlo(DEFAULT_INPUTS, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, config);

    expect(output1.mean).toBeCloseTo(output2.mean, 6);
    expect(output1.median).toBeCloseTo(output2.median, 6);
    expect(output1.results.length).toBe(output2.results.length);
  });

  it('LHS sampling produces similar mean to standard MC (within 5%)', () => {
    const stdConfig = { ...DEFAULT_CONFIG, numRuns: 1000 as const, seed: 99, samplingMethod: 'standard' as const };
    const lhsConfig = { ...DEFAULT_CONFIG, numRuns: 1000 as const, seed: 99, samplingMethod: 'lhs' as const };

    const stdOutput = runMonteCarlo(DEFAULT_INPUTS, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, stdConfig);
    const lhsOutput = runMonteCarlo(DEFAULT_INPUTS, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, lhsConfig);

    const diff = Math.abs(stdOutput.mean - lhsOutput.mean) / stdOutput.mean;
    expect(diff).toBeLessThan(0.05); // Within 5%
  });

  it('direct FCFF mode produces valid distribution with fcfDeviation stress', () => {
    const directInputs = {
      ...DEFAULT_INPUTS,
      projectionMode: 'direct' as const,
      fcfProjections: [100, 110, 120, 130, 140],
      wacc: 0.10,
    };
    // Disable margin-based vars, enable fcfDeviation
    const directVars = DEFAULT_STRESS_VARS.map(v => {
      if (['revenueGrowth', 'ebitdaMargin', 'capexPct', 'nwcPct', 'daPct', 'taxRate', 'year1GrowthPremium'].includes(v.id)) {
        return { ...v, enabled: false };
      }
      return v;
    });

    const config = { ...DEFAULT_CONFIG, numRuns: 500 as const, seed: 77 };
    const output = runMonteCarlo(directInputs, directVars, DEFAULT_SCENARIO, config);

    expect(output.results.length).toBeGreaterThan(450);
    expect(output.mean).not.toBeNaN();
    expect(output.mean).toBeGreaterThan(0);
    expect(output.stdDev).toBeGreaterThan(0);
    // fcfDeviation should be in active IDs
    expect(output.activeVariableIds).toContain('fcfDeviation');
  });

  it('keeps disabled variables fixed at their mean and hides them from tornado output', () => {
    const subsetVars = DEFAULT_STRESS_VARS.map(variable => (
      variable.id === 'wacc' || variable.id === 'taxRate'
        ? { ...variable, enabled: false }
        : variable
    ));

    const output = runMonteCarlo(
      DEFAULT_INPUTS,
      subsetVars,
      DEFAULT_SCENARIO,
      { ...DEFAULT_CONFIG, numRuns: 200 as const, seed: 11, samplingMethod: 'lhs' as const },
    );

    expect(output.activeVariableIds).not.toContain('wacc');
    expect(output.activeVariableIds).not.toContain('taxRate');
    expect(output.tornadoData.map(entry => entry.variableId)).not.toContain('wacc');
    expect(output.tornadoData.map(entry => entry.variableId)).not.toContain('taxRate');

    for (const record of output.runRecords.slice(0, 25)) {
      expect(record.wacc).toBeCloseTo(DEFAULT_STRESS_VARS.find(variable => variable.id === 'wacc')!.mean, 10);
      expect(record.taxRate).toBeCloseTo(DEFAULT_STRESS_VARS.find(variable => variable.id === 'taxRate')!.mean, 10);
    }
  });
});
