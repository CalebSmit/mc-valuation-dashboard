import { useMemo } from 'react';
import type { ChartData, ChartOptions } from 'chart.js';
import { useResultsStore } from '../store/resultsSlice';
import { useScenarioStore } from '../store/scenarioSlice';
import { useInputsStore } from '../store/inputsSlice';
import { buildBinColorArray, buildBinHoverColorArray } from '../engine/colorBands';
import { darkChartDefaults, CHART_COLORS } from '../utils/chartConfig';
import { formatPrice, formatPercent, formatRunCount } from '../utils/formatters';

// ─── useHistogramData Hook ────────────────────────────────────────────────────

interface HistogramChartData {
  chartData: ChartData<'bar'>;
  chartOptions: ChartOptions<'bar'>;
  hasData: boolean;
}

/**
 * Derives Chart.js-ready dataset from SimulationOutput + current scenario targets.
 * Recomputes bar colors instantly when thresholds change — no re-simulation needed.
 */
export function useHistogramData(): HistogramChartData {
  const output = useResultsStore(s => s.output);
  const scenario = useScenarioStore(s => s.scenario);
  const currentPrice = useInputsStore(s => s.inputs.currentPrice);

  const chartData = useMemo<ChartData<'bar'>>(() => {
    if (!output || output.histogramBins.length === 0) {
      return { labels: [], datasets: [] };
    }

    const bins = output.histogramBins;
    const labels = bins.map(b => `$${b.midpoint.toFixed(0)}`);
    const data = bins.map(b => b.count);
    const backgroundColor = buildBinColorArray(bins, scenario.bear, scenario.bull);
    const hoverBackgroundColor = buildBinHoverColorArray(bins, scenario.bear, scenario.bull);

    return {
      labels,
      datasets: [
        {
          label: 'Simulated Prices',
          data,
          backgroundColor,
          hoverBackgroundColor,
          borderWidth: 0,
          borderRadius: 1,
        },
      ],
    };
  }, [output, scenario.bear, scenario.bull]);

  const chartOptions = useMemo<ChartOptions<'bar'>>(() => {
    if (!output) return { ...darkChartDefaults };

    const totalRuns = output.results.length;

    return {
      ...darkChartDefaults,
      plugins: {
        ...darkChartDefaults.plugins,
        legend: { display: false },
        tooltip: {
          ...darkChartDefaults.plugins.tooltip,
          callbacks: {
            title: (items) => {
              const idx = items[0].dataIndex;
              if (!output) return '';
              const bin = output.histogramBins[idx];
              return `$${bin.lowerBound.toFixed(2)} – $${bin.upperBound.toFixed(2)}`;
            },
            label: (item) => {
              const count = item.raw as number;
              const pct = formatPercent(count / totalRuns);
              return ` ${formatRunCount(count)} runs (${pct})`;
            },
          },
        },
      },
      scales: {
        x: {
          ...darkChartDefaults.scales.x,
          title: {
            display: true,
            text: 'Implied Share Price ($)',
            color: '#8b949e',
            font: { family: 'DM Mono', size: 11 },
          },
          ticks: {
            ...darkChartDefaults.scales.x.ticks,
            maxTicksLimit: 10,
            callback: (_value, index) => {
              // Show label only every Nth bin to avoid crowding
              const bins = output.histogramBins;
              if (index % Math.ceil(bins.length / 10) === 0) {
                return `$${bins[index]?.midpoint.toFixed(0) ?? ''}`;
              }
              return '';
            },
          },
        },
        y: {
          ...darkChartDefaults.scales.y,
          title: {
            display: true,
            text: 'Frequency (# Runs)',
            color: '#8b949e',
            font: { family: 'DM Mono', size: 11 },
          },
        },
      },
    };
  }, [output]);

  // Vertical annotation lines data (bear, base, bull, current, mean, median)
  const annotationLines = useMemo(() => {
    if (!output) return [];
    return [
      { value: scenario.bear,     color: CHART_COLORS.bear,    label: `Bear $${scenario.bear.toFixed(0)}`,     dash: [4, 4] },
      { value: scenario.base,     color: CHART_COLORS.base,    label: `Base $${scenario.base.toFixed(0)}`,     dash: [4, 4] },
      { value: scenario.bull,     color: CHART_COLORS.bull,    label: `Bull $${scenario.bull.toFixed(0)}`,     dash: [4, 4] },
      { value: currentPrice,      color: CHART_COLORS.current, label: `Current ${formatPrice(currentPrice)}`,  dash: [2, 4] },
      { value: output.mean,       color: CHART_COLORS.mean,    label: `Mean ${formatPrice(output.mean)}`,      dash: [6, 2] },
      { value: output.median,     color: CHART_COLORS.median,  label: `Median ${formatPrice(output.median)}`,  dash: [6, 2] },
    ];
  }, [output, scenario, currentPrice]);

  return {
    chartData,
    chartOptions,
    hasData: output !== null && output.histogramBins.length > 0,
    // Expose annotation lines for the component to draw via custom plugin
    ...({ annotationLines } as object),
  } as HistogramChartData & { annotationLines: typeof annotationLines };
}
