import { useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import type { Chart as ChartJSType, ChartTypeRegistry } from 'chart.js';
import { useHistogramData } from '../../hooks/useHistogramData';
import { useResultsStore } from '../../store/resultsSlice';
import { useScenarioStore } from '../../store/scenarioSlice';
import { useInputsStore } from '../../store/inputsSlice';
import { EmptyState } from '../shared/EmptyState';
import { useSimulation } from '../../hooks/useSimulation';
import { CHART_COLORS, LABEL_TIERS } from '../../utils/chartConfig';
import { formatPrice, formatRunCount } from '../../utils/formatters';
import { resolveLabels } from '../../utils/chartLabelLayout';
import type { LabelInput } from '../../utils/chartLabelLayout';

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
        { value: scenario.bear,  color: CHART_COLORS.bear,    label: `Bear ${formatPrice(scenario.bear)}`,   dash: [4, 4], priority: 2 },
        { value: scenario.base,  color: CHART_COLORS.base,    label: `Base ${formatPrice(scenario.base)}`,   dash: [4, 4], priority: 2 },
        { value: scenario.bull,  color: CHART_COLORS.bull,    label: `Bull ${formatPrice(scenario.bull)}`,   dash: [4, 4], priority: 2 },
        { value: currentPrice,   color: CHART_COLORS.current, label: `Current ${formatPrice(currentPrice)}`, dash: [2, 4], priority: 1 },
        { value: output.mean,    color: CHART_COLORS.mean,    label: `Mean ${formatPrice(output.mean)}`,     dash: [6, 2], priority: 0 },
        { value: output.median,  color: CHART_COLORS.median,  label: `Median ${formatPrice(output.median)}`, dash: [6, 2], priority: 0 },
      ];

      const chartArea = chart.chartArea;
      const chartWidth = chartArea.right - chartArea.left;

      // Pass 1: compute pixel positions and build label inputs
      const visibleLines: { xPx: number; color: string; label: string; dash: number[]; priority: number }[] = [];
      for (const line of lines) {
        const xRatio = (line.value - minBin) / binRange;
        const xPx = chartArea.left + xRatio * chartWidth;
        if (xPx < chartArea.left - 10 || xPx > chartArea.right + 10) continue;
        visibleLines.push({ ...line, xPx });
      }

      const labelInputs: LabelInput[] = visibleLines.map(l => ({
        label: l.label,
        color: l.color,
        xPx: l.xPx,
        priority: l.priority,
      }));

      const font = '10px DM Mono';
      const placements = resolveLabels(labelInputs, ctx, chartArea, font);

      ctx.save();

      // Pass 2a: draw vertical dashed lines
      for (const line of visibleLines) {
        ctx.beginPath();
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash(line.dash);
        ctx.moveTo(line.xPx, chartArea.top);
        ctx.lineTo(line.xPx, chartArea.bottom);
        ctx.stroke();
      }

      // Pass 2b: draw labels at resolved (non-overlapping) positions
      ctx.setLineDash([]);
      ctx.font = font;
      ctx.textAlign = 'center';

      for (const p of placements) {
        // Leader line when label is bumped below the first tier
        if (p.labelY > chartArea.top + LABEL_TIERS[0] + 2) {
          ctx.beginPath();
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = 0.4;
          ctx.lineWidth = 0.75;
          ctx.moveTo(p.xPx, chartArea.top);
          ctx.lineTo(p.xPx, p.labelY - 10);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        ctx.fillStyle = p.color;
        ctx.fillText(p.label, p.labelX, p.labelY);
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
          <div className="output-chart-title text-13 font-medium">
            Monte Carlo Distribution — Implied Share Price
          </div>
          <div className="output-chart-subtitle output-chart-subtitle-mono text-11">
            {subtitle}
          </div>
        </div>
        {/* Color legend */}
        <div className="output-chart-legend flex items-center gap-3 text-11">
          <div className="flex items-center gap-1">
            <span className="output-legend-swatch output-legend-swatch-bear inline-block w-3 h-3 rounded-sm" />
            <span className="output-legend-label">&lt; Bear</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="output-legend-swatch output-legend-swatch-base inline-block w-3 h-3 rounded-sm" />
            <span className="output-legend-label">In Range</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="output-legend-swatch output-legend-swatch-bull inline-block w-3 h-3 rounded-sm" />
            <span className="output-legend-label">&gt; Bull</span>
          </div>
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
