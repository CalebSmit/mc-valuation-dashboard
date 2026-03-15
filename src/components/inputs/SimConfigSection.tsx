import { useConfigStore } from '../../store/configSlice';
import { SectionCard } from '../shared/SectionCard';
import { SECTION_TITLES, FIELD_LABELS, TOOLTIPS, SAMPLING_LABELS, TV_METHOD_LABELS } from '../../constants/labels';
import { TooltipIcon } from '../shared/TooltipIcon';
import { formatRunCount } from '../../utils/formatters';
import type { NumRuns } from '../../types/inputs';

// ─── SimConfigSection ─────────────────────────────────────────────────────────

const RUN_OPTIONS: NumRuns[] = [500, 1000, 5000, 10000, 25000];

export function SimConfigSection() {
  const config = useConfigStore(s => s.config);
  const setNumRuns = useConfigStore(s => s.setNumRuns);
  const setSeed = useConfigStore(s => s.setSeed);
  const setSamplingMethod = useConfigStore(s => s.setSamplingMethod);
  const setTerminalValueMethod = useConfigStore(s => s.setTerminalValueMethod);
  const setMidYearConvention = useConfigStore(s => s.setMidYearConvention);

  return (
    <SectionCard title={SECTION_TITLES.simConfig}>
      {/* Run count */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-2">
          <label className="text-12 ui-text-muted ui-font-space">
            {FIELD_LABELS.numRuns}
          </label>
          <TooltipIcon text={TOOLTIPS.numRuns} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {RUN_OPTIONS.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setNumRuns(n)}
              className={`ui-segment-btn ui-segment-btn-mono flex-1 py-1.5 rounded text-12 min-w-12 ${config.numRuns === n ? 'ui-segment-btn-active-solid' : 'ui-segment-btn-inactive'}`}
            >
              {formatRunCount(n)}
            </button>
          ))}
        </div>
      </div>

      {/* Sampling method */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-2">
          <label className="text-12 ui-text-muted ui-font-space">
            {FIELD_LABELS.samplingMethod}
          </label>
          <TooltipIcon text={TOOLTIPS.samplingMethod} />
        </div>
        <div className="flex gap-2">
          {(['standard', 'lhs'] as const).map(method => (
            <button
              key={method}
              type="button"
              onClick={() => setSamplingMethod(method)}
              className={`ui-segment-btn ui-segment-btn-space flex-1 py-1.5 rounded text-12 ${config.samplingMethod === method ? 'ui-segment-btn-active-soft' : 'ui-segment-btn-inactive'}`}
            >
              {SAMPLING_LABELS[method]}
            </button>
          ))}
        </div>
        {config.samplingMethod === 'lhs' && (
          <p className="text-11 mt-1 ui-text-muted ui-font-space">
            More efficient sampling — same confidence with fewer runs.
          </p>
        )}
      </div>

      {/* Terminal value method */}
      <div className="mb-3">
        <label className="text-12 block mb-2 ui-text-muted ui-font-space">
          {FIELD_LABELS.terminalValueMethod}
        </label>
        <div className="flex gap-2">
          {(['ggm', 'exitMultiple'] as const).map(method => (
            <button
              key={method}
              type="button"
              onClick={() => setTerminalValueMethod(method)}
              className={`ui-segment-btn ui-segment-btn-space flex-1 py-1.5 rounded text-12 ${config.terminalValueMethod === method ? 'ui-segment-btn-active-soft' : 'ui-segment-btn-inactive'}`}
            >
              {TV_METHOD_LABELS[method]}
            </button>
          ))}
        </div>
      </div>

      {/* Mid-year convention */}
      <div className="mb-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.midYearConvention ?? true}
            onChange={e => setMidYearConvention(e.target.checked)}
            className="accent-primary ui-checkbox-small"
          />
          <span className="text-12 ui-text-muted ui-font-space">
            Mid-year convention
          </span>
          <TooltipIcon text={TOOLTIPS.midYearConvention} />
        </label>
        {config.midYearConvention && (
          <p className="text-11 mt-1 ml-5 ui-text-faint ui-font-space">
            FCFs discounted at t&#8722;0.5 (standard sell-side practice).
          </p>
        )}
      </div>

      {/* Random seed */}
      <div className="mb-1">
        <div className="flex items-center gap-1 mb-1">
          <label htmlFor="seed-input" className="text-12 ui-text-muted ui-font-space">
            {FIELD_LABELS.seed}
          </label>
          <TooltipIcon text={TOOLTIPS.seed} />
          <span className="text-11 ml-1 ui-text-faint ui-font-space">(optional)</span>
        </div>
        <input
          id="seed-input"
          type="number"
          placeholder="e.g. 42"
          value={config.seed ?? ''}
          min={0}
          step={1}
          onChange={e => {
            const val = e.target.value.trim();
            if (val === '') { setSeed(null); return; }
            const n = parseInt(val, 10);
            if (!isNaN(n) && n >= 0) setSeed(n);
          }}
          className="mc-input ui-font-mono"
        />
      </div>
    </SectionCard>
  );
}
