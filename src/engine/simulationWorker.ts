// ─── Simulation Web Worker ───────────────────────────────────────────────────
//
// This file runs in a separate thread. It receives a WorkerMessage via postMessage,
// executes the full Monte Carlo simulation, and posts the result back.
//
// Vite imports this file with the `?worker` suffix:
//   import SimWorker from './simulationWorker.ts?worker';
//
// The worker has no access to the DOM — it can only use Web Worker APIs.

import type { WorkerMessage, WorkerResponse } from '../types/worker';
import { runMonteCarlo } from './mcRunner';

// ─── Message Handler ─────────────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  if (type !== 'RUN') {
    const response: WorkerResponse = {
      type: 'ERROR',
      payload: { message: `Unknown message type: ${String(type)}` },
    };
    self.postMessage(response);
    return;
  }

  try {
    const { inputs, stressVars, scenario, config } = payload;

    // Validate that we have the required data before running
    if (!inputs || !stressVars || !scenario || !config) {
      throw new Error('Missing required simulation parameters.');
    }

    if (stressVars.length === 0) {
      throw new Error('No stress variables provided.');
    }

    // Run the full Monte Carlo simulation
    const output = runMonteCarlo(inputs, stressVars, scenario, config);

    // Post result back to main thread
    // Note: Float64Array is transferred as a transferable object for zero-copy performance
    const response: WorkerResponse = {
      type: 'RESULT',
      payload: output,
    };

    // Transfer the Float64Array buffer to avoid copying (significant perf gain for 25k runs)
    // postMessage with transfer array: second arg is WindowPostMessageOptions when typed as Window,
    // but at runtime self IS a DedicatedWorkerGlobalScope that accepts Transferable[] directly.
    self.postMessage(response, { transfer: [output.results.buffer] });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown simulation error.';
    const response: WorkerResponse = {
      type: 'ERROR',
      payload: { message },
    };
    self.postMessage(response);
  }
};

// Handle unhandled promise rejections within the worker
self.onunhandledrejection = (event: PromiseRejectionEvent) => {
  const response: WorkerResponse = {
    type: 'ERROR',
    payload: { message: `Worker unhandled rejection: ${String(event.reason)}` },
  };
  self.postMessage(response);
};
