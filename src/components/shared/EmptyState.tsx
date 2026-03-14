// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  onRun?: () => void;
  error?: string | null;
}

export function EmptyState({ onRun, error }: EmptyStateProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div
          className="rounded p-4 text-center max-w-md"
          style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid var(--color-error)' }}
        >
          <div className="text-16 mb-2" style={{ color: 'var(--color-error)' }}>⚠ Simulation Error</div>
          <div className="text-13" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
            {error}
          </div>
        </div>
        {onRun && (
          <button
            type="button"
            onClick={onRun}
            className="text-13 px-4 py-2 rounded"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-bg)',
              border: 'none',
              fontFamily: 'Space Grotesk',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8">
      {/* Chart placeholder illustration */}
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none" aria-hidden>
        <rect x="4" y="60" width="14" height="16" rx="1" fill="rgba(88,166,255,0.2)" />
        <rect x="22" y="44" width="14" height="32" rx="1" fill="rgba(88,166,255,0.2)" />
        <rect x="40" y="28" width="14" height="48" rx="1" fill="rgba(88,166,255,0.35)" />
        <rect x="58" y="20" width="14" height="56" rx="1" fill="rgba(88,166,255,0.5)" />
        <rect x="76" y="32" width="14" height="44" rx="1" fill="rgba(88,166,255,0.35)" />
        <rect x="94" y="48" width="14" height="28" rx="1" fill="rgba(88,166,255,0.2)" />
        <rect x="112" y="56" width="4" height="20" rx="1" fill="rgba(88,166,255,0.15)" />
        {/* Bear/Bull lines */}
        <line x1="30" y1="4" x2="30" y2="76" stroke="rgba(248,81,73,0.4)" strokeWidth="1" strokeDasharray="3,3"/>
        <line x1="90" y1="4" x2="90" y2="76" stroke="rgba(63,185,80,0.4)" strokeWidth="1" strokeDasharray="3,3"/>
      </svg>

      <div className="text-center">
        <div
          className="text-16 mb-2"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk', fontWeight: 500 }}
        >
          Run simulation to see results
        </div>
        <div className="text-13" style={{ color: 'var(--color-text-faint)', fontFamily: 'Space Grotesk' }}>
          Configure inputs on the left, then click Run Simulation.
        </div>
      </div>

      {onRun && (
        <button
          type="button"
          onClick={onRun}
          className="px-5 py-2 rounded text-13"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-bg)',
            border: 'none',
            fontFamily: 'Space Grotesk',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ▶ Run Simulation
        </button>
      )}
    </div>
  );
}
