# PLAN.md — Monte Carlo Equity Valuation Dashboard

3 phases, ~2.5–3 hours total AI build time. Every task is scoped to a single file. Fix failures within the current phase before moving on. Do not proceed past a gate without explicit confirmation.

---

## Phase 1: Foundation + Core Engine (~70 min)

**Goal**: Scaffold the project, implement the full simulation engine, and render a bare-bones UI that proves real DCF + Monte Carlo data flows end-to-end.

### Tasks

1. **Scaffold project** (`package.json` + `vite.config.ts` + `tailwind.config.ts` + `tsconfig.json`) — Init Vite React-TS project, install dependencies: `chart.js react-chartjs-2 zustand jspdf html2canvas xlsx date-fns gh-pages`, configure Tailwind with CSS vars, add Google Fonts import to `index.html`. Set `base: '/mc-valuation-dashboard/'` in `vite.config.ts`. Add `worker: { format: 'es' }` to vite config. Add `predeploy` + `deploy` scripts to `package.json` per ARCHITECTURE.md §11.2.

2. **Create `src/index.css`** — Define all CSS custom properties (full color palette from ARCHITECTURE.md §10.2), Tailwind base import, global body styles with dark background and Space Grotesk / DM Mono font stacks

3. **Create `src/types/inputs.ts`** — `SimulationInputs`, `StressVariable`, `ScenarioTargets`, `SimulationConfig`, `SampledVariables` interfaces

4. **Create `src/types/outputs.ts`** — `SimulationResult`, `SimulationOutput`, `HistogramBin`, `TornadoEntry`, `SensitivityCell` interfaces

5. **Create `src/types/worker.ts`** — `WorkerMessage`, `WorkerResponse` types for Web Worker message contract

6. **Create `src/constants/finance.ts`** — Default values: WACC 10%, TGR 2.5%, revenue growth mean 8%, projection years 5, histogram bin count 50. All 10 stress variable defaults with labels, groups, distributions, and reasonable SDs. Income Statement group: revenueGrowth (mean 8%, SD 4%), ebitdaMargin (mean 22%, SD 4%), capexPct (mean 5%, SD 2%), nwcPct (mean 2%, SD 1%), daPct (mean 4%, SD 1%). Valuation group: wacc (mean 10%, SD 1.5%), tgr (mean 2.5%, SD 0.5%), exitMultiple (mean 12×, SD 2×), taxRate (mean 25%, SD 3%), year1GrowthPremium (mean 2%, SD 2%).

7. **Create `src/constants/labels.ts`** — All user-facing field labels, tooltip help text (professional finance definitions), section titles, error messages

8. **Create `src/engine/distributions.ts`** — `sampleNormal()`, `sampleLognormal()`, `sampleUniform()`, `sampleTriangular()` — all take pre-generated uniform random values as arguments (not calling Math.random internally)

9. **Create `src/engine/dcfEngine.ts`** — `computeDCF(base, sampled, method)` — full 5-step DCF: project FCF for N years, compute PV of cash flows, compute terminal value (GGM or exit multiple), compute EV, deduct net debt, divide by shares. Returns `NaN` if WACC ≤ TGR.

10. **Create `src/engine/lhsSampler.ts`** — `latinHypercubeSample(n, k)` returns `Float64Array[]` — divides each dimension into N equal intervals, takes one random sample per interval, shuffles each dimension independently

11. **Create `src/engine/statistics.ts`** — `computePercentile()`, `computeStdDev()`, `computeMean()`, `computeTornadoCorrelations()`, `buildHistogramBins()`

12. **Create `src/engine/colorBands.ts`** — `getBinColor()`, `buildBinColorArray()` — implements the bear/bull threshold coloring logic

13. **Create `src/engine/mcRunner.ts`** — `runMonteCarlo()` — allocates `Float64Array`, runs the hot loop, handles LHS vs. standard sampling, filters NaN, sorts, calls statistics, returns `SimulationOutput`

14. **Create `src/engine/simulationWorker.ts`** — Web Worker entry point: receives `WorkerMessage`, calls `runMonteCarlo()`, posts `WorkerResponse` back. Handles errors with try/catch.

15. **Create `src/utils/validators.ts`** — `validateInputs()` — validates all 12 rules, returns `ValidationResult` with all errors at once

16. **Create `src/utils/formatters.ts`** — `formatCurrency()`, `formatPercent()`, `formatPrice()`, `formatLargeNumber()`

17. **Create `src/utils/chartConfig.ts`** — `darkChartDefaults` export — shared Chart.js options object for dark theme, DM Mono font, grid color, tooltip styling

18. **Create bare-bones `src/App.tsx`** — Minimal layout: two text inputs (company name, current price), a "Run" button, and a `<pre>` that dumps raw `SimulationOutput` JSON after running. Enough to verify the worker fires, runs 1,000 iterations, and returns valid data.

### Tests

**Automated** (create `tests/engine/` files):
- [ ] `sampleNormal(0, 1, u1, u2)` returns values that pass KS test mean ≈ 0 over 10,000 samples
- [ ] `sampleUniform(0, 1, u)` returns value in [0, 1] for u ∈ [0, 1]
- [ ] `computeDCF()` returns NaN when WACC ≤ TGR
- [ ] `computeDCF()` returns positive number for WACC=0.10, TGR=0.025, revenue growth=0.08, EBITDA margin=0.20
- [ ] `computePercentile(sorted, 0.5)` returns median of [1,2,3,4,5] = 3
- [ ] `buildHistogramBins()` returns exactly 50 bins when given 10,000 price values
- [ ] `getBinColor(50, 60, 90)` returns red (below bear=60)
- [ ] `getBinColor(75, 60, 90)` returns blue (between bear=60 and bull=90)
- [ ] `getBinColor(100, 60, 90)` returns red (above bull=90)
- [ ] `validateInputs()` returns error for sharesOutstanding = 0
- [ ] `validateInputs()` returns error for bear > base
- [ ] `runMonteCarlo()` with 1,000 runs returns exactly 1,000 price values (after filtering NaN)

**Manual**:
- [ ] Click Run in bare-bones App.tsx, verify JSON output appears with mean/median/percentiles
- [ ] Verify worker runs without crashing (check browser DevTools)
- [ ] Verify 10,000 runs completes in <3 seconds (check console timing log)

### Gate
> **"Phase 1 ✅"** — DCF engine computes valid prices, 1,000-run MC simulation completes via Web Worker and returns a valid `SimulationOutput` object with all percentile fields populated. All 12 automated tests pass. **Do NOT proceed until confirmed.**

---

## Phase 2: Full UI + All Visualizations (~75 min)

**Goal**: Build the complete styled UI — input panel, all 5 output charts, stats panel — with full interactivity. By end of Phase 2, the dashboard is fully functional.

### Tasks

1. **Create `src/store/inputsSlice.ts`** — Zustand slice: company fundamentals state + actions, default stress variables (5 pre-configured), update actions for each field

2. **Create `src/store/configSlice.ts`** — Zustand slice: numRuns, seed, samplingMethod, terminalValueMethod with defaults and update actions

3. **Create `src/store/scenarioSlice.ts`** — Zustand slice: bear/base/bull prices with defaults (derived from currentPrice ±20%/0%/+30%) and update actions

4. **Create `src/store/resultsSlice.ts`** — Zustand slice: `output: SimulationOutput | null`, `isRunning: boolean`, `progress: number`, `error: string | null`, worker instance ref

5. **Create `src/hooks/useSimulation.ts`** — Spawns worker, handles onmessage + onerror, dispatches to resultsSlice, exposes `runSimulation()` and `abort()`

6. **Create `src/hooks/useHistogramData.ts`** — Derives `Chart.js` dataset from `SimulationOutput.histogramBins` + current scenario targets; recomputes colors when thresholds change without re-running

7. **Create `src/hooks/useSensitivityData.ts`** — Iterates 5×5 grid over WACC (±200bp) and TGR (±100bp) ranges, calls `computeDCF()` for each cell, returns `SensitivityCell[][]`

8. **Create `src/components/shared/InputField.tsx`** — Labeled input: label, tooltip icon, input, error text, units badge. Accepts all standard HTML input props.

9. **Create `src/components/shared/SliderWithInput.tsx`** — Range slider + numeric input in sync; amber-colored thumb; live update

10. **Create `src/components/shared/SectionCard.tsx`** — Dark card with amber numbered header, collapse/expand behavior, slot for content

11. **Create `src/components/shared/RunButton.tsx`** + `src/components/shared/ExportMenu.tsx` + `src/components/shared/Badge.tsx` + `src/components/shared/EmptyState.tsx` + `src/components/shared/TooltipIcon.tsx` — All shared primitives in one task (each under 40 lines)

12. **Create `src/components/inputs/FundamentalsSection.tsx`** — Section 1: Company Name, Ticker, Current Price, Shares Outstanding, Total Debt, Cash, TTM Revenue, TTM EBITDA, TTM FCF, Projection Years. Implied market cap read-only display.

13. **Create `src/components/inputs/StressVariableRow.tsx`** + `src/components/inputs/DistributionPreview.tsx` — Single stress variable row with mean/SD sliders and distribution sparkline preview

14. **Create `src/components/inputs/StressVariables.tsx`** — Section 2: Two labeled group headers ("Income Statement Drivers" and "Valuation & Cost of Capital"). Each group is collapsible. Contains all 10 stress variable rows: Group A (revenueGrowth, ebitdaMargin, capexPct, nwcPct, daPct) and Group B (wacc, tgr, exitMultiple, taxRate, year1GrowthPremium). Group-level expand/collapse controls.

15. **Create `src/components/inputs/SimConfigSection.tsx`** — Section 3: Run count radio group, seed field, LHS toggle, TV method toggle

16. **Create `src/components/inputs/ScenarioTargets.tsx`** — Section 4: Bear/Base/Bull price inputs with upside/downside % display. Color-coded borders. Post-simulation probability badges.

17. **Create `src/components/outputs/StatsPanel.tsx`** — Two-column table: all 16 stats (mean, median, SD, 5 percentiles, 3 scenario probabilities, VaR, CVaR). DM Mono values in amber. Color-coded probability rows.

18. **Create `src/components/outputs/HistogramChart.tsx`** — Chart.js bar chart: histogram with scenario line annotations (Bear, Base, Bull, Current Price, Mean, Median). Color bands from `useHistogramData`. Bar entry animation. Tooltip with count + percentage.

19. **Create `src/components/outputs/TornadoChart.tsx`** — Horizontal bar chart: all 10 stress variables ranked by |Pearson rank correlation| with impliedPrice. Positive = right (amber), negative = left (blue). Labels show variable name + correlation coefficient. Tells the analyst which of the 10 inputs most drives output variance.

20. **Create `src/components/outputs/CDFChart.tsx`** — Line chart: cumulative distribution. X = price, Y = cumulative %. Vertical reference lines at Bear/Base/Bull. Hover tooltip shows price + percentile.

21. **Create `src/components/outputs/SensitivityHeatmap.tsx`** — 5×5 table component (not Chart.js). Color gradient from red (low price) to green (high price). Cells show price + Δ% vs. base case.

22. **Create `src/components/outputs/FanChart.tsx`** — Line chart: 5th/25th/50th/75th/95th percentile price paths across projection years. Shaded bands between percentiles.

23. **Create `src/components/outputs/OutputTabs.tsx`** — Tab bar for: Histogram | Tornado | CDF | Sensitivity | Fan. Renders the active chart + StatsPanel sidebar.

24. **Create `src/components/layout/InputPanel.tsx`** — Scrollable left panel (320px). Renders sections 1–4. Run button at bottom of panel (sticky).

25. **Create `src/components/layout/Header.tsx`** — Company name/ticker display, implied market cap, current price, Run button (also in header for prominence), export menu, simulation status

26. **Create `src/components/layout/AppShell.tsx`** — Full layout: Header + InputPanel (left, 320px fixed) + OutputTabs (right, flex). Responsive: stacks below 1024px.

27. **Update `src/App.tsx`** — Replace bare-bones version with `<AppShell />` as the sole child

### Tests

**Automated**:
- [ ] `useHistogramData` returns correct colors when bear=60, bull=90 and bins span 40–120
- [ ] `useSensitivityData` returns a 5×5 grid (25 cells) for valid inputs
- [ ] `StatsPanel` renders all 16 stat rows when given mock `SimulationOutput`

**Manual**:
- [ ] Enter fundamentals → click Run → histogram renders with color bands
- [ ] Change Bear price target → histogram recolors without re-running simulation
- [ ] Stats panel shows all 16 values after run
- [ ] Tornado chart shows 5 bars correctly ranked
- [ ] CDF chart renders S-curve with reference lines at Bear/Base/Bull
- [ ] Sensitivity heatmap renders 5×5 grid with color gradient
- [ ] Fan chart renders 5 percentile lines across projection years
- [ ] Tab switching between all 5 output tabs works without crash
- [ ] Run button shows amber pulse animation while simulation runs
- [ ] Validation errors show inline when running with missing required field

### Gate
> **"Phase 2 ✅"** — Full dashboard renders, all 5 charts display real simulation data, color banding on histogram matches reference image (red below bear, blue between, red above bull), all 16 stats visible, tab switching works, run animation works. **Do NOT proceed until confirmed.**

---

## Phase 3: Export, Polish, and Ship (~55 min)

**Goal**: Implement all export flows, final visual polish, edge case handling, accessibility, GitHub Pages deployment configuration, and a working live URL.

### Tasks

1. **Create `src/hooks/useExport.ts`** — `exportPDF()` (html2canvas + jsPDF), `exportCSV()` (SheetJS with all 10 stress variable columns), `exportConfig()` (JSON blob download), `importConfig()` (FileReader + store update)

2. **Update `src/components/shared/ExportMenu.tsx`** — Wire up all 4 export actions from `useExport`. Show loading state during PDF generation.

3. **Create `tests/hooks/useExport.test.ts`** — Test `exportCSV` produces correct row shape with all 10 variable columns; test `importConfig` with valid and invalid JSON fixtures

4. **Update `src/components/inputs/ScenarioTargets.tsx`** — Wire probability badges from results store post-simulation. Show "—" before run, colored probabilities after.

5. **Polish `src/components/outputs/HistogramChart.tsx`** — Add bar entry stagger animation (CSS keyframes via Chart.js animation config). Add vertical annotation lines for Bear/Base/Bull/Current/Mean/Median with labels. Add chart title with run count and timestamp.

6. **Create empty and error states** (`src/components/shared/EmptyState.tsx` enhancements) — "Run simulation to see results" with amber Run button shortcut. Error state shows error message with retry button.

7. **Accessibility pass** (`src/components/` — update key files) — Add `aria-label` to all icon buttons, `role="status"` on stats panel, keyboard navigation for tabs, focus trap in tooltip popovers, sufficient color contrast check for text

8. **Create `src/components/inputs/DistributionPreview.tsx`** (if not complete in Phase 2) — Mini inline Chart.js line chart showing distribution shape (normal bell, uniform box, triangular peak) based on selected distribution type and parameters

9. **Responsive polish** — Update `AppShell.tsx` + `InputPanel.tsx`: below 1024px, stack panels vertically; input panel becomes collapsible drawer; charts resize to fill available width

10. **Final test sweep** (`tests/` — add edge case tests) — NaN filter test, WACC ≤ TGR warning test, import invalid JSON test, LHS vs. standard sampling produces similar mean within tolerance

11. **GitHub Pages deployment** (`vite.config.ts` + `package.json` verification + `README.md`) — Confirm `base: '/mc-valuation-dashboard/'` is set in `vite.config.ts`. Confirm `worker: { format: 'es' }` is present. Confirm `gh-pages` is in devDependencies. Create `README.md` with: project description, local dev instructions (`npm install` + `npm run dev`), and deploy instructions (`npm run deploy` → Settings → Pages → `gh-pages` branch). Run `npm run build` and verify `dist/` contains a working static bundle with no absolute `/assets/` paths.

### Tests

**Automated**:
- [ ] `exportCSV` row[0] has all 12 expected keys: RunId, RevenueGrowth, EbitdaMargin, CapexPct, NWCPct, DAPct, WACC, TGR, ExitMultiple, TaxRate, Year1GrowthPremium, ImpliedEV, ImpliedPrice
- [ ] `importConfig` with valid fixture populates store with correct values
- [ ] `importConfig` with invalid JSON returns error, does not mutate store
- [ ] 10,000 LHS runs vs. 10,000 standard runs: mean within 2% of each other on identical inputs
- [ ] `npm run build` exits with code 0 and produces `dist/index.html`

**Manual**:
- [ ] Export PDF → opens clean PDF with histogram image, stats table, company header
- [ ] Export CSV → opens in Excel with correct column headers and 10,000 rows, all 10 variable columns present
- [ ] Export JSON config → save, reload page, import config → all fields repopulated exactly including all 10 stress variable parameters
- [ ] Trigger WACC ≤ TGR warning → confirm banner shows; allow override; simulation runs with warning
- [ ] Trigger NaN output scenario → confirm warning badge shows "X runs discarded (invalid)"
- [ ] Narrow browser to 1024px → layout stacks, no horizontal scroll
- [ ] All tabs keyboard-navigable (Tab + Enter to switch)
- [ ] Empty state shows on initial load and after clearing results
- [ ] TooltipIcon popovers close on Escape key
- [ ] Run `npm run build && npx serve dist` → open `http://localhost:3000` → confirm app loads and simulation runs (validates GitHub Pages bundle before pushing)

### Gate
> **"Phase 3 ✅"** — PDF export produces readable output, CSV export contains all 13 columns including all 10 stress variables, JSON round-trip works, WACC/TGR warning works, layout is responsive at 1024px, `npm run build` succeeds, `dist/` bundle works when served locally. Ready to `npm run deploy`.

---

## Summary

| Phase | Name | Key Outcome | Time |
|-------|------|-------------|------|
| 1 | Foundation + Core Engine | Project scaffold (GH Pages config), full DCF engine with 10 stress variables, MC worker, bare-bones run UI | ~70 min |
| 2 | Full UI + All Visualizations | Complete styled dashboard: all inputs (10 stress vars in 2 groups), all 5 charts, stats panel | ~75 min |
| 3 | Export + Polish + Ship | PDF/CSV/JSON export, animations, accessibility, responsive, GH Pages deploy + README | ~55 min |

**Total: ~3.5 hours.**
