import { useState, useEffect, useRef } from 'react';

// ─── MethodologyModal ────────────────────────────────────────────────────────
// Full-screen overlay with scrollable methodology guide.

interface MethodologyModalProps {
  open: boolean;
  onClose: () => void;
}

interface SectionState {
  [key: string]: boolean;
}

function Accordion({ id, title, defaultOpen, state, toggle, children }: {
  id: string;
  title: string;
  defaultOpen?: boolean;
  state: SectionState;
  toggle: (id: string) => void;
  children: React.ReactNode;
}) {
  const isOpen = Boolean(state[id] ?? defaultOpen);
  return (
    <div className="method-section">
      <button
        type="button"
        className="method-section-header"
        onClick={() => toggle(id)}
      >
        <span className="method-section-chevron">{isOpen ? '▾' : '▸'}</span>
        <span>{title}</span>
      </button>
      {isOpen && (
        <div className="method-section-body">
          {children}
        </div>
      )}
    </div>
  );
}

export function MethodologyModal({ open, onClose }: MethodologyModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [sections, setSections] = useState<SectionState>({ quickstart: true });

  const toggle = (id: string) =>
    setSections(prev => ({ ...prev, [id]: !(prev[id] ?? false) }));

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      className="method-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Methodology Guide"
      onClick={handleBackdropClick}
    >
      <div className="method-container">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="method-header">
          <div className="method-header-left">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="method-header-icon">
              <rect x="2" y="1" width="14" height="16" rx="2" stroke="#f0b429" strokeWidth="1.4" fill="none" />
              <line x1="5.5" y1="5" x2="12.5" y2="5" stroke="#f0b429" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="5.5" y1="8" x2="12.5" y2="8" stroke="#f0b429" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="5.5" y1="11" x2="9.5" y2="11" stroke="#f0b429" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <h2 className="method-title">Methodology Guide</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="method-close"
            aria-label="Close methodology guide"
          >
            &times;
          </button>
        </div>

        {/* ── Scrollable Content ─────────────────────────────────── */}
        <div className="method-body">

          {/* ── 1. Quick Start ─────────────────────────────────── */}
          <Accordion id="quickstart" title="1. Quick Start — Your First Valuation in 5 Minutes" defaultOpen state={sections} toggle={toggle}>
            <p className="method-intro">
              You can get a meaningful Monte Carlo valuation with minimal setup. Here's the fastest path:
            </p>
            <ol className="method-steps">
              <li>
                <strong>Enter company basics</strong> in Section 01:
                <ul>
                  <li><span className="method-field">Current Stock Price</span> — the live market price per share</li>
                  <li><span className="method-field">Shares Outstanding</span> — diluted shares in millions (find on Yahoo Finance or the 10-K cover page)</li>
                  <li><span className="method-field">Total Debt</span> and <span className="method-field">Cash & Equivalents</span> — from the balance sheet, in $M</li>
                  <li><span className="method-field">TTM Revenue</span> — trailing twelve months revenue in $M</li>
                </ul>
              </li>
              <li>
                <strong>Leave all stress variables at their defaults.</strong> The default means and ranges are calibrated for a typical mid-cap US company. You can fine-tune later.
              </li>
              <li>
                <strong>Leave simulation config at defaults</strong> (10,000 runs, LHS sampling, Gordon Growth Model).
              </li>
              <li>
                <strong>Click "Run Simulation"</strong> (or press <kbd>Shift+Enter</kbd>).
              </li>
              <li>
                <strong>Read the results:</strong>
                <ul>
                  <li>The <em>Histogram</em> shows the distribution of implied share prices</li>
                  <li>The <em>Mean</em> and <em>Median</em> in the Stats panel are your central estimates</li>
                  <li>Compare these to the current stock price — if the mean is above the current price, the stock may be undervalued (and vice versa)</li>
                </ul>
              </li>
            </ol>
            <p className="method-tip">
              <strong>Tip:</strong> After your first run, set the Bear / Base / Bull targets in Section 04 to see probability-weighted scenario zones on the histogram.
            </p>
          </Accordion>

          {/* ── 2. Understanding the Inputs ─────────────────────── */}
          <Accordion id="inputs" title="2. Understanding the Inputs" state={sections} toggle={toggle}>

            <h4 className="method-subheader">Section 01 — Company Fundamentals</h4>
            <p>
              These anchor your valuation to real-world data. All financial figures should come from the company's most recent filings (10-K or 10-Q) or a financial data provider.
            </p>
            <table className="method-table">
              <thead>
                <tr><th>Field</th><th>What It Means</th><th>Where to Find It</th></tr>
              </thead>
              <tbody>
                <tr><td>Current Stock Price</td><td>Market price per share — your reference point for upside/downside</td><td>Any stock quote site</td></tr>
                <tr><td>Shares Outstanding</td><td>Total diluted shares (millions) — converts enterprise value to per-share price</td><td>10-K cover page, Yahoo Finance "Statistics"</td></tr>
                <tr><td>Total Debt</td><td>Short-term + long-term interest-bearing debt ($M)</td><td>Balance sheet</td></tr>
                <tr><td>Cash & Equivalents</td><td>Cash, cash equivalents, and short-term investments ($M)</td><td>Balance sheet</td></tr>
                <tr><td>TTM Revenue</td><td>Trailing 12-month revenue ($M) — the base from which future revenue is grown</td><td>Income statement (sum last 4 quarters)</td></tr>
                <tr><td>TTM EBITDA</td><td>Informational — helps calibrate the EBITDA margin stress variable</td><td>Income statement or add-back D&A to EBIT</td></tr>
                <tr><td>Projection Years</td><td>How many years of explicit FCF forecasts before terminal value takes over (3–10)</td><td>Your judgment — 5 is standard</td></tr>
                <tr><td>WACC</td><td>Weighted average cost of capital — the discount rate for future cash flows</td><td>Compute from CAPM + debt cost, or use 8–12% for US large-caps</td></tr>
              </tbody>
            </table>

            <h4 className="method-subheader">Section 02 — Stress Variables</h4>
            <p>
              These are the uncertain parameters that the Monte Carlo engine samples randomly in each simulation run. Each variable has:
            </p>
            <ul>
              <li><strong>Mean</strong> — your best estimate (central tendency)</li>
              <li><strong>Std Dev</strong> — how much uncertainty around the mean (wider = more uncertainty)</li>
              <li><strong>Min / Max</strong> — hard bounds to prevent unrealistic draws</li>
              <li><strong>Distribution</strong> — the shape of randomness (Normal, Log-Normal, Uniform, or Triangular)</li>
              <li><strong>Enable / Disable toggle</strong> — disabled variables are fixed at their mean (no randomness)</li>
            </ul>
            <p>
              In <em>Margin-Based</em> mode, the key variables are Revenue Growth, EBITDA Margin, CapEx %, ΔNWC %, D&A %, Tax Rate, and a Year 1 Growth Premium. In <em>Direct FCFF</em> mode, you enter year-by-year cash flow projections and stress them with a single FCF Deviation variable.
            </p>

            <h4 className="method-subheader">Section 03 — Simulation Config</h4>
            <ul>
              <li><strong>Number of Runs</strong> — more runs = smoother distributions and tighter confidence intervals, but slower. 10,000 is the sweet spot.</li>
              <li><strong>Sampling Method</strong> — Latin Hypercube (LHS) covers the distribution more efficiently than standard Monte Carlo. Recommended.</li>
              <li><strong>Terminal Value Method</strong> — Gordon Growth Model (perpetuity) or Exit Multiple (comparable company multiple). See "Recommended Settings" below.</li>
              <li><strong>Mid-Year Convention</strong> — discounts cash flows at mid-year instead of year-end. Standard practice; typically increases value by 3–6%.</li>
              <li><strong>Random Seed</strong> — set a number for reproducible results. Leave blank for a fresh random run each time.</li>
            </ul>

            <h4 className="method-subheader">Section 04 — Scenario Price Targets</h4>
            <p>
              Set Bear, Base, and Bull price targets to define scenario zones on the histogram. The dashboard shows the probability of exceeding each target. Changing targets re-colors the histogram instantly — no need to re-run the simulation.
            </p>
          </Accordion>

          {/* ── 3. Going Deeper ─────────────────────────────────── */}
          <Accordion id="advanced" title="3. Going Deeper — Advanced Tuning" state={sections} toggle={toggle}>

            <h4 className="method-subheader">Choosing Distribution Shapes</h4>
            <table className="method-table">
              <thead>
                <tr><th>Distribution</th><th>When to Use</th><th>Example</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Normal</td>
                  <td>Symmetric uncertainty around the mean. Good default for most financial parameters.</td>
                  <td>WACC, EBITDA margin, tax rate</td>
                </tr>
                <tr>
                  <td>Log-Normal</td>
                  <td>When values can't go negative and have right-skew (upside surprises are larger than downside).</td>
                  <td>Revenue growth for high-growth companies, exit multiples</td>
                </tr>
                <tr>
                  <td>Uniform</td>
                  <td>When you have a range but no view on the most likely value. Every value in [min, max] is equally likely.</td>
                  <td>Highly uncertain variables where you only have bounds</td>
                </tr>
                <tr>
                  <td>Triangular</td>
                  <td>When you have a best estimate (mode) and bounds. Good for expert elicitation.</td>
                  <td>CapEx % when you know the likely range and best guess</td>
                </tr>
              </tbody>
            </table>

            <h4 className="method-subheader">Calibrating from Historical Data</h4>
            <p>
              For the most accurate simulation, calibrate stress variable means and standard deviations from historical data:
            </p>
            <ul>
              <li><strong>Revenue Growth:</strong> Look at the company's 3–5 year revenue CAGR and year-over-year volatility. Set the mean near the CAGR and std dev near the historical variation.</li>
              <li><strong>EBITDA Margin:</strong> Check the range of margins over the past 5 years. The mean should be your forward estimate; std dev should reflect historical variability.</li>
              <li><strong>WACC:</strong> Compute from CAPM (risk-free rate + beta × equity risk premium) blended with after-tax cost of debt. Typical range: 7–14% for US equities.</li>
              <li><strong>Terminal Growth Rate:</strong> Should approximate long-run nominal GDP growth (2–3%). Rarely above 4%.</li>
            </ul>

            <h4 className="method-subheader">Margin-Based vs. Direct FCFF Mode</h4>
            <table className="method-table">
              <thead>
                <tr><th>Mode</th><th>Best For</th><th>Stress Variables</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Margin-Based (default)</td>
                  <td>When you want to model the full P&L: revenue growth, margins, capex, working capital. Gives you granular control over each driver.</td>
                  <td>7 income-statement + 3 valuation variables</td>
                </tr>
                <tr>
                  <td>Direct FCFF</td>
                  <td>When you already have a detailed financial model with year-by-year FCF projections and just want to stress-test them.</td>
                  <td>1 FCF deviation + 3 valuation variables</td>
                </tr>
              </tbody>
            </table>

            <h4 className="method-subheader">Latin Hypercube vs. Standard Monte Carlo</h4>
            <p>
              <strong>Standard MC</strong> draws each variable independently and randomly. With fewer runs, you may get uneven coverage of the distribution tails.
            </p>
            <p>
              <strong>Latin Hypercube Sampling (LHS)</strong> divides each variable's distribution into equal-probability strata and ensures one sample from each. This guarantees better coverage of the full range with fewer runs. <em>Recommended for most analyses.</em>
            </p>

            <h4 className="method-subheader">Reproducibility with Seeds</h4>
            <p>
              Set a random seed (any positive integer) to get identical results every run. This is useful for presentations, audits, or comparing scenarios while changing only one variable at a time.
            </p>
          </Accordion>

          {/* ── 4. Recommended Settings ─────────────────────────── */}
          <Accordion id="recommended" title="4. Recommended Settings" state={sections} toggle={toggle}>
            <table className="method-table method-table-rec">
              <thead>
                <tr><th>Setting</th><th>Recommended</th><th>Why</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Number of Runs</td>
                  <td className="method-rec-value">10,000</td>
                  <td>Good balance of statistical precision and speed (typically &lt; 3 seconds). 5,000 is fine for quick checks; 25,000 for final analysis.</td>
                </tr>
                <tr>
                  <td>Sampling Method</td>
                  <td className="method-rec-value">Latin Hypercube (LHS)</td>
                  <td>Better coverage of distribution tails with fewer runs. Equivalent to ~3× more standard MC runs.</td>
                </tr>
                <tr>
                  <td>Terminal Value Method</td>
                  <td className="method-rec-value">Gordon Growth Model</td>
                  <td>More theoretically grounded. Use Exit Multiple only when reliable comparable-company multiples are available and you trust them more than a perpetuity assumption.</td>
                </tr>
                <tr>
                  <td>Mid-Year Convention</td>
                  <td className="method-rec-value">On</td>
                  <td>Standard sell-side practice. Assumes cash flows arrive mid-year rather than year-end, which is more realistic.</td>
                </tr>
                <tr>
                  <td>Projection Years</td>
                  <td className="method-rec-value">5 years</td>
                  <td>Standard for most companies. Use 7–10 for high-growth companies where you have visibility into a longer runway.</td>
                </tr>
                <tr>
                  <td>WACC</td>
                  <td className="method-rec-value">8–12%</td>
                  <td>Typical for US large-cap equities. Higher for small-caps, emerging markets, or high-leverage companies.</td>
                </tr>
                <tr>
                  <td>Terminal Growth Rate</td>
                  <td className="method-rec-value">2–3%</td>
                  <td>Should approximate long-run nominal GDP growth. Rarely exceeds 4% — if it does, you're implying the company will eventually outgrow the economy.</td>
                </tr>
              </tbody>
            </table>
          </Accordion>

          {/* ── 5. Reading the Output ───────────────────────────── */}
          <Accordion id="output" title="5. Reading the Output" state={sections} toggle={toggle}>

            <h4 className="method-subheader">Charts</h4>
            <table className="method-table">
              <thead>
                <tr><th>Chart</th><th>What It Shows</th><th>What to Look For</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Histogram</td>
                  <td>Distribution of implied share prices across all simulation runs</td>
                  <td>Shape (normal vs. skewed), where the current price falls relative to the distribution, and how much mass is in each scenario zone (bear/base/bull)</td>
                </tr>
                <tr>
                  <td>Tornado</td>
                  <td>Rank correlation — how much each input variable influences the output price</td>
                  <td>The longest bars are the most important drivers. Focus your research effort on getting those inputs right.</td>
                </tr>
                <tr>
                  <td>CDF</td>
                  <td>Cumulative probability — P(Price &le; X) for any price X</td>
                  <td>Read off specific probabilities: "What's the chance the stock is worth less than $50?"</td>
                </tr>
                <tr>
                  <td>Sensitivity Heatmap</td>
                  <td>Deterministic grid of implied prices across WACC and Terminal Growth Rate combinations</td>
                  <td>How sensitive the valuation is to your two most important assumptions. The highlighted cell shows the base case.</td>
                </tr>
                <tr>
                  <td>Fan Chart</td>
                  <td>Percentile bands of projected price over the forecast period</td>
                  <td>How uncertainty widens over time. Narrow bands = more confidence in near-term; wide bands = high long-term uncertainty.</td>
                </tr>
              </tbody>
            </table>

            <h4 className="method-subheader">Key Statistics</h4>
            <ul>
              <li><strong>Mean & Median:</strong> Central estimates. If they diverge significantly, the distribution is skewed.</li>
              <li><strong>Std Dev:</strong> Measures total uncertainty. Higher = wider range of outcomes.</li>
              <li><strong>Percentiles (P5–P95):</strong> The range within which 90% of simulated prices fall. P5 is the downside; P95 is the upside.</li>
              <li><strong>P(Price &gt; Bear/Base/Bull):</strong> Probability of exceeding each scenario target.</li>
              <li><strong>VaR 95%:</strong> Value at Risk — the maximum loss in the best 95% of outcomes (5th percentile minus current price).</li>
              <li><strong>CVaR 95%:</strong> Conditional VaR (Expected Shortfall) — the average loss in the worst 5% of outcomes. More conservative than VaR.</li>
              <li><strong>Implied EV/EBITDA:</strong> Sanity check — if this is extremely high (&gt;30×) or low (&lt;3×), revisit your inputs.</li>
              <li><strong>Tail Ratio:</strong> P95/P5. If &gt;5×, the distribution has fat tails — consider tightening variable ranges.</li>
            </ul>
          </Accordion>

          {/* ── 6. Key Formulas ─────────────────────────────────── */}
          <Accordion id="formulas" title="6. Key Formulas" state={sections} toggle={toggle}>

            <h4 className="method-subheader">Free Cash Flow Bridge (Margin-Based Mode)</h4>
            <div className="method-formula-block">
              <div className="method-formula">Revenue<sub>t</sub> = Revenue<sub>t-1</sub> &times; (1 + Revenue Growth + Year 1 Premium<sub>if t=1</sub>)</div>
              <div className="method-formula">EBITDA<sub>t</sub> = Revenue<sub>t</sub> &times; EBITDA Margin</div>
              <div className="method-formula">EBIT<sub>t</sub> = EBITDA<sub>t</sub> &minus; Revenue<sub>t</sub> &times; D&A %</div>
              <div className="method-formula">NOPAT<sub>t</sub> = EBIT<sub>t</sub> &times; (1 &minus; Tax Rate)</div>
              <div className="method-formula">FCF<sub>t</sub> = NOPAT<sub>t</sub> + D&A &minus; CapEx &minus; &Delta;NWC</div>
              <div className="method-formula-note">where CapEx = Revenue<sub>t</sub> &times; CapEx%, D&A = Revenue<sub>t</sub> &times; D&A%, &Delta;NWC = Revenue<sub>t</sub> &times; NWC%</div>
            </div>

            <h4 className="method-subheader">Terminal Value</h4>
            <div className="method-formula-block">
              <div className="method-formula"><strong>Gordon Growth Model:</strong></div>
              <div className="method-formula">TV = FCF<sub>N</sub> &times; (1 + TGR) / (WACC &minus; TGR)</div>
              <div className="method-formula mt-3"><strong>Exit Multiple:</strong></div>
              <div className="method-formula">TV = EBITDA<sub>N</sub> &times; Exit Multiple</div>
              <div className="method-formula-note">Constraint: WACC must exceed TGR for GGM to be defined</div>
            </div>

            <h4 className="method-subheader">Enterprise Value to Price per Share</h4>
            <div className="method-formula-block">
              <div className="method-formula">PV(FCFs) = &Sigma; FCF<sub>t</sub> / (1 + WACC)<sup>t</sup></div>
              <div className="method-formula">Enterprise Value = PV(FCFs) + TV / (1 + WACC)<sup>N</sup></div>
              <div className="method-formula">Equity Value = EV &minus; Total Debt + Cash</div>
              <div className="method-formula">Price per Share = Equity Value / Shares Outstanding</div>
              <div className="method-formula-note">With mid-year convention, exponent becomes t &minus; 0.5</div>
            </div>
          </Accordion>

        </div>
      </div>
    </div>
  );
}
