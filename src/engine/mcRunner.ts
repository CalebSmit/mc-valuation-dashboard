import type { SimulationInputs, StressVariable, ScenarioTargets, SimulationConfig, SampledVariables, DistributionType, StressVariableId } from '../types/inputs';
import type { SimulationOutput, SimulationResult } from '../types/outputs';
import { sampleNormal, sampleLognormal, sampleUniform, sampleTriangular, createLcg, lcgNext, cryptoRandom } from './distributions';
import { latinHypercubeSample, latinHypercubeSampleSeeded } from './lhsSampler';
import { computeMean, computeStdDev, computePercentile, computeAllPercentiles, computeProbAbove, computeVaR95, computeCVaR95, buildHistogramBins, computeTornadoCorrelations } from './statistics';

// ─── Monte Carlo Runner ───────────────────────────────────────────────────────

/**
 * Run N Monte Carlo iterations of the DCF model.
 * This function is called from the Web Worker — it must not reference DOM APIs.
 *
 * @param inputs     Company fundamentals
 * @param stressVars Array of 10 stress variables with their distribution params
 * @param scenario   Bear/Base/Bull price targets (for probability computation)
 * @param config     Run count, seed, sampling method, TV method
 * @returns          Aggregated SimulationOutput
 */
export function runMonteCarlo(
  inputs: SimulationInputs,
  stressVars: StressVariable[],
  scenario: ScenarioTargets,
  config: SimulationConfig
): SimulationOutput {
  const N = config.numRuns;
  const method = config.terminalValueMethod;
  const midYear = config.midYearConvention ?? false;
  const start = Date.now();
  const activeStressVars = stressVars.filter(variable => variable.enabled);
  const activeVariableIds = activeStressVars.map(variable => variable.id);
  const activeVarIndices = buildActiveVariableIndexMap(activeStressVars);

  // ── Set up PRNG ──
  const isSeeded = config.seed !== null && config.seed !== undefined;
  const lcg = isSeeded ? createLcg(config.seed as number) : null;
  const random = lcg ? () => lcgNext(lcg) : cryptoRandom;

  // ── Set up LHS samples if needed ──
  let lhsSamples: Float64Array[] | null = null;
  if (config.samplingMethod === 'lhs' && activeStressVars.length > 0) {
    lhsSamples = isSeeded
      ? latinHypercubeSampleSeeded(N, activeStressVars.length, random)
      : latinHypercubeSample(N, activeStressVars.length);
  }

  // ── Allocate result arrays ──
  const allPrices = new Float64Array(N);
  const runRecords: SimulationResult[] = [];
  let discardedCount = 0;

  // ── Hot loop ──
  for (let i = 0; i < N; i++) {
    // Sample all variables for this run
    const sampled = sampleAllVariables(stressVars, activeStressVars, activeVarIndices, i, lhsSamples, random);

    // Compute DCF price
    const price = computeDCFPrice(inputs, sampled, method, midYear);

    allPrices[i] = price;

    // Track run record (for CSV export + tornado)
    // Compute EV for record — approximate using price × shares + debt - cash
    const ev = isNaN(price) ? NaN
      : (price * inputs.sharesOutstanding) + inputs.totalDebt - inputs.cashAndEquiv;

    runRecords.push({
      runId: i,
      revenueGrowth:      sampled.revenueGrowth,
      ebitdaMargin:       sampled.ebitdaMargin,
      capexPct:           sampled.capexPct,
      nwcPct:             sampled.nwcPct,
      daPct:              sampled.daPct,
      wacc:               sampled.wacc,
      terminalGrowthRate: sampled.tgr,
      exitMultiple:       sampled.exitMultiple,
      taxRate:            sampled.taxRate,
      year1GrowthPremium: sampled.year1GrowthPremium,
      impliedEV:          ev,
      impliedPrice:       price,
    });
  }

  // ── Filter invalid results ──
  let validCount = 0;
  for (let i = 0; i < N; i++) {
    if (!isNaN(allPrices[i]) && isFinite(allPrices[i])) validCount++;
  }
  discardedCount = N - validCount;

  const validPrices = new Float64Array(validCount);
  const validRecords: SimulationResult[] = [];
  let vi = 0;
  for (let i = 0; i < N; i++) {
    if (!isNaN(allPrices[i]) && isFinite(allPrices[i])) {
      validPrices[vi++] = allPrices[i];
      validRecords.push(runRecords[i]);
    }
  }

  // ── Sort for percentile computation ──
  validPrices.sort();

  // ── Aggregate statistics ──
  const mean = computeMean(validPrices);
  const stdDev = computeStdDev(validPrices, mean);
  const percentiles = computeAllPercentiles(validPrices);
  const probAboveBear = computeProbAbove(validPrices, scenario.bear);
  const probAboveBase = computeProbAbove(validPrices, scenario.base);
  const probAboveBull = computeProbAbove(validPrices, scenario.bull);
  const var95 = computeVaR95(validPrices);
  const cvar95 = computeCVaR95(validPrices);

  // ── Tornado correlations ──
  const tornadoData = computeTornadoCorrelations(validRecords, activeVariableIds);

  // Attach proper labels from stressVars to tornado entries
  const labelMap = new Map(stressVars.map(v => [v.id, v.label]));
  for (const entry of tornadoData) {
    entry.label = labelMap.get(entry.variableId as import('../types/inputs').StressVariableId) ?? entry.variableId;
  }

  // ── Histogram bins ──
  const histogramBins = buildHistogramBins(validPrices);

  // ── Valuation sanity checks ──
  // Implied EV/EBITDA: (mean price × shares + debt − cash) / TTM EBITDA
  const impliedEvEbitda = (inputs.ttmEbitda > 0 && !isNaN(mean))
    ? ((mean * inputs.sharesOutstanding) + inputs.totalDebt - inputs.cashAndEquiv) / inputs.ttmEbitda
    : NaN;

  // Tail ratio: P95 / P5 — flags fat-tailed distributions (>5× is concerning)
  const p5 = percentiles[5];
  const p95 = percentiles[95];
  const tailRatio = (p5 > 0) ? p95 / p5 : NaN;

  if (import.meta.env.DEV) {
    const elapsed = Date.now() - start;
    console.log(`[MC] ${N} runs in ${elapsed}ms | valid: ${validCount} | discarded: ${discardedCount}`);
  }

  const elapsedMs = Date.now() - start;

  return {
    results: validPrices,
    runRecords: validRecords,
    activeVariableIds,
    discardedCount,
    mean,
    median: computePercentile(validPrices, 0.5),
    stdDev,
    min: validPrices.length > 0 ? validPrices[0] : NaN,
    max: validPrices.length > 0 ? validPrices[validPrices.length - 1] : NaN,
    percentiles,
    probAboveBear,
    probAboveBase,
    probAboveBull,
    var95,
    cvar95,
    impliedEvEbitda,
    tailRatio,
    tornadoData,
    histogramBins,
    elapsedMs,
    completedAt: Date.now(),
  };
}

// ─── Variable Sampling ────────────────────────────────────────────────────────

/**
 * Sample all stress variables for one simulation run.
 * If LHS samples are provided, uses the pre-generated uniform values;
 * otherwise draws fresh random values.
 */
function sampleAllVariables(
  stressVars: StressVariable[],
  activeStressVars: StressVariable[],
  activeVarIndices: Partial<Record<StressVariableId, number>>,
  runIndex: number,
  lhsSamples: Float64Array[] | null,
  random: () => number
): SampledVariables {
  const sampled = createMeanSample(stressVars);

  for (const variable of activeStressVars) {
    const colIndex = activeVarIndices[variable.id];
    let value: number;

    if (lhsSamples !== null && colIndex !== undefined) {
      // LHS: use pre-generated uniform value for this run/column
      const u = lhsSamples[colIndex][runIndex];
      value = sampleFromDistribution(variable, u, random);
    } else {
      // Standard MC: draw two uniform values (needed for Box-Muller)
      value = sampleFromDistributionStandard(variable, random);
    }

    // Assign to the correct field
    assignVariable(sampled, variable.id, value);
  }

  return sampled;
}

function createMeanSample(stressVars: StressVariable[]): SampledVariables {
  const sampled: SampledVariables = {
    revenueGrowth: 0,
    ebitdaMargin: 0,
    capexPct: 0,
    nwcPct: 0,
    daPct: 0,
    wacc: 0,
    tgr: 0,
    exitMultiple: 0,
    taxRate: 0,
    year1GrowthPremium: 0,
  };

  for (const variable of stressVars) {
    assignVariable(sampled, variable.id, variable.mean);
  }

  return sampled;
}

function buildActiveVariableIndexMap(
  activeStressVars: StressVariable[]
): Partial<Record<StressVariableId, number>> {
  const indexMap: Partial<Record<StressVariableId, number>> = {};

  for (const [index, variable] of activeStressVars.entries()) {
    indexMap[variable.id] = index;
  }

  return indexMap;
}

/**
 * Sample from a distribution using a single pre-generated uniform value (LHS path).
 * For Normal/LogNormal (which need 2 uniforms), we use inverse CDF approximation
 * when given a single uniform — specifically the Beasley-Springer-Moro approximation.
 */
function sampleFromDistribution(
  v: StressVariable,
  u: number,
  random: () => number
): number {
  switch (v.distribution as DistributionType) {
    case 'normal': {
      // For LHS with a single uniform, use inverse normal CDF
      const z = inverseNormalCDF(u);
      const raw = v.mean + v.stdDev * z;
      return Math.min(Math.max(raw, v.min), v.max);
    }
    case 'lognormal': {
      const z = inverseNormalCDF(u);
      const raw = Math.exp(v.mean + v.stdDev * z);
      return Math.min(Math.max(raw, v.min), v.max);
    }
    case 'uniform':
      return sampleUniform(v.min, v.max, u);
    case 'triangular': {
      const ml = v.mostLikely ?? v.mean;
      return sampleTriangular(v.min, ml, v.max, u);
    }
    default: {
      // Standard normal fallback using Box-Muller with two fresh randoms
      const u2 = random();
      return sampleNormal(v.mean, v.stdDev, u, u2, v.min, v.max);
    }
  }
}

/**
 * Sample from a distribution using fresh random values (standard MC path).
 */
function sampleFromDistributionStandard(
  v: StressVariable,
  random: () => number
): number {
  const u1 = random();
  const u2 = random();
  switch (v.distribution as DistributionType) {
    case 'normal':
      return sampleNormal(v.mean, v.stdDev, u1, u2, v.min, v.max);
    case 'lognormal':
      return sampleLognormal(v.mean, v.stdDev, u1, u2, v.min, v.max);
    case 'uniform':
      return sampleUniform(v.min, v.max, u1);
    case 'triangular': {
      const ml = v.mostLikely ?? v.mean;
      return sampleTriangular(v.min, ml, v.max, u1);
    }
    default:
      return sampleNormal(v.mean, v.stdDev, u1, u2, v.min, v.max);
  }
}

/** Assign a sampled value to the correct field in SampledVariables. */
function assignVariable(sampled: SampledVariables, id: string, value: number): void {
  switch (id) {
    case 'revenueGrowth':      sampled.revenueGrowth = value; break;
    case 'ebitdaMargin':       sampled.ebitdaMargin = value; break;
    case 'capexPct':           sampled.capexPct = value; break;
    case 'nwcPct':             sampled.nwcPct = value; break;
    case 'daPct':              sampled.daPct = value; break;
    case 'wacc':               sampled.wacc = value; break;
    case 'tgr':                sampled.tgr = value; break;
    case 'exitMultiple':       sampled.exitMultiple = value; break;
    case 'taxRate':            sampled.taxRate = value; break;
    case 'year1GrowthPremium': sampled.year1GrowthPremium = value; break;
  }
}

// ─── DCF computation (inline to avoid cross-module import in worker) ──────────

function computeDCFPrice(
  inputs: SimulationInputs,
  sampled: SampledVariables,
  method: 'ggm' | 'exitMultiple',
  midYearConvention = false
): number {
  if (sampled.wacc <= sampled.tgr) return NaN;

  const N = inputs.projectionYears;
  let revenue = inputs.ttmRevenue;
  let pvFcf = 0;
  let lastFcf = 0;
  let lastEbitda = 0;

  for (let year = 1; year <= N; year++) {
    const growth = year === 1
      ? sampled.revenueGrowth + sampled.year1GrowthPremium
      : sampled.revenueGrowth;
    revenue *= (1 + growth);
    const ebitda = revenue * sampled.ebitdaMargin;
    const da = revenue * sampled.daPct;
    const ebit = ebitda - da;
    const nopat = ebit * (1 - sampled.taxRate);
    const fcf = nopat + da - revenue * sampled.capexPct - revenue * sampled.nwcPct;
    const discountExp = midYearConvention ? year - 0.5 : year;
    pvFcf += fcf / Math.pow(1 + sampled.wacc, discountExp);
    if (year === N) { lastFcf = fcf; lastEbitda = ebitda; }
  }

  const tv = method === 'ggm'
    ? lastFcf * (1 + sampled.tgr) / (sampled.wacc - sampled.tgr)
    : lastEbitda * sampled.exitMultiple;

  const ev = pvFcf + tv / Math.pow(1 + sampled.wacc, N);
  return (ev - inputs.totalDebt + inputs.cashAndEquiv) / inputs.sharesOutstanding;
}

// ─── Inverse Normal CDF (Rational Approximation) ─────────────────────────────
// Beasley-Springer-Moro algorithm — accurate to ~6 decimal places.
// Used for LHS sampling where we need a single-uniform inverse transform.

function inverseNormalCDF(p: number): number {
  if (p <= 0) return -6;
  if (p >= 1) return  6;

  const a = [
    -3.969683028665376e+01,  2.209460984245205e+02,
    -2.759285104469687e+02,  1.383577518672690e+02,
    -3.066479806614716e+01,  2.506628277459239e+00,
  ];
  const b = [
    -5.447609879822406e+01,  1.615858368580409e+02,
    -1.556989798598866e+02,  6.680131188771972e+01,
    -1.328068155288572e+01,
  ];
  const c = [
    -7.784894002430293e-03, -3.223964580411365e-01,
    -2.400758277161838e+00, -2.549732539343734e+00,
     4.374664141464968e+00,  2.938163982698783e+00,
  ];
  const d = [
     7.784695709041462e-03,  3.224671290700398e-01,
     2.445134137142996e+00,  3.754408661907416e+00,
  ];

  const pLow  = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
             ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}
