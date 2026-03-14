import { create } from 'zustand';
import type { SimulationOutput } from '../types/outputs';

// ─── Results Slice ────────────────────────────────────────────────────────────

interface ResultsSlice {
  output: SimulationOutput | null;
  isRunning: boolean;
  progress: number;       // 0–100
  error: string | null;
  warnings: Record<string, string>; // fieldId → warning message (non-blocking)
  elapsedMs: number | null;

  setOutput: (output: SimulationOutput) => void;
  setIsRunning: (isRunning: boolean) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setWarnings: (warnings: Record<string, string>) => void;
  setElapsedMs: (ms: number) => void;
  clearResults: () => void;
}

export const useResultsStore = create<ResultsSlice>((set) => ({
  output: null,
  isRunning: false,
  progress: 0,
  error: null,
  warnings: {},
  elapsedMs: null,

  setOutput: (output) => set({ output, error: null }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error, isRunning: false }),
  setWarnings: (warnings) => set({ warnings }),
  setElapsedMs: (elapsedMs) => set({ elapsedMs }),
  clearResults: () => set({ output: null, error: null, progress: 0, elapsedMs: null, warnings: {} }),
}));
