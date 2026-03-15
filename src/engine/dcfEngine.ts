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
  method: 'ggm' | 'exitMultiple',
  midYearConvention = false
): number {
  // Model is undefined when WACC ≤ TGR (perpetuity formula breaks)
  if (sampled.wacc <= sampled.tgr) return NaN;

  const N = base.projectionYears;
  let pvFcf = 0;
  let lastFcf = 0;
  let lastEbitda = 0;

  if (base.projectionMode === 'direct') {
    // ── Direct FCFF mode: user-entered projections stressed by % deviation ──
    for (let year = 1; year <= N; year++) {
      const baseFcf = base.fcfProjections[year - 1] ?? 0;
      const fcf = baseFcf * (1 + sampled.fcfDeviation);
      const discountExp = midYearConvention ? year - 0.5 : year;
      pvFcf += fcf / Math.pow(1 + sampled.wacc, discountExp);
      if (year === N) { lastFcf = fcf; }
    }
    // Terminal EBITDA for exit multiple TV uses TTM EBITDA as proxy
    lastEbitda = base.ttmEbitda;
  } else {
    // ── Margin-based mode: derive FCF from revenue × margin bridge ──
    const growthRates: number[] = [];
    for (let i = 0; i < N; i++) {
      growthRates.push(i === 0
        ? sampled.revenueGrowth + sampled.year1GrowthPremium
        : sampled.revenueGrowth
      );
    }

    let revenue = base.ttmRevenue;
    for (let year = 1; year <= N; year++) {
      revenue = revenue * (1 + growthRates[year - 1]);
      const ebitda = revenue * sampled.ebitdaMargin;
      const da = revenue * sampled.daPct;
      const ebit = ebitda - da;
      const nopat = ebit * (1 - sampled.taxRate);
      const capex = revenue * sampled.capexPct;
      const nwcChange = revenue * sampled.nwcPct;
      const fcf = nopat + da - capex - nwcChange;
      const discountExp = midYearConvention ? year - 0.5 : year;
      pvFcf += fcf / Math.pow(1 + sampled.wacc, discountExp);
      if (year === N) { lastFcf = fcf; lastEbitda = ebitda; }
    }
  }

  // Terminal Value
  let terminalValue: number;
  if (method === 'ggm') {
    terminalValue = lastFcf * (1 + sampled.tgr) / (sampled.wacc - sampled.tgr);
  } else {
    terminalValue = lastEbitda * sampled.exitMultiple;
  }

  // Enterprise Value = PV of explicit FCFs + PV of Terminal Value
  const ev = pvFcf + terminalValue / Math.pow(1 + sampled.wacc, N);

  // Equity Value = EV − Net Debt (Debt − Cash)
  const equity = ev - base.totalDebt + base.cashAndEquiv;

  return equity / base.sharesOutstanding;
}

/**
 * Compute Enterprise Value for sensitivity analysis.
 * Returns the EV ($M) rather than per-share price.
 */
export function computeEV(
  base: SimulationInputs,
  sampled: SampledVariables,
  method: 'ggm' | 'exitMultiple',
  midYearConvention = false
): number {
  if (sampled.wacc <= sampled.tgr) return NaN;

  const N = base.projectionYears;
  let pvFcf = 0;
  let lastFcf = 0;
  let lastEbitda = 0;

  if (base.projectionMode === 'direct') {
    for (let year = 1; year <= N; year++) {
      const baseFcf = base.fcfProjections[year - 1] ?? 0;
      const fcf = baseFcf * (1 + sampled.fcfDeviation);
      const discountExp = midYearConvention ? year - 0.5 : year;
      pvFcf += fcf / Math.pow(1 + sampled.wacc, discountExp);
      if (year === N) { lastFcf = fcf; }
    }
    lastEbitda = base.ttmEbitda;
  } else {
    const growthRates: number[] = [];
    for (let i = 0; i < N; i++) {
      growthRates.push(i === 0
        ? sampled.revenueGrowth + sampled.year1GrowthPremium
        : sampled.revenueGrowth
      );
    }

    let revenue = base.ttmRevenue;
    for (let year = 1; year <= N; year++) {
      revenue = revenue * (1 + growthRates[year - 1]);
      const ebitda = revenue * sampled.ebitdaMargin;
      const da = revenue * sampled.daPct;
      const ebit = ebitda - da;
      const nopat = ebit * (1 - sampled.taxRate);
      const capex = revenue * sampled.capexPct;
      const nwcChange = revenue * sampled.nwcPct;
      const fcf = nopat + da - capex - nwcChange;
      const discountExp = midYearConvention ? year - 0.5 : year;
      pvFcf += fcf / Math.pow(1 + sampled.wacc, discountExp);
      if (year === N) { lastFcf = fcf; lastEbitda = ebitda; }
    }
  }

  const terminalValue = method === 'ggm'
    ? lastFcf * (1 + sampled.tgr) / (sampled.wacc - sampled.tgr)
    : lastEbitda * sampled.exitMultiple;

  return pvFcf + terminalValue / Math.pow(1 + sampled.wacc, N);
}
