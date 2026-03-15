import { useScenarioStore } from '../../store/scenarioSlice';
import { useInputsStore } from '../../store/inputsSlice';
import { useResultsStore } from '../../store/resultsSlice';
import { SectionCard } from '../shared/SectionCard';
import { SECTION_TITLES, SECTION_SUBTITLES, TOOLTIPS } from '../../constants/labels';
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
      tone: 'bear',
      setter: setBear,
      tooltip: TOOLTIPS.bear,
      prob: output?.probAboveBear,
      probLabel: 'P(> Bear)',
    },
    {
      key: 'base' as const,
      label: 'Base',
      value: scenario.base,
      tone: 'base',
      setter: setBase,
      tooltip: TOOLTIPS.base,
      prob: output?.probAboveBase,
      probLabel: 'P(> Base)',
    },
    {
      key: 'bull' as const,
      label: 'Bull',
      value: scenario.bull,
      tone: 'bull',
      setter: setBull,
      tooltip: TOOLTIPS.bull,
      prob: output?.probAboveBull,
      probLabel: 'P(> Bull)',
    },
  ] as const;

  return (
    <SectionCard title={SECTION_TITLES.scenario} subtitle={SECTION_SUBTITLES.scenario}>
      <div className="flex flex-col gap-3">
        {scenarios.map(s => (
          <div key={s.key}>
            <div
              className={`scenario-target-card scenario-target-card-${s.tone} rounded p-2`}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <span className={`scenario-target-label scenario-target-label-${s.tone} text-11 font-semibold uppercase tracking-wide`}>
                    {s.label}
                  </span>
                  <TooltipIcon text={s.tooltip} />
                </div>
                {/* Probability badge — shows after simulation */}
                {s.prob !== undefined ? (
                  <span className={`scenario-target-prob scenario-target-prob-${s.tone} text-11 px-1.5 py-0.5 rounded`}>
                    {s.probLabel}: {formatProbability(s.prob)}
                  </span>
                ) : (
                  <span className="scenario-target-prob-empty text-11">
                    —
                  </span>
                )}
              </div>

              {/* Price input + upside display */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="scenario-target-currency absolute left-2 top-1/2 -translate-y-1/2 text-12 pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    className={`mc-input scenario-target-input scenario-target-input-${s.tone}`}
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
                  className={`scenario-target-delta text-12 w-16 text-right flex-shrink-0 ${currentPrice ? (s.value >= currentPrice ? 'scenario-target-delta-up' : 'scenario-target-delta-down') : 'scenario-target-delta-flat'}`}
                >
                  {updown(s.value)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Note: changing targets re-colors histogram without re-running */}
      <p className="scenario-target-note text-11 mt-2">
        Changing targets re-colors the histogram instantly.
      </p>
    </SectionCard>
  );
}
