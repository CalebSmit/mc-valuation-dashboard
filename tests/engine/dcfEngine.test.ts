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
