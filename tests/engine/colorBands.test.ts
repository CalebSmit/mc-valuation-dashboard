import { describe, it, expect } from 'vitest';
import { getBinColor, buildBinColorArray, HISTOGRAM_COLORS } from '../../src/engine/colorBands';
import type { HistogramBin } from '../../src/types/outputs';

describe('colorBands', () => {
  // Test 7: getBinColor(50, 60, 90) returns red (below bear=60)
  it('getBinColor returns red when binMid < bear', () => {
    const color = getBinColor(50, 60, 90);
    expect(color).toBe(HISTOGRAM_COLORS.belowBear);
    // Verify it's the red color
    expect(color).toContain('248, 81, 73');
  });

  // Test 8: getBinColor(75, 60, 90) returns blue (between bear=60 and bull=90)
  it('getBinColor returns blue when binMid is between bear and bull', () => {
    const color = getBinColor(75, 60, 90);
    expect(color).toBe(HISTOGRAM_COLORS.inRange);
    // Verify it's the blue color
    expect(color).toContain('88, 166, 255');
  });

  // Test 9: getBinColor(100, 60, 90) returns red (above bull=90)
  it('getBinColor returns red (lighter) when binMid > bull', () => {
    const color = getBinColor(100, 60, 90);
    expect(color).toBe(HISTOGRAM_COLORS.aboveBull);
    // Also a red color but with lower opacity
    expect(color).toContain('248, 81, 73');
  });

  it('getBinColor at exact bear boundary falls into in-range (≥ bear)', () => {
    const color = getBinColor(60, 60, 90); // exactly at bear
    expect(color).toBe(HISTOGRAM_COLORS.inRange);
  });

  it('getBinColor at exact bull boundary falls into in-range (≤ bull)', () => {
    const color = getBinColor(90, 60, 90); // exactly at bull
    expect(color).toBe(HISTOGRAM_COLORS.inRange);
  });

  it('buildBinColorArray returns correct colors for mixed bin set', () => {
    const bins: HistogramBin[] = [
      { lowerBound: 40, upperBound: 55, midpoint: 47.5, count: 10, frequency: 0.1 },
      { lowerBound: 55, upperBound: 75, midpoint: 65.0, count: 20, frequency: 0.2 },
      { lowerBound: 75, upperBound: 95, midpoint: 85.0, count: 30, frequency: 0.3 },
      { lowerBound: 95, upperBound: 110, midpoint: 102.5, count: 15, frequency: 0.15 },
    ];
    const colors = buildBinColorArray(bins, 60, 90);
    expect(colors[0]).toBe(HISTOGRAM_COLORS.belowBear);  // 47.5 < 60
    expect(colors[1]).toBe(HISTOGRAM_COLORS.inRange);    // 65 between 60–90
    expect(colors[2]).toBe(HISTOGRAM_COLORS.inRange);    // 85 between 60–90
    expect(colors[3]).toBe(HISTOGRAM_COLORS.aboveBull);  // 102.5 > 90
  });
});
