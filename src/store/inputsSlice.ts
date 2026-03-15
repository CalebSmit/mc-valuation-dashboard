import { create } from 'zustand';
import type { SimulationInputs, StressVariable, StressVariableId, ProjectionMode } from '../types/inputs';
import { DEFAULT_INPUTS, DEFAULT_STRESS_VARS } from '../constants/finance';

// ─── Income-statement stress var IDs (disabled in direct mode) ───────────────
const MARGIN_ONLY_VARS: StressVariableId[] = [
  'revenueGrowth', 'ebitdaMargin', 'capexPct', 'nwcPct', 'daPct', 'taxRate', 'year1GrowthPremium',
];

// ─── Inputs Slice ─────────────────────────────────────────────────────────────

interface InputsSlice {
  inputs: SimulationInputs;
  stressVars: StressVariable[];

  // Fundamentals actions
  setInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void;
  resetInputs: () => void;
  loadInputs: (inputs: SimulationInputs) => void;

  // Direct FCFF actions
  syncWaccToStressVar: (wacc: number) => void;
  setFcfProjection: (yearIndex: number, value: number) => void;
  setProjectionMode: (mode: ProjectionMode) => void;

  // Stress variable actions
  setStressVar: <K extends keyof StressVariable>(id: StressVariableId, key: K, value: StressVariable[K]) => void;
  resetStressVars: () => void;
  loadStressVars: (vars: StressVariable[]) => void;
}

function normalizeStressVar(variable: StressVariable): StressVariable {
  return {
    ...variable,
    enabled: variable.enabled ?? true,
  };
}

function cloneStressVars(vars: StressVariable[]): StressVariable[] {
  return vars.map(normalizeStressVar);
}

export const useInputsStore = create<InputsSlice>((set) => ({
  inputs: { ...DEFAULT_INPUTS },
  stressVars: cloneStressVars(DEFAULT_STRESS_VARS),

  setInput: (key, value) =>
    set(state => {
      const newInputs = { ...state.inputs, [key]: value };
      // When projectionYears changes, resize fcfProjections array
      if (key === 'projectionYears') {
        const years = value as number;
        const old = state.inputs.fcfProjections;
        const resized = Array.from({ length: years }, (_, i) => old[i] ?? 0);
        newInputs.fcfProjections = resized;
      }
      return { inputs: newInputs };
    }),

  resetInputs: () => set({ inputs: { ...DEFAULT_INPUTS } }),

  loadInputs: (inputs) => set({ inputs: { ...inputs } }),

  syncWaccToStressVar: (wacc) =>
    set(state => ({
      inputs: { ...state.inputs, wacc },
      stressVars: state.stressVars.map(v =>
        v.id === 'wacc' ? normalizeStressVar({ ...v, mean: wacc }) : v
      ),
    })),

  setFcfProjection: (yearIndex, value) =>
    set(state => {
      const updated = [...state.inputs.fcfProjections];
      updated[yearIndex] = value;
      return { inputs: { ...state.inputs, fcfProjections: updated } };
    }),

  setProjectionMode: (mode) =>
    set(state => ({
      inputs: { ...state.inputs, projectionMode: mode },
      stressVars: state.stressVars.map(v => {
        // In direct mode: disable income-statement vars, enable fcfDeviation
        // In margin mode: enable income-statement vars, disable fcfDeviation
        if (MARGIN_ONLY_VARS.includes(v.id)) {
          return normalizeStressVar({ ...v, enabled: mode === 'margin' });
        }
        if (v.id === 'fcfDeviation') {
          return normalizeStressVar({ ...v, enabled: mode === 'direct' });
        }
        return v;
      }),
    })),

  setStressVar: (id, key, value) =>
    set(state => ({
      stressVars: state.stressVars.map(v =>
        v.id === id ? normalizeStressVar({ ...v, [key]: value }) : v
      ),
    })),

  resetStressVars: () =>
    set({ stressVars: cloneStressVars(DEFAULT_STRESS_VARS) }),

  loadStressVars: (vars) =>
    set({ stressVars: cloneStressVars(vars) }),
}));
