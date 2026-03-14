import { useResultsStore } from '../../store/resultsSlice';
import { useScenarioStore } from '../../store/scenarioSlice';
import { useInputsStore } from '../../store/inputsSlice';
import { formatPrice, formatProbability, formatRunCount, formatTimestamp } from '../../utils/formatters';
import { STAT_LABELS } from '../../constants/labels';

// ─── StatsPanel ───────────────────────────────────────────────────────────────

export function StatsPanel() {
  const output = useResultsStore(s => s.output);
  const elapsed = useResultsStore(s => s.elapsedMs);
  const scenario = useScenarioStore(s => s.scenario);
  const currentPrice = useInputsStore(s => s.inputs.currentPrice);

  if (!output) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <span className="text-12" style={{ color: 'var(--color-text-faint)', fontFamily: 'Space Grotesk' }}>
          Run simulation to see statistics.
        </span>
      </div>
    );
  }

  const var95Loss = currentPrice - output.var95;
  const cvar95Loss = currentPrice - output.cvar95;

  const rows: { label: string; value: string; accent?: boolean; variant?: 'bear' | 'base' | 'bull' | 'normal' }[] = [
    { label: STAT_LABELS.mean,    value: formatPrice(output.mean),   accent: true },
    { label: STAT_LABELS.median,  value: formatPrice(output.median), accent: true },
    { label: STAT_LABELS.stdDev,  value: formatPrice(output.stdDev) },
    { label: STAT_LABELS.min,     value: formatPrice(output.min) },
    { label: STAT_LABELS.max,     value: formatPrice(output.max) },
    { label: '', value: '', accent: false }, // divider
    { label: STAT_LABELS.p5,   value: formatPrice(output.percentiles[5]) },
    { label: STAT_LABELS.p10,  value: formatPrice(output.percentiles[10]) },
    { label: STAT_LABELS.p25,  value: formatPrice(output.percentiles[25]) },
    { label: STAT_LABELS.p75,  value: formatPrice(output.percentiles[75]) },
    { label: STAT_LABELS.p90,  value: formatPrice(output.percentiles[90]) },
    { label: STAT_LABELS.p95,  value: formatPrice(output.percentiles[95]) },
    { label: '', value: '', accent: false }, // divider
    { label: STAT_LABELS.probAboveBear, value: formatProbability(output.probAboveBear), variant: 'bear' },
    { label: STAT_LABELS.probAboveBase, value: formatProbability(output.probAboveBase), variant: 'base' },
    { label: STAT_LABELS.probAboveBull, value: formatProbability(output.probAboveBull), variant: 'bull' },
    { label: '', value: '', accent: false }, // divider
    { label: STAT_LABELS.var95,  value: `−${formatPrice(Math.max(0, var95Loss))}` },
    { label: STAT_LABELS.cvar95, value: `−${formatPrice(Math.max(0, cvar95Loss))}` },
  ];

  const variantColor = (v?: 'bear' | 'base' | 'bull' | 'normal') => {
    if (v === 'bear') return 'var(--color-bear)';
    if (v === 'base') return 'var(--color-neutral)';
    if (v === 'bull') return 'var(--color-bull)';
    return 'var(--color-primary)';
  };

  const variantDot = (v?: 'bear' | 'base' | 'bull' | 'normal') => {
    if (!v || v === 'normal') return null;
    return (
      <span
        className="inline-block w-1.5 h-1.5 rounded-full mr-1 flex-shrink-0"
        style={{ background: variantColor(v), verticalAlign: 'middle' }}
      />
    );
  };

  return (
    <div className="h-full overflow-y-auto" role="region" aria-label="Simulation statistics">
      {/* Run metadata */}
      <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between">
          <span className="text-11" style={{ color: 'var(--color-text-faint)', fontFamily: 'Space Grotesk' }}>
            {formatRunCount(output.results.length)} valid runs
            {output.discardedCount > 0 && (
              <span style={{ color: 'var(--color-warn)' }}> · {output.discardedCount} discarded</span>
            )}
          </span>
          {elapsed && (
            <span className="text-11" style={{ color: 'var(--color-text-faint)', fontFamily: 'DM Mono' }}>
              {elapsed.toFixed(0)}ms
            </span>
          )}
        </div>
        <div className="text-11 mt-0.5" style={{ color: 'var(--color-text-faint)', fontFamily: 'DM Mono' }}>
          {formatTimestamp(output.completedAt)}
        </div>
      </div>

      {/* Stats table */}
      <table className="w-full text-12" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          {rows.map((row, i) => {
            if (!row.label) {
              return <tr key={i}><td colSpan={2} style={{ borderBottom: '1px solid var(--color-border)', padding: '2px 0' }} /></tr>;
            }
            return (
              <tr
                key={row.label}
                className="stat-value"
                style={{ borderBottom: '1px solid rgba(48,54,61,0.5)' }}
              >
                <td className="px-3 py-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
                  {variantDot(row.variant)}
                  {row.label}
                </td>
                <td
                  className="px-3 py-1.5 text-right"
                  style={{
                    color: row.variant ? variantColor(row.variant) : (row.accent ? 'var(--color-primary)' : 'var(--color-text)'),
                    fontFamily: 'DM Mono',
                    fontWeight: row.accent ? 500 : 400,
                  }}
                >
                  {row.value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Scenario reference */}
      <div className="px-3 py-2 mt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="text-11 mb-1" style={{ color: 'var(--color-text-faint)', fontFamily: 'Space Grotesk' }}>
          Scenario targets
        </div>
        {[
          { label: 'Bear', value: scenario.bear, color: 'var(--color-bear)' },
          { label: 'Base', value: scenario.base, color: 'var(--color-neutral)' },
          { label: 'Bull', value: scenario.bull, color: 'var(--color-bull)' },
        ].map(s => (
          <div key={s.label} className="flex justify-between text-11">
            <span style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>{s.label}</span>
            <span style={{ color: s.color, fontFamily: 'DM Mono' }}>{formatPrice(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
