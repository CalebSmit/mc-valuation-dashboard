import type { StressVariableId } from './inputs';

// ─── Simulation Outputs ──────────────────────────────────────────────────────

/** Raw result for a single simulation run (stored for CSV export + tornado). */
export interface SimulationResult {
  runId: number;
  revenueGrowth: number;
  ebitdaMargin: number;
  capexPct: number;
  nwcPct: number;
  daPct: number;
  wacc: number;
  terminalGrowthRate: number;
  exitMultiple: number;
  taxRate: number;
  year1GrowthPremium: number;
  impliedEV: number;     // $M
  impliedPrice: number;  // $ per share
}

// ─── Histogram ──────────────────────────────────────────────────────────────

/** A single histogram bucket for Chart.js rendering. */
export interface HistogramBin {
  lowerBound: number; // Price ($)
  upperBound: number; // Price ($)
  midpoint: number;   // (lower + upper) / 2
  count: number;      // # of simulation runs in this bin
  frequency: number;  // count / totalRuns
}

// ─── Tornado ────────────────────────────────────────────────────────────────

/** Pearson rank correlation entry for tornado chart. */
export interface TornadoEntry {
  variableId: string;
  label: string;
  correlation: number; // -1 to 1
  absCorrelation: number; // |correlation|
}

// ─── Sensitivity ────────────────────────────────────────────────────────────

/** A single cell in the 2D sensitivity heatmap. */
export interface SensitivityCell {
  rowValue: number;     // Row variable value (e.g., WACC %)
  colValue: number;     // Column variable value (e.g., TGR %)
  price: number;        // Implied share price ($)
  deltaVsBase: number;  // % change vs. base case
}

// ─── Aggregated Output ───────────────────────────────────────────────────────

/** Percentile keys used in SimulationOutput. */
export type PercentileKey = 5 | 10 | 25 | 75 | 90 | 95;

/** Full aggregated output returned by runMonteCarlo(). */
export interface SimulationOutput {
  /** Raw implied prices for all valid runs. Sorted ascending. */
  results: Float64Array;

  /** Full run records (for CSV export + tornado correlation). */
  runRecords: SimulationResult[];

  /** Stress variables that were actively sampled during this run. */
  activeVariableIds: StressVariableId[];

  /** Count of runs discarded due to NaN / Infinity. */
  discardedCount: number;

  // ── Summary statistics ──
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  percentiles: Record<PercentileKey, number>;

  // ── Scenario probabilities ──
  probAboveBear: number; // 0–1
  probAboveBase: number;
  probAboveBull: number;

  // ── Risk metrics ──
  var95: number;   // Value at Risk (5th percentile — max loss from current price)
  cvar95: number;  // Conditional VaR (expected value in worst 5%)

  // ── Valuation sanity checks ──
  impliedEvEbitda: number; // Mean implied EV / TTM EBITDA multiple
  tailRatio: number;       // P95 / P5 ratio — flags fat-tailed distributions

  // ── Derived chart data ──
  tornadoData: TornadoEntry[];
  histogramBins: HistogramBin[];

  /** Actual engine runtime in milliseconds. */
  elapsedMs: number;

  /** Timestamp when simulation completed. */
  completedAt: number; // Date.now()
}
