import { create } from 'zustand';
import type { SimulationConfig, NumRuns, SamplingMethod } from '../types/inputs';
import { DEFAULT_CONFIG } from '../constants/finance';

// ─── Config Slice ─────────────────────────────────────────────────────────────

interface ConfigSlice {
  config: SimulationConfig;
  setNumRuns: (numRuns: NumRuns) => void;
  setSeed: (seed: number | null) => void;
  setSamplingMethod: (method: SamplingMethod) => void;
  setTerminalValueMethod: (method: 'ggm' | 'exitMultiple') => void;
  resetConfig: () => void;
  loadConfig: (config: SimulationConfig) => void;
}

export const useConfigStore = create<ConfigSlice>((set) => ({
  config: { ...DEFAULT_CONFIG },

  setNumRuns: (numRuns) =>
    set(state => ({ config: { ...state.config, numRuns } })),

  setSeed: (seed) =>
    set(state => ({ config: { ...state.config, seed } })),

  setSamplingMethod: (samplingMethod) =>
    set(state => ({ config: { ...state.config, samplingMethod } })),

  setTerminalValueMethod: (terminalValueMethod) =>
    set(state => ({
      config: { ...state.config, terminalValueMethod },
    })),

  resetConfig: () => set({ config: { ...DEFAULT_CONFIG } }),

  loadConfig: (config) => set({ config: { ...config } }),
}));
