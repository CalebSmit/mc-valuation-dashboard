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

export const useInputsStore = create<InputsSlice>((set) => ({
  inputs: { ...DEFAULT_INPUTS },
  stressVars: DEFAULT_STRESS_VARS.map(v => ({ ...v })),

  setInput: (key, value) =>
    set(state => ({ inputs: { ...state.inputs, [key]: value } })),

  resetInputs: () => set({ inputs: { ...DEFAULT_INPUTS } }),

  loadInputs: (inputs) => set({ inputs: { ...inputs } }),

  setStressVar: (id, key, value) =>
    set(state => ({
      stressVars: state.stressVars.map(v =>
        v.id === id ? { ...v, [key]: value } : v
      ),
    })),

  resetStressVars: () =>
    set({ stressVars: DEFAULT_STRESS_VARS.map(v => ({ ...v })) }),

  loadStressVars: (vars) =>
    set({ stressVars: vars.map(v => ({ ...v })) }),
}));
