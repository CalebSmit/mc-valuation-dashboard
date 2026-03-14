import { describe, it, expect } from 'vitest';
import { runMonteCarlo } from '../../src/engine/mcRunner';
import { DEFAULT_INPUTS, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, DEFAULT_CONFIG } from '../../src/constants/finance';

// ─── StatsPanel data completeness tests ───────────────────────────────────────
// Tests that SimulationOutput includes all 16 stats that StatsPanel renders,
// without requiring a React render environment.

describe('SimulationOutput (StatsPanel data contract)', () => {
  const output = runMonteCarlo(
    DEFAULT_INPUTS,
    DEFAULT_STRESS_VARS,
    DEFAULT_SCENARIO,
    { ...DEFAULT_CONFIG, numRuns: 1000, seed: 99 },
  );

  // ── Central tendency (2 stats) ──
  it('mean is finite and positive', () => {
    expect(output.mean).not.toBeNaN();
    expect(isFinite(output.mean)).toBe(true);
    expect(output.mean).toBeGreaterThan(0);
  });

  it('median is finite and positive', () => {
    expect(output.median).not.toBeNaN();
    expect(isFinite(output.median)).toBe(true);
    expect(output.median).toBeGreaterThan(0);
  });

  // ── Spread (3 stats) ──
  it('stdDev is non-negative', () => {
    expect(output.stdDev).toBeGreaterThanOrEqual(0);
  });

  it('min < median < max', () => {
    expect(output.min).toBeLessThan(output.median);
    expect(output.median).toBeLessThan(output.max);
  });

  // ── Percentiles (6 stats: P5, P10, P25, P75, P90, P95) ──
  it('all required percentiles are present and ordered', () => {
    const p = output.percentiles;
    expect(p[5]).toBeDefined();
    expect(p[10]).toBeDefined();
    expect(p[25]).toBeDefined();
    expect(p[75]).toBeDefined();
    expect(p[90]).toBeDefined();
    expect(p[95]).toBeDefined();

    expect(p[5]).toBeLessThanOrEqual(p[10]);
    expect(p[10]).toBeLessThanOrEqual(p[25]);
    expect(p[25]).toBeLessThanOrEqual(p[75]);
    expect(p[75]).toBeLessThanOrEqual(p[90]);
    expect(p[90]).toBeLessThanOrEqual(p[95]);
  });

  // ── Scenario probabilities (3 stats) ──
  it('probAboveBear/Base/Bull are in [0,1] and ordered correctly', () => {
    expect(output.probAboveBear).toBeGreaterThanOrEqual(output.probAboveBase);
    expect(output.probAboveBase).toBeGreaterThanOrEqual(output.probAboveBull);
    expect(output.probAboveBull).toBeGreaterThanOrEqual(0);
    expect(output.probAboveBear).toBeLessThanOrEqual(1);
  });

  // ── Risk stats (2 stats: VaR95, CVaR95) ──
  it('VaR95 is present and below median', () => {
    expect(output.var95).toBeDefined();
    expect(output.var95).toBeLessThanOrEqual(output.median);
  });

  it('CVaR95 ≤ VaR95 (mean of worst 5% ≤ 5th percentile cutoff)', () => {
    expect(output.cvar95).toBeLessThanOrEqual(output.var95);
  });

  // ── Tornado data ──
  it('tornadoData has entries with all required fields', () => {
    expect(output.tornadoData.length).toBeGreaterThan(0);
    for (const entry of output.tornadoData) {
      expect(typeof entry.variableId).toBe('string');
      expect(typeof entry.correlation).toBe('number');
      expect(Math.abs(entry.correlation)).toBeLessThanOrEqual(1);
    }
  });

  // ── Timestamp ──
  it('completedAt is a recent ISO timestamp', () => {
    const ts = new Date(output.completedAt).getTime();
    expect(ts).toBeGreaterThan(Date.now() - 60_000); // within last 60s
  });
});
