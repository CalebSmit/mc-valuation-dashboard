# Monte Carlo Equity Valuation Dashboard

A professional-grade, browser-based DCF + Monte Carlo simulation tool for equity valuation. Built with React 18, TypeScript 5, Chart.js 4, and Zustand — runs entirely in the browser with no backend required.

![MC Valuation Dashboard](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Tests](https://img.shields.io/badge/Tests-75%20passing-green)

---

## Features

- **Full DCF engine** — Revenue → EBITDA → EBIT → NOPAT → FCF → PV → Terminal Value → EV → Equity → Price
- **10 stress variables** across two groups: Income Statement Drivers and Valuation / Cost of Capital
- **Two terminal value methods**: Gordon Growth Model (GGM) and Exit Multiple
- **Monte Carlo simulation**: up to 25,000 paths, runs in a Web Worker (never blocks the UI)
- **Latin Hypercube Sampling** — better variance coverage than standard Monte Carlo with fewer runs
- **5 output charts**: Histogram, Tornado, CDF, Sensitivity Heatmap (5×5 WACC × TGR), Fan Chart
- **Live re-coloring**: changing Bear/Base/Bull thresholds instantly recolors the histogram without re-running
- **Export flows**: PDF, Excel/CSV (13 columns), JSON config save/load
- **Bloomberg-dark UI**: Space Grotesk + DM Mono typography, amber accent, dark palette

---

## Local Development

### Prerequisites

- Node.js 18+ and npm 9+

### Install

```bash
npm install
```

### Run dev server

```bash
npm run dev
```

Open [http://localhost:5173/mc-valuation-dashboard/](http://localhost:5173/mc-valuation-dashboard/)

### Run tests

```bash
npm test
```

75 tests across 12 test files. Includes engine unit tests, statistics tests, export shape tests, edge case tests, and a performance gate (10,000 runs < 3,000ms).

### Build for production

```bash
npm run build
```

Output goes to `dist/`. Verify locally with:

```bash
npx serve dist
```

Then open [http://localhost:3000](http://localhost:3000).

---

## GitHub Pages Deployment

This app is pre-configured for GitHub Pages at `/mc-valuation-dashboard/`.

### First-time setup

1. Create a GitHub repository named `mc-valuation-dashboard`
2. Push your code to the `main` branch

### Deploy

```bash
npm run deploy
```

This runs `npm run build` then pushes `dist/` to the `gh-pages` branch automatically.

### Enable GitHub Pages

In your repository:
1. Go to **Settings → Pages**
2. Under **Source**, select **Deploy from a branch**
3. Set branch to `gh-pages`, folder to `/ (root)`
4. Click **Save**

Your app will be live at `https://<your-username>.github.io/mc-valuation-dashboard/`

---

## Architecture

```
src/
├── engine/          # Core simulation (no React dependencies)
│   ├── dcfEngine.ts         # 5-step DCF model
│   ├── mcRunner.ts          # Monte Carlo hot loop (Float64Array)
│   ├── simulationWorker.ts  # Web Worker entry point
│   ├── distributions.ts     # Normal, LogNormal, Uniform, Triangular
│   ├── lhsSampler.ts        # Latin Hypercube Sampling
│   ├── statistics.ts        # Percentiles, VaR, CVaR, Tornado correlations
│   └── colorBands.ts        # Histogram bin coloring logic
├── store/           # Zustand state slices
├── hooks/           # useSimulation, useExport, useHistogramData, useSensitivityData
├── components/
│   ├── inputs/      # FundamentalsSection, StressVariables, SimConfig, ScenarioTargets
│   ├── outputs/     # OutputTabs, 5 chart components, StatsPanel
│   └── layout/      # AppShell, Header, InputPanel
└── types/           # TypeScript interfaces
```

### Key design decisions

- **Web Worker**: All MC computation runs off the main thread. The `Float64Array` price buffer is transferred (zero-copy) back to the main thread after completion.
- **LCG seeded PRNG**: `createLcg`/`lcgNext` (Park-Miller constants) gives reproducible runs when a seed is set; `crypto.getRandomValues` (8192-float buffer) for non-seeded runs.
- **Beasley-Springer-Moro inverse normal CDF**: Used for LHS single-uniform-path sampling, enabling Latin Hypercube without Box-Muller's two-uniform requirement.
- **HashRouter**: Used instead of BrowserRouter for static GitHub Pages hosting (no server-side routing needed).

---

## Stress Variables

| ID | Label | Group | Default Mean | Default SD |
|----|-------|-------|-------------|------------|
| `revenueGrowth` | Revenue Growth | Income Statement | 8% | 4% |
| `ebitdaMargin` | EBITDA Margin | Income Statement | 22% | 4% |
| `capexPct` | CapEx % Revenue | Income Statement | 5% | 2% |
| `nwcPct` | NWC Change % Revenue | Income Statement | 2% | 1% |
| `daPct` | D&A % Revenue | Income Statement | 4% | 1% |
| `wacc` | WACC | Valuation | 10% | 1.5% |
| `tgr` | Terminal Growth Rate | Valuation | 2.5% | 0.5% |
| `exitMultiple` | Exit EV/EBITDA Multiple | Valuation | 12× | 2× |
| `taxRate` | Effective Tax Rate | Valuation | 25% | 3% |
| `year1GrowthPremium` | Year 1 Growth Premium | Valuation | 2% | 2% |

Each variable supports Normal, LogNormal, Uniform, and Triangular distributions.

---

## License

MIT
