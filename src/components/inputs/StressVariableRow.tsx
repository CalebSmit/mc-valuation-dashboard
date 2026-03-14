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
    <div className="mb-2 rounded" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
      {/* Row header — always visible */}
      <div
        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(v => !v); } }}
      >
        <span className="text-11" style={{ color: 'var(--color-text-faint)', width: '10px', flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>

        <span className="text-12 flex-1 truncate" style={{ color: 'var(--color-text)', fontFamily: 'Space Grotesk' }}>
          {variable.label}
        </span>

        {tooltip && (
          <div onClick={e => e.stopPropagation()}>
            <TooltipIcon text={tooltip} />
          </div>
        )}

        {/* Mini distribution preview */}
        <div onClick={e => e.stopPropagation()} className="flex-shrink-0">
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
          className="text-12 flex-shrink-0 w-16 text-right"
          style={{ color: 'var(--color-primary)', fontFamily: 'DM Mono' }}
        >
          {fmt(variable.mean)}{units}
        </span>
      </div>

      {/* Expanded controls */}
      {expanded && (
        <div className="px-3 py-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          {/* Distribution type selector */}
          <div className="flex items-center gap-1 mb-3">
            <span className="text-11 flex-shrink-0" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk', width: '72px' }}>
              Distribution
            </span>
            <div className="flex gap-1 flex-wrap">
              {DIST_TYPES.map(dt => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => set('distribution', dt)}
                  className="text-11 px-2 py-0.5 rounded"
                  style={{
                    background: variable.distribution === dt ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: variable.distribution === dt ? 'var(--color-bg)' : 'var(--color-text-muted)',
                    border: `1px solid ${variable.distribution === dt ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    fontFamily: 'Space Grotesk',
                    cursor: 'pointer',
                  }}
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
              <span className="text-11 block mb-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>Min</span>
              <input
                type="number"
                className="mc-input text-12"
                value={(variable.min * scale).toFixed(1)}
                step={isPct ? 0.5 : 0.5}
                onChange={e => set('min', parseFloat(e.target.value) / scale)}
              />
            </div>
            <div className="flex-1">
              <span className="text-11 block mb-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>Max</span>
              <input
                type="number"
                className="mc-input text-12"
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
