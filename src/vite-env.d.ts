/// <reference types="vite/client" />

// ─── Vite Worker URL import types ─────────────────────────────────────────────
// Allows: import SimWorker from './simulationWorker.ts?worker'

declare module '*?worker' {
  const WorkerConstructor: new () => Worker;
  export default WorkerConstructor;
}
