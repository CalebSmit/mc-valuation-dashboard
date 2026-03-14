import { Line } from 'react-chartjs-2';
import { useMemo } from 'react';
import { useResultsStore } from '../../store/resultsSlice';
import { useInputsStore } from '../../store/inputsSlice';
import { EmptyState } from '../shared/EmptyState';
import { useSimulation } from '../../hooks/useSimulation';
import { darkChartDefaults, CHART_COLORS } from '../../utils/chartConfig';
import { computePercentile } from '../../engine/statistics';
import { formatPrice } from '../../utils/formatters';

// ─── FanChart ─────────────────────────────────────────────────────────────────
// Shows 5th/25th/50th/75th/95th percentile price paths across projection years.

const PERCENTILES = [5, 25, 50, 75, 95] as const;
const PERCENTILE_LABELS = ['P5', 'P25', 'P50 (Median)', 'P75', 'P95'];
const PERCENTILE_COLORS = [
  CHART_COLORS.bear,
  'rgba(248,81,73,0.6)',
  CHART_COLORS.fanP50,
  'rgba(63,185,80,0.6)',
  CHART_COLORS.bull,
];
const PERCENTILE_WIDTHS = [1, 1.5, 2, 1.5, 1];
const FILL_COLORS = [
  undefined,
  'rgba(88,166,255,0.06)',
  'rgba(88,166,255,0.08)',
  'rgba(88,166,255,0.06)',
  undefined,
];

export function FanChart() {
  const output = useResultsStore(s => s.output);
  const inputs = useInputsStore(s => s.inputs);
  const { runSimulation } = useSimulation();

  const chartData = useMemo(() => {
    if (!output || output.results.length === 0) return null;

    const N = inputs.projectionYears;
    const years = Array.from({ length: N + 1 }, (_, i) => i); // [0, 1, 2, ..., N]
    const labels = years.map(y => (y === 0 ? 'Now' : `Year ${y}`));

    // For each percentile, project the path:
    // Year 0 = current price
    // Year t = year 0 price * (1 + percentile_annual_return)^t
    // We approximate by scaling the final-year percentile price back to annual returns

    const currentP = inputs.currentPrice;
    const pctValues = PERCENTILES.map(p => computePercentile(output.results, p / 100));

    const datasets = PERCENTILES.map((pct, idx) => {
      const finalPrice = pctValues[idx];
      // Compute implied CAGR from current to final
      const cagr = isNaN(finalPrice) || finalPrice <= 0 || currentP <= 0
        ? 0
        : Math.pow(finalPrice / currentP, 1 / N) - 1;

      const data = years.map(y => {
        if (y === 0) return currentP;
        return currentP * Math.pow(1 + cagr, y);
      });

      return {
        label: PERCENTILE_LABELS[idx],
        data,
        borderColor: PERCENTILE_COLORS[idx],
        backgroundColor: FILL_COLORS[idx],
        borderWidth: PERCENTILE_WIDTHS[idx],
        borderDash: pct === 50 ? [] : [4, 3],
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: idx > 0 && idx < PERCENTILES.length - 1 ? '-1' : false,
        tension: 0.3,
      };
    });

    return { labels, datasets };
  }, [output, inputs.projectionYears, inputs.currentPrice]);

  if (!chartData) {
    return <EmptyState onRun={runSimulation} />;
  }

  const chartOptions = {
    ...darkChartDefaults,
    plugins: {
      ...darkChartDefaults.plugins,
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          ...darkChartDefaults.plugins.legend.labels,
          usePointStyle: true,
          pointStyleWidth: 16,
        },
      },
      tooltip: {
        ...darkChartDefaults.plugins.tooltip,
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (item: { dataset: { label?: string }; raw: unknown }) =>
            ` ${item.dataset.label}: ${formatPrice(item.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        ...darkChartDefaults.scales.x,
        title: {
          display: true,
          text: 'Projection Year',
          color: '#8b949e',
          font: { family: 'DM Mono', size: 11 },
        },
      },
      y: {
        ...darkChartDefaults.scales.y,
        title: {
          display: true,
          text: 'Implied Share Price ($)',
          color: '#8b949e',
          font: { family: 'DM Mono', size: 11 },
        },
        ticks: {
          ...darkChartDefaults.scales.y.ticks,
          callback: (v: number | string) => `$${Number(v).toFixed(0)}`,
        },
      },
    },
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-1 mb-2">
        <div className="text-13 font-medium" style={{ color: 'var(--color-text)', fontFamily: 'Space Grotesk' }}>
          Price Path Fan Chart — Percentile Bands
        </div>
        <div className="text-11" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
          5th / 25th / 50th / 75th / 95th percentile price paths across {inputs.projectionYears}-year forecast horizon.
        </div>
      </div>
      <div className="flex-1 relative min-h-0">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
