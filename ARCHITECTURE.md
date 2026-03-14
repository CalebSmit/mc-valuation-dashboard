# ARCHITECTURE.md — Monte Carlo Equity Valuation Dashboard

## 1. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| UI Framework | React 18 + TypeScript 5 | Functional components, hooks |
| Build Tool | Vite 5 | Fast HMR, Web Worker support via `?worker`; `base` set to repo name for GitHub Pages |
| Styling | Tailwind CSS 3 | Utility classes only; custom CSS vars in `index.css` |
| Charts | Chart.js 4 + react-chartjs-2 | Histogram, Tornado, CDF, Sensitivity heatmap, Fan chart |
| Global State | Zustand 4 | Slices for inputs, config, results |
| Simulation Engine | Custom TypeScript + Web Worker | `simulationWorker.ts` runs in separate thread |
| PDF Export | jsPDF + html2canvas | Renders output panel to canvas, inserts into PDF |
| CSV/Excel Export | SheetJS (xlsx) | Exports raw run data |
| JSON Config | Native browser APIs | FileReader + Blob download |
| Math/Stats | Custom utils in `/src/engine/` | No external stats library needed |
| Testing | Vitest + @testing-library/react | Unit tests on engine + hooks; component tests |
| Deployment | GitHub Pages via `gh-pages` npm package | `npm run deploy` pushes `dist/` to `gh-pages` branch |
| Package Manager | npm | |
| Platform | Web browser (Chrome 100+, Edge, Safari 15+, Firefox 110+) | No backend, no Node.js at runtime; fully static |

---

## 2. Project Structure

```
mc-valuation-dashboard/
├── public/
│   └── favicon.svg
├── src/
│   ├── constants/
│   │   ├── finance.ts          # Default WACC, TGR, trading days, distribution defaults
│   │   └── labels.ts           # All user-facing strings, tooltip text, field labels
│   │
│   ├── types/
│   │   ├── inputs.ts           # SimulationInputs, StressVariable, ScenarioTargets, SimulationConfig
│   │   ├── outputs.ts          # SimulationResult, SimulationOutput, HistogramBin, TornadoEntry
│   │   └── charts.ts           # Chart.js dataset types, SensitivityCell
│   │
│   ├── engine/
│   │   ├── distributions.ts    # sampleNormal(), sampleLognormal(), sampleUniform(), sampleTriangular()
│   │   ├── dcfEngine.ts        # computeDCF(inputs, sampledVars): number — single-run DCF computation
│   │   ├── mcRunner.ts         # runMonteCarlo(inputs, config): SimulationOutput — orchestrates N runs
│   │   ├── lhsSampler.ts       # latinHypercubeSample(n, variables): Float64Array[][] — LHS implementation
│   │   ├── statistics.ts       # computePercentile(), computeStdDev(), computeTornadoCorrelations()
│   │   ├── colorBands.ts       # getBinColor(price, bear, bull): string — color assignment logic
│   │   └── simulationWorker.ts # Web Worker entry point — receives message, runs mcRunner, posts back
│   │
│   ├── store/
│   │   ├── inputsSlice.ts      # Zustand slice: company fundamentals + stress variables
│   │   ├── configSlice.ts      # Zustand slice: run count, seed, method, TV method
│   │   ├── scenarioSlice.ts    # Zustand slice: bear/base/bull targets
│   │   └── resultsSlice.ts     # Zustand slice: SimulationOutput | null, isRunning, progress
│   │
│   ├── hooks/
│   │   ├── useSimulation.ts    # Spawns worker, handles messages, updates resultsSlice
│   │   ├── useHistogramData.ts # Derives Chart.js dataset from SimulationOutput + scenario targets
│   │   ├── useSensitivityData.ts # Derives 2D sensitivity table from input ranges
│   │   └── useExport.ts        # Orchestrates PDF + CSV + JSON config export
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx        # Main layout: header + left panel + right panel
│   │   │   ├── Header.tsx          # Company name/ticker + Run button + status
│   │   │   └── InputPanel.tsx      # Scrollable left panel with 4 input sections
│   │   │
│   │   ├── inputs/
│   │   │   ├── FundamentalsSection.tsx   # Section 1: company fundamentals fields
│   │   │   ├── StressVariables.tsx       # Section 2: accordion for each stress variable
│   │   │   ├── StressVariableRow.tsx     # Single variable: mean/SD sliders + distribution picker
│   │   │   ├── DistributionPreview.tsx   # Mini sparkline showing distribution shape
│   │   │   ├── SimConfigSection.tsx      # Section 3: run count, seed, LHS toggle, TV method
│   │   │   └── ScenarioTargets.tsx       # Section 4: Bear/Base/Bull price inputs
│   │   │
│   │   ├── outputs/
│   │   │   ├── OutputTabs.tsx        # Tab bar: Histogram | Tornado | CDF | Sensitivity | Fan Chart
│   │   │   ├── StatsPanel.tsx        # Summary statistics sidebar
│   │   │   ├── HistogramChart.tsx    # Main MC distribution histogram (Chart.js bar)
│   │   │   ├── TornadoChart.tsx      # Horizontal bar chart ranked by Pearson correlation
│   │   │   ├── CDFChart.tsx          # Cumulative distribution function (Chart.js line)
│   │   │   ├── SensitivityHeatmap.tsx # 2D sensitivity table with color gradient
│   │   │   └── FanChart.tsx          # Price path percentile bands over time (Chart.js line)
│   │   │
│   │   └── shared/
│   │       ├── InputField.tsx        # Reusable labeled input with tooltip + error state
│   │       ├── SliderWithInput.tsx   # Range slider + numeric input in sync
│   │       ├── TooltipIcon.tsx       # (?) icon with popover content
│   │       ├── SectionCard.tsx       # Dark card container with amber header
│   │       ├── Badge.tsx             # Probability badge with color coding
│   │       ├── RunButton.tsx         # Amber CTA button with pulsing animation state
│   │       ├── EmptyState.tsx        # "Run simulation to see results" placeholder
│   │       └── ExportMenu.tsx        # PDF / CSV / JSON export dropdown
│   │
│   ├── utils/
│   │   ├── formatters.ts       # formatCurrency(), formatPercent(), formatPrice()
│   │   ├── validators.ts       # validateInputs(): ValidationResult — all 12 input rules
│   │   └── chartConfig.ts      # Shared Chart.js defaults (dark theme, fonts, grid colors)
│   │
│   ├── App.tsx                 # Root component — mounts AppShell
│   ├── main.tsx                # Vite entry point
│   └── index.css               # CSS variables + Tailwind base imports + font imports
│
├── tests/
│   ├── engine/
│   │   ├── distributions.test.ts
│   │   ├── dcfEngine.test.ts
│   │   ├── statistics.test.ts
│   │   └── colorBands.test.ts
│   ├── hooks/
│   │   └── useHistogramData.test.ts
│   └── utils/
│       └── validators.test.ts
│
├── index.html
├── vite.config.ts          # base: '/mc-valuation-dashboard/' for GitHub Pages
├── tailwind.config.ts
├── tsconfig.json
└── package.json            # deploy script: "deploy": "npm run build && gh-pages -d dist"
```

---

## 3. Data Flows

### 3.1 App Initialization
1. `main.tsx` mounts `App.tsx` → renders `AppShell`
2. Zustand store initializes with default inputs from `finance.ts` constants
3. All input sections render with default values populated
4. Output panel shows `EmptyState` component — simulation not yet run

### 3.2 User Configures Inputs and Runs Simulation
1. User fills in fundamentals + adjusts stress variable sliders → `inputsSlice` updates
2. User sets Bear/Base/Bull targets → `scenarioSlice` updates
3. User clicks "Run Simulation" → `Header.tsx` calls `useSimulation().runSimulation()`
4. `useSimulation` validates inputs via `validateInputs()` — if errors, shows inline validation, aborts
5. `useSimulation` sets `resultsSlice.isRunning = true`, spawns `simulationWorker.ts` via `new Worker()`
6. Worker receives `{ inputs, config }` message → calls `mcRunner.runMonteCarlo()` → posts `SimulationOutput` back
7. `useSimulation` receives message → updates `resultsSlice` with output → sets `isRunning = false`
8. `HistogramChart` and `StatsPanel` re-render with live data

### 3.3 Histogram Color Update (Without Re-run)
1. User changes a scenario target price → `scenarioSlice` updates
2. `useHistogramData` hook recomputes `colorBands.getBinColor()` for each bin using new thresholds
3. Chart.js dataset backgroundColor array is updated → `chart.update()` called
4. Histogram re-colors in <16ms (no simulation re-run needed)

### 3.4 Sensitivity Table Computation
1. User navigates to Sensitivity tab
2. `useSensitivityData` iterates a 5×5 grid over the selected variables' ranges
3. For each cell, calls `dcfEngine.computeDCF()` with point estimates (no MC)
4. Returns `SensitivityCell[][]` with prices + relative change colors
5. `SensitivityHeatmap` renders color-coded table

### 3.5 PDF Export
1. User clicks Export → PDF
2. `useExport.exportPDF()` calls `html2canvas` on the output panel DOM node
3. Canvas converted to PNG, inserted into `jsPDF` document
4. Stats panel text rendered as text layer in PDF (not rasterized)
5. PDF downloaded as `[ticker]-monte-carlo-[date].pdf`

### 3.6 CSV Export
1. `useExport.exportCSV()` reads `resultsSlice.results` raw run array
2. SheetJS `utils.aoa_to_sheet()` builds sheet from results array
3. Downloaded as `[ticker]-mc-runs-[date].xlsx`

---

## 4. Service Contracts

```typescript
// ─── distributions.ts ───────────────────────────────────────────────────────

/** Box-Muller transform: sample from N(mean, stdDev) */
export function sampleNormal(mean: number, stdDev: number, u1: number, u2: number): number;

/** Sample from LogNormal distribution */
export function sampleLognormal(mean: number, stdDev: number, u1: number, u2: number): number;

/** Sample from Uniform(min, max) */
export function sampleUniform(min: number, max: number, u: number): number;

/** Sample from Triangular(min, mostLikely, max) */
export function sampleTriangular(min: number, mostLikely: number, max: number, u: number): number;


// ─── dcfEngine.ts ─────────────────────────────────────────────────────────────

/** Compute single-run implied share price from sampled inputs. Returns NaN if undefined (WACC ≤ TGR). */
export function computeDCF(
  base: SimulationInputs,
  sampled: SampledVariables,
  method: 'ggm' | 'exitMultiple'
): number;


// ─── mcRunner.ts ─────────────────────────────────────────────────────────────

/** Run N Monte Carlo iterations, return aggregated output. Called from Web Worker. */
export function runMonteCarlo(
  inputs: SimulationInputs,
  stressVars: StressVariable[],
  scenario: ScenarioTargets,
  config: SimulationConfig
): SimulationOutput;


// ─── lhsSampler.ts ────────────────────────────────────────────────────────────

/** Latin Hypercube sample: returns N×K matrix of uniform [0,1] samples. */
export function latinHypercubeSample(n: number, k: number): Float64Array[];


// ─── statistics.ts ────────────────────────────────────────────────────────────

/** Compute percentile value from sorted Float64Array. p ∈ [0, 1]. */
export function computePercentile(sorted: Float64Array, p: number): number;

/** Compute population standard deviation. */
export function computeStdDev(values: Float64Array, mean: number): number;

/** Compute Pearson rank correlation between impliedPrices and each input variable.
 *  Returns array sorted by |correlation| descending for tornado chart. */
export function computeTornadoCorrelations(
  results: SimulationResult[],
  variableIds: string[]
): TornadoEntry[];


// ─── colorBands.ts ────────────────────────────────────────────────────────────

/** Determine Chart.js bar color based on bin midpoint vs. scenario thresholds. */
export function getBinColor(binMidpoint: number, bear: number, bull: number): string;

/** Build full color array for all histogram bins. */
export function buildBinColorArray(bins: HistogramBin[], bear: number, bull: number): string[];


// ─── simulationWorker.ts ──────────────────────────────────────────────────────

/** Web Worker: listens for WorkerMessage, runs simulation, posts WorkerResponse back. */
self.onmessage = (e: MessageEvent<WorkerMessage>) => { ... };


// ─── useSimulation.ts ─────────────────────────────────────────────────────────

/** Hook: exposes runSimulation() and abort(). Manages worker lifecycle and result posting. */
export function useSimulation(): {
  runSimulation: () => void;
  abort: () => void;
  isRunning: boolean;
  progress: number; // 0–100
};


// ─── useExport.ts ─────────────────────────────────────────────────────────────

export function useExport(): {
  exportPDF: () => Promise<void>;
  exportCSV: () => void;
  exportConfig: () => void;
  importConfig: (file: File) => Promise<void>;
};


// ─── validators.ts ────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>; // fieldId → error message
}

/** Validate all inputs before running simulation. Returns all errors at once (not fail-fast). */
export function validateInputs(
  inputs: SimulationInputs,
  stressVars: StressVariable[],
  scenario: ScenarioTargets,
  config: SimulationConfig
): ValidationResult;
```

---

## 5. Key Implementation Patterns

### 5.1 DCF Engine — Single Run (10 Stress Variables)
```typescript
// dcfEngine.ts — full FCF bridge with all 10 stress variables
export function computeDCF(base: SimulationInputs, sampled: SampledVariables, method: 'ggm' | 'exitMultiple'): number {
  if (sampled.wacc <= sampled.tgr) return NaN;

  // Year 1 uses a separate near-term growth rate (mean + premium), subsequent years use mean
  const growthRates = Array.from({ length: base.projectionYears }, (_, i) =>
    i === 0 ? sampled.revenueGrowth + sampled.year1GrowthPremium : sampled.revenueGrowth
  );

  let revenue = base.ttmRevenue;
  let pv = 0;

  for (let year = 1; year <= base.projectionYears; year++) {
    revenue = revenue * (1 + growthRates[year - 1]);
    const ebitda = revenue * sampled.ebitdaMargin;
    const ebit = ebitda - revenue * sampled.daPct;         // D&A subtracted for tax
    const nopat = ebit * (1 - sampled.taxRate);            // tax-effected operating profit
    const da = revenue * sampled.daPct;                    // add back D&A (non-cash)
    const capex = revenue * sampled.capexPct;              // subtract CapEx
    const nwcChange = revenue * sampled.nwcPct;            // subtract NWC increase
    const fcf = nopat + da - capex - nwcChange;            // unlevered FCF
    pv += fcf / Math.pow(1 + sampled.wacc, year);
  }

  const lastRevenue = base.ttmRevenue * growthRates.reduce((acc, g) => acc * (1 + g), 1);
  const lastEbitda = lastRevenue * sampled.ebitdaMargin;

  const terminalValue = method === 'ggm'
    ? (pv * Math.pow(1 + sampled.wacc, base.projectionYears)) // last FCF * (1+tgr)/(wacc-tgr)
      // (simplified above — use actual last FCF in full implementation)
    : lastEbitda * sampled.exitMultiple;

  // Proper GGM: last year FCF * (1 + tgr) / (wacc - tgr)
  const lastFCF = (lastRevenue * sampled.ebitdaMargin - lastRevenue * sampled.daPct) * (1 - sampled.taxRate)
    + lastRevenue * sampled.daPct - lastRevenue * sampled.capexPct - lastRevenue * sampled.nwcPct;
  const tv = method === 'ggm'
    ? lastFCF * (1 + sampled.tgr) / (sampled.wacc - sampled.tgr)
    : lastEbitda * sampled.exitMultiple;

  const ev = pv + tv / Math.pow(1 + sampled.wacc, base.projectionYears);
  const equity = ev - base.totalDebt + base.cashAndEquiv;
  return equity / base.sharesOutstanding;
}
```

### 5.2 MC Runner — Hot Loop with Typed Arrays
```typescript
// mcRunner.ts — performance-critical path
export function runMonteCarlo(inputs, stressVars, scenario, config): SimulationOutput {
  const N = config.numRuns;
  const prices = new Float64Array(N);
  const samples = config.samplingMethod === 'lhs'
    ? latinHypercubeSample(N, stressVars.length)
    : null;

  for (let i = 0; i < N; i++) {
    const sampled = sampleVariables(stressVars, i, samples);
    prices[i] = computeDCF(inputs, sampled, config.terminalValueMethod);
  }

  const validPrices = prices.filter(p => !isNaN(p) && isFinite(p));
  validPrices.sort();
  return aggregateResults(validPrices, stressVars, scenario);
}
```

### 5.3 Histogram Bin Color Assignment
```typescript
// colorBands.ts — called on every render when thresholds change
export function getBinColor(binMid: number, bear: number, bull: number): string {
  if (binMid < bear) return 'rgba(248, 81, 73, 0.85)';   // red — below bear
  if (binMid > bull) return 'rgba(248, 81, 73, 0.65)';   // red (lighter) — above bull
  return 'rgba(88, 166, 255, 0.85)';                     // blue — between bear and bull
}
```

### 5.4 Web Worker Message Contract
```typescript
// types/worker.ts
export interface WorkerMessage {
  type: 'RUN';
  payload: {
    inputs: SimulationInputs;
    stressVars: StressVariable[];
    scenario: ScenarioTargets;
    config: SimulationConfig;
  };
}

export interface WorkerResponse {
  type: 'RESULT' | 'ERROR';
  payload: SimulationOutput | { message: string };
}
```

### 5.5 Chart.js Dark Theme Defaults
```typescript
// utils/chartConfig.ts
export const darkChartDefaults = {
  plugins: {
    legend: { labels: { color: '#8b949e', font: { family: 'DM Mono' } } },
    tooltip: { backgroundColor: '#1f2937', titleColor: '#f0b429', bodyColor: '#e6edf3' }
  },
  scales: {
    x: { ticks: { color: '#8b949e', font: { family: 'DM Mono' } }, grid: { color: '#30363d' } },
    y: { ticks: { color: '#8b949e', font: { family: 'DM Mono' } }, grid: { color: '#30363d' } }
  }
};
```

---

## 6. Storage Schema

No persistent storage. All state lives in Zustand (in-memory). JSON config export/import uses browser File API:

```typescript
// Export config
const blob = new Blob([JSON.stringify(configObject)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// trigger download...

// Import config
const reader = new FileReader();
reader.onload = (e) => {
  const config = JSON.parse(e.target.result as string);
  // validate shape, then update store
};
```

---

## 7. Error Handling

| Error Category | Handling |
|---------------|----------|
| Invalid inputs (missing, NaN, out of range) | `validateInputs()` returns all errors at once; shown inline; run blocked |
| WACC ≤ TGR | Warning banner shown; run allowed with confirmation |
| Worker computation error | `WorkerResponse.type === 'ERROR'` → show toast error, clear isRunning |
| NaN outputs from DCF (invalid sample) | Filtered out of results; count shown in warning badge |
| PDF export fails (canvas security) | Toast: "Export failed — check browser permissions" |
| Import invalid JSON | Toast: "Invalid config file"; state unchanged |
| Worker terminated (page refresh/navigate) | Worker.terminate() called on component unmount |

---

## 8. Security & Privacy

- All computation is client-side — no data sent to any server
- No telemetry, analytics, or tracking
- No user data stored beyond the browser session
- JSON config export contains only user-entered model assumptions — no PII
- Content Security Policy: no `eval`, no `unsafe-inline` scripts (except Vite dev server)

---

## 9. Performance

- Web Worker isolates 10,000-run simulation from main thread — UI stays responsive at 60fps during run
- `Float64Array` (vs. plain JS array) reduces GC pressure in the hot loop
- Chart.js histogram is pre-binned server-side (in worker) — never renders 10,000 individual elements
- Latin Hypercube Sampling converges faster, meaning equivalent statistical confidence with fewer runs
- Histogram color update (threshold change) calls `chart.update()` only — no full re-render
- React renders are minimized via Zustand selectors (components subscribe to only their slice)

---

## 10. Design System

### 10.1 Typography
```
Display/data font: DM Mono — https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap
UI/label font: Space Grotesk — https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap

Type scale (px): 11 / 12 / 13 / 14 / 16 / 20 / 28
- 28px: Company name in header (Space Grotesk 700)
- 20px: Section headers (Space Grotesk 600)
- 16px: Stat values (DM Mono 500)
- 14px: Body / input labels (Space Grotesk 400)
- 13px: Muted secondary labels (Space Grotesk 400, color-text-muted)
- 12px: Axis labels in charts (DM Mono 400)
- 11px: Caption / tooltip fine print (DM Mono 300)
```

### 10.2 Color Palette
(See AI_RULES.md §3.5 for full CSS variable definitions)

Key additions for charts:
```css
--chart-histogram-base:   rgba(88, 166, 255, 0.85);   /* blue — in-range bars */
--chart-histogram-bear:   rgba(248, 81, 73, 0.85);    /* red — below bear */
--chart-histogram-bull:   rgba(248, 81, 73, 0.65);    /* red lighter — above bull */
--chart-line-mean:        #f0b429;                     /* amber — mean line */
--chart-line-median:      #58a6ff;                     /* blue — median line */
--chart-line-current:     #e6edf3;                     /* white — current price line */
```

### 10.3 Spatial & Component Style
- Border radius: 4px for cards/panels, 2px for inputs, 0px for chart frames
- Shadow: none on cards (borders do the work); 0 0 0 2px amber on focused inputs
- Button: Primary = amber bg + near-black text, 4px radius, 44px height; Ghost = transparent + border
- Input: dark surface-alt bg, 1px border (border color), amber focus ring (2px offset)
- Accordion sections: 1px left border (amber when open, border-color when closed)

### 10.4 Motion & Animation
- Library: CSS transitions only (no Framer Motion in v1)
- Histogram bar entry: `animation: barGrow 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards` staggered 5ms per bar
- Run button pulse: `animation: pulse 1s ease-in-out infinite` while isRunning
- Number counter update: `transition: all 300ms ease-out` on stat values
- Panel slide-in on tab switch: `transition: opacity 200ms ease, transform 200ms ease`

### 10.5 Visual Atmosphere
- Page background: `--color-bg` (#0d1117) — near-black, no texture
- Panel backgrounds: `--color-surface` (#161b22) with 1px `--color-border` border
- Header: thin 1px amber bottom border to separate from content
- Charts: matching dark background so they feel embedded, not pasted-on
- The amber (#f0b429) is used sparingly — only on: run button, active accordion borders, focused inputs, primary stat values, and chart mean line

---

## 11. GitHub Pages Deployment Config

### 11.1 vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/mc-valuation-dashboard/', // MUST match your GitHub repo name exactly
  worker: {
    format: 'es', // ESM workers supported in all modern browsers
  },
});
```

### 11.2 package.json scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

### 11.3 Router Setup
Use `HashRouter` (not `BrowserRouter`) because GitHub Pages does not support server-side URL rewriting. Hash-based routing (`/#/`) works with static file hosting.
```typescript
// main.tsx
import { HashRouter } from 'react-router-dom';
// This is a single-page app with no routes in v1 — HashRouter is still required
// so that direct links to /#/ don't 404 on GitHub Pages
```

### 11.4 Web Worker path
Vite handles Web Worker imports automatically via the `?worker` suffix:
```typescript
// useSimulation.ts
import SimWorker from '../engine/simulationWorker.ts?worker';
const worker = new SimWorker(); // Vite bundles and inlines the worker correctly for GH Pages
```

### 11.5 Deployment Steps (for COWORK_PROMPT reference)
1. Create a GitHub repo named `mc-valuation-dashboard`
2. Push all source code to the `main` branch
3. Run `npm run deploy` — this builds the app and pushes `dist/` to the `gh-pages` branch
4. In GitHub repo Settings → Pages → set source to the `gh-pages` branch
5. App will be live at `https://[your-username].github.io/mc-valuation-dashboard/`
6. For subsequent updates: push changes to `main`, then run `npm run deploy` again
