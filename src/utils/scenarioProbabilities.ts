import type { ScenarioTargets } from '../types/inputs';
import { computeProbAbove } from '../engine/statistics';

export interface ScenarioProbabilities {
  probAboveBear: number;
  probAboveBase: number;
  probAboveBull: number;
}

/**
 * Derive scenario probabilities from sorted simulation results and
 * the current Bear/Base/Bull targets.
 */
export function deriveScenarioProbabilities(
  sortedResults: Float64Array,
  scenario: ScenarioTargets,
): ScenarioProbabilities {
  if (sortedResults.length === 0) {
    return {
      probAboveBear: 0,
      probAboveBase: 0,
      probAboveBull: 0,
    };
  }

  return {
    probAboveBear: computeProbAbove(sortedResults, scenario.bear),
    probAboveBase: computeProbAbove(sortedResults, scenario.base),
    probAboveBull: computeProbAbove(sortedResults, scenario.bull),
  };
}
