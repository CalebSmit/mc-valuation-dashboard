import { useState, useEffect, useRef } from 'react';
import { useInputsStore } from '../../store/inputsSlice';
import { useScenarioStore } from '../../store/scenarioSlice';
import type { ProjectionMode } from '../../types/inputs';

// ─── GuidedSetupWizard ───────────────────────────────────────────────────────
// Step-by-step modal that walks users through all required inputs,
// then auto-populates the dashboard on completion.

interface GuidedSetupWizardProps {
  open: boolean;
  onClose: () => void;
}

interface WizardData {
  // Step 1
  companyName: string;
  ticker: string;
  currentPrice: number;
  sharesOutstanding: number;
  // Step 2
  totalDebt: number;
  cashAndEquiv: number;
  // Step 3
  projectionMode: ProjectionMode;
  ttmRevenue: number;
  ttmEbitda: number;
  ttmFcf: number;
  projectionYears: 3 | 5 | 7 | 10;
  fcfProjections: number[];
  // Step 4
  wacc: number; // as percentage (e.g. 10)
  terminalValueMethod: 'ggm' | 'exitMultiple';
}

const TOTAL_STEPS = 5;

const STEP_LABELS = [
  'Company Basics',
  'Capital Structure',
  'Projection Approach',
  'Valuation Settings',
  'Review',
];

function defaultWizardData(): WizardData {
  return {
    companyName: '',
    ticker: '',
    currentPrice: 0,
    sharesOutstanding: 0,
    totalDebt: 0,
    cashAndEquiv: 0,
    projectionMode: 'margin',
    ttmRevenue: 0,
    ttmEbitda: 0,
    ttmFcf: 0,
    projectionYears: 5,
    fcfProjections: [0, 0, 0, 0, 0],
    wacc: 10,
    terminalValueMethod: 'ggm',
  };
}

export function GuidedSetupWizard({ open, onClose }: GuidedSetupWizardProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(defaultWizardData);

  const setInput = useInputsStore(s => s.setInput);
  const setProjectionMode = useInputsStore(s => s.setProjectionMode);
  const setFcfProjection = useInputsStore(s => s.setFcfProjection);
  const syncWaccToStressVar = useInputsStore(s => s.syncWaccToStressVar);
  const setStressVar = useInputsStore(s => s.setStressVar);
  const deriveFromPrice = useScenarioStore(s => s.deriveFromPrice);

  // Reset wizard when opened
  useEffect(() => {
    if (open) {
      setStep(1);
      setData(defaultWizardData());
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const update = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData(prev => {
      const next = { ...prev, [key]: value };
      // Resize fcfProjections when projectionYears changes
      if (key === 'projectionYears') {
        const years = value as number;
        next.fcfProjections = Array.from({ length: years }, (_, i) => prev.fcfProjections[i] ?? 0);
      }
      return next;
    });
  };

  const updateFcf = (index: number, value: number) => {
    setData(prev => {
      const arr = [...prev.fcfProjections];
      arr[index] = value;
      return { ...prev, fcfProjections: arr };
    });
  };

  // ── Validation ──────────────────────────────────────────────────────────
  const canAdvance = (): boolean => {
    switch (step) {
      case 1:
        return data.currentPrice > 0 && data.sharesOutstanding > 0;
      case 2:
        return true; // debt/cash can be 0
      case 3:
        if (data.projectionMode === 'margin') {
          return data.ttmRevenue > 0;
        }
        return data.fcfProjections.some(v => v !== 0);
      case 4:
        return data.wacc > 0 && data.wacc < 50;
      default:
        return true;
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    // 1. Set fundamentals
    setInput('companyName', data.companyName);
    setInput('ticker', data.ticker);
    setInput('currentPrice', data.currentPrice);
    setInput('sharesOutstanding', data.sharesOutstanding);
    setInput('totalDebt', data.totalDebt);
    setInput('cashAndEquiv', data.cashAndEquiv);
    setInput('projectionYears', data.projectionYears);
    setInput('terminalValueMethod', data.terminalValueMethod);

    // 2. Set projection mode
    setProjectionMode(data.projectionMode);

    if (data.projectionMode === 'margin') {
      setInput('ttmRevenue', data.ttmRevenue);
      setInput('ttmEbitda', data.ttmEbitda);
      setInput('ttmFcf', data.ttmFcf);

      // 3. Auto-calibrate stress vars from TTM data
      if (data.ttmRevenue > 0 && data.ttmEbitda > 0 && data.ttmFcf > 0) {
        const derivedEbitdaMargin = data.ttmEbitda / data.ttmRevenue;
        const da = data.ttmRevenue * 0.04;
        const nopat = (data.ttmEbitda - da) * (1 - 0.25);
        const derivedCapexPct = Math.max(0, (nopat + da - data.ttmFcf) / data.ttmRevenue);
        setStressVar('ebitdaMargin', 'mean', derivedEbitdaMargin);
        setStressVar('capexPct', 'mean', derivedCapexPct);
      }
    } else {
      // Direct FCFF mode
      for (let i = 0; i < data.fcfProjections.length; i++) {
        setFcfProjection(i, data.fcfProjections[i]);
      }
    }

    // 4. WACC
    syncWaccToStressVar(data.wacc / 100);

    // 5. Derive scenario targets from price
    if (data.currentPrice > 0) {
      deriveFromPrice(data.currentPrice);
    }

    onClose();
  };

  const pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div
      ref={overlayRef}
      className="method-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Guided Setup"
      onClick={handleBackdropClick}
    >
      <div className="wizard-container">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="wizard-header">
          <div className="wizard-header-left">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="ui-icon-fixed">
              <path d="M9 2 L10.5 6.5 L15 7 L11.5 10 L12.5 15 L9 12.5 L5.5 15 L6.5 10 L3 7 L7.5 6.5Z" stroke="#f0b429" strokeWidth="1.3" fill="rgba(240,180,41,0.15)" strokeLinejoin="round" />
            </svg>
            <h2 className="wizard-title">Guided Setup</h2>
            <span className="wizard-step-label">Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="method-close"
            aria-label="Close wizard"
          >
            &times;
          </button>
        </div>

        {/* ── Progress bar ────────────────────────────────────────── */}
        <div className="wizard-progress-track">
          <div className="wizard-progress-fill" style={{ width: `${pct}%` }} />
        </div>

        {/* ── Step Content ────────────────────────────────────────── */}
        <div className="wizard-body">

          {step === 1 && (
            <div className="wizard-step">
              <p className="wizard-step-intro">
                Let's start with the basics. What company are you valuing?
              </p>
              <div className="wizard-field-group">
                <WizardField label="Company Name" hint="Optional — used for labeling exports" optional>
                  <input className="mc-input" type="text" value={data.companyName} placeholder="e.g. Apple Inc." onChange={e => update('companyName', e.target.value)} />
                </WizardField>
                <WizardField label="Ticker Symbol" hint="Optional — used for labeling exports" optional>
                  <input className="mc-input" type="text" value={data.ticker} placeholder="e.g. AAPL" onChange={e => update('ticker', e.target.value.toUpperCase())} />
                </WizardField>
                <WizardField label="Current Stock Price" unit="$" required>
                  <input className="mc-input" type="number" value={data.currentPrice || ''} placeholder="0.00" min={0.01} step={0.5} onChange={e => update('currentPrice', parseFloat(e.target.value) || 0)} />
                </WizardField>
                <WizardField label="Shares Outstanding" unit="millions" hint="Find on Yahoo Finance 'Statistics' or the 10-K cover page" required>
                  <input className="mc-input" type="number" value={data.sharesOutstanding || ''} placeholder="0" min={0.001} step={1} onChange={e => update('sharesOutstanding', parseFloat(e.target.value) || 0)} />
                </WizardField>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step">
              <p className="wizard-step-intro">
                Now enter the company's debt and cash from the balance sheet.
              </p>
              <div className="wizard-field-group">
                <WizardField label="Total Debt" unit="$M" hint="Interest-bearing debt only (short-term + long-term). Not accounts payable.">
                  <input className="mc-input" type="number" value={data.totalDebt || ''} placeholder="0" min={0} step={10} onChange={e => update('totalDebt', parseFloat(e.target.value) || 0)} />
                </WizardField>
                <WizardField label="Cash & Equivalents" unit="$M" hint="Cash, cash equivalents, and short-term investments">
                  <input className="mc-input" type="number" value={data.cashAndEquiv || ''} placeholder="0" min={0} step={10} onChange={e => update('cashAndEquiv', parseFloat(e.target.value) || 0)} />
                </WizardField>
              </div>
              <div className="wizard-hint-box">
                Both values are in millions of dollars. You can enter 0 if the company has no debt or cash.
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step">
              <p className="wizard-step-intro">
                How do you want to project future cash flows?
              </p>
              <div className="wizard-mode-cards">
                <button
                  type="button"
                  className={`wizard-mode-card ${data.projectionMode === 'margin' ? 'wizard-mode-card-active' : ''}`}
                  onClick={() => update('projectionMode', 'margin')}
                >
                  <span className="wizard-mode-card-title">Margin-Based</span>
                  <span className="wizard-mode-card-desc">
                    Build projections from revenue and profit margins. Best if you don't have a detailed financial model.
                  </span>
                </button>
                <button
                  type="button"
                  className={`wizard-mode-card ${data.projectionMode === 'direct' ? 'wizard-mode-card-active' : ''}`}
                  onClick={() => update('projectionMode', 'direct')}
                >
                  <span className="wizard-mode-card-title">Direct FCFF</span>
                  <span className="wizard-mode-card-desc">
                    Enter your own year-by-year free cash flow projections. Best if you've already built a financial model.
                  </span>
                </button>
              </div>

              {data.projectionMode === 'margin' && (
                <div className="wizard-field-group mt-4">
                  <WizardField label="TTM Revenue" unit="$M" hint="Trailing twelve months revenue" required>
                    <input className="mc-input" type="number" value={data.ttmRevenue || ''} placeholder="0" min={0} step={10} onChange={e => update('ttmRevenue', parseFloat(e.target.value) || 0)} />
                  </WizardField>
                  <WizardField label="TTM EBITDA" unit="$M" hint="Revenue minus operating expenses, before depreciation">
                    <input className="mc-input" type="number" value={data.ttmEbitda || ''} placeholder="0" min={0} step={10} onChange={e => update('ttmEbitda', parseFloat(e.target.value) || 0)} />
                  </WizardField>
                  <WizardField label="TTM Free Cash Flow" unit="$M" hint="Used to auto-calibrate CapEx and margin assumptions">
                    <input className="mc-input" type="number" value={data.ttmFcf || ''} placeholder="0" step={10} onChange={e => update('ttmFcf', parseFloat(e.target.value) || 0)} />
                  </WizardField>
                </div>
              )}

              {data.projectionMode === 'direct' && (
                <div className="mt-4">
                  <div className="wizard-field-group mb-3">
                    <WizardField label="Projection Years">
                      <div className="flex gap-1">
                        {([3, 5, 7, 10] as const).map(yr => (
                          <button
                            key={yr}
                            type="button"
                            className={`wizard-yr-btn text-12 px-3 py-1.5 rounded ${data.projectionYears === yr ? 'wizard-yr-btn-active' : 'wizard-yr-btn-inactive'}`}
                            onClick={() => update('projectionYears', yr)}
                          >
                            {yr}yr
                          </button>
                        ))}
                      </div>
                    </WizardField>
                  </div>
                  <div className="wizard-fcf-grid">
                    {data.fcfProjections.map((val, i) => (
                      <div key={i} className="wizard-fcf-cell">
                        <label className="wizard-fcf-label text-11">Yr {i + 1}</label>
                        <input
                          className="mc-input text-12"
                          type="number"
                          value={val || ''}
                          placeholder="$M"
                          step={10}
                          onChange={e => updateFcf(i, parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="wizard-step">
              <p className="wizard-step-intro">
                Set your discount rate and terminal value method.
              </p>
              <div className="wizard-field-group">
                {data.projectionMode === 'margin' && (
                  <WizardField label="Projection Years">
                    <div className="flex gap-1">
                      {([3, 5, 7, 10] as const).map(yr => (
                        <button
                          key={yr}
                          type="button"
                          className={`wizard-yr-btn text-12 px-3 py-1.5 rounded ${data.projectionYears === yr ? 'wizard-yr-btn-active' : 'wizard-yr-btn-inactive'}`}
                          onClick={() => update('projectionYears', yr)}
                        >
                          {yr}yr
                        </button>
                      ))}
                    </div>
                  </WizardField>
                )}
                <WizardField label="WACC (Discount Rate)" unit="%" hint="8-12% is typical for US large-caps. Use a higher rate for riskier companies." required>
                  <input className="mc-input" type="number" value={data.wacc || ''} placeholder="10" min={1} max={50} step={0.5} onChange={e => update('wacc', parseFloat(e.target.value) || 0)} />
                </WizardField>
              </div>

              <p className="wizard-sublabel mt-4 mb-2">Terminal Value Method</p>
              <div className="wizard-mode-cards">
                <button
                  type="button"
                  className={`wizard-mode-card ${data.terminalValueMethod === 'ggm' ? 'wizard-mode-card-active' : ''}`}
                  onClick={() => update('terminalValueMethod', 'ggm')}
                >
                  <span className="wizard-mode-card-title">Gordon Growth Model</span>
                  <span className="wizard-mode-card-desc">
                    Assumes cash flows grow at a steady rate forever. The standard approach for most valuations.
                  </span>
                </button>
                <button
                  type="button"
                  className={`wizard-mode-card ${data.terminalValueMethod === 'exitMultiple' ? 'wizard-mode-card-active' : ''}`}
                  onClick={() => update('terminalValueMethod', 'exitMultiple')}
                >
                  <span className="wizard-mode-card-title">Exit Multiple</span>
                  <span className="wizard-mode-card-desc">
                    Assumes the company is sold at a multiple of EBITDA. Use when comparable company data is more reliable.
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="wizard-step">
              <p className="wizard-step-intro">
                Review your inputs. Click "Populate Dashboard" to fill everything in.
              </p>
              <div className="wizard-review">
                <ReviewGroup label="Company">
                  <ReviewRow label="Name" value={data.companyName || '—'} />
                  <ReviewRow label="Ticker" value={data.ticker || '—'} />
                  <ReviewRow label="Stock Price" value={`$${data.currentPrice.toLocaleString()}`} />
                  <ReviewRow label="Shares Outstanding" value={`${data.sharesOutstanding.toLocaleString()}M`} />
                </ReviewGroup>
                <ReviewGroup label="Capital Structure">
                  <ReviewRow label="Total Debt" value={`$${data.totalDebt.toLocaleString()}M`} />
                  <ReviewRow label="Cash & Equiv." value={`$${data.cashAndEquiv.toLocaleString()}M`} />
                </ReviewGroup>
                <ReviewGroup label="Projections">
                  <ReviewRow label="Mode" value={data.projectionMode === 'margin' ? 'Margin-Based' : 'Direct FCFF'} />
                  {data.projectionMode === 'margin' ? (
                    <>
                      <ReviewRow label="TTM Revenue" value={`$${data.ttmRevenue.toLocaleString()}M`} />
                      <ReviewRow label="TTM EBITDA" value={`$${data.ttmEbitda.toLocaleString()}M`} />
                      <ReviewRow label="TTM FCF" value={`$${data.ttmFcf.toLocaleString()}M`} />
                    </>
                  ) : (
                    <ReviewRow label="FCFF Projections" value={data.fcfProjections.map((v, i) => `Yr${i + 1}: $${v}M`).join(', ')} />
                  )}
                  <ReviewRow label="Projection Years" value={`${data.projectionYears} years`} />
                </ReviewGroup>
                <ReviewGroup label="Valuation">
                  <ReviewRow label="WACC" value={`${data.wacc}%`} />
                  <ReviewRow label="Terminal Value" value={data.terminalValueMethod === 'ggm' ? 'Gordon Growth Model' : 'Exit Multiple'} />
                </ReviewGroup>
              </div>
              <div className="wizard-hint-box mt-3">
                You can fine-tune stress variables, scenario targets, and simulation settings on the dashboard after setup.
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="wizard-footer">
          {step > 1 ? (
            <button type="button" className="wizard-btn wizard-btn-back" onClick={() => setStep(s => s - 1)}>
              Back
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              className={`wizard-btn wizard-btn-next ${!canAdvance() ? 'wizard-btn-disabled' : ''}`}
              disabled={!canAdvance()}
              onClick={() => setStep(s => s + 1)}
            >
              Next
            </button>
          ) : (
            <button type="button" className="wizard-btn wizard-btn-submit" onClick={handleSubmit}>
              Populate Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ─────────────────────────────────────────────────────

function WizardField({ label, unit, hint, required, optional, children }: {
  label: string;
  unit?: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="wizard-field">
      <label className="wizard-field-label text-12">
        {label}
        {unit && <span className="wizard-field-unit">{unit}</span>}
        {required && <span className="wizard-field-required">*</span>}
        {optional && <span className="wizard-field-optional">optional</span>}
      </label>
      {children}
      {hint && <span className="wizard-field-hint text-11">{hint}</span>}
    </div>
  );
}

function ReviewGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="wizard-review-group">
      <div className="wizard-review-group-label text-10 uppercase tracking-wider">{label}</div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="wizard-review-row">
      <span className="wizard-review-key text-12">{label}</span>
      <span className="wizard-review-val text-12">{value}</span>
    </div>
  );
}
