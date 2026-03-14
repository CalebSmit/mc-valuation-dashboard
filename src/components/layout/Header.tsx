import { useInputsStore } from '../../store/inputsSlice';
import { useResultsStore } from '../../store/resultsSlice';
import { useSimulation } from '../../hooks/useSimulation';
import { useExport } from '../../hooks/useExport';
import { ExportMenu } from '../shared/ExportMenu';
import { RunButton } from '../shared/RunButton';
import { formatLargeNumber, formatPrice } from '../../utils/formatters';

// ─── Header ───────────────────────────────────────────────────────────────────
// Top bar: logo | company info | run status | export menu | run button

export function Header() {
  const inputs = useInputsStore(s => s.inputs);
  const { isRunning, progress, runSimulation, abort } = useSimulation();
  const output = useResultsStore(s => s.output);
  const elapsedMs = useResultsStore(s => s.elapsedMs);
  const { exportPDF, exportCSV, exportConfig, importConfig } = useExport();

  const impliedMarketCap =
    inputs.currentPrice > 0 && inputs.sharesOutstanding > 0
      ? inputs.currentPrice * inputs.sharesOutstanding
      : null;

  const statusText = (() => {
    if (isRunning) return `Running… ${progress.toFixed(0)}%`;
    if (output) {
      const ms = elapsedMs != null ? ` · ${elapsedMs}ms` : '';
      return `${output.results.length.toLocaleString()} paths${ms}`;
    }
    return 'Ready';
  })();

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-5 py-3 gap-4"
      style={{
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        height: '56px',
      }}
    >
      {/* ── Logo / title ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Logo mark */}
        <div
          className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded"
          style={{ background: 'rgba(240,180,41,0.15)', border: '1px solid rgba(240,180,41,0.3)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 14 L5 8 L8 11 L11 5 L14 2" stroke="#f0b429" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="14" cy="2" r="1.5" fill="#f0b429" />
          </svg>
        </div>

        <div className="min-w-0">
          <div
            className="text-13 font-semibold truncate"
            style={{ color: 'var(--color-text)', fontFamily: 'Space Grotesk' }}
          >
            MC Valuation
          </div>
          <div
            className="text-10 truncate"
            style={{ color: 'var(--color-text-faint)', fontFamily: 'DM Mono' }}
          >
            Monte Carlo Equity Dashboard
          </div>
        </div>
      </div>

      {/* ── Company info ──────────────────────────────────────────────── */}
      {(inputs.companyName || inputs.ticker) && (
        <div
          className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded min-w-0"
          style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
        >
          {inputs.ticker && (
            <span
              className="text-12 font-semibold flex-shrink-0"
              style={{ color: 'var(--color-primary)', fontFamily: 'DM Mono' }}
            >
              {inputs.ticker}
            </span>
          )}
          {inputs.companyName && (
            <span
              className="text-12 truncate max-w-32"
              style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}
            >
              {inputs.companyName}
            </span>
          )}
          {inputs.currentPrice > 0 && (
            <span
              className="text-12 font-medium flex-shrink-0"
              style={{ color: 'var(--color-text)', fontFamily: 'DM Mono' }}
            >
              {formatPrice(inputs.currentPrice)}
            </span>
          )}
          {impliedMarketCap != null && (
            <span
              className="text-11 flex-shrink-0"
              style={{ color: 'var(--color-text-faint)', fontFamily: 'DM Mono' }}
            >
              MCap {formatLargeNumber(impliedMarketCap)}
            </span>
          )}
        </div>
      )}

      {/* ── Spacer ────────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Simulation status ─────────────────────────────────────────── */}
      <div
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded"
        style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}
      >
        {/* Status dot */}
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: isRunning
              ? '#f0b429'
              : output
              ? 'var(--color-bull)'
              : 'var(--color-text-faint)',
            animation: isRunning ? 'pulse-amber 1s ease-in-out infinite' : 'none',
          }}
        />
        <span
          className="text-11"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'DM Mono', whiteSpace: 'nowrap' }}
        >
          {statusText}
        </span>
      </div>

      {/* ── Export menu ───────────────────────────────────────────────── */}
      {/* Wrap handlers to match ExportMenu's void-return contract */}
      <ExportMenu
        onExportPDF={async () => { await exportPDF(); }}
        onExportCSV={() => { exportCSV(); }}
        onExportConfig={() => { exportConfig(); }}
        onImportConfig={async (file) => { await importConfig(file); }}
      />

      {/* ── Run button (compact) ──────────────────────────────────────── */}
      <div className="flex-shrink-0" style={{ width: '110px' }}>
        <RunButton
          onRun={isRunning ? abort : runSimulation}
          isRunning={isRunning}
          progress={progress}
          compact
        />
      </div>
    </header>
  );
}
