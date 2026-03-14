import { useRef, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import type { Chart as ChartJSType, ChartTypeRegistry } from 'chart.js';
import { useHistogramData } from '../../hooks/useHistogramData';
import { useResultsStore } from '../../store/resultsSlice';
import { useScenarioStore } from '../../store/scenarioSlice';
import { useInputsStore } from '../../store/inputsSlice';
import { EmptyState } from '../shared/EmptyState';
import { useSimulation } from '../../hooks/useSimulation';
import { CHART_COLORS } from '../../utils/chartConfig';
import { formatPrice, formatRunCount } from '../../utils/formatters';

// ─── HistogramChart ───────────────────────────────────────────────────────────

export function HistogramChart() {
  // Typed as Chart<'bar'> to match react-chartjs-2's specific bar ref type
  const chartRef = useRef<ChartJSType<'bar'> | undefined>(undefined);
  const { chartData, chartOptions, hasData } = useHistogramData();

  const output = useResultsStore(s => s.output);
  const error = useResultsStore(s => s.error);
  const scenario = useScenarioStore(s => s.scenario);
  const currentPrice = useInputsStore(s => s.inputs.currentPrice);
  const { runSimulation } = useSimulation();

  // Re-color bars when scenario changes without re-running simulation
  useEffect(() => {
    if (!chartRef.current || !output) return;
    chartRef.current.update('none'); // 'none' = skip animation for recolor
  }, [scenario.bear, scenario.bull, output]);

  if (!hasData) {
    return <EmptyState onRun={runSimulation} error={error} />;
  }

  // Build inline vertical lines as a custom Chart.js plugin
  const verticalLinesPlugin = {
    id: 'verticalLines',
    afterDatasetsDraw(chart: ChartJSType<keyof ChartTypeRegistry>) {
      const { ctx, scales } = chart;
      if (!scales.x || !output) return;

      const bins = output.histogramBins;
      if (bins.length === 0) return;

      const minBin = bins[0].lowerBound;
      const maxBin = bins[bins.length - 1].upperBound;
      const binRange = maxBin - minBin;

      const lines = [
        { value: scenario.bear,  color: CHART_COLORS.bear,    label: `Bear ${formatPrice(scenario.bear)}`,   dash: [4, 4] },
        { value: scenario.base,  color: CHART_COLORS.base,    label: `Base ${formatPrice(scenario.base)}`,   dash: [4, 4] },
        { value: scenario.bull,  color: CHART_COLORS.bull,    label: `Bull ${formatPrice(scenario.bull)}`,   dash: [4, 4] },
        { value: currentPrice,   color: CHART_COLORS.current, label: `Current ${formatPrice(currentPrice)}`, dash: [2, 4] },
        { value: output.mean,    color: CHART_COLORS.mean,    label: `Mean ${formatPrice(output.mean)}`,     dash: [6, 2] },
        { value: output.median,  color: CHART_COLORS.median,  label: `Median ${formatPrice(output.median)}`, dash: [6, 2] },
      ];

      const chartArea = chart.chartArea;
      const chartWidth = chartArea.right - chartArea.left;

      ctx.save();

      for (const line of lines) {
        // Map price to x pixel position
        const xRatio = (line.value - minBin) / binRange;
        const xPx = chartArea.left + xRatio * chartWidth;

        if (xPx < chartArea.left - 10 || xPx > chartArea.right + 10) continue;

        ctx.beginPath();
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash(line.dash ?? [4, 4]);
        ctx.moveTo(xPx, chartArea.top);
        ctx.lineTo(xPx, chartArea.bottom);
        ctx.stroke();

        // Label at top
        ctx.setLineDash([]);
        ctx.fillStyle = line.color;
        ctx.font = '10px DM Mono';
        ctx.textAlign = 'center';
        const labelX = Math.min(Math.max(xPx, chartArea.left + 24), chartArea.right - 24);
        ctx.fillText(line.label, labelX, chartArea.top + 12);
      }

      ctx.restore();
    },
  };

  // Chart title / subtitle
  const subtitle = output
    ? `${formatRunCount(output.results.length)} simulations · Mean ${formatPrice(output.mean)} · Std Dev ${formatPrice(output.stdDev)}`
    : '';

  return (
    <div className="h-full flex flex-col">
      {/* Chart header */}
      <div className="flex items-center justify-between px-1 mb-2">
        <div>
          <div className="text-13 font-medium" style={{ color: 'var(--color-text)', fontFamily: 'Space Grotesk' }}>
            Monte Carlo Distribution — Implied Share Price
          </div>
          <div className="text-11" style={{ color: 'var(--color-text-muted)', fontFamily: 'DM Mono' }}>
            {subtitle}
          </div>
        </div>
        {/* Color legend */}
        <div className="flex items-center gap-3 text-11" style={{ fontFamily: 'Space Grotesk' }}>
          {[
            { color: CHART_COLORS.histBear, label: '< Bear' },
            { color: CHART_COLORS.histBase, label: 'In Range' },
            { color: CHART_COLORS.histBull, label: '> Bull' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: l.color }} />
              <span style={{ color: 'var(--color-text-muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart canvas */}
      <div className="flex-1 relative min-h-0">
        <Bar
          ref={chartRef as React.RefObject<ChartJSType<'bar'>>}
          data={chartData}
          options={chartOptions}
          plugins={[verticalLinesPlugin]}
        />
      </div>
    </div>
  );
}
