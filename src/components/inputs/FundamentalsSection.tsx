import { useInputsStore } from '../../store/inputsSlice';
import { useScenarioStore } from '../../store/scenarioSlice';
import { SectionCard } from '../shared/SectionCard';
import { InputField } from '../shared/InputField';
import { SECTION_TITLES, FIELD_LABELS, FIELD_UNITS, TOOLTIPS } from '../../constants/labels';
import { formatLargeNumber } from '../../utils/formatters';
import type { SimulationInputs } from '../../types/inputs';

// ─── FundamentalsSection ──────────────────────────────────────────────────────

export function FundamentalsSection() {
  const inputs = useInputsStore(s => s.inputs);
  const setInput = useInputsStore(s => s.setInput);
  const deriveFromPrice = useScenarioStore(s => s.deriveFromPrice);

  const num = (key: keyof SimulationInputs) => (value: string) => {
    const n = parseFloat(value);
    if (!isNaN(n)) {
      setInput(key, n as SimulationInputs[typeof key]);
      if (key === 'currentPrice') deriveFromPrice(n);
    }
  };

  const str = (key: keyof SimulationInputs) => (value: string) => {
    setInput(key, value as SimulationInputs[typeof key]);
  };

  const impliedMarketCap = inputs.currentPrice * inputs.sharesOutstanding;

  return (
    <SectionCard title={SECTION_TITLES.fundamentals}>
      {/* Text fields */}
      <div className="grid grid-cols-2 gap-x-3">
        <InputField
          id="companyName"
          label={FIELD_LABELS.companyName}
          tooltip={TOOLTIPS.companyName}
          value={inputs.companyName}
          onChange={e => str('companyName')(e.target.value)}
          placeholder="Acme Corp"
        />
        <InputField
          id="ticker"
          label={FIELD_LABELS.ticker}
          tooltip={TOOLTIPS.ticker}
          value={inputs.ticker}
          onChange={e => str('ticker')(e.target.value.toUpperCase())}
          placeholder="ACME"
          style={{ textTransform: 'uppercase' }}
        />
      </div>

      {/* Numeric fields */}
      <div className="grid grid-cols-2 gap-x-3">
        <InputField
          id="currentPrice"
          label={FIELD_LABELS.currentPrice}
          tooltip={TOOLTIPS.currentPrice}
          type="number"
          units={FIELD_UNITS.currentPrice}
          value={inputs.currentPrice}
          onChange={e => num('currentPrice')(e.target.value)}
          min={0.01}
          step={0.01}
        />
        <InputField
          id="sharesOutstanding"
          label={FIELD_LABELS.sharesOutstanding}
          tooltip={TOOLTIPS.sharesOutstanding}
          type="number"
          units={FIELD_UNITS.sharesOutstanding}
          value={inputs.sharesOutstanding}
          onChange={e => num('sharesOutstanding')(e.target.value)}
          min={0.001}
          step={1}
        />
        <InputField
          id="totalDebt"
          label={FIELD_LABELS.totalDebt}
          tooltip={TOOLTIPS.totalDebt}
          type="number"
          units={FIELD_UNITS.totalDebt}
          value={inputs.totalDebt}
          onChange={e => num('totalDebt')(e.target.value)}
          step={10}
        />
        <InputField
          id="cashAndEquiv"
          label={FIELD_LABELS.cashAndEquiv}
          tooltip={TOOLTIPS.cashAndEquiv}
          type="number"
          units={FIELD_UNITS.cashAndEquiv}
          value={inputs.cashAndEquiv}
          onChange={e => num('cashAndEquiv')(e.target.value)}
          step={10}
        />
        <InputField
          id="ttmRevenue"
          label={FIELD_LABELS.ttmRevenue}
          tooltip={TOOLTIPS.ttmRevenue}
          type="number"
          units={FIELD_UNITS.ttmRevenue}
          value={inputs.ttmRevenue}
          onChange={e => num('ttmRevenue')(e.target.value)}
          step={10}
        />
        <InputField
          id="ttmEbitda"
          label={FIELD_LABELS.ttmEbitda}
          tooltip={TOOLTIPS.ttmEbitda}
          type="number"
          units={FIELD_UNITS.ttmEbitda}
          value={inputs.ttmEbitda}
          onChange={e => num('ttmEbitda')(e.target.value)}
          step={10}
        />
        <InputField
          id="ttmFcf"
          label={FIELD_LABELS.ttmFcf}
          tooltip={TOOLTIPS.ttmFcf}
          type="number"
          units={FIELD_UNITS.ttmFcf}
          value={inputs.ttmFcf}
          onChange={e => num('ttmFcf')(e.target.value)}
          step={10}
        />

        {/* Projection Years */}
        <div className="mb-3">
          <label className="text-12 block mb-1" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
            {FIELD_LABELS.projectionYears}
          </label>
          <div className="flex gap-1">
            {([3, 5, 7, 10] as const).map(yr => (
              <button
                key={yr}
                type="button"
                onClick={() => setInput('projectionYears', yr)}
                className="flex-1 py-1 rounded text-12"
                style={{
                  background: inputs.projectionYears === yr ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                  color: inputs.projectionYears === yr ? 'var(--color-bg)' : 'var(--color-text-muted)',
                  border: `1px solid ${inputs.projectionYears === yr ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  fontFamily: 'DM Mono',
                  cursor: 'pointer',
                }}
              >
                {yr}yr
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Implied market cap read-only */}
      <div className="mt-1 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between">
          <span className="text-12" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
            Implied Market Cap
          </span>
          <span className="text-13 font-medium" style={{ color: 'var(--color-primary)', fontFamily: 'DM Mono' }}>
            {formatLargeNumber(impliedMarketCap)}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
