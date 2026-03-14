import { describe, it, expect } from 'vitest';
import { runMonteCarlo } from '../../src/engine/mcRunner';
import { DEFAULT_INPUTS, DEFAULT_STRESS_VARS, DEFAULT_SCENARIO, DEFAULT_CONFIG } from '../../src/constants/finance';
import type { SimulationResult } from '../../src/types/outputs';

// ─── useExport tests ───────────────────────────────────────────────────────────
// Tests the export data contract without a browser environment.
// exportPDF and file-download paths are not testable in jsdom — we test the
// data shapes and importConfig validation logic directly.

// ── CSV row shape ──────────────────────────────────────────────────────────────

const EXPECTED_CSV_KEYS = [
  'RunId',
  'RevenueGrowth',
  'EbitdaMargin',
  'CapexPct',
  'NWCPct',
  'DAPct',
  'WACC',
  'TGR',
  'ExitMultiple',
  'TaxRate',
  'Year1GrowthPremium',
  'ImpliedEV',
  'ImpliedPrice',
] as const;

type CsvRow = Record<typeof EXPECTED_CSV_KEYS[number], number>;

function buildCsvRows(records: SimulationResult[]): CsvRow[] {
  return records.map((r, i) => ({
    RunId:              i + 1,
    RevenueGrowth:      r.revenueGrowth,
    EbitdaMargin:       r.ebitdaMargin,
    CapexPct:           r.capexPct,
    NWCPct:             r.nwcPct,
    DAPct:              r.daPct,
    WACC:               r.wacc,
    TGR:                r.terminalGrowthRate,
    ExitMultiple:       r.exitMultiple,
    TaxRate:            r.taxRate,
    Year1GrowthPremium: r.year1GrowthPremium,
    ImpliedEV:          r.impliedEV,
    ImpliedPrice:       r.impliedPrice,
  }));
}

describe('exportCSV row shape', () => {
  const output = runMonteCarlo(
    DEFAULT_INPUTS,
    DEFAULT_STRESS_VARS,
    DEFAULT_SCENARIO,
    { ...DEFAULT_CONFIG, numRuns: 500, seed: 42 },
  );

  const rows = buildCsvRows(output.runRecords);

  it('produces one row per valid run', () => {
    expect(rows.length).toBe(output.runRecords.length);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('row[0] has all 13 expected column keys', () => {
    const row = rows[0];
    for (const key of EXPECTED_CSV_KEYS) {
      expect(key in row, `Missing key: ${key}`).toBe(true);
    }
  });

  it('RunId starts at 1 and increments', () => {
    expect(rows[0].RunId).toBe(1);
    expect(rows[1].RunId).toBe(2);
    expect(rows[rows.length - 1].RunId).toBe(rows.length);
  });

  it('ImpliedPrice matches runRecords.impliedPrice', () => {
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      expect(rows[i].ImpliedPrice).toBe(output.runRecords[i].impliedPrice);
    }
  });

  it('all numeric values are finite (no NaN or Infinity)', () => {
    const numericKeys = EXPECTED_CSV_KEYS.filter(k => k !== 'RunId') as (keyof CsvRow)[];
    for (const row of rows.slice(0, 50)) {
      for (const key of numericKeys) {
        const val = row[key] as number;
        expect(isNaN(val), `NaN in ${key}`).toBe(false);
        expect(isFinite(val), `Infinite in ${key}`).toBe(true);
      }
    }
  });

  it('WACC values are in a plausible range (0.01–0.50)', () => {
    for (const row of rows) {
      expect(row.WACC).toBeGreaterThan(0.01);
      expect(row.WACC).toBeLessThan(0.50);
    }
  });
});

// ── importConfig validation ────────────────────────────────────────────────────

// Inline the validation logic from useExport (pure functions, no browser APIs)
interface ConfigSnapshot {
  version: 1;
  exportedAt: string;
  inputs: typeof DEFAULT_INPUTS;
  stressVars: typeof DEFAULT_STRESS_VARS;
  config: typeof DEFAULT_CONFIG;
  scenario: typeof DEFAULT_SCENARIO;
}

function validateConfigSnapshot(text: string): { ok: boolean; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Invalid JSON file. Could not parse.' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Config file is not a valid object.' };
  }

  const snap = parsed as Partial<ConfigSnapshot>;

  if (snap.version !== 1) {
    return { ok: false, error: `Unsupported config version: ${String(snap.version)}` };
  }

  if (!snap.inputs || !snap.stressVars || !snap.config || !snap.scenario) {
    return { ok: false, error: 'Config file is missing required fields.' };
  }

  const inp = snap.inputs;
  if (
    typeof inp.sharesOutstanding !== 'number' ||
    typeof inp.currentPrice !== 'number' ||
    typeof inp.ttmRevenue !== 'number'
  ) {
    return { ok: false, error: 'Config inputs are missing required numeric fields.' };
  }

  if (!Array.isArray(snap.stressVars) || snap.stressVars.length === 0) {
    return { ok: false, error: 'Config stressVars must be a non-empty array.' };
  }

  return { ok: true };
}

describe('importConfig validation', () => {
  const validSnapshot: ConfigSnapshot = {
    version: 1,
    exportedAt: new Date().toISOString(),
    inputs: DEFAULT_INPUTS,
    stressVars: DEFAULT_STRESS_VARS,
    config: DEFAULT_CONFIG,
    scenario: DEFAULT_SCENARIO,
  };

  it('accepts a valid config snapshot', () => {
    const result = validateConfigSnapshot(JSON.stringify(validSnapshot));
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects invalid JSON', () => {
    const result = validateConfigSnapshot('not { valid json }}}');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Invalid JSON/);
  });

  it('rejects wrong version number', () => {
    const badVersion = { ...validSnapshot, version: 2 };
    const result = validateConfigSnapshot(JSON.stringify(badVersion));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/version/i);
  });

  it('rejects snapshot missing required top-level keys', () => {
    const missingStress = { version: 1, exportedAt: '', inputs: DEFAULT_INPUTS, config: DEFAULT_CONFIG, scenario: DEFAULT_SCENARIO };
    const result = validateConfigSnapshot(JSON.stringify(missingStress));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/missing required/i);
  });

  it('rejects snapshot with non-numeric inputs.sharesOutstanding', () => {
    const badInputs = { ...validSnapshot, inputs: { ...DEFAULT_INPUTS, sharesOutstanding: '100M' } };
    const result = validateConfigSnapshot(JSON.stringify(badInputs));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/numeric/i);
  });

  it('rejects snapshot with empty stressVars array', () => {
    const emptyVars = { ...validSnapshot, stressVars: [] };
    const result = validateConfigSnapshot(JSON.stringify(emptyVars));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/non-empty/i);
  });
});
