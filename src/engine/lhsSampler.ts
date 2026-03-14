// ─── Latin Hypercube Sampler ──────────────────────────────────────────────────
//
// Latin Hypercube Sampling (LHS) partitions each variable's [0,1] range into N
// equal-probability intervals and draws exactly one sample from each interval.
// This guarantees full coverage of the distribution, giving equivalent statistical
// confidence with fewer runs than Standard Monte Carlo.

/**
 * Generate an N × k matrix of uniform [0,1] samples using Latin Hypercube Sampling.
 *
 * Each column represents one variable. Each column contains exactly one sample
 * from each of the N equal intervals [0/N, 1/N), [1/N, 2/N), ..., [(N-1)/N, 1].
 * The columns are independently shuffled (permuted) to remove correlation.
 *
 * @param n  Number of simulation runs
 * @param k  Number of variables
 * @returns  Array of k Float64Array, each of length n
 */
export function latinHypercubeSample(n: number, k: number): Float64Array[] {
  const result: Float64Array[] = [];

  for (let j = 0; j < k; j++) {
    const column = new Float64Array(n);

    // Step 1: For each interval i, draw one uniform sample within [i/n, (i+1)/n)
    for (let i = 0; i < n; i++) {
      const intervalStart = i / n;
      const intervalEnd = (i + 1) / n;
      column[i] = intervalStart + Math.random() * (intervalEnd - intervalStart);
    }

    // Step 2: Shuffle the column (Fisher-Yates) so the intervals are in random order
    // This breaks spurious correlations between variables
    fisherYatesShuffle(column);

    result.push(column);
  }

  return result;
}

/**
 * In-place Fisher-Yates shuffle of a Float64Array.
 */
function fisherYatesShuffle(arr: Float64Array): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
}

/**
 * Seeded variant: generate LHS samples using a provided PRNG function.
 * Use this when reproducibility is required (user-provided seed).
 *
 * @param n       Number of simulation runs
 * @param k       Number of variables
 * @param random  A function returning a uniform [0,1) value (e.g., lcgNext)
 */
export function latinHypercubeSampleSeeded(
  n: number,
  k: number,
  random: () => number
): Float64Array[] {
  const result: Float64Array[] = [];

  for (let j = 0; j < k; j++) {
    const column = new Float64Array(n);

    // Draw one sample per interval
    for (let i = 0; i < n; i++) {
      const intervalStart = i / n;
      const intervalEnd = (i + 1) / n;
      column[i] = intervalStart + random() * (intervalEnd - intervalStart);
    }

    // Fisher-Yates with seeded PRNG
    for (let i = column.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const temp = column[i];
      column[i] = column[j];
      column[j] = temp;
    }

    result.push(column);
  }

  return result;
}
