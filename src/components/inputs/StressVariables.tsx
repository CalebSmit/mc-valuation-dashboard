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
  const activeIncomeCount = incomeVars.filter(v => v.enabled).length;
  const activeValuationCount = valuationVars.filter(v => v.enabled).length;

  return (
    <SectionCard title={SECTION_TITLES.stressVars}>
      {/* Group A: Income Statement Drivers */}
      <GroupHeader
        label={STRESS_GROUP_LABELS.incomeStatement}
        open={incomeOpen}
        onToggle={() => setIncomeOpen(v => !v)}
        count={incomeVars.length}
        activeCount={activeIncomeCount}
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
        activeCount={activeValuationCount}
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
  activeCount: number;
}

function GroupHeader({ label, open, onToggle, count, activeCount }: GroupHeaderProps) {
  return (
    <button
      type="button"
      className="stress-group-header flex items-center justify-between py-1.5 px-1 mb-1 cursor-pointer rounded"
      onClick={onToggle}
    >
      <span className="stress-group-label text-11 uppercase font-semibold tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="stress-group-count text-11 rounded-full px-1.5 py-0.5">
          {activeCount}/{count}
        </span>
        <span className="stress-group-chevron text-11">{open ? '▲' : '▼'}</span>
      </div>
    </button>
  );
}
