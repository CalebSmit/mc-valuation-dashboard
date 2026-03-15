import { useState, useRef, useCallback } from 'react';
import { useResultsStore } from '../../store/resultsSlice';
import { StatsPanel } from './StatsPanel';
import { HistogramChart } from './HistogramChart';
import { TornadoChart } from './TornadoChart';
import { CDFChart } from './CDFChart';
import { SensitivityHeatmap } from './SensitivityHeatmap';
import { FanChart } from './FanChart';
import { TAB_LABELS } from '../../constants/labels';

// ─── OutputTabs ───────────────────────────────────────────────────────────────
// Five-tab output area (Histogram | Tornado | CDF | Sensitivity | Fan)
// with StatsPanel sidebar to the right.
// Keyboard navigation: Left/Right arrows move between tabs (ARIA Authoring Practices).

type TabKey = 'histogram' | 'tornado' | 'cdf' | 'sensitivity' | 'fan';

const TABS: { key: TabKey; label: string; badge?: string }[] = [
  { key: 'histogram',   label: TAB_LABELS.histogram },
  { key: 'tornado',     label: TAB_LABELS.tornado },
  { key: 'cdf',         label: TAB_LABELS.cdf },
  { key: 'sensitivity', label: TAB_LABELS.sensitivity, badge: 'det.' },
  { key: 'fan',         label: TAB_LABELS.fan },
];

export function OutputTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>('histogram');
  const output = useResultsStore(s => s.output);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === 'ArrowRight') {
      next = (index + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft') {
      next = (index - 1 + TABS.length) % TABS.length;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = TABS.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    setActiveTab(TABS[next].key);
    tabRefs.current[next]?.focus();
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <div
        className="output-tabs-bar flex-shrink-0 flex items-center gap-0 border-b px-4 overflow-x-auto overflow-y-hidden"
        role="tablist"
        aria-label="Output charts"
      >
        {TABS.map((tab, i) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              ref={el => { tabRefs.current[i] = el; }}
              id={`tab-${tab.key}`}
              role="tab"
              aria-controls={`tabpanel-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.key)}
              onKeyDown={e => handleKeyDown(e, i)}
              className={`output-tab-button relative flex-shrink-0 whitespace-nowrap px-4 py-3 text-12 font-medium transition-colors ${isActive ? 'output-tab-button-active' : 'output-tab-button-inactive'}`}
              onFocus={e => {
                if (e.target.matches(':focus-visible')) {
                  (e.target as HTMLElement).style.outline = '2px solid var(--color-primary)';
                  (e.target as HTMLElement).style.outlineOffset = '-2px';
                }
              }}
              onBlur={e => {
                (e.target as HTMLElement).style.outline = 'none';
              }}
            >
              {tab.label}
              {tab.badge && (
                <span
                  className="output-tab-badge ml-1 text-10 px-1 rounded"
                  title="Deterministic sensitivity — point estimates, not stochastic"
                >
                  {tab.badge}
                </span>
              )}
              {/* Active underline */}
              {isActive && (
                <span
                  className="output-tab-underline absolute bottom-0 left-0 right-0 h-0.5"
                  aria-hidden
                />
              )}
              {/* Indicator dot when data is available */}
              {output && (
                <span
                  className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full align-middle ${isActive ? 'output-tab-dot-active' : 'output-tab-dot-inactive'}`}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content Area: Chart + StatsPanel sidebar ────────────────────── */}
      <div className="output-tabs-content flex flex-1 min-h-0 overflow-hidden">
        {/* Chart panel */}
        <div
          className="output-tabs-chart flex-1 min-w-0 min-h-0 p-4 overflow-auto"
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
        >
          {activeTab === 'histogram'   && <HistogramChart />}
          {activeTab === 'tornado'     && <TornadoChart />}
          {activeTab === 'cdf'         && <CDFChart />}
          {activeTab === 'sensitivity' && <SensitivityHeatmap />}
          {activeTab === 'fan'         && <FanChart />}
        </div>

        {/* Stats sidebar — always visible on right; role=status for live updates */}
        <div
          className="output-tabs-sidebar flex-shrink-0 overflow-y-auto"
          role="complementary"
          aria-label="Simulation statistics"
        >
          <StatsPanel />
        </div>
      </div>
    </div>
  );
}
