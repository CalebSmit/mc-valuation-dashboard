import { useState } from 'react';
import { useInputsStore } from '../../store/inputsSlice';
import { useResultsStore } from '../../store/resultsSlice';
import { useSimulation } from '../../hooks/useSimulation';
import { useExport } from '../../hooks/useExport';
import { ExportMenu } from '../shared/ExportMenu';
import { RunButton } from '../shared/RunButton';
import { MethodologyModal } from '../shared/MethodologyModal';
import { GuidedSetupWizard } from '../shared/GuidedSetupWizard';
import { SnapshotPreviewModal } from '../shared/SnapshotPreviewModal';
import { formatLargeNumber, formatPrice } from '../../utils/formatters';

// ─── Header ───────────────────────────────────────────────────────────────────
// Top bar: logo | company info | run status | export menu | run button

export function Header() {
  const inputs = useInputsStore(s => s.inputs);
  const { isRunning, progress, runSimulation, abort } = useSimulation();
  const output = useResultsStore(s => s.output);
  const elapsedMs = useResultsStore(s => s.elapsedMs);
  const { exportPDF, exportCSV, exportConfig, importConfig } = useExport();
  const [methodOpen, setMethodOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(true);
  const [snapshotOpen, setSnapshotOpen] = useState(false);

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
    <>
    <header
      className="header-shell flex-shrink-0 flex items-center justify-between px-5 py-3 gap-4"
    >
      {/* ── Logo / title ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Logo mark */}
        <div
          className="header-logo-mark flex-shrink-0 flex items-center justify-center w-8 h-8 rounded"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 14 L5 8 L8 11 L11 5 L14 2" stroke="#f0b429" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="14" cy="2" r="1.5" fill="#f0b429" />
          </svg>
        </div>

        <div className="min-w-0">
          <div
            className="header-title text-13 font-semibold truncate"
          >
            MC Valuation
          </div>
          <div
            className="header-subtitle text-10 truncate"
          >
            Monte Carlo Equity Dashboard
          </div>
        </div>
      </div>

      {/* ── Company info ──────────────────────────────────────────────── */}
      {(inputs.companyName || inputs.ticker) && (
        <div
          className="header-company-chip hidden md:flex items-center gap-3 px-3 py-1.5 rounded min-w-0"
        >
          {inputs.ticker && (
            <span
              className="header-company-ticker text-12 font-semibold flex-shrink-0"
            >
              {inputs.ticker}
            </span>
          )}
          {inputs.companyName && (
            <span
              className="header-company-name text-12 truncate max-w-32"
            >
              {inputs.companyName}
            </span>
          )}
          {inputs.currentPrice > 0 && (
            <span
              className="header-company-price text-12 font-medium flex-shrink-0"
            >
              {formatPrice(inputs.currentPrice)}
            </span>
          )}
          {impliedMarketCap != null && (
            <span
              className="header-company-mcap text-11 flex-shrink-0"
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
        className="header-status hidden sm:flex items-center gap-2 px-3 py-1.5 rounded"
      >
        {/* Status dot */}
        <span
          className={`header-status-dot w-2 h-2 rounded-full flex-shrink-0 ${isRunning ? 'header-status-dot-running' : output ? 'header-status-dot-complete' : 'header-status-dot-idle'}`}
        />
        <span
          className="header-status-text text-11"
        >
          {statusText}
        </span>
      </div>

      {/* ── Guided Setup button ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setWizardOpen(true)}
        className="header-guide-btn text-12 px-3 py-2 rounded flex items-center gap-1.5"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="ui-icon-fixed">
          <path d="M8 1.5 L9.3 5.2 L13.2 5.5 L10.2 8 L11.1 12 L8 10 L4.9 12 L5.8 8 L2.8 5.5 L6.7 5.2Z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
        </svg>
        Setup
      </button>

      {/* ── Methodology button ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setMethodOpen(true)}
        className="header-guide-btn text-12 px-3 py-2 rounded flex items-center gap-1.5"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="ui-icon-fixed">
          <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
          <line x1="5" y1="4.5" x2="11" y2="4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="5" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <line x1="5" y1="9.5" x2="8.5" y2="9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        Guide
      </button>

      {/* ── Export menu ───────────────────────────────────────────────── */}
      {/* Wrap handlers to match ExportMenu's void-return contract */}
      <ExportMenu
        onExportPDF={async () => { await exportPDF(); }}
        onExportCSV={() => { exportCSV(); }}
        onExportConfig={() => { exportConfig(); }}
        onImportConfig={async (file) => { await importConfig(file); }}
        onCopySnapshot={() => { setSnapshotOpen(true); }}
      />

      {/* ── Run button (compact) ──────────────────────────────────────── */}
      <div className="header-run-button-wrap flex-shrink-0">
        <RunButton
          onRun={isRunning ? abort : runSimulation}
          isRunning={isRunning}
          progress={progress}
          compact
        />
      </div>
    </header>

    <MethodologyModal open={methodOpen} onClose={() => setMethodOpen(false)} />
    <GuidedSetupWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    <SnapshotPreviewModal
      open={snapshotOpen}
      onClose={() => setSnapshotOpen(false)}
      activeTab={
        ['histogram', 'tornado', 'cdf', 'sensitivity', 'fan'].find(
          t => document.getElementById(`tabpanel-${t}`),
        ) ?? 'histogram'
      }
    />
    </>
  );
}
