import { useRef, useCallback } from 'react';
import type { WorkerMessage, WorkerResponse } from '../types/worker';
import { useInputsStore } from '../store/inputsSlice';
import { useConfigStore } from '../store/configSlice';
import { useScenarioStore } from '../store/scenarioSlice';
import { useResultsStore } from '../store/resultsSlice';
import { validateInputs } from '../utils/validators';
// Vite Web Worker import — bundled correctly for GitHub Pages
import SimWorker from '../engine/simulationWorker.ts?worker';

// ─── useSimulation Hook ───────────────────────────────────────────────────────

interface UseSimulationReturn {
  runSimulation: () => void;
  abort: () => void;
  isRunning: boolean;
  progress: number;
  warnings: Record<string, string>;
}

/**
 * Hook that manages the simulation worker lifecycle.
 * Reads from all store slices, spawns the Web Worker,
 * and writes results back to resultsSlice.
 */
export function useSimulation(): UseSimulationReturn {
  const workerRef = useRef<Worker | null>(null);
  const startTimeRef = useRef<number>(0);

  // Store reads
  const inputs = useInputsStore(s => s.inputs);
  const stressVars = useInputsStore(s => s.stressVars);
  const config = useConfigStore(s => s.config);
  const scenario = useScenarioStore(s => s.scenario);

  // Store writes
  const setOutput = useResultsStore(s => s.setOutput);
  const setIsRunning = useResultsStore(s => s.setIsRunning);
  const setProgress = useResultsStore(s => s.setProgress);
  const setError = useResultsStore(s => s.setError);
  const setWarnings = useResultsStore(s => s.setWarnings);
  const setElapsedMs = useResultsStore(s => s.setElapsedMs);
  const clearResults = useResultsStore(s => s.clearResults);

  // Reactive reads for return values
  const isRunning = useResultsStore(s => s.isRunning);
  const progress = useResultsStore(s => s.progress);
  const warnings = useResultsStore(s => s.warnings);

  const abort = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsRunning(false);
    setProgress(0);
  }, [setIsRunning, setProgress]);

  const runSimulation = useCallback(() => {
    if (isRunning) return;

    // Validate inputs before running
    const validation = validateInputs(inputs, stressVars, scenario, config);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      setError(`Validation failed: ${firstError}`);
      return;
    }

    // Surface non-blocking warnings (e.g. WACC ≤ TGR)
    setWarnings(validation.warnings);

    // Abort any in-progress run
    abort();

    clearResults();
    // Re-set warnings after clearResults (which wipes them)
    setWarnings(validation.warnings);
    setIsRunning(true);
    setProgress(0);
    startTimeRef.current = performance.now();

    // Spawn a fresh worker for each run
    const worker = new SimWorker();
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const elapsed = performance.now() - startTimeRef.current;

      if (event.data.type === 'RESULT') {
        setOutput(event.data.payload);
        setElapsedMs(elapsed);
        setIsRunning(false);
        setProgress(100);
      } else {
        setError(event.data.payload.message);
      }

      worker.terminate();
      workerRef.current = null;
    };

    worker.onerror = (err: ErrorEvent) => {
      setError(`Worker error: ${err.message}`);
      worker.terminate();
      workerRef.current = null;
    };

    // Sync terminalValueMethod from config into the stressVars run
    const message: WorkerMessage = {
      type: 'RUN',
      payload: {
        inputs: { ...inputs, terminalValueMethod: config.terminalValueMethod },
        stressVars,
        scenario,
        config,
      },
    };

    worker.postMessage(message);
  }, [isRunning, inputs, stressVars, scenario, config, abort, clearResults, setIsRunning, setProgress, setOutput, setElapsedMs, setError, setWarnings]);

  return { runSimulation, abort, isRunning, progress, warnings };
}
