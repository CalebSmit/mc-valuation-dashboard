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
      className="flex flex-col h-full"
      style={{
        width: '320px',
        minWidth: '320px',
        maxWidth: '320px',
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
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
        className="flex-shrink-0 px-3 py-3"
        style={{
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
        }}
      >
        {/* Error banner */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-2 px-3 py-2 rounded text-11"
            style={{
              background: 'rgba(248,81,73,0.12)',
              border: '1px solid rgba(248,81,73,0.4)',
              color: 'var(--color-bear)',
              fontFamily: 'Space Grotesk',
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Warning banners (non-blocking) — e.g. WACC ≤ TGR */}
        {warningList.length > 0 && !error && (
          <div
            role="status"
            aria-live="polite"
            className="mb-2 px-3 py-2 rounded text-11 space-y-1"
            style={{
              background: 'rgba(240,180,41,0.08)',
              border: '1px solid rgba(240,180,41,0.35)',
              fontFamily: 'Space Grotesk',
            }}
          >
            {warningList.map((w, i) => (
              <div key={i} style={{ color: 'var(--color-primary)' }}>
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
          className="mt-2 text-10 text-center"
          style={{ color: 'var(--color-text-faint)', fontFamily: 'Space Grotesk' }}
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
