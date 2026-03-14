import type { SimulationInputs, SampledVariables } from '../types/inputs';

// ─── DCF Engine — Single-Run Implied Share Price ───────────────────────────
//
// Implements the full 10-variable FCF bridge as specified in ARCHITECTURE.md §5.1.
// Returns NaN when the model is undefined (WACC ≤ TGR).

/**
 * Compute the implied share price for one Monte Carlo run.
 *
 * DCF Bridge (per year):
 *   revenue_t  = revenue_{t-1} × (1 + growthRate_t)
 *   EBITDA_t   = revenue_t × ebitdaMargin
 *   EBIT_t     = EBITDA_t − revenue_t × daPct          (D&A is non-cash → subtract for tax)
 *   NOPAT_t    = EBIT_t × (1 − taxRate)
 *   FCF_t      = NOPAT_t + revenue_t × daPct           (add back D&A)
 *               − revenue_t × capexPct                  (subtract CapEx)
 *               − revenue_t × nwcPct                    (subtract NWC increase)
 *   PV         += FCF_t / (1 + WACC)^t
 *
 * Terminal Value:
 *   GGM:          TV = lastFCF × (1 + tgr) / (wacc − tgr)
 *   Exit Multiple: TV = lastEBITDA × exitMultiple
 *
 * Enterprise Value:
 *   EV = PV_of_FCFs + TV / (1 + WACC)^N
 *
 * Equity Value:
 *   Equity = EV − totalDebt + cashAndEquiv
 *   Price  = Equity / sharesOutstanding
 *
 * @returns Implied price per share ($), or NaN if WACC ≤ TGR (undefined model).
 */
export function computeDCF(
  base: SimulationInputs,
  sampled: SampledVariables,
  method: 'ggm' | 'exitMultiple'
): number {
  // Model is undefined when WACC ≤ TGR (perpetuity formula breaks)
  if (sampled.wacc <= sampled.tgr) return NaN;

  const N = base.projectionYears;

  // Year 1 uses revenueGrowth + year1GrowthPremium; subsequent years use revenueGrowth
  const growthRates: number[] = [];
  for (let i = 0; i < N; i++) {
    growthRates.push(i === 0
      ? sampled.revenueGrowth + sampled.year1GrowthPremium
      : sampled.revenueGrowth
    );
  }

  let revenue = base.ttmRevenue;
  let pvFcf = 0;
  let lastFcf = 0;
  let lastEbitda = 0;

  for (let year = 1; year <= N; year++) {
    // Grow revenue
    revenue = revenue * (1 + growthRates[year - 1]);

    // EBITDA
    const ebitda = revenue * sampled.ebitdaMargin;

    // EBIT (subtract D&A from EBITDA for tax purposes)
    const da = revenue * sampled.daPct;
    const ebit = ebitda - da;

    // NOPAT (tax-effected operating profit)
    const nopat = ebit * (1 - sampled.taxRate);

    // Unlevered Free Cash Flow
    const capex = revenue * sampled.capexPct;
    const nwcChange = revenue * sampled.nwcPct;
    const fcf = nopat + da - capex - nwcChange;

    // Discount to present value
    pvFcf += fcf / Math.pow(1 + sampled.wacc, year);

    // Track last year values for terminal value
    if (year === N) {
      lastFcf = fcf;
      lastEbitda = ebitda;
    }
  }

  // Terminal Value
  let terminalValue: number;
  if (method === 'ggm') {
    // Gordon Growth Model: TV = FCF_N × (1 + TGR) / (WACC − TGR)
    terminalValue = lastFcf * (1 + sampled.tgr) / (sampled.wacc - sampled.tgr);
  } else {
    // Exit Multiple: TV = EBITDA_N × EV/EBITDA multiple
    terminalValue = lastEbitda * sampled.exitMultiple;
  }

  // Enterprise Value = PV of explicit FCFs + PV of Terminal Value
  const ev = pvFcf + terminalValue / Math.pow(1 + sampled.wacc, N);

  // Equity Value = EV − Net Debt (Debt − Cash)
  const equity = ev - base.totalDebt + base.cashAndEquiv;

  // Price per share
  const price = equity / base.sharesOutstanding;

  return price;
}

/**
 * Compute Enterprise Value for sensitivity analysis.
 * Returns the EV ($M) rather than per-share price.
 */
export function computeEV(
  base: SimulationInputs,
  sampled: SampledVariables,
  method: 'ggm' | 'exitMultiple'
): number {
  if (sampled.wacc <= sampled.tgr) return NaN;

  const N = base.projectionYears;
  const growthRates: number[] = [];
  for (let i = 0; i < N; i++) {
    growthRates.push(i === 0
      ? sampled.revenueGrowth + sampled.year1GrowthPremium
      : sampled.revenueGrowth
    );
  }

  let revenue = base.ttmRevenue;
  let pvFcf = 0;
  let lastFcf = 0;
  let lastEbitda = 0;

  for (let year = 1; year <= N; year++) {
    revenue = revenue * (1 + growthRates[year - 1]);
    const ebitda = revenue * sampled.ebitdaMargin;
    const da = revenue * sampled.daPct;
    const ebit = ebitda - da;
    const nopat = ebit * (1 - sampled.taxRate);
    const capex = revenue * sampled.capexPct;
    const nwcChange = revenue * sampled.nwcPct;
    const fcf = nopat + da - capex - nwcChange;
    pvFcf += fcf / Math.pow(1 + sampled.wacc, year);
    if (year === N) { lastFcf = fcf; lastEbitda = ebitda; }
  }

  const terminalValue = method === 'ggm'
    ? lastFcf * (1 + sampled.tgr) / (sampled.wacc - sampled.tgr)
    : lastEbitda * sampled.exitMultiple;

  return pvFcf + terminalValue / Math.pow(1 + sampled.wacc, N);
}
