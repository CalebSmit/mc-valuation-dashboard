# AI_RULES.md — Monte Carlo Valuation Dashboard

This file governs all AI-assisted development for this project. It overrides AI suggestions when conflicts arise. Read it before writing a single line of code.

---

## 1. Purpose

This is a professional-grade, browser-based Monte Carlo simulation dashboard for equity valuation. It is built for finance professionals (analysts, PMs, associates) who need rigorous, interactive DCF + Monte Carlo modeling with institutional-quality visuals. The tool must feel credible, fast, and defensible — not like a toy.

---

## 2. Core Principles

1. **Platform**: Single-page web app (React + TypeScript + Vite). No backend. All computation in-browser using Web Workers.
2. **No external data fetching by default** — the user manually enters company fundamentals. An optional ticker auto-fill via Yahoo Finance proxy may be added in Phase 3.
3. **All state is ephemeral by default** — sessions are not persisted unless user explicitly exports. No user accounts, no login.
4. **The simulation engine is the source of truth** — UI is read-only relative to the engine. Never let the UI hold stale simulation state.
5. **Finance-grade precision**: All monetary values displayed to 2 decimal places. Percentages to 1 decimal. Share prices to 2 decimal. No rounding errors in simulation math.
6. **Performance first**: 10,000-run simulation must complete in <3 seconds in-browser. Use Web Workers + typed arrays (Float64Array) for the hot path.
7. **Deploy target is GitHub Pages** — the app must be a fully static build (no server-side rendering, no Node.js at runtime). `vite.config.ts` must set `base` to the repository name (e.g., `base: '/mc-valuation-dashboard/'`). All asset paths must be relative. The build output (`dist/`) must work when served from a subdirectory.
8. **Do not build in v1**: live market data feeds, user auth, cloud sync, portfolio tracking, options pricing, or multi-asset correlation matrices.

---

## 3. Coding Standards

**Language**: TypeScript 5+ (strict mode, no `any`)  
**Framework**: React 18+ with functional components + hooks only  
**Build**: Vite 5+  
**Styling**: Tailwind CSS utility classes only — no inline styles except for Chart.js canvas dimensions  
**Charts**: Chart.js 4 (via react-chartjs-2) for all visualizations  
**Math**: Custom simulation engine in `/src/engine/` — no external stats libraries  
**Workers**: Web Worker (`/src/engine/simulationWorker.ts`) for the MC hot loop  
**State**: Zustand for global simulation state  
**Export**: jsPDF + html2canvas for PDF export; SheetJS (xlsx) for CSV/Excel export

**Rules**:
- No `any` type — define interfaces for every shape
- Functional components only — no class components
- `async/await` with `try/catch` for all async operations
- Custom hooks prefixed with `use`
- All financial constants (risk-free rate defaults, trading days/year, etc.) in `src/constants/finance.ts`
- All user-facing labels, tooltips, and help text in `src/constants/labels.ts`
- All color/threshold logic for the histogram in `src/utils/colorBands.ts`
- Simulation inputs validated before any run — no silent NaN propagation

---

## 3.5. Frontend Design Standards

**Design Direction**: "Bloomberg Terminal meets modern SaaS" — dark, data-dense, authoritative. Think dark navy/charcoal backgrounds, amber/gold accent, clean tabular data, tight spacing. The dashboard should feel like institutional-grade tooling, not a retail app.

**Typography**:
- Display/header font: **DM Mono** — `https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap` (for numbers, tickers, stats)
- UI/label font: **Inter** is explicitly ALLOWED here as secondary only for navigation and labels — but pair it with a data-display font for numbers
- Actually: Use **Space Grotesk** for UI labels + **DM Mono** for all numeric/financial data
- Import: `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap`
- NEVER use: system-ui, Roboto, Arial, Helvetica for headings or body

**Color Palette** (CSS variables):
```css
:root {
  --color-bg:           #0d1117;   /* near-black page background */
  --color-surface:      #161b22;   /* card/panel background */
  --color-surface-alt:  #1f2937;   /* input field background, slightly lighter */
  --color-border:       #30363d;   /* panel borders */
  --color-primary:      #f0b429;   /* amber/gold — primary accent, CTA */
  --color-primary-dim:  #92660c;   /* dimmed amber for secondary actions */
  --color-text:         #e6edf3;   /* primary text */
  --color-text-muted:   #8b949e;   /* muted/secondary labels */
  --color-text-faint:   #484f58;   /* placeholder text */
  --color-bull:         #3fb950;   /* green for upside/bull scenarios */
  --color-bear:         #f85149;   /* red for downside/bear scenarios */
  --color-neutral:      #58a6ff;   /* blue for base/neutral scenarios */
  --color-warn:         #d29922;   /* orange for warnings */
  --color-success:      #3fb950;
  --color-error:        #f85149;
}
```

**Histogram coloring** (matches provided reference image):
- Red bars: price outcomes **below** the Bear threshold
- Blue bars: price outcomes **between** Bear and Bull thresholds
- Red bars (right tail): price outcomes **above** the Bull threshold
- The thresholds are user-configurable scenario price targets

**Layout**:
- Left panel (320px fixed): all simulation inputs, scrollable
- Right panel (flex): output area with tabbed visualizations
- Header bar (48px): company info summary + run button
- No cookie-cutter sidebar-card-grid — this is a dense, purpose-built analytics layout
- Responsive breakpoint: collapse to stacked layout below 1024px

**Motion**:
- Histogram bars animate in on simulation completion (staggered left-to-right, 400ms total)
- Run button pulses amber while simulation is in progress
- Number counters animate when stats update (300ms ease-out)
- No gratuitous animation — every motion communicates state change

**Atmosphere**:
- Dark background with subtle noise texture (`background-image: url("data:image/svg+xml,...")`)
- Amber glow on CTA button
- Panel borders with very subtle glow on hover
- No gradients on backgrounds — flat dark surfaces with precise borders

---

## 4. Testing Requirements

| Layer | Tool | Coverage |
|-------|------|----------|
| Simulation engine | Vitest | All DCF functions, MC runner, distribution sampling |
| Color band logic | Vitest | Threshold boundary conditions |
| State hooks | Vitest + mock worker | Input change → state update |
| Export functions | Vitest | CSV shape, PDF generation flow |
| UI components | Manual | All interactive states |

No phase may begin until the previous phase's tests all pass.

---

## 5. Forbidden Patterns

| ❌ Never | ✅ Instead |
|----------|-----------|
| `any` type | Typed interfaces for every shape |
| `Math.random()` in simulation loop | Custom LCG seeded PRNG or `crypto.getRandomValues` buffer |
| Blocking main thread for simulation | Web Worker for all MC iteration |
| Hardcoded colors in components | CSS variables + `colorBands.ts` utility |
| `localStorage` for session state | In-memory Zustand store only |
| Mutating simulation results directly | Immutable result objects, new array per run |
| `console.log` in production | Remove or guard with `if (import.meta.env.DEV)` |
| Rendering 10,000 individual SVG elements | Aggregate into histogram bins before rendering |
| Raw Date arithmetic | `date-fns` for any date math |
| Chart.js re-initialization on every render | Stable chart ref + `update()` calls |
| Absolute asset paths (`/assets/...`) | Relative paths — required for GitHub Pages subdirectory hosting |
| `HashRouter` — use `BrowserRouter` with `basename` | `HashRouter` for GitHub Pages (no server-side redirect support) |
| Purple gradients on white backgrounds | Dark surface palette defined above |
| Generic card grids | Purpose-built analytics layout |
| Unstyled HTML inputs | Custom-styled inputs matching the design system |

---

## 6. Definition of Done

1. 10,000-run Monte Carlo simulation completes in <3 seconds on a modern laptop (M1/i7)
2. Histogram renders with correct color banding: red below Bear target, blue between targets, red above Bull target
3. All 6 input sections are functional and validated (no NaN propagation to engine)
4. All 5 output tabs render correct charts with real simulation data
5. PDF export produces a clean single-page report with all key stats and histogram
6. CSV export contains one row per simulation run with all tracked outputs
7. No TypeScript compiler errors in strict mode
8. All Vitest tests pass with zero failures
9. Responsive layout works at 1024px+ (no horizontal scrollbar)
10. Tooltip help text is present on every non-obvious input field
11. `npm run build` produces a clean `dist/` folder with no errors
12. App loads and functions correctly when served from a GitHub Pages subdirectory URL (test with `npm run preview` after setting `base` in vite.config.ts)

If any criterion fails, the feature is not done.
