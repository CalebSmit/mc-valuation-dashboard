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

  return (
    <SectionCard title={SECTION_TITLES.simConfig}>
      {/* Run count */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-2">
          <label className="text-12" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
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
              className="flex-1 py-1.5 rounded text-12"
              style={{
                background: config.numRuns === n ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                color: config.numRuns === n ? 'var(--color-bg)' : 'var(--color-text-muted)',
                border: `1px solid ${config.numRuns === n ? 'var(--color-primary)' : 'var(--color-border)'}`,
                fontFamily: 'DM Mono',
                cursor: 'pointer',
                minWidth: '48px',
              }}
            >
              {formatRunCount(n)}
            </button>
          ))}
        </div>
      </div>

      {/* Sampling method */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-2">
          <label className="text-12" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
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
              className="flex-1 py-1.5 rounded text-12"
              style={{
                background: config.samplingMethod === method ? 'rgba(240,180,41,0.15)' : 'var(--color-surface-alt)',
                color: config.samplingMethod === method ? 'var(--color-primary)' : 'var(--color-text-muted)',
                border: `1px solid ${config.samplingMethod === method ? 'var(--color-primary)' : 'var(--color-border)'}`,
                fontFamily: 'Space Grotesk',
                cursor: 'pointer',
              }}
            >
              {SAMPLING_LABELS[method]}
            </button>
          ))}
        </div>
        {config.samplingMethod === 'lhs' && (
          <p className="text-11 mt-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
            More efficient sampling — same confidence with fewer runs.
          </p>
        )}
      </div>

      {/* Terminal value method */}
      <div className="mb-3">
        <label className="text-12 block mb-2" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
          {FIELD_LABELS.terminalValueMethod}
        </label>
        <div className="flex gap-2">
          {(['ggm', 'exitMultiple'] as const).map(method => (
            <button
              key={method}
              type="button"
              onClick={() => setTerminalValueMethod(method)}
              className="flex-1 py-1.5 rounded text-12"
              style={{
                background: config.terminalValueMethod === method ? 'rgba(240,180,41,0.15)' : 'var(--color-surface-alt)',
                color: config.terminalValueMethod === method ? 'var(--color-primary)' : 'var(--color-text-muted)',
                border: `1px solid ${config.terminalValueMethod === method ? 'var(--color-primary)' : 'var(--color-border)'}`,
                fontFamily: 'Space Grotesk',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              {TV_METHOD_LABELS[method]}
            </button>
          ))}
        </div>
      </div>

      {/* Random seed */}
      <div className="mb-1">
        <div className="flex items-center gap-1 mb-1">
          <label htmlFor="seed-input" className="text-12" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
            {FIELD_LABELS.seed}
          </label>
          <TooltipIcon text={TOOLTIPS.seed} />
          <span className="text-11 ml-1" style={{ color: 'var(--color-text-faint)', fontFamily: 'Space Grotesk' }}>(optional)</span>
        </div>
        <input
          id="seed-input"
          type="number"
          className="mc-input"
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
          style={{ fontFamily: 'DM Mono' }}
        />
      </div>
    </SectionCard>
  );
}
