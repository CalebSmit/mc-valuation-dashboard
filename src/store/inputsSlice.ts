import { create } from 'zustand';
import type { SimulationInputs, StressVariable, StressVariableId } from '../types/inputs';
import { DEFAULT_INPUTS, DEFAULT_STRESS_VARS } from '../constants/finance';

// ─── Inputs Slice ─────────────────────────────────────────────────────────────

interface InputsSlice {
  inputs: SimulationInputs;
  stressVars: StressVariable[];

  // Fundamentals actions
  setInput: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void;
  resetInputs: () => void;
  loadInputs: (inputs: SimulationInputs) => void;

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
    set(state => ({ inputs: { ...state.inputs, [key]: value } })),

  resetInputs: () => set({ inputs: { ...DEFAULT_INPUTS } }),

  loadInputs: (inputs) => set({ inputs: { ...inputs } }),

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
