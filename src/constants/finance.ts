import type { SimulationInputs, StressVariable, ScenarioTargets, SimulationConfig } from '../types/inputs';

// ─── Simulation Constants ────────────────────────────────────────────────────

export const HISTOGRAM_BIN_COUNT = 50;
export const TRADING_DAYS_PER_YEAR = 252;
export const DEFAULT_RISK_FREE_RATE = 0.045; // 4.5%

// ─── Default Company Inputs ─────────────────────────────────────────────────

export const DEFAULT_INPUTS: SimulationInputs = {
  companyName: '',
  ticker: '',
  currentPrice: 100,
  sharesOutstanding: 100,   // 100M shares
  totalDebt: 500,           // $500M
  cashAndEquiv: 200,        // $200M
  ttmRevenue: 1000,         // $1B TTM revenue
  ttmEbitda: 220,           // $220M (22% margin)
  ttmFcf: 130,              // $130M TTM FCF
  projectionYears: 5,
  terminalValueMethod: 'ggm',
};

// ─── Default Stress Variables (10 variables, 2 groups) ──────────────────────

export const DEFAULT_STRESS_VARS: StressVariable[] = [
  // ── Group A: Income Statement & Cash Flow Drivers ──
  {
    id: 'revenueGrowth',
    label: 'Revenue Growth Rate',
    group: 'incomeStatement',
    enabled: true,
    mean: 0.08,       // 8%
    stdDev: 0.04,     // 4%
    min: -0.10,       // -10%
    max: 0.30,        // 30%
    distribution: 'normal',
    mostLikely: null,
  },
  {
    id: 'ebitdaMargin',
    label: 'EBITDA Margin',
    group: 'incomeStatement',
    enabled: true,
    mean: 0.22,       // 22%
    stdDev: 0.04,     // 4%
    min: 0.05,        // 5%
    max: 0.45,        // 45%
    distribution: 'normal',
    mostLikely: null,
  },
  {
    id: 'capexPct',
    label: 'CapEx as % of Revenue',
    group: 'incomeStatement',
    enabled: true,
    mean: 0.05,       // 5%
    stdDev: 0.02,     // 2%
    min: 0.01,        // 1%
    max: 0.20,        // 20%
    distribution: 'normal',
    mostLikely: null,
  },
  {
    id: 'nwcPct',
    label: '\u0394NWC as % of Revenue (annual)',
    group: 'incomeStatement',
    enabled: true,
    mean: 0.02,       // 2%
    stdDev: 0.01,     // 1%
    min: -0.05,       // -5%
    max: 0.10,        // 10%
    distribution: 'normal',
    mostLikely: null,
  },
  {
    id: 'daPct',
    label: 'D&A as % of Revenue',
    group: 'incomeStatement',
    enabled: true,
    mean: 0.04,       // 4%
    stdDev: 0.01,     // 1%
    min: 0.01,        // 1%
    max: 0.15,        // 15%
    distribution: 'normal',
    mostLikely: null,
  },

  // ── Group B: Valuation & Cost of Capital ──
  {
    id: 'wacc',
    label: 'WACC',
    group: 'valuation',
    enabled: true,
    mean: 0.10,       // 10%
    stdDev: 0.015,    // 1.5%
    min: 0.05,        // 5%
    max: 0.20,        // 20%
    distribution: 'normal',
    mostLikely: null,
  },
  {
    id: 'tgr',
    label: 'Terminal Growth Rate',
    group: 'valuation',
    enabled: true,
    mean: 0.025,      // 2.5%
    stdDev: 0.005,    // 0.5%
    min: 0.00,        // 0%
    max: 0.05,        // 5%
    distribution: 'normal',
    mostLikely: null,
  },
  {
    id: 'exitMultiple',
    label: 'EV/EBITDA Exit Multiple',
    group: 'valuation',
    enabled: true,
    mean: 12.0,       // 12x
    stdDev: 2.0,      // 2x
    min: 4.0,         // 4x
    max: 25.0,        // 25x
    distribution: 'normal',
    mostLikely: null,
  },
  {
    id: 'taxRate',
    label: 'Tax Rate',
    group: 'valuation',
    enabled: true,
    mean: 0.25,       // 25%
    stdDev: 0.03,     // 3%
    min: 0.10,        // 10%
    max: 0.45,        // 45%
    distribution: 'normal',
    mostLikely: null,
  },
  {
    id: 'year1GrowthPremium',
    label: 'Year 1 Growth Premium',
    group: 'valuation',
    enabled: true,
    mean: 0.02,       // 2% additional near-term growth
    stdDev: 0.02,     // 2%
    min: -0.05,       // -5%
    max: 0.15,        // 15%
    distribution: 'normal',
    mostLikely: null,
  },
];

// ─── Default Scenario Targets ────────────────────────────────────────────────

export const DEFAULT_SCENARIO: ScenarioTargets = {
  bear: 80,   // $80 — 20% below default currentPrice of $100
  base: 100,  // $100 — at current price
  bull: 130,  // $130 — 30% above current price
};

// ─── Default Simulation Config ────────────────────────────────────────────────

export const DEFAULT_CONFIG: SimulationConfig = {
  numRuns: 10000,
  seed: null,
  samplingMethod: 'standard',
  terminalValueMethod: 'ggm',
  midYearConvention: true,
};

// ─── Validation Bounds ───────────────────────────────────────────────────────

export const BOUNDS = {
  taxRate: { min: 0, max: 0.60 },
  capexPct: { min: 0, max: 1.0 },
  daPct: { min: 0, max: 1.0 },
  nwcPct: { min: -0.50, max: 0.50 },
  wacc: { min: 0.01, max: 0.50 },
  tgr: { min: -0.05, max: 0.10 },
  sharesOutstanding: { min: 0.001 },
  currentPrice: { min: 0.01 },
} as const;
