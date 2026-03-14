import { useState } from 'react';
import { useInputsStore } from '../../store/inputsSlice';
import { SectionCard } from '../shared/SectionCard';
import { StressVariableRow } from './StressVariableRow';
import { SECTION_TITLES, STRESS_GROUP_LABELS } from '../../constants/labels';

// ─── StressVariables ──────────────────────────────────────────────────────────

export function StressVariables() {
  const stressVars = useInputsStore(s => s.stressVars);
  const [incomeOpen, setIncomeOpen] = useState(true);
  const [valuationOpen, setValuationOpen] = useState(true);

  const incomeVars = stressVars.filter(v => v.group === 'incomeStatement');
  const valuationVars = stressVars.filter(v => v.group === 'valuation');

  return (
    <SectionCard title={SECTION_TITLES.stressVars}>
      {/* Group A: Income Statement Drivers */}
      <GroupHeader
        label={STRESS_GROUP_LABELS.incomeStatement}
        open={incomeOpen}
        onToggle={() => setIncomeOpen(v => !v)}
        count={incomeVars.length}
      />
      {incomeOpen && (
        <div className="mb-2">
          {incomeVars.map(v => (
            <StressVariableRow key={v.id} variable={v} />
          ))}
        </div>
      )}

      {/* Group B: Valuation & Cost of Capital */}
      <GroupHeader
        label={STRESS_GROUP_LABELS.valuation}
        open={valuationOpen}
        onToggle={() => setValuationOpen(v => !v)}
        count={valuationVars.length}
      />
      {valuationOpen && (
        <div>
          {valuationVars.map(v => (
            <StressVariableRow key={v.id} variable={v} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── GroupHeader ──────────────────────────────────────────────────────────────

interface GroupHeaderProps {
  label: string;
  open: boolean;
  onToggle: () => void;
  count: number;
}

function GroupHeader({ label, open, onToggle, count }: GroupHeaderProps) {
  return (
    <div
      className="flex items-center justify-between py-1.5 px-1 mb-1 cursor-pointer rounded"
      onClick={onToggle}
      role="button"
      aria-expanded={open}
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      style={{
        background: 'transparent',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '8px',
      }}
    >
      <span className="text-11 uppercase font-semibold tracking-wider" style={{ color: 'var(--color-primary)', fontFamily: 'Space Grotesk', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-11 rounded-full px-1.5 py-0.5" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', fontFamily: 'DM Mono' }}>
          {count}
        </span>
        <span className="text-11" style={{ color: 'var(--color-text-faint)' }}>{open ? '▲' : '▼'}</span>
      </div>
    </div>
  );
}
