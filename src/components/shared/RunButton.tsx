// ─── RunButton ────────────────────────────────────────────────────────────────

interface RunButtonProps {
  /** Called on click — caller passes either runSimulation or abort depending on state */
  onRun: () => void;
  isRunning: boolean;
  progress?: number;   // 0–100
  disabled?: boolean;
  compact?: boolean;   // narrower variant for header
}

export function RunButton({
  onRun,
  isRunning,
  progress = 0,
  disabled = false,
  compact = false,
}: RunButtonProps) {
  const height = compact ? '34px' : '44px';
  const fontSize = compact ? '12px' : '14px';
  const padding = compact ? '0 14px' : '0 24px';

  return (
    <button
      type="button"
      onClick={onRun}
      disabled={disabled}
      aria-busy={isRunning}
      aria-label={isRunning ? 'Abort simulation' : 'Run Monte Carlo simulation'}
      className={isRunning && !compact ? 'btn-run-pulsing' : ''}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        height,
        padding,
        background: disabled
          ? 'var(--color-surface-alt)'
          : isRunning
          ? 'var(--color-primary-dim)'
          : 'var(--color-primary)',
        color: disabled ? 'var(--color-text-muted)' : 'var(--color-bg)',
        border: 'none',
        borderRadius: '4px',
        fontFamily: 'Space Grotesk',
        fontWeight: 600,
        fontSize,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 150ms ease',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      {/* Progress fill bar (visible while running) */}
      {isRunning && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.2)',
            transformOrigin: 'left',
            transform: `scaleX(${progress / 100})`,
            transition: 'transform 80ms linear',
            borderRadius: '4px',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Button content (sits above progress fill) */}
      <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '7px' }}>
        {isRunning ? (
          <>
            <SpinnerIcon />
            {compact ? `${progress.toFixed(0)}%` : 'Running…'}
          </>
        ) : (
          <>
            <RunIcon />
            {compact ? 'Run' : 'Run Simulation'}
          </>
        )}
      </span>
    </button>
  );
}

function RunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M3 2L11 7L3 12V2Z" fill="currentColor" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle
        cx="7"
        cy="7"
        r="5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="20 12"
        strokeLinecap="round"
      />
    </svg>
  );
}
