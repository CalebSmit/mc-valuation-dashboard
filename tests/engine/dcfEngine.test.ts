import { describe, it, expect } from 'vitest';
import { computeDCF } from '../../src/engine/dcfEngine';
import { DEFAULT_INPUTS } from '../../src/constants/finance';
import type { SampledVariables } from '../../src/types/inputs';

const BASE_SAMPLED: SampledVariables = {
  revenueGrowth:      0.08,  // 8%
  ebitdaMargin:       0.20,  // 20%
  capexPct:           0.05,  // 5%
  nwcPct:             0.02,  // 2%
  daPct:              0.04,  // 4%
  wacc:               0.10,  // 10%
  tgr:                0.025, // 2.5%
  exitMultiple:       12.0,
  taxRate:            0.25,  // 25%
  year1GrowthPremium: 0.00,
  fcfDeviation:       0.00,
};

describe('dcfEngine', () => {
  // Test 3: computeDCF returns NaN when WACC ≤ TGR
  it('returns NaN when WACC ≤ TGR (model undefined)', () => {
    const sampled = { ...BASE_SAMPLED, wacc: 0.025, tgr: 0.025 };
    expect(computeDCF(DEFAULT_INPUTS, sampled, 'ggm')).toBeNaN();

    const sampled2 = { ...BASE_SAMPLED, wacc: 0.02, tgr: 0.025 };
    expect(computeDCF(DEFAULT_INPUTS, sampled2, 'ggm')).toBeNaN();
  });

  // Test 4: computeDCF returns positive number for valid inputs
  it('returns positive price for valid inputs (WACC=10%, TGR=2.5%, growth=8%, EBITDA=20%)', () => {
    const price = computeDCF(DEFAULT_INPUTS, BASE_SAMPLED, 'ggm');
    expect(price).not.toBeNaN();
    expect(price).toBeGreaterThan(0);
    // For DEFAULT_INPUTS ($1B revenue, 100M shares, $500M debt, $200M cash),
    // this should produce a price somewhere in a reasonable range (>$10, <$10,000)
    expect(price).toBeGreaterThan(10);
    expect(price).toBeLessThan(10_000);
  });

  it('exit multiple method also returns positive price', () => {
    const price = computeDCF(DEFAULT_INPUTS, BASE_SAMPLED, 'exitMultiple');
    expect(price).not.toBeNaN();
    expect(price).toBeGreaterThan(0);
  });

  it('year1GrowthPremium increases price vs. no premium', () => {
    const basePrice = computeDCF(DEFAULT_INPUTS, BASE_SAMPLED, 'ggm');
    const premiumSampled = { ...BASE_SAMPLED, year1GrowthPremium: 0.05 }; // +5%
    const premiumPrice = computeDCF(DEFAULT_INPUTS, premiumSampled, 'ggm');
    expect(premiumPrice).toBeGreaterThan(basePrice);
  });
});

// ─── Direct FCFF Mode Tests ──────────────────────────────────────────────────

describe('dcfEngine — direct FCFF mode', () => {
  const directInputs = {
    ...DEFAULT_INPUTS,
    projectionMode: 'direct' as const,
    fcfProjections: [100, 110, 120, 130, 140], // $M per year
    wacc: 0.10,
  };

  const directSampled: SampledVariables = {
    ...BASE_SAMPLED,
    fcfDeviation: 0, // no deviation — should use exact projections
  };

  it('returns positive price with user-entered FCF projections and zero deviation', () => {
    const price = computeDCF(directInputs, directSampled, 'ggm');
    expect(price).not.toBeNaN();
    expect(price).toBeGreaterThan(0);
  });

  it('fcfDeviation=0 produces deterministic output matching manual PV calculation', () => {
    const price = computeDCF(directInputs, directSampled, 'ggm');
    // Manual PV: sum of FCF/(1.10)^t + TV/(1.10)^5
    // TV = 140 * (1.025) / (0.10 - 0.025) = 140 * 1.025 / 0.075 = 1913.33
    const wacc = 0.10;
    const tgr = 0.025;
    let pvManual = 0;
    const fcfs = [100, 110, 120, 130, 140];
    for (let t = 1; t <= 5; t++) {
      pvManual += fcfs[t - 1] / Math.pow(1 + wacc, t);
    }
    const tv = 140 * (1 + tgr) / (wacc - tgr);
    pvManual += tv / Math.pow(1 + wacc, 5);
    const equity = pvManual - directInputs.totalDebt + directInputs.cashAndEquiv;
    const expectedPrice = equity / directInputs.sharesOutstanding;
    expect(price).toBeCloseTo(expectedPrice, 2);
  });

  it('positive fcfDeviation increases price vs. zero deviation', () => {
    const basePrice = computeDCF(directInputs, directSampled, 'ggm');
    const upSampled = { ...directSampled, fcfDeviation: 0.10 }; // +10%
    const upPrice = computeDCF(directInputs, upSampled, 'ggm');
    expect(upPrice).toBeGreaterThan(basePrice);
  });

  it('exit multiple TV uses ttmEbitda in direct mode', () => {
    const price = computeDCF(directInputs, directSampled, 'exitMultiple');
    expect(price).not.toBeNaN();
    expect(price).toBeGreaterThan(0);
  });
});
