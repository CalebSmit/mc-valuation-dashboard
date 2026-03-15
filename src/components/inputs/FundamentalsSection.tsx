import { useState } from 'react';
import { useInputsStore } from '../../store/inputsSlice';
import { useScenarioStore } from '../../store/scenarioSlice';
import { SectionCard } from '../shared/SectionCard';
import { InputField } from '../shared/InputField';
import { TooltipIcon } from '../shared/TooltipIcon';
import { SECTION_TITLES, FIELD_LABELS, FIELD_UNITS, TOOLTIPS } from '../../constants/labels';
import { formatLargeNumber } from '../../utils/formatters';
import type { SimulationInputs, ProjectionMode } from '../../types/inputs';

// ─── FundamentalsSection ──────────────────────────────────────────────────────

// Assumptions used when back-solving CapEx from TTM FCF
const ASSUMED_TAX_RATE = 0.25;
const ASSUMED_DA_PCT = 0.04;

export function FundamentalsSection() {
  const inputs = useInputsStore(s => s.inputs);
  const setInput = useInputsStore(s => s.setInput);
  const setStressVar = useInputsStore(s => s.setStressVar);
  const syncWaccToStressVar = useInputsStore(s => s.syncWaccToStressVar);
  const setFcfProjection = useInputsStore(s => s.setFcfProjection);
  const setProjectionMode = useInputsStore(s => s.setProjectionMode);
  const deriveFromPrice = useScenarioStore(s => s.deriveFromPrice);
  const [calibrationBanner, setCalibrationBanner] = useState<string | null>(null);

  const tryCalibrate = (revenue: number, ebitda: number, fcf: number) => {
    if (revenue > 0 && ebitda > 0 && fcf > 0) {
      const derivedEbitdaMargin = ebitda / revenue;
      // Back-solve CapEx: FCF ≈ NOPAT + DA - CapEx (NWC change ~0)
      const da = revenue * ASSUMED_DA_PCT;
      const nopat = (ebitda - da) * (1 - ASSUMED_TAX_RATE);
      const derivedCapexPct = Math.max(0, (nopat + da - fcf) / revenue);

      setStressVar('ebitdaMargin', 'mean', parseFloat(derivedEbitdaMargin.toFixed(4)));
      setStressVar('capexPct', 'mean', parseFloat(derivedCapexPct.toFixed(4)));

      const marginPct = (derivedEbitdaMargin * 100).toFixed(1);
      const capexPct = (derivedCapexPct * 100).toFixed(1);
      setCalibrationBanner(`Stress var defaults updated from TTM data \u2014 EBITDA Margin: ${marginPct}%, CapEx: ${capexPct}%`);
    }
  };

  const num = (key: keyof SimulationInputs) => (value: string) => {
    const n = parseFloat(value);
    if (!isNaN(n)) {
      setInput(key, n as SimulationInputs[typeof key]);
      if (key === 'currentPrice') deriveFromPrice(n);
      if (key === 'ttmRevenue' || key === 'ttmEbitda' || key === 'ttmFcf') {
        const rev    = key === 'ttmRevenue' ? n : inputs.ttmRevenue;
        const ebitda = key === 'ttmEbitda'  ? n : inputs.ttmEbitda;
        const fcf    = key === 'ttmFcf'     ? n : inputs.ttmFcf;
        tryCalibrate(rev, ebitda, fcf);
      }
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
          className="uppercase"
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
        {/* TTM Revenue & TTM FCF — only in margin mode (EBITDA always visible for exit multiple) */}
        {inputs.projectionMode === 'margin' && (
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
        )}
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
        {inputs.projectionMode === 'margin' && (
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
        )}

        {/* Projection Years */}
        <div className="mb-3">
          <label className="text-12 block mb-1 ui-text-muted ui-font-space">
            {FIELD_LABELS.projectionYears}
          </label>
          <div className="flex gap-1">
            {([3, 5, 7, 10] as const).map(yr => (
              <button
                key={yr}
                type="button"
                onClick={() => setInput('projectionYears', yr)}
                className={`ui-segment-btn ui-segment-btn-mono flex-1 py-1 rounded text-12 ${inputs.projectionYears === yr ? 'ui-segment-btn-active-solid' : 'ui-segment-btn-inactive'}`}
              >
                {yr}yr
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── WACC Input ──────────────────────────────────────────────── */}
      <div className="ui-border-top mt-1 pt-2">
        <div className="grid grid-cols-2 gap-x-3">
          <InputField
            id="waccInput"
            label={FIELD_LABELS.waccInput}
            tooltip={TOOLTIPS.waccTopLevel}
            type="number"
            units="%"
            value={parseFloat((inputs.wacc * 100).toFixed(2))}
            onChange={e => {
              const pct = parseFloat(e.target.value);
              if (!isNaN(pct)) syncWaccToStressVar(pct / 100);
            }}
            min={1}
            max={50}
            step={0.5}
          />
        </div>
      </div>

      {/* ── Projection Mode Toggle ──────────────────────────────────── */}
      <div className="ui-border-top mt-1 pt-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-12 ui-text-muted ui-font-space">{FIELD_LABELS.projectionMode}</span>
          <TooltipIcon text={TOOLTIPS.projectionMode} />
        </div>
        <div className="flex gap-1">
          {([
            { key: 'margin' as ProjectionMode, label: 'Margin-Based' },
            { key: 'direct' as ProjectionMode, label: 'Direct FCFF' },
          ]).map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setProjectionMode(opt.key)}
              className={`ui-segment-btn flex-1 py-1.5 rounded text-12 ${inputs.projectionMode === opt.key ? 'ui-segment-btn-active-solid' : 'ui-segment-btn-inactive'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Direct FCFF Projection Grid ─────────────────────────────── */}
      {inputs.projectionMode === 'direct' && (
        <div className="ui-border-top mt-1 pt-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-12 ui-text-muted ui-font-space">{FIELD_LABELS.fcfProjections}</span>
            <TooltipIcon text={TOOLTIPS.fcfProjections} />
          </div>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: inputs.projectionYears }, (_, i) => (
              <div key={i}>
                <label className="text-11 ui-text-faint block mb-0.5 text-center">Yr {i + 1}</label>
                <input
                  type="number"
                  className="mc-input text-12 text-center w-full"
                  aria-label={`Year ${i + 1} FCFF projection ($M)`}
                  value={inputs.fcfProjections[i] ?? 0}
                  step={10}
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) setFcfProjection(i, v);
                  }}
                />
                <span className="text-10 ui-text-faint block text-center">$M</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Implied market cap read-only */}
      <div className="ui-border-top mt-1 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-12 ui-text-muted ui-font-space">
            Implied Market Cap
          </span>
          <span className="text-13 font-medium ui-text-primary ui-font-mono">
            {formatLargeNumber(impliedMarketCap)}
          </span>
        </div>
      </div>

      {/* TTM calibration banner */}
      {calibrationBanner && (
        <div className="ui-banner-amber mt-2 px-2 py-1.5 rounded text-11 flex items-start gap-1.5">
          <span className="ui-icon-fixed">&#9432;</span>
          <span>{calibrationBanner}</span>
          <button
            type="button"
            onClick={() => setCalibrationBanner(null)}
            className="ui-btn-icon-dismiss"
            aria-label="Dismiss"
          >
            &#10005;
          </button>
        </div>
      )}
    </SectionCard>
  );
}
