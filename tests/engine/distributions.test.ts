import { describe, it, expect } from 'vitest';
import { sampleNormal, sampleUniform, sampleTriangular, sampleLognormal } from '../../src/engine/distributions';

describe('distributions', () => {
  // Test 1: sampleNormal produces values with mean ≈ 0 over 10,000 samples
  it('sampleNormal(0, 1) produces values with mean ≈ 0 over 10,000 samples', () => {
    let sum = 0;
    const N = 10_000;
    for (let i = 0; i < N; i++) {
      // Use deterministic but varied inputs to Box-Muller
      const u1 = Math.max(((i + 1) / (N + 1)), Number.EPSILON);
      const u2 = ((i * 7 + 3) % N) / N + 0.001;
      sum += sampleNormal(0, 1, u1, u2);
    }
    const mean = sum / N;
    // Mean should be within ±0.1 of 0 for 10k samples
    expect(Math.abs(mean)).toBeLessThan(0.1);
  });

  // Test 2: sampleUniform returns value in [0, 1] for u ∈ [0, 1]
  it('sampleUniform(0, 1, u) returns value in [0, 1] for all u ∈ [0, 1]', () => {
    const testValues = [0, 0.001, 0.25, 0.5, 0.75, 0.999, 1];
    for (const u of testValues) {
      const result = sampleUniform(0, 1, u);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    }
  });

  it('sampleTriangular returns value within [min, max]', () => {
    for (let i = 0; i < 100; i++) {
      const result = sampleTriangular(10, 15, 25, i / 100);
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(25);
    }
  });

  it('sampleLognormal returns positive values', () => {
    const result = sampleLognormal(0, 0.5, 0.3, 0.7);
    expect(result).toBeGreaterThan(0);
  });
});
