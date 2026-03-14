// ─── Probability Distribution Samplers ───────────────────────────────────────
//
// All sampling functions take pre-generated uniform [0,1] values as arguments.
// They do NOT call Math.random() internally — this keeps them pure and testable,
// and lets the caller (mcRunner) control the PRNG strategy (seeded LCG or crypto).

/**
 * Box-Muller transform: sample from Normal(mean, stdDev).
 * Requires two independent uniform samples u1, u2 ∈ (0, 1].
 * Returns a value clamped to [min, max] if provided.
 */
export function sampleNormal(
  mean: number,
  stdDev: number,
  u1: number,
  u2: number,
  min?: number,
  max?: number
): number {
  // Guard against u1 = 0 which would cause log(0) = -Infinity
  const safeU1 = Math.max(u1, Number.EPSILON);
  const z = Math.sqrt(-2.0 * Math.log(safeU1)) * Math.cos(2.0 * Math.PI * u2);
  const sample = mean + stdDev * z;
  if (min !== undefined && max !== undefined) {
    return Math.min(Math.max(sample, min), max);
  }
  return sample;
}

/**
 * Sample from LogNormal distribution.
 * Parameters are the mean and stdDev of the UNDERLYING normal distribution.
 * To match a desired lognormal mean μ_LN and variance σ²_LN:
 *   mu_normal = ln(μ_LN² / sqrt(σ²_LN + μ_LN²))
 *   sigma_normal = sqrt(ln(σ²_LN / μ_LN² + 1))
 * For simplicity, mean/stdDev here are the normal-space params (caller's responsibility).
 */
export function sampleLognormal(
  mean: number,
  stdDev: number,
  u1: number,
  u2: number,
  min?: number,
  max?: number
): number {
  const normalSample = sampleNormal(mean, stdDev, u1, u2);
  const sample = Math.exp(normalSample);
  if (min !== undefined && max !== undefined) {
    return Math.min(Math.max(sample, min), max);
  }
  return sample;
}

/**
 * Sample from Uniform(min, max).
 * u ∈ [0, 1] — a single uniform random value.
 */
export function sampleUniform(min: number, max: number, u: number): number {
  return min + (max - min) * u;
}

/**
 * Sample from Triangular(min, mostLikely, max) using the inverse CDF method.
 * u ∈ [0, 1] — a single uniform random value.
 * The triangular distribution is fully defined by its three parameters.
 */
export function sampleTriangular(
  min: number,
  mostLikely: number,
  max: number,
  u: number
): number {
  if (min >= max) return mostLikely; // degenerate case
  const range = max - min;
  const fc = (mostLikely - min) / range; // CDF value at mode

  if (u < fc) {
    // Left side of the triangle
    return min + Math.sqrt(u * range * (mostLikely - min));
  } else if (u > fc) {
    // Right side of the triangle
    return max - Math.sqrt((1 - u) * range * (max - mostLikely));
  }
  return mostLikely;
}

// ─── Seeded LCG PRNG ─────────────────────────────────────────────────────────
// Linear Congruential Generator — fast, deterministic, sufficient for financial MC.
// Parameters from Numerical Recipes (Park-Miller variant).

const LCG_A = 1664525;
const LCG_C = 1013904223;
const LCG_M = 2 ** 32;

/** Mutable LCG state object. Create one per simulation run for thread-safe isolation. */
export interface LcgState {
  seed: number;
}

/** Create a new LCG state from a seed value. */
export function createLcg(seed: number): LcgState {
  return { seed: seed >>> 0 }; // force unsigned 32-bit
}

/** Advance LCG and return next value in [0, 1). */
export function lcgNext(state: LcgState): number {
  state.seed = ((LCG_A * state.seed + LCG_C) >>> 0) % LCG_M;
  return state.seed / LCG_M;
}

// ─── Crypto PRNG Buffer ───────────────────────────────────────────────────────
// For non-seeded runs: use crypto.getRandomValues for better randomness.
// Batched into a buffer to avoid per-call overhead.

const CRYPTO_BUFFER_SIZE = 8192; // 8192 floats per refill
let cryptoBuffer: Float64Array | null = null;
let cryptoBufferIndex = 0;

/** Fill the crypto buffer from crypto.getRandomValues. */
function refillCryptoBuffer(): void {
  // crypto.getRandomValues only supports integer arrays
  const intBuffer = new Uint32Array(CRYPTO_BUFFER_SIZE);
  // Web Worker has access to self.crypto; main thread has window.crypto
  const cryptoObj = (typeof self !== 'undefined' ? self.crypto : globalThis.crypto) as Crypto;
  cryptoObj.getRandomValues(intBuffer);
  cryptoBuffer = new Float64Array(CRYPTO_BUFFER_SIZE);
  for (let i = 0; i < CRYPTO_BUFFER_SIZE; i++) {
    // Convert Uint32 to [0, 1) by dividing by 2^32
    cryptoBuffer[i] = (intBuffer[i] >>> 0) / 4294967296;
  }
  cryptoBufferIndex = 0;
}

/** Get next random value from crypto buffer (lazy-initialized). */
export function cryptoRandom(): number {
  if (cryptoBuffer === null || cryptoBufferIndex >= CRYPTO_BUFFER_SIZE) {
    refillCryptoBuffer();
  }
  // Non-null assertion: refillCryptoBuffer always sets cryptoBuffer
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return cryptoBuffer![cryptoBufferIndex++];
}
