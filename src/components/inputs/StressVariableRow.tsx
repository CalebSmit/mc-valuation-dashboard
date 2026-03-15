import { useState } from 'react';
import type { StressVariable, DistributionType, StressVariableId } from '../../types/inputs';
import { useInputsStore } from '../../store/inputsSlice';
import { SliderWithInput } from '../shared/SliderWithInput';
import { DistributionPreview } from './DistributionPreview';
import { DISTRIBUTION_LABELS, TOOLTIPS } from '../../constants/labels';
import { TooltipIcon } from '../shared/TooltipIcon';

// ─── StressVariableRow ────────────────────────────────────────────────────────

interface StressVariableRowProps {
  variable: StressVariable;
}

const IS_PERCENTAGE: Record<StressVariableId, boolean> = {
  revenueGrowth: true, ebitdaMargin: true, capexPct: true, nwcPct: true, daPct: true,
  wacc: true, tgr: true, exitMultiple: false, taxRate: true, year1GrowthPremium: true,
  fcfDeviation: true,
};

const DIST_TYPES: DistributionType[] = ['normal', 'lognormal', 'uniform', 'triangular'];

export function StressVariableRow({ variable }: StressVariableRowProps) {
  const setStressVar = useInputsStore(s => s.setStressVar);
  const [expanded, setExpanded] = useState(false);

  const isPct = IS_PERCENTAGE[variable.id];
  const scale = isPct ? 100 : 1;
  const units = isPct ? '%' : '×';
  const tooltip = TOOLTIPS[variable.id as keyof typeof TOOLTIPS] ?? '';

  const fmt = (v: number) => (v * scale).toFixed(isPct ? 1 : 2);

  const set = <K extends keyof StressVariable>(key: K, val: StressVariable[K]) =>
    setStressVar(variable.id, key, val);

  return (
    <div
      className={`stress-variable-card mb-2 rounded${variable.enabled ? '' : ' stress-variable-card-fixed'}`}
    >
      {/* Row header — always visible */}
      <div className="flex items-center gap-2 px-2 py-1.5">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={variable.enabled}
            onChange={e => set('enabled', e.target.checked)}
            aria-label={`Use ${variable.label} in simulation`}
            className="stress-variable-toggle"
          />
        </label>

        <button
          type="button"
          className="stress-variable-expand flex items-center gap-2 flex-1 min-w-0 p-0 text-left"
          onClick={() => setExpanded(v => !v)}
        >
          <span className="stress-variable-chevron text-11">
            {expanded ? '▲' : '▼'}
          </span>

          <span className="stress-variable-label text-12 flex-1 truncate">
            {variable.label}
          </span>
        </button>

        {tooltip && (
          <div>
            <TooltipIcon text={tooltip} />
          </div>
        )}

        {/* Mini distribution preview */}
        <div className="flex-shrink-0">
          <DistributionPreview
            distribution={variable.distribution}
            mean={variable.mean}
            stdDev={variable.stdDev}
            min={variable.min}
            max={variable.max}
            mostLikely={variable.mostLikely}
          />
        </div>

        {/* Mean value badge */}
        <span
          className={`stress-variable-mean text-12 flex-shrink-0 w-16 text-right ${variable.enabled ? 'stress-variable-mean-active' : 'stress-variable-mean-fixed'}`}
        >
          {fmt(variable.mean)}{units}
        </span>

        <span
          className={`stress-variable-status text-11 flex-shrink-0 w-10 text-right uppercase ${variable.enabled ? 'stress-variable-status-active' : 'stress-variable-status-fixed'}`}
        >
          {variable.enabled ? 'Varies' : 'Held'}
        </span>
      </div>

      {/* Expanded controls */}
      {expanded && (
        <div className="stress-variable-controls px-3 py-2">
          {/* Distribution type selector */}
          <div className="flex items-center gap-1 mb-3">
            <span className="stress-variable-controls-label text-11 flex-shrink-0">
              Distribution
            </span>
            <div className="flex gap-1 flex-wrap">
              {DIST_TYPES.map(dt => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => set('distribution', dt)}
                  className={`stress-variable-dist-button text-11 px-2 py-0.5 rounded ${variable.distribution === dt ? 'stress-variable-dist-button-active' : 'stress-variable-dist-button-inactive'}`}
                >
                  {DISTRIBUTION_LABELS[dt]}
                </button>
              ))}
            </div>
          </div>

          {/* Mean slider */}
          <SliderWithInput
            label="Mean"
            value={variable.mean * scale}
            min={variable.min * scale}
            max={variable.max * scale}
            step={isPct ? 0.1 : 0.1}
            units={units}
            onChange={v => set('mean', v / scale)}
          />

          {/* Std Dev slider */}
          <SliderWithInput
            label="Std Dev"
            value={variable.stdDev * scale}
            min={0}
            max={(variable.max - variable.min) * scale * 0.5}
            step={isPct ? 0.1 : 0.1}
            units={units}
            onChange={v => set('stdDev', v / scale)}
          />

          {/* Min / Max inline */}
          <div className="flex gap-2">
            <div className="flex-1">
              <span className="stress-variable-minmax-label text-11 block mb-1">Min</span>
              <input
                type="number"
                className="mc-input text-12"
                aria-label={`${variable.label} minimum value`}
                value={(variable.min * scale).toFixed(1)}
                step={isPct ? 0.5 : 0.5}
                onChange={e => set('min', parseFloat(e.target.value) / scale)}
              />
            </div>
            <div className="flex-1">
              <span className="stress-variable-minmax-label text-11 block mb-1">Max</span>
              <input
                type="number"
                className="mc-input text-12"
                aria-label={`${variable.label} maximum value`}
                value={(variable.max * scale).toFixed(1)}
                step={isPct ? 0.5 : 0.5}
                onChange={e => set('max', parseFloat(e.target.value) / scale)}
              />
            </div>
          </div>

          {/* Most Likely — only for triangular */}
          {variable.distribution === 'triangular' && (
            <div className="mt-2">
              <SliderWithInput
                label="Most Likely"
                value={(variable.mostLikely ?? variable.mean) * scale}
                min={variable.min * scale}
                max={variable.max * scale}
                step={isPct ? 0.1 : 0.1}
                units={units}
                onChange={v => set('mostLikely', v / scale)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
