import type { SimulationResult, HistogramBin, TornadoEntry, PercentileKey } from '../types/outputs';
import { HISTOGRAM_BIN_COUNT } from '../constants/finance';

// ─── Core Statistics ──────────────────────────────────────────────────────────

/**
 * Compute the mean of a Float64Array.
 */
export function computeMean(values: Float64Array): number {
  if (values.length === 0) return NaN;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
  }
  return sum / values.length;
}

/**
 * Compute the population standard deviation of a Float64Array.
 * Requires the pre-computed mean for efficiency.
 */
export function computeStdDev(values: Float64Array, mean: number): number {
  if (values.length < 2) return 0;
  let sumSq = 0;
  for (let i = 0; i < values.length; i++) {
    const diff = values[i] - mean;
    sumSq += diff * diff;
  }
  return Math.sqrt(sumSq / values.length);
}

/**
 * Compute the percentile value from a SORTED Float64Array.
 * Uses linear interpolation (same as Excel PERCENTILE.INC / numpy default).
 *
 * @param sorted  Must be sorted in ascending order
 * @param p       Percentile as a fraction in [0, 1]
 */
export function computePercentile(sorted: Float64Array, p: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];

  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  const frac = index - lower;
  return sorted[lower] * (1 - frac) + sorted[upper] * frac;
}

/**
 * Compute all required percentiles at once from a sorted array.
 */
export function computeAllPercentiles(sorted: Float64Array): Record<PercentileKey, number> {
  return {
    5:  computePercentile(sorted, 0.05),
    10: computePercentile(sorted, 0.10),
    25: computePercentile(sorted, 0.25),
    75: computePercentile(sorted, 0.75),
    90: computePercentile(sorted, 0.90),
    95: computePercentile(sorted, 0.95),
  };
}

/**
 * Compute the probability that a value exceeds a threshold.
 * Array must be sorted ascending.
 *
 * @param sorted     Sorted ascending Float64Array
 * @param threshold  The threshold value
 * @returns          Fraction of values above threshold (0–1)
 */
export function computeProbAbove(sorted: Float64Array, threshold: number): number {
  if (sorted.length === 0) return 0;
  // Binary search for insertion point
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sorted[mid] <= threshold) lo = mid + 1;
    else hi = mid;
  }
  return (sorted.length - lo) / sorted.length;
}

/**
 * Compute Value at Risk (VaR) at 95% confidence level.
 * VaR 95% = current price − 5th percentile price (max loss in best 95% of outcomes).
 * Returns the 5th percentile price directly (caller can subtract from current price).
 */
export function computeVaR95(sorted: Float64Array): number {
  return computePercentile(sorted, 0.05);
}

/**
 * Compute Conditional VaR (CVaR / Expected Shortfall) at 95% confidence.
 * CVaR = mean of the worst 5% of outcomes.
 */
export function computeCVaR95(sorted: Float64Array): number {
  if (sorted.length === 0) return NaN;
  const cutoffIndex = Math.floor(sorted.length * 0.05);
  if (cutoffIndex === 0) return sorted[0];
  let sum = 0;
  for (let i = 0; i < cutoffIndex; i++) {
    sum += sorted[i];
  }
  return sum / cutoffIndex;
}

// ─── Histogram Binning ────────────────────────────────────────────────────────

/**
 * Build histogram bins from a sorted array of price values.
 * Creates HISTOGRAM_BIN_COUNT equal-width bins spanning the data range.
 *
 * @param sorted     Sorted ascending Float64Array of price values
 * @param binCount   Number of bins (default: HISTOGRAM_BIN_COUNT)
 */
export function buildHistogramBins(
  sorted: Float64Array,
  binCount: number = HISTOGRAM_BIN_COUNT
): HistogramBin[] {
  if (sorted.length === 0) return [];

  const minVal = sorted[0];
  const maxVal = sorted[sorted.length - 1];
  const range = maxVal - minVal;

  // Handle degenerate case where all values are identical
  if (range === 0) {
    return [{
      lowerBound: minVal - 0.5,
      upperBound: minVal + 0.5,
      midpoint: minVal,
      count: sorted.length,
      frequency: 1,
    }];
  }

  // Small padding so the max value falls in the last bin, not out of bounds
  const padding = range * 0.001;
  const adjustedMin = minVal - padding;
  const adjustedMax = maxVal + padding;
  const binWidth = (adjustedMax - adjustedMin) / binCount;

  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    lowerBound: adjustedMin + i * binWidth,
    upperBound: adjustedMin + (i + 1) * binWidth,
    midpoint: adjustedMin + (i + 0.5) * binWidth,
    count: 0,
    frequency: 0,
  }));

  // Fill bins (sorted array → linear scan possible, but binary placement is cleaner)
  for (let i = 0; i < sorted.length; i++) {
    const binIndex = Math.min(
      Math.floor((sorted[i] - adjustedMin) / binWidth),
      binCount - 1
    );
    bins[binIndex].count++;
  }

  // Compute frequencies
  const total = sorted.length;
  for (const bin of bins) {
    bin.frequency = bin.count / total;
  }

  return bins;
}

// ─── Tornado Correlations ─────────────────────────────────────────────────────

/**
 * Compute Pearson rank correlation between impliedPrice and each input variable.
 * Rank correlation (Spearman) is used because it's robust to non-linear relationships.
 * Returns entries sorted by |correlation| descending for the tornado chart.
 *
 * @param results      Array of SimulationResult (one per run)
 * @param variableIds  Variable IDs to compute correlation for
 */
export function computeTornadoCorrelations(
  results: SimulationResult[],
  variableIds: string[]
): TornadoEntry[] {
  if (results.length < 2) return [];

  const n = results.length;

  // Extract and rank the price column
  const prices = new Float64Array(n);
  for (let i = 0; i < n; i++) prices[i] = results[i].impliedPrice;
  const priceRanks = computeRanks(prices);

  const entries: TornadoEntry[] = [];

  for (const varId of variableIds) {
    const varValues = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      varValues[i] = getVariableValue(results[i], varId);
    }
    const varRanks = computeRanks(varValues);
    const corr = pearsonCorrelation(priceRanks, varRanks);
    entries.push({
      variableId: varId,
      label: varId, // overridden in the component with proper labels
      correlation: corr,
      absCorrelation: Math.abs(corr),
    });
  }

  // Sort by absolute correlation descending
  entries.sort((a, b) => b.absCorrelation - a.absCorrelation);

  return entries;
}

/** Get the sampled value of a named variable from a simulation result. */
function getVariableValue(result: SimulationResult, varId: string): number {
  switch (varId) {
    case 'revenueGrowth':      return result.revenueGrowth;
    case 'ebitdaMargin':       return result.ebitdaMargin;
    case 'capexPct':           return result.capexPct;
    case 'nwcPct':             return result.nwcPct;
    case 'daPct':              return result.daPct;
    case 'wacc':               return result.wacc;
    case 'tgr':                return result.terminalGrowthRate;
    case 'exitMultiple':       return result.exitMultiple;
    case 'taxRate':            return result.taxRate;
    case 'year1GrowthPremium': return result.year1GrowthPremium;
    default:                   return 0;
  }
}

/**
 * Compute ranks of a Float64Array (average rank for ties).
 * Returns a new Float64Array of the same length.
 */
function computeRanks(values: Float64Array): Float64Array {
  const n = values.length;
  const indexed: Array<{ value: number; index: number }> = [];
  for (let i = 0; i < n; i++) {
    indexed.push({ value: values[i], index: i });
  }
  indexed.sort((a, b) => a.value - b.value);

  const ranks = new Float64Array(n);
  let i = 0;
  while (i < n) {
    let j = i;
    // Find run of equal values
    while (j < n - 1 && indexed[j + 1].value === indexed[j].value) j++;
    const avgRank = (i + j) / 2 + 1; // 1-based average rank
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].index] = avgRank;
    }
    i = j + 1;
  }
  return ranks;
}

/**
 * Pearson correlation coefficient between two Float64Arrays of the same length.
 */
function pearsonCorrelation(x: Float64Array, y: Float64Array): number {
  const n = x.length;
  if (n < 2) return 0;

  let sumX = 0, sumY = 0;
  for (let i = 0; i < n; i++) { sumX += x[i]; sumY += y[i]; }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0, sumSqX = 0, sumSqY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  if (denominator === 0) return 0;
  return numerator / denominator;
}
