import type { SimulationInputs, StressVariable, ScenarioTargets, SimulationConfig } from './inputs';
import type { SimulationOutput } from './outputs';

// ─── Web Worker Message Contract ────────────────────────────────────────────

/** Message sent FROM main thread TO worker. */
export interface WorkerMessage {
  type: 'RUN';
  payload: {
    inputs: SimulationInputs;
    stressVars: StressVariable[];
    scenario: ScenarioTargets;
    config: SimulationConfig;
  };
}

/** Message sent FROM worker BACK TO main thread on success. */
export interface WorkerResultResponse {
  type: 'RESULT';
  payload: SimulationOutput;
}

/** Message sent FROM worker BACK TO main thread on error. */
export interface WorkerErrorResponse {
  type: 'ERROR';
  payload: { message: string };
}

/** Union type of all possible worker responses. */
export type WorkerResponse = WorkerResultResponse | WorkerErrorResponse;
