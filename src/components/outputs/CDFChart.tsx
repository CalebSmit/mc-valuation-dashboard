import { Line } from 'react-chartjs-2';
import { useResultsStore } from '../../store/resultsSlice';
import { useScenarioStore } from '../../store/scenarioSlice';
import { EmptyState } from '../shared/EmptyState';
import { useSimulation } from '../../hooks/useSimulation';
import { darkChartDefaults, CHART_COLORS, LABEL_TIERS } from '../../utils/chartConfig';
import { formatPrice, formatPercent } from '../../utils/formatters';
import { resolveLabels } from '../../utils/chartLabelLayout';
import type { LabelInput } from '../../utils/chartLabelLayout';

// ─── CDFChart ─────────────────────────────────────────────────────────────────

const CDF_POINTS = 100;

export function CDFChart() {
  const output = useResultsStore(s => s.output);
  const scenario = useScenarioStore(s => s.scenario);
  const { runSimulation } = useSimulation();

  if (!output || output.results.length === 0) {
    return <EmptyState onRun={runSimulation} />;
  }

  const sorted = output.results; // already sorted
  const n = sorted.length;
  const minP = sorted[0];
  const maxP = sorted[n - 1];
  const range = maxP - minP || 1;

  // Build CDF points
  const step = range / (CDF_POINTS - 1);
  const cdfData = Array.from({ length: CDF_POINTS }, (_, i) => {
    const x = minP + i * step;
    // Binary search for fraction of values ≤ x
    let lo = 0, hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (sorted[mid] <= x) lo = mid + 1; else hi = mid;
    }
    return { x, y: lo / n };
  });

  // Reference line y-values at Bear / Base / Bull
  const getY = (price: number) => {
    let lo = 0, hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (sorted[mid] <= price) lo = mid + 1; else hi = mid;
    }
    return lo / n;
  };

  const chartData = {
    labels: cdfData.map(p => `$${p.x.toFixed(0)}`),
    datasets: [
      {
        label: 'CDF',
        data: cdfData.map(p => p.y * 100),
        borderColor: CHART_COLORS.median,
        backgroundColor: 'rgba(88,166,255,0.08)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  // Reference line positions as annotation-style markers
  const refLines = [
    { price: scenario.bear, color: CHART_COLORS.bear,    label: 'Bear' },
    { price: scenario.base, color: CHART_COLORS.base,    label: 'Base' },
    { price: scenario.bull, color: CHART_COLORS.bull,    label: 'Bull' },
  ].map(r => ({ ...r, pct: getY(r.price) }));

  const verticalLinesPlugin = {
    id: 'cdfRefLines',
    afterDatasetsDraw(chart: { ctx: CanvasRenderingContext2D; chartArea: { left: number; right: number; top: number; bottom: number }; scales: { x?: { min: number; max: number }; y?: { min: number; max: number } } }) {
      const { ctx, chartArea, scales } = chart;
      if (!scales.x || !scales.y) return;

      const xMin = scales.x.min;
      const xMax = scales.x.max;
      const yMin = scales.y.min;
      const yMax = scales.y.max;
      const w = chartArea.right - chartArea.left;
      const h = chartArea.bottom - chartArea.top;

      // Build visible lines with pixel positions
      const visible = refLines
        .map(ref => {
          const xRatio = (ref.price - xMin) / (xMax - xMin);
          const xPx = chartArea.left + xRatio * w;
          const yRatio = (ref.pct * 100 - yMin) / (yMax - yMin);
          const yPx = chartArea.bottom - yRatio * h;
          return { ...ref, xPx, yPx };
        })
        .filter(ref => ref.xPx >= chartArea.left && ref.xPx <= chartArea.right);

      // Resolve label positions to avoid overlap
      const font = '10px DM Mono';
      const labelInputs: LabelInput[] = visible.map(ref => ({
        label: `${ref.label} ${formatPrice(ref.price)}`,
        color: ref.color,
        xPx: ref.xPx,
        priority: 2,
      }));
      const placements = resolveLabels(labelInputs, ctx, chartArea, font);

      ctx.save();

      // Draw lines
      for (const ref of visible) {
        // Vertical line
        ctx.beginPath();
        ctx.strokeStyle = ref.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(ref.xPx, chartArea.top);
        ctx.lineTo(ref.xPx, chartArea.bottom);
        ctx.stroke();

        // Horizontal line to y-axis
        ctx.beginPath();
        ctx.setLineDash([2, 4]);
        ctx.moveTo(chartArea.left, ref.yPx);
        ctx.lineTo(ref.xPx, ref.yPx);
        ctx.stroke();

        // Y-axis percentile label
        ctx.setLineDash([]);
        ctx.fillStyle = ref.color;
        ctx.font = font;
        ctx.textAlign = 'right';
        ctx.fillText(formatPercent(ref.pct), chartArea.left - 2, ref.yPx + 4);
      }

      // Draw top labels at resolved positions
      ctx.setLineDash([]);
      ctx.font = font;
      ctx.textAlign = 'center';
      for (const p of placements) {
        // Leader line when bumped below first tier
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

  const chartOptions = {
    ...darkChartDefaults,
    plugins: {
      ...darkChartDefaults.plugins,
      legend: { display: false },
      tooltip: {
        ...darkChartDefaults.plugins.tooltip,
        callbacks: {
          title: (items: Array<{ dataIndex: number }>) => {
            const idx = items[0].dataIndex;
            return formatPrice(cdfData[idx].x);
          },
          label: (item: { raw: unknown }) => ` ${Number(item.raw).toFixed(1)}th percentile`,
        },
      },
    },
    scales: {
      x: {
        ...darkChartDefaults.scales.x,
        title: { display: true, text: 'Implied Share Price ($)', color: '#8b949e', font: { family: 'DM Mono', size: 11 } },
        ticks: { ...darkChartDefaults.scales.x.ticks, maxTicksLimit: 8, callback: (_v: unknown, i: number) => i % 10 === 0 ? `$${cdfData[i]?.x.toFixed(0) ?? ''}` : '' },
        min: minP,
        max: maxP,
      },
      y: {
        ...darkChartDefaults.scales.y,
        min: 0, max: 100,
        title: { display: true, text: 'Cumulative Probability (%)', color: '#8b949e', font: { family: 'DM Mono', size: 11 } },
        ticks: { ...darkChartDefaults.scales.y.ticks, callback: (v: number | string) => `${v}%` },
      },
    },
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-1 mb-2">
        <div className="output-chart-title text-13 font-medium">
          Cumulative Distribution Function
        </div>
        <div className="output-chart-subtitle text-11">
          Read off any percentile directly. Hover for price → cumulative probability.
        </div>
      </div>
      <div className="flex-1 relative min-h-0">
        <Line data={chartData} options={chartOptions} plugins={[verticalLinesPlugin]} />
      </div>
    </div>
  );
}
