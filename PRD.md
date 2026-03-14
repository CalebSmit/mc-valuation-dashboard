# PRD.md — Monte Carlo Equity Valuation Dashboard

## 1. Overview

A browser-based, single-page React dashboard that lets finance professionals run institutional-quality Monte Carlo simulations on public company DCF models. The user enters company fundamentals and uncertainty parameters, configures scenario price targets (Bear / Base / Bull), and immediately sees a color-coded distribution histogram alongside statistical output panels. All computation happens client-side with no backend required. Runs on any modern browser (Chrome, Edge, Safari, Firefox).

---

## 2. Problem Statement

Equity analysts currently run Monte Carlo simulations in Excel using add-ins (@Risk, Crystal Ball) that are expensive, slow, Windows-only, and produce static outputs. There is no fast, shareable, browser-native tool that: (a) handles a full DCF-based MC simulation with professional-grade inputs, (b) maps color-coded scenario thresholds onto the output distribution, and (c) exports publication-ready charts and data. This dashboard solves that gap with zero setup, zero cost, and sub-3-second simulation times.

---

## 3. Target Users

| Persona | Description | Key Need |
|---------|-------------|----------|
| **Buy-side analyst** | Equity research analyst at hedge fund or asset manager | Fast scenario stress-testing against price targets and entry/exit decisions |
| **Investment banking associate** | IBD associate building DCF-backed pitch models | Defensible valuation ranges with probability-weighted outputs for client decks |
| **Equity research associate** | Sell-side analyst building consensus models | Sensitivity analysis across WACC and growth inputs with exportable charts |
| **Portfolio manager** | PM reviewing analyst models before investment committee | Quick visual read of probability distribution vs. current price + targets |

**Primary v1 persona**: Buy-side equity analyst who needs to stress-test a DCF in under 5 minutes with a visual she can drop into a committee memo.

---

## 4. User Stories

### Critical (must ship):

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-01 | As an analyst, I want to enter company financials (revenue, EBITDA, FCF, shares outstanding) so the model has a real starting base | Fields accept numeric input; invalid entries show inline error; model won't run with missing required fields |
| US-02 | As an analyst, I want to set mean and standard deviation for each stress variable (revenue growth, EBITDA margin, WACC, terminal growth rate, exit multiple) so I can control the distribution of each input | Each variable has a mean slider + SD slider with numeric input override; min/max bounds are enforced |
| US-03 | As an analyst, I want to choose the number of simulation runs (500 / 1,000 / 5,000 / 10,000 / 25,000) so I can trade off speed vs. statistical confidence | Run count selector renders; simulation completes within 3s for ≤10,000 runs; progress indicator shows during run |
| US-04 | As an analyst, I want to set Bear, Base, and Bull price targets so the histogram is colored by scenario zone | Three price target inputs; histogram bars are red below Bear, blue/gray between Bear and Bull, red above Bull (as in reference image) |
| US-05 | As an analyst, I want to see the Monte Carlo histogram immediately after the simulation runs so I can read the distribution at a glance | Histogram renders within 300ms of simulation completion; X-axis is price ($), Y-axis is frequency; bars animate in |
| US-06 | As an analyst, I want to see summary statistics (mean, median, std dev, 5th/25th/75th/95th percentiles, probability of exceeding Bear/Base/Bull) so I have quantitative read-outs | Stats panel renders with all 9 statistics; values update on every new run |
| US-07 | As an analyst, I want a tornado chart showing which input variables drive the most variance in the output so I know where to focus diligence | Tornado chart ranks 5 stress variables by their contribution to output variance; uses Pearson rank correlation |
| US-08 | As an analyst, I want a sensitivity table (2D heatmap) of price vs. WACC and Terminal Growth Rate so I can see traditional sensitivity analysis alongside the MC | 5×5 heatmap with color gradient (red→green); cell values are DCF price; user selects which two variables to plot |
| US-09 | As an analyst, I want to export the dashboard as a PDF report so I can share it with my PM or include it in a memo | Export produces a clean PDF with: company header, histogram, summary stats, key inputs used |
| US-10 | As an analyst, I want to export the raw simulation results as a CSV so I can do further analysis in Excel | CSV has one row per simulation run: Run #, Revenue Growth %, EBITDA Margin %, WACC %, TGR %, Exit Multiple, Implied EV, Implied Price |
| US-11 | As an analyst, I want to toggle between DCF Terminal Value methods (Gordon Growth Model vs. Exit Multiple) so I can use the approach appropriate to the company | Toggle button switches between GGM and EV/EBITDA exit multiple; relevant input fields show/hide accordingly |
| US-12 | As an analyst, I want to save and restore my input configuration as a JSON file so I can pick up where I left off | "Save Config" exports inputs as `.json`; "Load Config" imports and repopulates all fields |
| US-13 | As an analyst, I want the dashboard to be accessible at a public GitHub Pages URL so I can open it from any machine without installing anything | `npm run build` + `npm run deploy` pushes `dist/` to `gh-pages` branch; app loads at `https://[username].github.io/mc-valuation-dashboard/` with all features working |

### Nice-to-have:
| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| NH-01 | As an analyst, I want a cumulative distribution function (CDF) chart so I can read off any percentile directly | CDF chart tab renders S-curve; hovering a point shows price and percentile |
| NH-02 | As an analyst, I want scenario path fan chart (price over projection years) so I can see how paths evolve | Fan chart shows 5th/25th/50th/75th/95th percentile paths across 1–5 year forecast horizon |
| NH-03 | As an analyst, I want to set input correlations (e.g., revenue growth correlated with EBITDA margin) so I can capture co-movement | Correlation matrix input (3×3) with Cholesky decomposition used in sampling |
| NH-04 | As an analyst, I want a dark/light mode toggle for sharing charts in presentations | Theme toggle persists for the session |
| NH-05 | As an analyst, I want to compare two simulation runs side-by-side so I can see the effect of changing assumptions | Run A vs Run B overlay on histogram |

### Deferred (v2+):
- Live ticker data auto-fill from Yahoo Finance / OpenBB
- User accounts and saved models in cloud
- Multi-company comparison
- Options pricing (Black-Scholes, binomial lattice)
- rTSR PSU valuation (Monte Carlo relative performance)
- Macro scenario overlay (recession, rate shock)

---

## 5. Feature Specs

### 5.1 Input Panel — Company Fundamentals
**What user sees**: Left panel, Section 1 of 6. Fields: Company Name (text), Ticker (text), Current Stock Price ($), Shares Outstanding (M), Total Debt ($M), Cash & Equivalents ($M), TTM Revenue ($M), TTM EBITDA ($M), TTM Free Cash Flow ($M), Projection Years (3/5/7/10 selector).  
**Visual design**: Dark surface card with amber section header "01 — Company Fundamentals". Input fields have dark surface-alt background, amber focus ring. Tooltip (?) icon on each field opens a popover with finance-professional definition.  
**Behavior**: Entering Current Price pre-populates an "Implied market cap" read-only display below. All fields debounce validation 400ms.  
**Validation**: All monetary fields must be positive numbers. Shares outstanding > 0 required to run.

### 5.2 Input Panel — Stress Variable Configuration
**What user sees**: Section 2 of 6. Ten collapsible sub-sections, one per variable, organized into two groups:

**Group A — Income Statement & Cash Flow Drivers**
1. Revenue Growth Rate (YoY %)
2. EBITDA Margin (%)
3. CapEx as % of Revenue (%)
4. Change in Net Working Capital as % of Revenue (%)
5. D&A as % of Revenue (%) — affects FCF bridge from EBITDA

**Group B — Valuation & Cost of Capital**
6. WACC (%)
7. Terminal Growth Rate (%)
8. EV/EBITDA Exit Multiple (×)
9. Tax Rate (%) — effective corporate tax rate applied to EBIT
10. Revenue Growth Rate — Year 1 Premium (%) — allows a separate near-term growth spike vs. long-run mean (useful for high-growth companies)

Each sub-section: Mean, Std Dev, Min, Max, Distribution Type selector (Normal / Log-Normal / Uniform / Triangular). Triangular shows an additional "Most Likely" field.

**Visual design**: Accordion with two labeled group headers ("Income Statement Drivers" and "Valuation & Cost of Capital"). Active section has amber left border. Sliders are amber-colored. Mean/SD values shown numerically beside sliders. An inline mini-histogram sparkline previews the selected distribution shape.
**Behavior**: Changing distribution type shows/hides relevant fields. Group headers can collapse/expand all variables in that group at once.
**Validation**: SD ≥ 0. Min < Mean < Max for triangular. WACC > Terminal Growth Rate (otherwise model is undefined — show warning but allow override). CapEx and D&A values must be ≥ 0. Tax Rate must be in [0%, 60%].

### 5.3 Input Panel — Simulation Configuration
**What user sees**: Section 3 of 6. Fields: Number of Runs (radio: 500 / 1,000 / 5,000 / 10,000 / 25,000), Random Seed (numeric, optional — enables reproducibility), Sampling Method (radio: Standard Monte Carlo / Latin Hypercube), Terminal Value Method (toggle: Gordon Growth Model / Exit Multiple).  
**Visual design**: Compact radio group with pill styling. Seed field is monospaced. A small info banner explains Latin Hypercube: "More efficient sampling — same confidence with fewer runs."  
**Behavior**: Selecting LHS and high run counts shows an estimated run time badge.  
**Validation**: Seed must be integer if provided.

### 5.4 Input Panel — Scenario Price Targets
**What user sees**: Section 4 of 6. Three price input fields: Bear Target ($), Base Target ($), Bull Target ($). Below each: auto-calculated "Upside/downside vs current price (%)" read-only field. A "Probability of exceeding" badge auto-populates after simulation.  
**Visual design**: Bear field has red left border, Base has blue, Bull has green. After simulation, probability badges glow in matching colors.  
**Behavior**: These three values drive the histogram color banding. Changing them after a simulation triggers an instant re-color without re-running.  
**Validation**: Bear < Base < Bull required before run.

### 5.5 Output — Monte Carlo Histogram
**What user sees**: Main output tab. Bar chart where X-axis = Implied Share Price ($), Y-axis = Frequency (# of simulation runs). Color coding: red bars below Bear target, blue/gray bars between Bear and Bull, red bars above Bull (matching reference image exactly). Vertical dashed lines at Bear, Base, Bull prices, labeled. A "Current Price" vertical line in white. Mean and Median shown as colored vertical lines.  
**Visual design**: Dark chart background matching `--color-bg`. Amber grid lines (subtle). Axis labels in DM Mono. Legend at top showing color→scenario mapping. Bars animate in left-to-right on render.  
**Behavior**: Hovering a bar shows tooltip: "Price range: $XX–$XX | Count: N runs | X.X% of simulations". Clicking a bar filters the stats panel to show stats for that range only (advanced).  
**Validation**: If simulation hasn't run, chart shows "Run simulation to see results" empty state.

### 5.6 Output — Statistics Panel
**What user sees**: Sidebar to the right of histogram (or below on narrow viewports). Table of: Mean Price, Median Price, Std Dev, Min, Max, 5th Pctl, 10th Pctl, 25th Pctl, 75th Pctl, 90th Pctl, 95th Pctl, P(Price > Bear), P(Price > Base), P(Price > Bull), VaR 95% (max loss from current price at 5th percentile), CVaR 95% (expected loss in worst 5% of outcomes).  
**Visual design**: Two-column table. Value column in DM Mono amber. Probability-of-exceeding rows have colored dot prefix (red/blue/green for bear/base/bull).  
**Behavior**: All values update immediately when simulation completes.

---

## 6. Data Model

**SimulationInputs**
| Field | Type | Notes |
|-------|------|-------|
| companyName | string | Display only |
| ticker | string | Display only |
| currentPrice | number | Current market price ($) |
| sharesOutstanding | number | Millions |
| totalDebt | number | $M |
| cashAndEquiv | number | $M |
| ttmRevenue | number | $M |
| ttmEbitda | number | $M |
| ttmFcf | number | $M |
| projectionYears | 3\|5\|7\|10 | Forecast horizon |
| terminalValueMethod | 'ggm'\|'exitMultiple' | GGM or Exit Multiple |

**StressVariable**
| Field | Type | Notes |
|-------|------|-------|
| id | string | e.g. 'revenueGrowth', 'ebitdaMargin', 'capexPct', 'nwcPct', 'daPct', 'wacc', 'tgr', 'exitMultiple', 'taxRate', 'year1GrowthPremium' |
| label | string | Display label |
| group | 'incomeStatement' \| 'valuation' | Groups variables in the accordion UI |
| mean | number | % |
| stdDev | number | % |
| min | number | % |
| max | number | % |
| distribution | 'normal'\|'lognormal'\|'uniform'\|'triangular' | |
| mostLikely | number\|null | For triangular distribution only |

**ScenarioTargets**
| Field | Type | Notes |
|-------|------|-------|
| bear | number | Price ($) |
| base | number | Price ($) |
| bull | number | Price ($) |

**SimulationConfig**
| Field | Type | Notes |
|-------|------|-------|
| numRuns | 500\|1000\|5000\|10000\|25000 | |
| seed | number\|null | Optional reproducibility |
| samplingMethod | 'standard'\|'lhs' | Latin Hypercube option |

**SimulationResult**
| Field | Type | Notes |
|-------|------|-------|
| runId | number | Index 0..N-1 |
| revenueGrowth | number | Sampled value |
| ebitdaMargin | number | Sampled value |
| wacc | number | Sampled value |
| terminalGrowthRate | number | Sampled value |
| exitMultiple | number | Sampled value |
| impliedEV | number | Computed EV ($M) |
| impliedPrice | number | Computed price per share ($) |

**SimulationOutput** (aggregated)
| Field | Type | Notes |
|-------|------|-------|
| results | Float64Array | impliedPrice for all N runs |
| mean | number | |
| median | number | |
| stdDev | number | |
| percentiles | Record<5\|10\|25\|75\|90\|95, number> | |
| probAboveBear | number | 0–1 |
| probAboveBase | number | 0–1 |
| probAboveBull | number | 0–1 |
| var95 | number | Value at Risk |
| cvar95 | number | Conditional VaR |
| tornadoData | TornadoEntry[] | Rank correlation per variable |
| histogramBins | HistogramBin[] | Pre-bucketed for Chart.js |

---

## 7. Edge Cases

| Scenario | Expected Behavior |
|----------|------------------|
| WACC ≤ Terminal Growth Rate | Show red warning banner "Model undefined: WACC must exceed TGR". Allow override with confirmation. |
| Negative FCF as TTM input | Allow it; warn user "Negative FCF detected — ensure this is expected" |
| Very tight SD (near-zero) | Distribution looks like a spike; valid — show note "Low variance: consider widening SD" |
| All outputs below Bear | Histogram is entirely red; probability badges show 0% for Base and Bull |
| Run count = 25,000 on slow device | Progress bar + estimated time shown; UI remains interactive during worker computation |
| User changes Bear > Base > Bull | Reorder inputs automatically or show validation error before allowing run |
| Page refreshed mid-simulation | Worker terminates; inputs remain, results cleared; user must re-run |
| Zero shares outstanding | Block run; show error "Shares outstanding required to compute per-share price" |
| Load invalid JSON config | Show toast error "Invalid config file — please check format"; do not corrupt state |
| Export PDF with no simulation run | Show toast "Run the simulation before exporting" |
| GitHub Pages 404 on direct URL | Use HashRouter so all routes resolve client-side; no 404.html workaround needed |
| NaN in simulation output | Filter out; show count of discarded runs in a warning banner |

---

## 8. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Simulation speed (10,000 runs) | <3 seconds | performance.now() in worker, logged to console.dev |
| Time to first meaningful output | <500ms after run completes | Lighthouse TTI / manual stopwatch |
| Zero NaN outputs for valid inputs | 100% clean runs | Unit test: 10,000 runs with valid inputs, count NaN |
| Histogram color accuracy | 100% bars correctly colored per thresholds | Unit test: bin color assignment function |
| Export completeness | PDF + CSV both contain all required fields | Manual review + unit test on CSV shape |
| Input validation coverage | All 12 validation rules tested | Vitest: one test per rule |

---

## 9. Out of Scope (v1)

- Live market data / ticker API integration
- User accounts or cloud persistence
- Multi-company comparison mode
- Options pricing models (Black-Scholes, binomial)
- rTSR / PSU valuation
- Macro scenario library (pre-built recession/bull market templates)
- Mobile-optimized layout (below 1024px, a "view-only" collapsed layout is acceptable)
- Collaboration / sharing links
- AI-assisted input suggestion ("typical WACC for SaaS is X%")

---

## 10. Future Roadmap (v2+)

1. **Ticker auto-fill**: Connect to Yahoo Finance or OpenBB to pre-populate fundamentals from a ticker symbol
2. **Correlation matrix**: Allow user to specify pairwise correlations between stress variables (Cholesky decomposition for sampling)
3. **Scenario library**: Save and recall named scenario sets (e.g., "Base Case Q3 2025", "Bear Case — Rate Shock")
4. **AI input assistant**: Suggest distribution parameters based on sector benchmarks and historical data
5. **Shareable URL**: Encode simulation config in URL query params for easy sharing without an account
6. **Institutional report template**: Multi-page PDF export styled like a sell-side research initiation
