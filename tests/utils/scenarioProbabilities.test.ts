import { describe, it, expect } from 'vitest';
import { deriveScenarioProbabilities } from '../../src/utils/scenarioProbabilities';

describe('deriveScenarioProbabilities', () => {
  it('returns zero probabilities for empty results', () => {
    const probs = deriveScenarioProbabilities(new Float64Array(), {
      bear: 80,
      base: 100,
      bull: 130,
    });

    expect(probs.probAboveBear).toBe(0);
    expect(probs.probAboveBase).toBe(0);
    expect(probs.probAboveBull).toBe(0);
  });

  it('updates probabilities as scenario targets move', () => {
    // Sorted simulation outputs as produced by mcRunner
    const results = new Float64Array([10, 20, 30, 40, 50]);

    const highThresholds = deriveScenarioProbabilities(results, {
      bear: 100,
      base: 120,
      bull: 140,
    });

    const lowThresholds = deriveScenarioProbabilities(results, {
      bear: 5,
      base: 15,
      bull: 25,
    });

    expect(highThresholds.probAboveBear).toBe(0);
    expect(highThresholds.probAboveBase).toBe(0);
    expect(highThresholds.probAboveBull).toBe(0);

    expect(lowThresholds.probAboveBear).toBe(1);
    expect(lowThresholds.probAboveBase).toBe(0.8);
    expect(lowThresholds.probAboveBull).toBe(0.6);
  });
});
