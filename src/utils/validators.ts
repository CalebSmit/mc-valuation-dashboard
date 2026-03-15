import type { SimulationInputs, StressVariable, ScenarioTargets, SimulationConfig } from '../types/inputs';
import { BOUNDS } from '../constants/finance';
import { ERRORS } from '../constants/labels';

// ─── Validation Result ────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>; // fieldId → error message
  warnings: Record<string, string>; // fieldId → warning (non-blocking)
}

// ─── Main Validator ───────────────────────────────────────────────────────────

/**
 * Validate all simulation inputs before running.
 * Returns ALL errors at once (not fail-fast) so the UI can show every issue simultaneously.
 * Warnings are returned separately — they don't block the run but should be shown.
 */
export function validateInputs(
  inputs: SimulationInputs,
  stressVars: StressVariable[],
  scenario: ScenarioTargets,
  config: SimulationConfig
): ValidationResult {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // ── Company Fundamentals ──

  if (!inputs.sharesOutstanding || inputs.sharesOutstanding <= 0) {
    errors['sharesOutstanding'] = ERRORS.sharesRequired;
  }

  if (!inputs.currentPrice || inputs.currentPrice < BOUNDS.currentPrice.min) {
    errors['currentPrice'] = ERRORS.currentPriceRequired;
  }

  // TTM Revenue required in margin mode; in direct mode it's informational
  if (inputs.projectionMode !== 'direct') {
    if (!inputs.ttmRevenue || inputs.ttmRevenue <= 0) {
      errors['ttmRevenue'] = ERRORS.revenueRequired;
    }
  }

  // Negative FCF warning (not a blocking error)
  if (inputs.ttmFcf < 0) {
    warnings['ttmFcf'] = ERRORS.negativeFcf;
  }

  // ── Direct FCFF mode: at least one projection must be non-zero ──
  if (inputs.projectionMode === 'direct') {
    if (!inputs.fcfProjections || inputs.fcfProjections.every(v => v === 0)) {
      errors['fcfProjections'] = ERRORS.fcfProjectionsRequired;
    }
  }

  // ── WACC bounds check ──
  if (inputs.wacc < BOUNDS.wacc.min || inputs.wacc > BOUNDS.wacc.max) {
    errors['waccInput'] = ERRORS.waccRange;
  }

  // ── Scenario Targets ──

  if (scenario.bear >= scenario.base) {
    errors['bear'] = ERRORS.bearLtBase;
  }

  if (scenario.base >= scenario.bull) {
    errors['base'] = ERRORS.baseLtBull;
  }

  if (scenario.bear >= scenario.bull) {
    errors['bearBull'] = ERRORS.bearLtBull;
  }

  // ── Stress Variables ──

  for (const v of stressVars) {
    if (!v.enabled) continue;

    const prefix = `stressVar.${v.id}`;

    // Standard deviation must be non-negative
    if (v.stdDev < 0) {
      errors[`${prefix}.stdDev`] = `${v.label}: ${ERRORS.stdDevNegative}`;
    }

    // Very low variance warning
    if (v.stdDev === 0 || v.stdDev < v.mean * 0.001) {
      warnings[`${prefix}.stdDev`] = `${v.label}: ${ERRORS.lowVariance}`;
    }

    // Triangular distribution: validate mostLikely is within [min, max]
    if (v.distribution === 'triangular') {
      const ml = v.mostLikely ?? v.mean;
      if (ml < v.min || ml > v.max) {
        errors[`${prefix}.mostLikely`] = `${v.label}: ${ERRORS.triangularOrder}`;
      }
    }

    // Tax rate bounds
    if (v.id === 'taxRate') {
      if (v.mean < BOUNDS.taxRate.min || v.mean > BOUNDS.taxRate.max) {
        errors[`${prefix}.mean`] = `${v.label}: ${ERRORS.taxRateRange}`;
      }
    }

    // CapEx and D&A must be non-negative
    if ((v.id === 'capexPct' || v.id === 'daPct') && v.mean < 0) {
      errors[`${prefix}.mean`] = `${v.label}: Must be ≥ 0.`;
    }
  }

  // ── WACC vs TGR — blocking error when mean WACC ≤ mean TGR ──
  // When the mean inputs violate this, virtually all runs will be discarded (NaN).
  // A warning is issued for moderate overlap (WACC − TGR < 1%) where some runs may still be valid.

  const waccVar = stressVars.find(v => v.id === 'wacc');
  const tgrVar = stressVars.find(v => v.id === 'tgr');
  if (waccVar && tgrVar) {
    const waccEnabled = waccVar.enabled !== false;
    const tgrEnabled = tgrVar.enabled !== false;
    if (waccEnabled && tgrEnabled) {
      if (waccVar.mean <= tgrVar.mean) {
        errors['wacc_tgr'] = ERRORS.waccGtTgr;
      } else if (waccVar.mean - tgrVar.mean < 0.01) {
        // Spread < 1%: large fraction of sampled runs will have WACC ≤ TGR → warn
        warnings['wacc_tgr'] = 'WACC − TGR spread is < 1%. Many sampled runs may be discarded as invalid. Consider widening the gap.';
      }
    }
  }

  // ── Config Validation ──

  if (config.seed !== null && config.seed !== undefined) {
    if (!Number.isInteger(config.seed) || config.seed < 0) {
      errors['seed'] = ERRORS.invalidSeed;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a JSON config object imported from file.
 * Returns true if it has the expected shape for a saved config.
 */
export function validateConfigJson(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  const config = obj as Record<string, unknown>;
  // Must have inputs and stressVars at minimum
  return (
    typeof config['inputs'] === 'object' &&
    Array.isArray(config['stressVars']) &&
    typeof config['scenario'] === 'object' &&
    typeof config['simConfig'] === 'object'
  );
}
