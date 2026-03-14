import { create } from 'zustand';
import type { ScenarioTargets } from '../types/inputs';
import { DEFAULT_SCENARIO } from '../constants/finance';

// ─── Scenario Slice ───────────────────────────────────────────────────────────

interface ScenarioSlice {
  scenario: ScenarioTargets;
  setBear: (bear: number) => void;
  setBase: (base: number) => void;
  setBull: (bull: number) => void;
  setScenario: (scenario: ScenarioTargets) => void;
  resetScenario: () => void;
  /** Derive default scenario from current price (bear −20%, base =current, bull +30%) */
  deriveFromPrice: (currentPrice: number) => void;
}

export const useScenarioStore = create<ScenarioSlice>((set) => ({
  scenario: { ...DEFAULT_SCENARIO },

  setBear: (bear) =>
    set(state => ({ scenario: { ...state.scenario, bear } })),

  setBase: (base) =>
    set(state => ({ scenario: { ...state.scenario, base } })),

  setBull: (bull) =>
    set(state => ({ scenario: { ...state.scenario, bull } })),

  setScenario: (scenario) => set({ scenario: { ...scenario } }),

  resetScenario: () => set({ scenario: { ...DEFAULT_SCENARIO } }),

  deriveFromPrice: (currentPrice) =>
    set({
      scenario: {
        bear: Math.round(currentPrice * 0.80 * 100) / 100,
        base: Math.round(currentPrice * 100) / 100,
        bull: Math.round(currentPrice * 1.30 * 100) / 100,
      },
    }),
}));
