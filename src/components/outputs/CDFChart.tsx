import { Line } from 'react-chartjs-2';
import { useResultsStore } from '../../store/resultsSlice';
import { useScenarioStore } from '../../store/scenarioSlice';
import { EmptyState } from '../shared/EmptyState';
import { useSimulation } from '../../hooks/useSimulation';
import { darkChartDefaults, CHART_COLORS } from '../../utils/chartConfig';
import { formatPrice, formatPercent } from '../../utils/formatters';

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

      ctx.save();
      for (const ref of refLines) {
        const xRatio = (ref.price - xMin) / (xMax - xMin);
        const xPx = chartArea.left + xRatio * w;
        if (xPx < chartArea.left || xPx > chartArea.right) continue;

        const yRatio = (ref.pct * 100 - yMin) / (yMax - yMin);
        const yPx = chartArea.bottom - yRatio * h;

        // Vertical line
        ctx.beginPath();
        ctx.strokeStyle = ref.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(xPx, chartArea.top);
        ctx.lineTo(xPx, chartArea.bottom);
        ctx.stroke();

        // Horizontal line to y-axis
        ctx.beginPath();
        ctx.setLineDash([2, 4]);
        ctx.moveTo(chartArea.left, yPx);
        ctx.lineTo(xPx, yPx);
        ctx.stroke();

        // Labels
        ctx.setLineDash([]);
        ctx.fillStyle = ref.color;
        ctx.font = '10px DM Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`${ref.label} ${formatPrice(ref.price)}`, xPx, chartArea.top + 12);
        ctx.textAlign = 'right';
        ctx.fillText(formatPercent(ref.pct), chartArea.left - 2, yPx + 4);
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
        <div className="text-13 font-medium" style={{ color: 'var(--color-text)', fontFamily: 'Space Grotesk' }}>
          Cumulative Distribution Function
        </div>
        <div className="text-11" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
          Read off any percentile directly. Hover for price → cumulative probability.
        </div>
      </div>
      <div className="flex-1 relative min-h-0">
        <Line data={chartData} options={chartOptions} plugins={[verticalLinesPlugin]} />
      </div>
    </div>
  );
}
