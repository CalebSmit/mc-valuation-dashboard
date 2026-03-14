import { useCallback } from 'react';
import { useResultsStore } from '../store/resultsSlice';
import { useInputsStore } from '../store/inputsSlice';
import { useConfigStore } from '../store/configSlice';
import { useScenarioStore } from '../store/scenarioSlice';
import type { SimulationInputs, StressVariable, SimulationConfig, ScenarioTargets } from '../types/inputs';

// ─── useExport ────────────────────────────────────────────────────────────────
// Provides four export actions wired to current store state.
// All are async and return a boolean indicating success.

export interface ExportHook {
  exportPDF: () => Promise<boolean>;
  exportCSV: () => boolean;
  exportConfig: () => boolean;
  importConfig: (file: File) => Promise<{ ok: boolean; error?: string }>;
}

// Config snapshot shape saved/loaded via JSON
interface ConfigSnapshot {
  version: 1;
  exportedAt: string;
  inputs: SimulationInputs;
  stressVars: StressVariable[];
  config: SimulationConfig;
  scenario: ScenarioTargets;
}

export function useExport(): ExportHook {
  const output   = useResultsStore(s => s.output);
  const inputs   = useInputsStore(s => s.inputs);
  const stressVars = useInputsStore(s => s.stressVars);
  const config   = useConfigStore(s => s.config);
  const scenario = useScenarioStore(s => s.scenario);

  const loadInputs   = useInputsStore(s => s.loadInputs);
  const loadStressVars = useInputsStore(s => s.loadStressVars);
  const loadConfig   = useConfigStore(s => s.loadConfig);
  const setScenario  = useScenarioStore(s => s.setScenario);

  // ── exportPDF ─────────────────────────────────────────────────────────────
  const exportPDF = useCallback(async (): Promise<boolean> => {
    if (!output) return false;

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      // Target the output chart area (OutputTabs content)
      const el = document.getElementById('mc-output-area') ?? document.body;
      const canvas = await html2canvas(el, {
        backgroundColor: '#0d1117',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      // A4 landscape
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 12;

      // ── Header ──
      pdf.setFillColor(13, 17, 23);
      pdf.rect(0, 0, pageW, pageH, 'F');

      pdf.setTextColor(240, 180, 41);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Monte Carlo Equity Valuation', margin, 14);

      pdf.setTextColor(139, 148, 158);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const subtitle = [
        inputs.companyName && inputs.ticker
          ? `${inputs.ticker} — ${inputs.companyName}`
          : inputs.companyName || inputs.ticker || 'Unnamed Company',
        `${output.results.length.toLocaleString()} simulations`,
        `Mean: $${output.mean.toFixed(2)}`,
        `Median: $${output.median.toFixed(2)}`,
        `Generated: ${new Date().toLocaleDateString()}`,
      ].filter(Boolean).join('   ·   ');
      pdf.text(subtitle, margin, 20);

      // ── Chart image ──
      const imgY = 26;
      const imgH = pageH - imgY - margin - 32; // leave room for stats at bottom
      const imgW = pageW - margin * 2;
      const aspect = canvas.width / canvas.height;
      const displayH = Math.min(imgH, imgW / aspect);
      const displayW = displayH * aspect;
      const imgX = margin + (imgW - displayW) / 2;

      pdf.addImage(imgData, 'PNG', imgX, imgY, displayW, displayH);

      // ── Stats summary at bottom ──
      const statsY = imgY + displayH + 6;
      const stats = [
        ['Bear', `$${scenario.bear.toFixed(2)}`, `P(>${scenario.bear.toFixed(0)}) ${(output.probAboveBear * 100).toFixed(1)}%`],
        ['Base', `$${scenario.base.toFixed(2)}`, `P(>${scenario.base.toFixed(0)}) ${(output.probAboveBase * 100).toFixed(1)}%`],
        ['Bull', `$${scenario.bull.toFixed(2)}`, `P(>${scenario.bull.toFixed(0)}) ${(output.probAboveBull * 100).toFixed(1)}%`],
        ['P5',   `$${output.percentiles[5].toFixed(2)}`, ''],
        ['P25',  `$${output.percentiles[25].toFixed(2)}`, ''],
        ['P75',  `$${output.percentiles[75].toFixed(2)}`, ''],
        ['P95',  `$${output.percentiles[95].toFixed(2)}`, ''],
        ['VaR95', `$${output.var95.toFixed(2)}`, ''],
        ['CVaR95',`$${output.cvar95.toFixed(2)}`, ''],
      ];

      const colW = (pageW - margin * 2) / stats.length;
      stats.forEach(([label, val, note], i) => {
        const x = margin + i * colW;
        pdf.setTextColor(139, 148, 158);
        pdf.setFontSize(7);
        pdf.text(label, x, statsY + 4);
        pdf.setTextColor(230, 237, 243);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(val, x, statsY + 9);
        pdf.setFont('helvetica', 'normal');
        if (note) {
          pdf.setFontSize(7);
          pdf.setTextColor(139, 148, 158);
          pdf.text(note, x, statsY + 14);
        }
      });

      const filename = `mc-valuation-${inputs.ticker || 'analysis'}-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
      return true;
    } catch (err) {
      console.error('[exportPDF]', err);
      return false;
    }
  }, [output, inputs, scenario]);

  // ── exportCSV ─────────────────────────────────────────────────────────────
  // 13 columns: RunId + 10 stress vars + ImpliedEV + ImpliedPrice
  const exportCSV = useCallback((): boolean => {
    if (!output || output.runRecords.length === 0) return false;

    try {
      const rows = output.runRecords.map((r, i) => ({
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

      // Dynamic import of xlsx (SheetJS)
      import('xlsx').then(({ utils, writeFile }) => {
        const ws = utils.json_to_sheet(rows);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, 'MC Results');

        const filename = `mc-valuation-${inputs.ticker || 'analysis'}-${new Date().toISOString().slice(0, 10)}.xlsx`;
        writeFile(wb, filename);
      });

      return true;
    } catch (err) {
      console.error('[exportCSV]', err);
      return false;
    }
  }, [output, inputs.ticker]);

  // ── exportConfig ──────────────────────────────────────────────────────────
  const exportConfig = useCallback((): boolean => {
    try {
      const snapshot: ConfigSnapshot = {
        version: 1,
        exportedAt: new Date().toISOString(),
        inputs,
        stressVars,
        config,
        scenario,
      };

      const json = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `mc-config-${inputs.ticker || 'analysis'}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      console.error('[exportConfig]', err);
      return false;
    }
  }, [inputs, stressVars, config, scenario]);

  // ── importConfig ──────────────────────────────────────────────────────────
  const importConfig = useCallback(async (file: File): Promise<{ ok: boolean; error?: string }> => {
    try {
      const text = await file.text();

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

      // Validate version
      if (snap.version !== 1) {
        return { ok: false, error: `Unsupported config version: ${String(snap.version)}` };
      }

      // Validate required keys
      if (!snap.inputs || !snap.stressVars || !snap.config || !snap.scenario) {
        return { ok: false, error: 'Config file is missing required fields (inputs/stressVars/config/scenario).' };
      }

      // Validate inputs has required numeric fields
      const inp = snap.inputs;
      if (
        typeof inp.sharesOutstanding !== 'number' ||
        typeof inp.currentPrice !== 'number' ||
        typeof inp.ttmRevenue !== 'number'
      ) {
        return { ok: false, error: 'Config inputs are missing required numeric fields.' };
      }

      // Validate stressVars is a non-empty array
      if (!Array.isArray(snap.stressVars) || snap.stressVars.length === 0) {
        return { ok: false, error: 'Config stressVars must be a non-empty array.' };
      }

      // Apply to stores
      loadInputs(snap.inputs);
      loadStressVars(snap.stressVars as StressVariable[]);
      loadConfig(snap.config as SimulationConfig);
      setScenario(snap.scenario as ScenarioTargets);

      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown import error.';
      return { ok: false, error: msg };
    }
  }, [loadInputs, loadStressVars, loadConfig, setScenario]);

  return { exportPDF, exportCSV, exportConfig, importConfig };
}
