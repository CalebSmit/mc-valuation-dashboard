import { useResultsStore } from '../../store/resultsSlice';
import { useScenarioStore } from '../../store/scenarioSlice';
import { useInputsStore } from '../../store/inputsSlice';
import { formatPrice, formatProbability, formatRunCount, formatTimestamp, formatMultiple } from '../../utils/formatters';
import { STAT_LABELS } from '../../constants/labels';
import { TooltipIcon } from '../shared/TooltipIcon';

// ─── StatsPanel ───────────────────────────────────────────────────────────────

export function StatsPanel() {
  const output = useResultsStore(s => s.output);
  const elapsed = useResultsStore(s => s.elapsedMs);
  const scenario = useScenarioStore(s => s.scenario);
  const currentPrice = useInputsStore(s => s.inputs.currentPrice);

  if (!output) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <span className="stats-empty text-12">
          Run simulation to see statistics.
        </span>
      </div>
    );
  }

  const var95Loss = currentPrice - output.var95;
  const cvar95Loss = currentPrice - output.cvar95;

  // High discard rate (>2%) means the WACC/TGR distribution has significant overlap
  const totalRuns = output.results.length + output.discardedCount;
  const discardRate = totalRuns > 0 ? output.discardedCount / totalRuns : 0;
  const highDiscardRate = discardRate > 0.02;

  const evEbitda = output.impliedEvEbitda;

  // Fat tail warning: P95/P5 > 5× is concerning
  const fatTail = !isNaN(output.tailRatio) && output.tailRatio > 5;

  const rows: { label: string; value: string; accent?: boolean; hero?: boolean; variant?: 'bear' | 'base' | 'bull' | 'normal'; tooltip?: string; header?: string }[] = [
    { label: '', value: '', header: 'KEY RESULTS' },
    { label: STAT_LABELS.mean,    value: formatPrice(output.mean),   accent: true, hero: true },
    { label: STAT_LABELS.median,  value: formatPrice(output.median), accent: true, hero: true },
    { label: STAT_LABELS.stdDev,  value: formatPrice(output.stdDev) },
    { label: STAT_LABELS.min,     value: formatPrice(output.min) },
    { label: STAT_LABELS.max,     value: formatPrice(output.max) },
    { label: '', value: '', header: 'PERCENTILES' },
    { label: STAT_LABELS.p5,   value: formatPrice(output.percentiles[5]) },
    { label: STAT_LABELS.p10,  value: formatPrice(output.percentiles[10]) },
    { label: STAT_LABELS.p25,  value: formatPrice(output.percentiles[25]) },
    { label: STAT_LABELS.p75,  value: formatPrice(output.percentiles[75]) },
    { label: STAT_LABELS.p90,  value: formatPrice(output.percentiles[90]) },
    { label: STAT_LABELS.p95,  value: formatPrice(output.percentiles[95]) },
    { label: '', value: '', header: 'SCENARIO PROBABILITIES' },
    { label: STAT_LABELS.probAboveBear, value: formatProbability(output.probAboveBear), variant: 'bear' },
    { label: STAT_LABELS.probAboveBase, value: formatProbability(output.probAboveBase), variant: 'base' },
    { label: STAT_LABELS.probAboveBull, value: formatProbability(output.probAboveBull), variant: 'bull' },
    { label: '', value: '', header: 'RISK METRICS' },
    {
      label: STAT_LABELS.var95,
      value: `−${formatPrice(Math.max(0, var95Loss))}`,
      tooltip: 'Maximum loss in the best 95% of outcomes (current price − 5th percentile). Expressed as a dollar loss from the current price.',
    },
    {
      label: STAT_LABELS.cvar95,
      value: `−${formatPrice(Math.max(0, cvar95Loss))}`,
      tooltip: 'Expected Shortfall: mean loss in the worst 5% of outcomes (current price − mean of bottom 5%). More conservative than VaR.',
    },
  ];

  const variantColor = (v?: 'bear' | 'base' | 'bull' | 'normal') => {
    if (v === 'bear') return 'stats-value-bear';
    if (v === 'base') return 'stats-value-base';
    if (v === 'bull') return 'stats-value-bull';
    return 'stats-value-accent';
  };

  const variantDot = (v?: 'bear' | 'base' | 'bull' | 'normal') => {
    if (!v || v === 'normal') return null;
    return (
      <span
        className={`stats-variant-dot inline-block w-1.5 h-1.5 rounded-full mr-1 flex-shrink-0 ${v === 'bear' ? 'stats-variant-dot-bear' : v === 'base' ? 'stats-variant-dot-base' : 'stats-variant-dot-bull'}`}
      />
    );
  };

  return (
    <div className="h-full overflow-y-auto" role="region" aria-label="Simulation statistics">
      {/* Run metadata */}
      <div className="ui-border-bottom px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-11 ui-text-faint ui-font-space">
            {formatRunCount(output.results.length)} valid runs
            {output.discardedCount > 0 && (
              <span className={highDiscardRate ? 'stats-discard-danger' : 'stats-discard-warn'}>
                {' '}· {output.discardedCount} discarded
              </span>
            )}
          </span>
          {elapsed && (
            <span className="text-11 ui-text-faint ui-font-mono">
              {elapsed.toFixed(0)}ms
            </span>
          )}
        </div>
        <div className="text-11 mt-0.5 ui-text-faint ui-font-mono">
          {formatTimestamp(output.completedAt)}
        </div>
        {/* High discard rate warning */}
        {highDiscardRate && (
          <div className="ui-banner-red mt-1.5 px-2 py-1 rounded text-11">
            {(discardRate * 100).toFixed(0)}% of runs discarded — the discount rate (WACC) was too close to the growth rate (TGR). Try increasing WACC or decreasing TGR.
          </div>
        )}
      </div>

      {/* Stats table */}
      <table className="ui-table-collapse w-full text-12">
        <tbody>
          {rows.map((row, i) => {
            if (row.header) {
              return (
                <tr key={`hdr-${i}`}>
                  <td colSpan={2} className="stats-group-header px-3 pt-3 pb-1 text-10 uppercase tracking-wider">
                    {row.header}
                  </td>
                </tr>
              );
            }
            if (!row.label) {
              return <tr key={i}><td colSpan={2} className="stats-divider-row" /></tr>;
            }
            return (
              <tr
                key={row.label}
                className="stat-value ui-border-bottom-soft"
              >
                <td className="px-3 py-1.5 ui-text-muted ui-font-space">
                  <span className="flex items-center gap-1">
                    {variantDot(row.variant)}
                    {row.label}
                    {row.tooltip && <TooltipIcon text={row.tooltip} />}
                  </span>
                </td>
                <td
                  className={`px-3 py-1.5 text-right ui-font-mono ${row.hero ? 'text-13' : ''} ${row.variant ? variantColor(row.variant) : (row.accent ? 'stats-value-accent' : 'stats-value-normal')}`}
                >
                  {row.value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Implied EV/EBITDA sanity check */}
      {!isNaN(evEbitda) && (
        <div className="ui-border-top px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-12 ui-text-muted ui-font-space">
              {STAT_LABELS.impliedEvEbitda}
              <TooltipIcon text="Implied EV/EBITDA = (mean price × shares + debt − cash) / TTM EBITDA. Green = 6–20× (typical), amber = 3–6× or 20–30× (stretched), red = outside this range (extreme)." />
            </span>
            <span className={`text-12 ui-font-mono ${isNaN(evEbitda) ? 'stats-ev-muted' : evEbitda < 3 || evEbitda > 30 ? 'stats-ev-bear' : evEbitda < 6 || evEbitda > 20 ? 'stats-ev-warn' : 'stats-ev-bull'}`}>
              {formatMultiple(evEbitda)}
            </span>
          </div>
        </div>
      )}

      {/* Fat-tail warning */}
      {fatTail && (
        <div className="ui-banner-amber mx-3 mb-2 px-2 py-1.5 rounded text-11">
          Results have a very wide spread (P95/P5 = {formatMultiple(output.tailRatio)}) — the upside and downside scenarios are far apart. Consider narrowing the ranges on your stress variables.
        </div>
      )}

      {/* Scenario reference */}
      <div className="ui-border-top px-3 py-2 mt-1">
        <div className="text-11 mb-1 ui-text-faint ui-font-space">
          Scenario targets
        </div>
        {[
          { label: 'Bear', value: scenario.bear, colorClass: 'ui-text-bear' },
          { label: 'Base', value: scenario.base, colorClass: 'ui-text-neutral' },
          { label: 'Bull', value: scenario.bull, colorClass: 'ui-text-bull' },
        ].map(s => (
          <div key={s.label} className="flex justify-between text-11">
            <span className="ui-text-muted ui-font-space">{s.label}</span>
            <span className={`${s.colorClass} ui-font-mono`}>{formatPrice(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
