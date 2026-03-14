import { useScenarioStore } from '../../store/scenarioSlice';
import { useInputsStore } from '../../store/inputsSlice';
import { useResultsStore } from '../../store/resultsSlice';
import { SectionCard } from '../shared/SectionCard';
import { SECTION_TITLES, TOOLTIPS } from '../../constants/labels';
import { TooltipIcon } from '../shared/TooltipIcon';
import { formatDelta, formatProbability } from '../../utils/formatters';

// ─── ScenarioTargets ──────────────────────────────────────────────────────────

export function ScenarioTargets() {
  const scenario = useScenarioStore(s => s.scenario);
  const setBear = useScenarioStore(s => s.setBear);
  const setBase = useScenarioStore(s => s.setBase);
  const setBull = useScenarioStore(s => s.setBull);
  const currentPrice = useInputsStore(s => s.inputs.currentPrice);
  const output = useResultsStore(s => s.output);

  const updown = (target: number) => {
    if (!currentPrice) return '—';
    return formatDelta((target - currentPrice) / currentPrice);
  };

  const scenarios = [
    {
      key: 'bear' as const,
      label: 'Bear',
      value: scenario.bear,
      color: 'var(--color-bear)',
      borderColor: 'rgba(248,81,73,0.5)',
      setter: setBear,
      tooltip: TOOLTIPS.bear,
      prob: output?.probAboveBear,
      probLabel: 'P(> Bear)',
    },
    {
      key: 'base' as const,
      label: 'Base',
      value: scenario.base,
      color: 'var(--color-neutral)',
      borderColor: 'rgba(88,166,255,0.5)',
      setter: setBase,
      tooltip: TOOLTIPS.base,
      prob: output?.probAboveBase,
      probLabel: 'P(> Base)',
    },
    {
      key: 'bull' as const,
      label: 'Bull',
      value: scenario.bull,
      color: 'var(--color-bull)',
      borderColor: 'rgba(63,185,80,0.5)',
      setter: setBull,
      tooltip: TOOLTIPS.bull,
      prob: output?.probAboveBull,
      probLabel: 'P(> Bull)',
    },
  ] as const;

  return (
    <SectionCard title={SECTION_TITLES.scenario}>
      <div className="flex flex-col gap-3">
        {scenarios.map(s => (
          <div key={s.key}>
            <div
              className="rounded p-2"
              style={{ borderLeft: `3px solid ${s.borderColor}`, background: 'var(--color-surface-alt)' }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-11 font-semibold uppercase tracking-wide" style={{ color: s.color, fontFamily: 'Space Grotesk' }}>
                    {s.label}
                  </span>
                  <TooltipIcon text={s.tooltip} />
                </div>
                {/* Probability badge — shows after simulation */}
                {s.prob !== undefined ? (
                  <span
                    className="text-11 px-1.5 py-0.5 rounded"
                    style={{
                      background: `${s.borderColor.replace('0.5', '0.15')}`,
                      color: s.color,
                      fontFamily: 'DM Mono',
                      border: `1px solid ${s.borderColor}`,
                    }}
                  >
                    {s.probLabel}: {formatProbability(s.prob)}
                  </span>
                ) : (
                  <span className="text-11" style={{ color: 'var(--color-text-faint)', fontFamily: 'DM Mono' }}>
                    —
                  </span>
                )}
              </div>

              {/* Price input + upside display */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-12 pointer-events-none"
                    style={{ color: 'var(--color-text-muted)', fontFamily: 'DM Mono' }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    className="mc-input"
                    style={{ paddingLeft: '18px', color: s.color, fontFamily: 'DM Mono' }}
                    value={s.value}
                    min={0.01}
                    step={0.5}
                    onChange={e => {
                      const n = parseFloat(e.target.value);
                      if (!isNaN(n) && n > 0) s.setter(n);
                    }}
                    aria-label={`${s.label} target price`}
                  />
                </div>
                <span
                  className="text-12 w-16 text-right flex-shrink-0"
                  style={{
                    color: currentPrice
                      ? (s.value >= currentPrice ? 'var(--color-bull)' : 'var(--color-bear)')
                      : 'var(--color-text-muted)',
                    fontFamily: 'DM Mono',
                  }}
                >
                  {updown(s.value)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Note: changing targets re-colors histogram without re-running */}
      <p className="text-11 mt-2" style={{ color: 'var(--color-text-faint)', fontFamily: 'Space Grotesk' }}>
        Changing targets re-colors the histogram instantly.
      </p>
    </SectionCard>
  );
}
