import { useEffect } from 'react';
import { Header } from './Header';
import { InputPanel } from './InputPanel';
import { OutputTabs } from '../outputs/OutputTabs';
import { useSimulation } from '../../hooks/useSimulation';

// ─── AppShell ─────────────────────────────────────────────────────────────────
// Full layout: fixed Header (56px) + flex row (InputPanel 320px | OutputTabs flex-1)
// Below 1024px: InputPanel stacks above OutputTabs (no fixed height).

export function AppShell() {
  const { runSimulation } = useSimulation();

  // Keyboard shortcut: Shift+Enter → Run
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        runSimulation();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [runSimulation]);

  return (
    <div
      className="flex flex-col"
      style={{
        height: '100dvh',
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        overflow: 'hidden',
      }}
    >
      {/* ── Top navigation bar ──────────────────────────────────────────── */}
      <Header />

      {/* ── Main content: sidebar + output area ─────────────────────────── */}
      <div
        className="flex flex-1 min-h-0"
        style={{ overflow: 'hidden' }}
      >
        {/* Input panel — fixed 320px on lg+, full-width stacked on mobile */}
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{ width: '320px' }}
        >
          <InputPanel />
        </div>

        {/* Output area — takes remaining space; id used by html2canvas for PDF export */}
        <div
          id="mc-output-area"
          className="flex-1 min-w-0 min-h-0 flex flex-col"
          style={{ background: 'var(--color-bg)' }}
        >
          <OutputTabs />
        </div>
      </div>
    </div>
  );
}
