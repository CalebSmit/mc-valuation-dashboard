import type { HistogramBin } from '../types/outputs';

// ─── Histogram Color Band Logic ───────────────────────────────────────────────
//
// Color assignment for histogram bars, based on bin midpoint vs. scenario thresholds.
// Matches the reference image:
//   - Red:  bin midpoint < Bear target (downside — below bear threshold)
//   - Blue: bin midpoint ≥ Bear AND ≤ Bull (in-range — between scenarios)
//   - Red (lighter): bin midpoint > Bull target (right tail — above bull threshold)

/** Color constants matching the design system palette. */
export const HISTOGRAM_COLORS = {
  belowBear: 'rgba(248, 81, 73, 0.85)',   // Red — below bear
  inRange:   'rgba(88, 166, 255, 0.85)',   // Blue — between bear and bull
  aboveBull: 'rgba(248, 81, 73, 0.65)',   // Red lighter — above bull
} as const;

/**
 * Determine the Chart.js bar color for a single histogram bin.
 *
 * @param binMidpoint  The midpoint price of the bin ($)
 * @param bear         Bear scenario price target ($)
 * @param bull         Bull scenario price target ($)
 * @returns            RGBA color string for Chart.js backgroundColor
 */
export function getBinColor(binMidpoint: number, bear: number, bull: number): string {
  if (binMidpoint < bear) return HISTOGRAM_COLORS.belowBear;
  if (binMidpoint > bull) return HISTOGRAM_COLORS.aboveBull;
  return HISTOGRAM_COLORS.inRange;
}

/**
 * Build the full backgroundColor array for all histogram bins.
 * Called both on initial render and whenever scenario thresholds change
 * (enabling instant re-color without re-running the simulation).
 *
 * @param bins  Pre-bucketed histogram bins from statistics.buildHistogramBins()
 * @param bear  Bear scenario price target ($)
 * @param bull  Bull scenario price target ($)
 * @returns     Array of RGBA color strings, one per bin
 */
export function buildBinColorArray(
  bins: HistogramBin[],
  bear: number,
  bull: number
): string[] {
  return bins.map(bin => getBinColor(bin.midpoint, bear, bull));
}

/**
 * Build the hover backgroundColor array (slightly lighter for hover state).
 */
export function buildBinHoverColorArray(
  bins: HistogramBin[],
  bear: number,
  bull: number
): string[] {
  return bins.map(bin => {
    const color = getBinColor(bin.midpoint, bear, bull);
    // Increase opacity for hover state
    return color.replace(/[\d.]+\)$/, '1.0)');
  });
}
