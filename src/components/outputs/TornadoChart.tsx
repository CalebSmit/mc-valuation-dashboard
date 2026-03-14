import { Bar } from 'react-chartjs-2';
import { useResultsStore } from '../../store/resultsSlice';
import { EmptyState } from '../shared/EmptyState';
import { useSimulation } from '../../hooks/useSimulation';
import { darkChartDefaults, CHART_COLORS } from '../../utils/chartConfig';
import { formatCorrelation } from '../../utils/formatters';

// ─── TornadoChart ─────────────────────────────────────────────────────────────

export function TornadoChart() {
  const output = useResultsStore(s => s.output);
  const { runSimulation } = useSimulation();

  if (!output || output.tornadoData.length === 0) {
    return <EmptyState onRun={runSimulation} />;
  }

  // Sort by |correlation| descending (already sorted in engine, but defensive)
  const sorted = [...output.tornadoData].sort((a, b) => b.absCorrelation - a.absCorrelation);

  const labels = sorted.map(e => e.label);
  const correlations = sorted.map(e => e.correlation);
  const colors = correlations.map(c =>
    c >= 0 ? CHART_COLORS.tornado : CHART_COLORS.tornadoNeg
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Pearson Rank Correlation with Implied Price',
        data: correlations,
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 2,
      },
    ],
  };

  const chartOptions = {
    ...darkChartDefaults,
    indexAxis: 'y' as const, // horizontal bar
    plugins: {
      ...darkChartDefaults.plugins,
      legend: { display: false },
      tooltip: {
        ...darkChartDefaults.plugins.tooltip,
        callbacks: {
          label: (item: { raw: unknown }) => {
            const corr = item.raw as number;
            return ` Correlation: ${formatCorrelation(corr)} (${corr >= 0 ? 'positive' : 'negative'})`;
          },
        },
      },
    },
    scales: {
      x: {
        ...darkChartDefaults.scales.x,
        min: -1,
        max: 1,
        title: {
          display: true,
          text: 'Pearson Rank Correlation',
          color: '#8b949e',
          font: { family: 'DM Mono', size: 11 },
        },
        ticks: {
          ...darkChartDefaults.scales.x.ticks,
          callback: (v: number | string) => formatCorrelation(Number(v)),
        },
      },
      y: {
        ...darkChartDefaults.scales.y,
        ticks: {
          ...darkChartDefaults.scales.y.ticks,
          font: { family: 'Space Grotesk', size: 11 },
        },
      },
    },
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-1 mb-2">
        <div className="text-13 font-medium" style={{ color: 'var(--color-text)', fontFamily: 'Space Grotesk' }}>
          Tornado Chart — Input Sensitivity
        </div>
        <div className="text-11" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
          Ranked by |Pearson rank correlation| with implied price.
          <span style={{ color: CHART_COLORS.tornado }}> Amber = positive</span>,
          <span style={{ color: CHART_COLORS.tornadoNeg }}> Blue = negative</span>.
        </div>
      </div>
      <div className="flex-1 relative min-h-0">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
