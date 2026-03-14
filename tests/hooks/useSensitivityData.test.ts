import { describe, it, expect } from 'vitest';
import { computeDCF } from '../../src/engine/dcfEngine';
import { DEFAULT_INPUTS, DEFAULT_STRESS_VARS } from '../../src/constants/finance';
import type { SampledVariables } from '../../src/types/inputs';

// ─── useSensitivityData behavior tests ────────────────────────────────────────
// Tests the DCF sensitivity grid logic (5×5 WACC × TGR) without React hooks.
// The hook drives computeDCF for each cell; we test the DCF calls directly.

describe('sensitivity heatmap 5×5 grid (useSensitivityData core)', () => {
  // Build mean-value SampledVariables from DEFAULT_STRESS_VARS
  const meanVars = Object.fromEntries(
    DEFAULT_STRESS_VARS.map(v => [v.id, v.mean]),
  ) as SampledVariables;

  // Grid definition matching useSensitivityData
  const baseWacc = meanVars.wacc;
  const baseTgr = meanVars.tgr;
  const waccSteps = [-0.02, -0.01, 0, +0.01, +0.02];
  const tgrSteps  = [-0.01, -0.005, 0, +0.005, +0.01];

  const rowValues = waccSteps.map(d => baseWacc + d);
  const colValues = tgrSteps.map(d => baseTgr + d);

  const cells = rowValues.map(wacc =>
    colValues.map(tgr => {
      const sampled: SampledVariables = { ...meanVars, wacc, tgr };
      return computeDCF(DEFAULT_INPUTS, sampled, 'ggm');
    }),
  );

  it('generates a 5×5 grid (5 rows, 5 columns)', () => {
    expect(cells.length).toBe(5);
    expect(cells[0].length).toBe(5);
  });

  it('base case cell [2][2] uses mean WACC and TGR and is not NaN', () => {
    const basePrice = cells[2][2];
    expect(basePrice).not.toBeNaN();
    expect(basePrice).toBeGreaterThan(0);
  });

  it('prices decrease as WACC increases (row direction)', () => {
    // For a given TGR column, higher WACC → lower price
    const midCol = 2;
    for (let ri = 1; ri < rowValues.length; ri++) {
      const prevPrice = cells[ri - 1][midCol];
      const currPrice = cells[ri][midCol];
      if (isNaN(prevPrice) || isNaN(currPrice)) continue;
      expect(currPrice).toBeLessThanOrEqual(prevPrice);
    }
  });

  it('prices increase as TGR increases (column direction)', () => {
    // For a given WACC row, higher TGR → higher price
    const midRow = 2;
    for (let ci = 1; ci < colValues.length; ci++) {
      const prevPrice = cells[midRow][ci - 1];
      const currPrice = cells[midRow][ci];
      if (isNaN(prevPrice) || isNaN(currPrice)) continue;
      expect(currPrice).toBeGreaterThanOrEqual(prevPrice);
    }
  });

  it('cell returns NaN when WACC ≤ TGR (GGM undefined)', () => {
    // Force WACC = TGR to trigger the NaN guard
    const sampled: SampledVariables = { ...meanVars, wacc: meanVars.tgr };
    const price = computeDCF(DEFAULT_INPUTS, sampled, 'ggm');
    expect(price).toBeNaN();
  });

  it('all 25 cells have finite price or NaN — no Infinity or negative', () => {
    for (const row of cells) {
      for (const price of row) {
        if (!isNaN(price)) {
          expect(isFinite(price)).toBe(true);
          expect(price).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});
