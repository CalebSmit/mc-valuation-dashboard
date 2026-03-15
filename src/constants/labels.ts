// ─── User-Facing Labels, Tooltips, and Help Text ─────────────────────────────
// All strings that appear in the UI live here. Never hardcode labels in components.

// ─── Section Headers ─────────────────────────────────────────────────────────
export const SECTION_TITLES = {
  fundamentals: '01 — Company Fundamentals',
  stressVars: '02 — Stress Variables',
  simConfig: '03 — Simulation Config',
  scenario: '04 — Scenario Price Targets',
} as const;

export const SECTION_SUBTITLES = {
  fundamentals: 'Required — enter your company\'s key financial data',
  stressVars: 'Optional — defaults work for a first run',
  simConfig: 'Optional — controls how the simulation runs',
  scenario: 'Optional — set price targets to shade the histogram',
} as const;

export const STRESS_GROUP_LABELS = {
  incomeStatement: 'Income Statement Drivers',
  valuation: 'Valuation & Cost of Capital',
  cashFlow: 'Direct FCFF Stress',
} as const;

// ─── Field Labels ─────────────────────────────────────────────────────────────
export const FIELD_LABELS = {
  companyName: 'Company Name (optional)',
  ticker: 'Ticker (optional)',
  currentPrice: 'Current Stock Price',
  sharesOutstanding: 'Shares Outstanding',
  totalDebt: 'Total Debt',
  cashAndEquiv: 'Cash & Equivalents',
  ttmRevenue: 'TTM Revenue',
  ttmEbitda: 'TTM EBITDA',
  ttmFcf: 'TTM Free Cash Flow',
  projectionYears: 'Projection Years',
  terminalValueMethod: 'Terminal Value Method',
  projectionMode: 'Projection Mode',
  fcfProjections: 'FCFF Projections',
  waccInput: 'WACC (Discount Rate)',
  numRuns: 'Number of Runs',
  seed: 'Random Seed',
  samplingMethod: 'Sampling Method',
  bear: 'Bear Target',
  base: 'Base Target',
  bull: 'Bull Target',
} as const;

// ─── Field Units ──────────────────────────────────────────────────────────────
export const FIELD_UNITS = {
  currentPrice: '$',
  sharesOutstanding: 'M',
  totalDebt: '$M',
  cashAndEquiv: '$M',
  ttmRevenue: '$M',
  ttmEbitda: '$M',
  ttmFcf: '$M',
  bear: '$',
  base: '$',
  bull: '$',
} as const;

// ─── Tooltip Help Text ─────────────────────────────────────────────────────────
export const TOOLTIPS = {
  companyName: 'Name of the company being valued. Used for labeling exports only.',
  ticker: 'Exchange ticker symbol (e.g., AAPL, MSFT). Used for labeling exports only.',
  currentPrice: 'Current market price per share. Used as the reference price for scenario upside/downside calculations.',
  sharesOutstanding: 'Total diluted shares outstanding in millions. Used to convert Enterprise Value to equity value per share.',
  totalDebt: 'Total interest-bearing debt (short-term + long-term) in $M. Subtracted from EV to arrive at equity value.',
  cashAndEquiv: 'Cash and cash equivalents in $M. Added back to arrive at equity value (EV bridge: Equity = EV − Debt + Cash).',
  ttmRevenue: 'Trailing twelve months (TTM) revenue in $M. The base year from which forward projections are grown.',
  ttmEbitda: 'TTM Earnings Before Interest, Taxes, Depreciation & Amortization in $M. Informational — the DCF engine derives forward EBITDA from revenue × EBITDA margin.',
  ttmFcf: 'TTM unlevered Free Cash Flow in $M. Informational — the simulation derives FCF via the full bridge (NOPAT + D&A − CapEx − ΔNWC).',
  projectionYears: 'Explicit forecast period. FCF is projected year-by-year, discounted to PV. Terminal value captures value beyond this horizon.',
  terminalValueMethod: 'Gordon Growth Model (GGM) assumes FCF grows at TGR in perpetuity. Exit Multiple applies EV/EBITDA at the terminal year.',
  numRuns: 'More runs = higher statistical precision but slower execution. 10,000 is the recommended default (< 3 seconds).',
  seed: 'Setting a seed makes the simulation reproducible — same inputs + same seed = identical results every run. Leave blank for a random run.',
  samplingMethod: 'Standard Monte Carlo draws independently from each variable\'s distribution. Latin Hypercube Sampling (LHS) ensures the full range of each variable is covered more efficiently — equivalent confidence with fewer runs.',
  midYearConvention: 'When enabled, cash flows are discounted at mid-year (t \u2212 0.5) rather than end-of-year. This is standard sell-side practice and typically increases implied value by 3\u20136% depending on WACC and forecast horizon.',
  revenueGrowth: 'Year-over-year revenue growth rate (%). Applied to each projection year. Year 1 adds the Year 1 Premium on top.',
  ebitdaMargin: 'EBITDA as a % of revenue. Applied to each projection year\'s revenue to compute EBITDA.',
  capexPct: 'Capital expenditures as a % of revenue. Subtracted in the FCF bridge. Must be ≥ 0.',
  nwcPct: 'Annual change in Net Working Capital as a % of revenue. Positive = NWC builds (cash outflow, reduces FCF). Negative = NWC releases (cash inflow, increases FCF). This is the year-over-year delta, not a level.',
  daPct: 'Depreciation & Amortization as a % of revenue. Added back after tax (non-cash item) in the FCF bridge.',
  wacc: 'Weighted Average Cost of Capital (%). The discount rate applied to project cash flows. WACC must exceed Terminal Growth Rate or the terminal value formula is undefined. Build-up: Rf + \u03b2\u00d7ERP (equity) blended with after-tax cost of debt. Typical range for US equities: 7\u201314%.',
  tgr: 'Terminal Growth Rate (%). The perpetuity growth rate for the Gordon Growth Model. Typically 2–3% (near long-run GDP growth). Must be < WACC.',
  exitMultiple: 'EV/EBITDA exit multiple applied to terminal year EBITDA. Used when Terminal Value Method = Exit Multiple. Typically 8–20× for most sectors.',
  taxRate: 'Effective corporate tax rate (%). Applied to EBIT to compute NOPAT. Must be in [0%, 60%].',
  year1GrowthPremium: 'Additional growth rate applied to Year 1 only, on top of the base Revenue Growth Rate. Useful for companies with near-term catalysts (e.g., new product launch, geographic expansion).',
  projectionMode: 'Margin-Based derives FCF from revenue × margin − capex − NWC. Direct FCFF lets you enter your own year-by-year free cash flow projections and stresses them with a % deviation.',
  fcfProjections: 'Year-by-year unlevered Free Cash Flow to the Firm (FCFF) projections in $M. These are your base-case projections — the Monte Carlo engine will apply a random % deviation to each run.',
  waccTopLevel: 'Your base-case Weighted Average Cost of Capital. This value syncs to the WACC stress variable mean. The Monte Carlo engine will sample around this value based on the WACC stress variable distribution.',
  fcfDeviation: 'Random percentage deviation applied to each year\'s FCFF projection in every simulation run. Mean = 0% (unbiased), StdDev controls how much the projections vary across runs.',
  bear: 'Bear case price target ($). Histogram bars below this price are colored red. Represents the downside scenario threshold.',
  base: 'Base case price target ($). Represents your primary valuation estimate. The simulation mean should be near this level if inputs are calibrated correctly.',
  bull: 'Bull case price target ($). Histogram bars above this price are colored red (right tail). Represents the upside scenario threshold.',
} as const;

// ─── Stats Panel Labels ───────────────────────────────────────────────────────
export const STAT_LABELS = {
  mean: 'Mean Price',
  median: 'Median Price',
  stdDev: 'Std. Dev.',
  min: 'Min',
  max: 'Max',
  p5: '5th Percentile',
  p10: '10th Percentile',
  p25: '25th Percentile',
  p75: '75th Percentile',
  p90: '90th Percentile',
  p95: '95th Percentile',
  probAboveBear: 'P(Price > Bear)',
  probAboveBase: 'P(Price > Base)',
  probAboveBull: 'P(Price > Bull)',
  var95: 'VaR 95% (worst likely loss)',
  cvar95: 'CVaR 95% (avg worst-case loss)',
  impliedEvEbitda: 'Implied EV/EBITDA',
} as const;

// ─── Validation & Error Messages ──────────────────────────────────────────────
export const ERRORS = {
  sharesRequired: 'Shares outstanding must be > 0 to compute per-share price.',
  currentPriceRequired: 'Current stock price must be > 0.',
  revenueRequired: 'TTM Revenue must be > 0.',
  bearLtBase: 'Bear target must be less than Base target.',
  baseLtBull: 'Base target must be less than Bull target.',
  bearLtBull: 'Bear target must be less than Bull target.',
  waccGtTgr: 'WACC mean must exceed Terminal Growth Rate mean. When WACC \u2264 TGR the Gordon Growth Model terminal value is undefined — all simulation runs will be discarded.',
  invalidSeed: 'Seed must be a positive integer.',
  stdDevNegative: 'Standard deviation must be ≥ 0.',
  triangularOrder: 'For triangular distribution: Min < Most Likely < Max required.',
  taxRateRange: 'Tax rate must be between 0% and 60%.',
  invalidJson: 'Invalid config file — please check format and try again.',
  noSimulationResults: 'Run the simulation before exporting.',
  negativeFcf: 'Negative FCF detected — ensure this is expected for this company.',
  fcfProjectionsRequired: 'At least one FCFF projection must be non-zero in Direct mode.',
  waccRange: 'WACC must be between 1% and 50%.',
  lowVariance: 'Low variance: standard deviation is very small. Consider widening SD for meaningful simulation.',
} as const;

// ─── Toast / Status Messages ─────────────────────────────────────────────────
export const STATUS = {
  running: 'Running simulation...',
  complete: 'Simulation complete',
  exporting: 'Generating export...',
  exported: 'Export complete',
  configSaved: 'Configuration saved.',
  configLoaded: 'Configuration loaded.',
  workerError: 'Simulation error. Check inputs and try again.',
} as const;

// ─── Tab Labels ───────────────────────────────────────────────────────────────
export const TAB_LABELS = {
  histogram: 'Histogram',
  tornado: 'Tornado',
  cdf: 'CDF (Cumulative)',
  sensitivity: 'Sensitivity',
  fan: 'Fan Chart',
} as const;

export const TAB_DESCRIPTIONS = {
  histogram: 'Distribution of simulated share prices',
  tornado: 'Which inputs move the price the most',
  cdf: 'Probability of price being above or below any value',
  sensitivity: 'How WACC and growth rate affect fair value',
  fan: 'Spread of possible price paths over time',
} as const;

// ─── Chart Titles ─────────────────────────────────────────────────────────────
export const CHART_TITLES = {
  histogram: 'Monte Carlo Distribution — Implied Share Price',
  tornado: 'Tornado Chart — Input Variable Sensitivity',
  cdf: 'Cumulative Distribution Function',
  sensitivity: 'Sensitivity Analysis — WACC vs. Terminal Growth Rate',
  fan: 'Price Path Fan Chart — Percentile Bands',
} as const;

// ─── Distribution Type Labels ─────────────────────────────────────────────────
export const DISTRIBUTION_LABELS = {
  normal: 'Normal',
  lognormal: 'Log-Normal',
  uniform: 'Uniform',
  triangular: 'Triangular',
} as const;

// ─── TV Method Labels ─────────────────────────────────────────────────────────
export const TV_METHOD_LABELS = {
  ggm: 'Gordon Growth Model',
  exitMultiple: 'Exit Multiple',
} as const;

// ─── Sampling Method Labels ───────────────────────────────────────────────────
export const SAMPLING_LABELS = {
  standard: 'Standard Monte Carlo',
  lhs: 'Latin Hypercube',
} as const;
