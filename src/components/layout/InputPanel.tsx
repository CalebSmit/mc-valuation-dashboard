import { FundamentalsSection } from '../inputs/FundamentalsSection';
import { StressVariables } from '../inputs/StressVariables';
import { SimConfigSection } from '../inputs/SimConfigSection';
import { ScenarioTargets } from '../inputs/ScenarioTargets';
import { RunButton } from '../shared/RunButton';
import { useSimulation } from '../../hooks/useSimulation';
import { useResultsStore } from '../../store/resultsSlice';

// ─── InputPanel ───────────────────────────────────────────────────────────────
// Fixed 320px left panel with all four input sections + sticky Run button.

export function InputPanel() {
  const { runSimulation, abort, isRunning, progress, warnings } = useSimulation();
  const error = useResultsStore(s => s.error);

  const warningList = Object.values(warnings);

  return (
    <div
      className="input-panel-shell flex flex-col h-full"
    >
      {/* ── Scrollable sections ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-2">
        <FundamentalsSection />
        <StressVariables />
        <SimConfigSection />
        <ScenarioTargets />
      </div>

      {/* ── Sticky Run button footer ─────────────────────────────────────── */}
      <div
        className="input-panel-footer flex-shrink-0 px-3 py-3"
      >
        {/* Error banner */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="input-panel-error-banner mb-2 px-3 py-2 rounded text-11"
          >
            ⚠ {error}
          </div>
        )}

        {/* Warning banners (non-blocking) — e.g. WACC ≤ TGR */}
        {warningList.length > 0 && !error && (
          <div
            role="status"
            aria-live="polite"
            className="input-panel-warning-banner mb-2 px-3 py-2 rounded text-11 space-y-1"
          >
            {warningList.map((w, i) => (
              <div key={i} className="input-panel-warning-item">
                ⚠ {w}
              </div>
            ))}
          </div>
        )}

        <RunButton
          onRun={isRunning ? abort : runSimulation}
          isRunning={isRunning}
          progress={progress}
        />

        <p
          className="input-panel-hint mt-2 text-10 text-center"
          aria-live="polite"
        >
          {isRunning
            ? `Running… ${progress.toFixed(0)}%`
            : 'Shift+Enter to run'}
        </p>
      </div>
    </div>
  );
}
