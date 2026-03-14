import { describe, it, expect } from 'vitest';
import { computePercentile, buildHistogramBins, computeMean, computeStdDev } from '../../src/engine/statistics';
import { HISTOGRAM_BIN_COUNT } from '../../src/constants/finance';

describe('statistics', () => {
  // Test 5: computePercentile returns median of [1,2,3,4,5] = 3
  it('computePercentile(sorted, 0.5) returns median of [1,2,3,4,5] = 3', () => {
    const arr = new Float64Array([1, 2, 3, 4, 5]);
    expect(computePercentile(arr, 0.5)).toBe(3);
  });

  // Test 6: buildHistogramBins returns exactly 50 bins for 10,000 values
  it('buildHistogramBins returns exactly 50 bins for 10,000 price values', () => {
    const prices = new Float64Array(10_000);
    for (let i = 0; i < 10_000; i++) {
      prices[i] = 50 + (i / 10_000) * 100; // 50 to 150
    }
    prices.sort();
    const bins = buildHistogramBins(prices);
    expect(bins).toHaveLength(HISTOGRAM_BIN_COUNT);
  });

  it('buildHistogramBins total count equals input length', () => {
    const N = 1000;
    const prices = new Float64Array(N);
    for (let i = 0; i < N; i++) prices[i] = 80 + Math.random() * 60;
    prices.sort();
    const bins = buildHistogramBins(prices);
    const totalCount = bins.reduce((sum, b) => sum + b.count, 0);
    expect(totalCount).toBe(N);
  });

  it('computeMean returns correct mean', () => {
    const arr = new Float64Array([10, 20, 30]);
    expect(computeMean(arr)).toBeCloseTo(20, 5);
  });

  it('computeStdDev returns 0 for single element', () => {
    const arr = new Float64Array([42]);
    expect(computeStdDev(arr, 42)).toBe(0);
  });

  it('computePercentile handles edge cases', () => {
    const arr = new Float64Array([5]);
    expect(computePercentile(arr, 0.5)).toBe(5);

    const empty = new Float64Array(0);
    expect(computePercentile(empty, 0.5)).toBeNaN();
  });
});
