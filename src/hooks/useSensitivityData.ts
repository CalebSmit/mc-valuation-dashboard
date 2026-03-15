import { useMemo } from 'react';
import type { SensitivityCell } from '../types/outputs';
import type { SampledVariables } from '../types/inputs';
import { useInputsStore } from '../store/inputsSlice';
import { useConfigStore } from '../store/configSlice';
import { computeDCF } from '../engine/dcfEngine';

// ─── useSensitivityData Hook ──────────────────────────────────────────────────

interface SensitivityData {
  cells: SensitivityCell[][];     // 5×5 grid [rowIndex][colIndex]
  rowValues: number[];            // WACC values for row headers
  colValues: number[];            // TGR values for column headers
  basePrice: number;              // Center cell price (base case)
}

const GRID_SIZE = 5;

/**
 * Derives a 5×5 sensitivity table over WACC (rows) and TGR (columns).
 * Uses point-estimate DCF (no Monte Carlo) for each cell.
 * Ranges: WACC ±200bp, TGR ±100bp around their means.
 */
export function useSensitivityData(): SensitivityData {
  const inputs = useInputsStore(s => s.inputs);
  const stressVars = useInputsStore(s => s.stressVars);
  const config = useConfigStore(s => s.config);

  return useMemo(() => {
    // Find mean values for all variables (base case point estimate)
    const varMap = new Map(stressVars.map(v => [v.id, v]));
    const waccVar = varMap.get('wacc');
    const tgrVar = varMap.get('tgr');

    const waccMean = waccVar?.mean ?? 0.10;
    const tgrMean  = tgrVar?.mean  ?? 0.025;

    // Build base SampledVariables from means of all stress vars
    const baseSampled: SampledVariables = {
      revenueGrowth:      varMap.get('revenueGrowth')?.mean ?? 0.08,
      ebitdaMargin:       varMap.get('ebitdaMargin')?.mean  ?? 0.22,
      capexPct:           varMap.get('capexPct')?.mean      ?? 0.05,
      nwcPct:             varMap.get('nwcPct')?.mean        ?? 0.02,
      daPct:              varMap.get('daPct')?.mean         ?? 0.04,
      wacc:               waccMean,
      tgr:                tgrMean,
      exitMultiple:       varMap.get('exitMultiple')?.mean  ?? 12.0,
      taxRate:            varMap.get('taxRate')?.mean       ?? 0.25,
      year1GrowthPremium: varMap.get('year1GrowthPremium')?.mean ?? 0.02,
      fcfDeviation:       varMap.get('fcfDeviation')?.mean ?? 0,
    };

    const midYear = config.midYearConvention ?? false;

    // Base case price
    const basePrice = computeDCF(inputs, baseSampled, config.terminalValueMethod, midYear);

    // WACC range: ±200bp in 4 equal steps → 5 values
    const waccStep = 0.005; // 50bp per step
    const rowValues = Array.from({ length: GRID_SIZE }, (_, i) =>
      Math.round((waccMean - 2 * waccStep + i * waccStep) * 10000) / 10000
    );

    // TGR range: ±100bp in 4 equal steps → 5 values
    const tgrStep = 0.0025; // 25bp per step
    const colValues = Array.from({ length: GRID_SIZE }, (_, j) =>
      Math.round((tgrMean - 2 * tgrStep + j * tgrStep) * 10000) / 10000
    );

    // Build 5×5 grid
    const cells: SensitivityCell[][] = rowValues.map(wacc =>
      colValues.map(tgr => {
        const sampled = { ...baseSampled, wacc, tgr };
        const price = computeDCF(inputs, sampled, config.terminalValueMethod, midYear);
        const deltaVsBase = isNaN(price) || isNaN(basePrice) ? NaN
          : (price - basePrice) / Math.abs(basePrice);
        return { rowValue: wacc, colValue: tgr, price, deltaVsBase };
      })
    );

    return { cells, rowValues, colValues, basePrice };
  }, [inputs, stressVars, config.terminalValueMethod, config.midYearConvention]);
}
