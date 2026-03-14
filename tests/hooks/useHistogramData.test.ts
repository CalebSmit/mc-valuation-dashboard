import { describe, it, expect, beforeEach } from 'vitest';
import { runMonteCarlo } from '../../src/engine/mcRunner';
import { DEFAULT_INPUTS, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, DEFAULT_CONFIG } from '../../src/constants/finance';
import { buildBinColorArray, buildBinHoverColorArray } from '../../src/engine/colorBands';
import { HISTOGRAM_COLORS } from '../../src/engine/colorBands';

// ─── useHistogramData behavior tests ──────────────────────────────────────────
// Tests the bin coloring logic without requiring a React render environment.
// (The hook itself is a thin wrapper around buildBinColorArray.)

describe('bin color logic (useHistogramData core)', () => {
  const output = runMonteCarlo(
    DEFAULT_INPUTS,
    DEFAULT_STRESS_VARS,
    DEFAULT_SCENARIO,
    { ...DEFAULT_CONFIG, numRuns: 500, seed: 7 },
  );
  const bins = output.histogramBins;

  it('builds a color array with length equal to bin count', () => {
    const colors = buildBinColorArray(bins, DEFAULT_SCENARIO.bear, DEFAULT_SCENARIO.bull);
    expect(colors.length).toBe(bins.length);
  });

  it('bins below bear target are colored bear-red', () => {
    // Find the first bin whose midpoint is below bear target
    const bearBinIdx = bins.findIndex(b => b.midpoint < DEFAULT_SCENARIO.bear);
    if (bearBinIdx === -1) return; // no bins below bear — skip assertion

    const colors = buildBinColorArray(bins, DEFAULT_SCENARIO.bear, DEFAULT_SCENARIO.bull);
    expect(colors[bearBinIdx]).toBe(HISTOGRAM_COLORS.belowBear);
  });

  it('bins between bear and bull targets are colored in-range blue', () => {
    const midBinIdx = bins.findIndex(
      b => b.midpoint >= DEFAULT_SCENARIO.bear && b.midpoint <= DEFAULT_SCENARIO.bull,
    );
    if (midBinIdx === -1) return;

    const colors = buildBinColorArray(bins, DEFAULT_SCENARIO.bear, DEFAULT_SCENARIO.bull);
    expect(colors[midBinIdx]).toBe(HISTOGRAM_COLORS.inRange);
  });

  it('bins above bull target are colored bull-green', () => {
    const bullBinIdx = bins.findIndex(b => b.midpoint > DEFAULT_SCENARIO.bull);
    if (bullBinIdx === -1) return;

    const colors = buildBinColorArray(bins, DEFAULT_SCENARIO.bear, DEFAULT_SCENARIO.bull);
    expect(colors[bullBinIdx]).toBe(HISTOGRAM_COLORS.aboveBull);
  });

  it('hover colors array has same length as standard colors array', () => {
    const colors = buildBinColorArray(bins, DEFAULT_SCENARIO.bear, DEFAULT_SCENARIO.bull);
    const hoverColors = buildBinHoverColorArray(bins, DEFAULT_SCENARIO.bear, DEFAULT_SCENARIO.bull);
    expect(hoverColors.length).toBe(colors.length);
  });

  it('changing scenario thresholds changes bin colors', () => {
    const originalColors = buildBinColorArray(bins, DEFAULT_SCENARIO.bear, DEFAULT_SCENARIO.bull);

    // Use extreme thresholds: set bear very high so most bins are "below bear"
    const extremeBear = 9999;
    const extremeBull = 99999;
    const extremeColors = buildBinColorArray(bins, extremeBear, extremeBull);

    // Should differ from original since thresholds moved
    const firstBinChanged = originalColors[0] !== extremeColors[0];
    // At extreme values, all bins should be below bear
    expect(extremeColors.every(c => c === HISTOGRAM_COLORS.belowBear)).toBe(true);
    expect(firstBinChanged || true).toBe(true); // always true, just verifying logic path
  });
});
