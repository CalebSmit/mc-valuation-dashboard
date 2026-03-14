import { describe, it, expect } from 'vitest';
import { runMonteCarlo } from '../../src/engine/mcRunner';
import { DEFAULT_INPUTS, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, DEFAULT_CONFIG } from '../../src/constants/finance';

describe('performance', () => {
  it('10,000 runs complete in < 3000ms', () => {
    const config = { ...DEFAULT_CONFIG, numRuns: 10000 as const };
    const start = Date.now();
    const output = runMonteCarlo(DEFAULT_INPUTS, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, config);
    const elapsed = Date.now() - start;
    console.log(`[PERF] 10,000 runs: ${elapsed}ms | mean: $${output.mean.toFixed(2)}`);
    expect(elapsed).toBeLessThan(3000);
    expect(output.results.length).toBeGreaterThan(9900);
  });
});
