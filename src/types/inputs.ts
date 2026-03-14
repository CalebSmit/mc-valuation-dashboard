// ─── Simulation Inputs ───────────────────────────────────────────────────────

/** Company fundamentals entered by the user. */
export interface SimulationInputs {
  companyName: string;
  ticker: string;
  currentPrice: number;
  sharesOutstanding: number; // Millions
  totalDebt: number;         // $M
  cashAndEquiv: number;      // $M
  ttmRevenue: number;        // $M
  ttmEbitda: number;         // $M
  ttmFcf: number;            // $M
  projectionYears: 3 | 5 | 7 | 10;
  terminalValueMethod: 'ggm' | 'exitMultiple';
}

// ─── Stress Variable ────────────────────────────────────────────────────────

export type DistributionType = 'normal' | 'lognormal' | 'uniform' | 'triangular';

export type StressVariableId =
  | 'revenueGrowth'
  | 'ebitdaMargin'
  | 'capexPct'
  | 'nwcPct'
  | 'daPct'
  | 'wacc'
  | 'tgr'
  | 'exitMultiple'
  | 'taxRate'
  | 'year1GrowthPremium';

export type StressVariableGroup = 'incomeStatement' | 'valuation';

/** One of the 10 configurable uncertainty variables. */
export interface StressVariable {
  id: StressVariableId;
  label: string;
  group: StressVariableGroup;
  mean: number;        // expressed as decimal fraction (e.g., 0.08 for 8%) — EXCEPT exitMultiple (raw number)
  stdDev: number;      // same units as mean
  min: number;         // lower bound for sampling clamp
  max: number;         // upper bound for sampling clamp
  distribution: DistributionType;
  mostLikely: number | null; // Only used for 'triangular' distribution
}

/** Sampled values for a single simulation run (all variables resolved to numbers). */
export interface SampledVariables {
  revenueGrowth: number;
  ebitdaMargin: number;
  capexPct: number;
  nwcPct: number;
  daPct: number;
  wacc: number;
  tgr: number;
  exitMultiple: number;
  taxRate: number;
  year1GrowthPremium: number;
}

// ─── Scenario Targets ───────────────────────────────────────────────────────

/** Bear / Base / Bull price targets that drive histogram color banding. */
export interface ScenarioTargets {
  bear: number; // Price ($)
  base: number; // Price ($)
  bull: number; // Price ($)
}

// ─── Simulation Config ──────────────────────────────────────────────────────

export type NumRuns = 500 | 1000 | 5000 | 10000 | 25000;
export type SamplingMethod = 'standard' | 'lhs';

/** User-configurable simulation settings. */
export interface SimulationConfig {
  numRuns: NumRuns;
  seed: number | null;       // Optional for reproducibility
  samplingMethod: SamplingMethod;
  terminalValueMethod: 'ggm' | 'exitMultiple';
}
