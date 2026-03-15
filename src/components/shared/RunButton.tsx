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
  const rootClasses = [
    'run-btn',
    compact ? 'run-btn-compact' : 'run-btn-regular',
    isRunning ? 'run-btn-running' : 'run-btn-idle',
    disabled ? 'run-btn-disabled' : 'run-btn-enabled',
    isRunning && !compact ? 'btn-run-pulsing' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      onClick={onRun}
      disabled={disabled}
      aria-label={isRunning ? 'Abort simulation' : 'Run Monte Carlo simulation'}
      className={rootClasses}
    >
      {/* Progress fill bar (visible while running) */}
      {isRunning && <span className="run-btn-progress" />}

      {/* Button content (sits above progress fill) */}
      <span className="run-btn-content">
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
      className="run-btn-spinner"
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
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
