import { describe, it, expect } from 'vitest';
import { runMonteCarlo } from '../../src/engine/mcRunner';
import { computeDCF } from '../../src/engine/dcfEngine';
import { validateInputs } from '../../src/utils/validators';
import {
  DEFAULT_INPUTS,
  DEFAULT_STRESS_VARS,
  DEFAULT_SCENARIO,
  DEFAULT_CONFIG,
} from '../../src/constants/finance';
import type { SampledVariables } from '../../src/types/inputs';

// ─── Edge Case Tests ──────────────────────────────────────────────────────────

describe('NaN filter — invalid runs are discarded', () => {
  it('discards runs where WACC ≤ TGR by filtering NaN from output', () => {
    // Force all runs to produce NaN by making WACC mean = TGR mean
    const forceNaNVars = DEFAULT_STRESS_VARS.map(v => {
      // WACC = TGR = 0.025 exactly, with no clamping via matching min/max
      if (v.id === 'wacc') return { ...v, mean: 0.025, stdDev: 0, min: 0.025, max: 0.025 };
      if (v.id === 'tgr')  return { ...v, mean: 0.025, stdDev: 0, min: 0.025, max: 0.025 };
      return { ...v, stdDev: 0 }; // no variance, deterministic
    });

    const output = runMonteCarlo(
      DEFAULT_INPUTS,
      forceNaNVars,
      DEFAULT_SCENARIO,
      { ...DEFAULT_CONFIG, numRuns: 100, seed: 1 },
    );

    // All runs should be discarded (WACC ≤ TGR → NaN for GGM)
    expect(output.discardedCount).toBe(100);
    expect(output.results.length).toBe(0);
  });

  it('produces valid stats when only some runs are NaN', () => {
    // Wide stdDev on WACC so some draws will fall at or below TGR
    const wideWaccVars = DEFAULT_STRESS_VARS.map(v => {
      if (v.id === 'wacc') return { ...v, mean: 0.05, stdDev: 0.04, min: 0.01, max: 0.20 };
      return v;
    });

    const output = runMonteCarlo(
      DEFAULT_INPUTS,
      wideWaccVars,
      DEFAULT_SCENARIO,
      { ...DEFAULT_CONFIG, numRuns: 1000, seed: 7 },
    );

    // Some runs may be discarded but we should still have valid results
    expect(output.results.length).toBeGreaterThan(0);
    expect(output.discardedCount).toBeGreaterThanOrEqual(0);
    expect(output.results.length + output.discardedCount).toBe(1000);
  });
});

describe('WACC ≤ TGR validation warning', () => {
  it('returns a blocking error when WACC mean ≤ TGR mean', () => {
    const warnVars = DEFAULT_STRESS_VARS.map(v => {
      if (v.id === 'wacc') return { ...v, mean: 0.02 };
      if (v.id === 'tgr')  return { ...v, mean: 0.03 };
      return v;
    });

    const result = validateInputs(DEFAULT_INPUTS, warnVars, DEFAULT_SCENARIO, DEFAULT_CONFIG);
    expect(result.valid).toBe(false);  // Blocking error — all runs would be discarded as NaN
    expect(Object.keys(result.errors)).toContain('wacc_tgr');
  });

  it('returns no WACC warning when WACC mean > TGR mean (normal case)', () => {
    const result = validateInputs(DEFAULT_INPUTS, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, DEFAULT_CONFIG);
    expect(result.warnings['wacc_tgr']).toBeUndefined();
  });

  it('returns no WACC warning when WACC is fixed and disabled', () => {
    const warnVars = DEFAULT_STRESS_VARS.map(v => {
      if (v.id === 'wacc') return { ...v, mean: 0.02, enabled: false };
      if (v.id === 'tgr') return { ...v, mean: 0.03 };
      return v;
    });

    const result = validateInputs(DEFAULT_INPUTS, warnVars, DEFAULT_SCENARIO, DEFAULT_CONFIG);
    expect(result.warnings['wacc_tgr']).toBeUndefined();
  });
});

describe('LHS vs standard MC convergence (2% tolerance at 10,000 runs)', () => {
  it('LHS and standard MC mean within 2% of each other at 10,000 runs', () => {
    const standard = runMonteCarlo(
      DEFAULT_INPUTS,
      DEFAULT_STRESS_VARS,
      DEFAULT_SCENARIO,
      { ...DEFAULT_CONFIG, numRuns: 10000, seed: 42, samplingMethod: 'standard' },
    );
    const lhs = runMonteCarlo(
      DEFAULT_INPUTS,
      DEFAULT_STRESS_VARS,
      DEFAULT_SCENARIO,
      { ...DEFAULT_CONFIG, numRuns: 10000, seed: 42, samplingMethod: 'lhs' },
    );

    const relativeDiff = Math.abs(standard.mean - lhs.mean) / standard.mean;
    expect(relativeDiff).toBeLessThan(0.02);
  });
});

describe('computeDCF edge cases', () => {
  const meanVars = Object.fromEntries(
    DEFAULT_STRESS_VARS.map(v => [v.id, v.mean]),
  ) as SampledVariables;

  it('returns NaN when WACC exactly equals TGR', () => {
    const sampled: SampledVariables = { ...meanVars, wacc: 0.05, tgr: 0.05 };
    expect(computeDCF(DEFAULT_INPUTS, sampled, 'ggm')).toBeNaN();
  });

  it('returns NaN when WACC < TGR (GGM denominator negative)', () => {
    const sampled: SampledVariables = { ...meanVars, wacc: 0.02, tgr: 0.05 };
    expect(computeDCF(DEFAULT_INPUTS, sampled, 'ggm')).toBeNaN();
  });

  it('exit multiple method does not require WACC > TGR', () => {
    // With exit multiple TV, WACC ≤ TGR constraint does not apply
    const sampled: SampledVariables = { ...meanVars, wacc: 0.02, tgr: 0.05 };
    const price = computeDCF(DEFAULT_INPUTS, sampled, 'exitMultiple');
    // May or may not be NaN depending on the positive EV constraint,
    // but it should not throw
    expect(typeof price).toBe('number');
  });
});
