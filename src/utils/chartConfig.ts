import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// ─── Register Chart.js Components ────────────────────────────────────────────
// Must be called once before any Chart.js chart renders.

export function registerChartDefaults(): void {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );

  // Apply global dark theme defaults
  ChartJS.defaults.color = '#8b949e';
  ChartJS.defaults.borderColor = '#30363d';
  ChartJS.defaults.font.family = 'DM Mono';
  ChartJS.defaults.font.size = 12;
  ChartJS.defaults.animation = { duration: 400 };
}

// ─── Shared Dark Theme Options ────────────────────────────────────────────────

export const darkChartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#8b949e',
        font: { family: 'DM Mono', size: 11 },
        padding: 16,
        boxWidth: 12,
        boxHeight: 12,
      },
    },
    tooltip: {
      backgroundColor: '#1f2937',
      titleColor: '#f0b429',
      bodyColor: '#e6edf3',
      borderColor: '#30363d',
      borderWidth: 1,
      padding: 10,
      titleFont: { family: 'DM Mono', size: 12, weight: 'bold' as const },
      bodyFont: { family: 'DM Mono', size: 11 },
      cornerRadius: 4,
    },
  },
  scales: {
    x: {
      ticks: {
        color: '#8b949e',
        font: { family: 'DM Mono', size: 11 },
        maxRotation: 0,
      },
      grid: {
        color: '#30363d',
        drawBorder: false,
      },
      border: {
        color: '#30363d',
      },
    },
    y: {
      ticks: {
        color: '#8b949e',
        font: { family: 'DM Mono', size: 11 },
      },
      grid: {
        color: '#30363d',
        drawBorder: false,
      },
      border: {
        color: '#30363d',
      },
    },
  },
} as const;

// ─── Annotation Line Helper ───────────────────────────────────────────────────

export interface AnnotationLine {
  value: number;
  color: string;
  label: string;
  dash?: number[];
}

/**
 * Build Chart.js annotation plugin config for vertical price lines.
 * Requires chartjs-plugin-annotation — if not installed, use custom plugin below.
 */
export function buildVerticalLines(lines: AnnotationLine[]): Record<string, unknown> {
  const annotations: Record<string, unknown> = {};
  lines.forEach((line, i) => {
    annotations[`line${i}`] = {
      type: 'line',
      xMin: line.value,
      xMax: line.value,
      borderColor: line.color,
      borderWidth: 1.5,
      borderDash: line.dash ?? [4, 4],
      label: {
        content: line.label,
        enabled: true,
        position: 'start',
        color: line.color,
        font: { family: 'DM Mono', size: 10 },
        backgroundColor: 'transparent',
        padding: 2,
      },
    };
  });
  return { annotations };
}

// ─── Color Palette Constants ──────────────────────────────────────────────────

export const CHART_COLORS = {
  mean:       '#f0b429',  // amber
  median:     '#58a6ff',  // blue
  current:    '#e6edf3',  // near-white
  bear:       '#f85149',  // red
  bull:       '#3fb950',  // green
  base:       '#8b949e',  // muted gray
  histBase:   'rgba(88, 166, 255, 0.85)',   // blue bars
  histBear:   'rgba(248, 81, 73, 0.85)',    // red bars (below bear)
  histBull:   'rgba(248, 81, 73, 0.65)',    // red lighter (above bull)
  tornado:    '#f0b429',  // amber (positive correlation)
  tornadoNeg: '#58a6ff',  // blue (negative correlation)
  fanP50:     '#f0b429',  // median path
  fanFill:    'rgba(88, 166, 255, 0.1)',    // fan shading
} as const;

// ─── Label Layout Constants ──────────────────────────────────────────────────
// Used by chartLabelLayout.ts for vertical-tier collision avoidance.

/** Y-offsets from chartArea.top for each label tier */
export const LABEL_TIERS = [12, 26, 40];

/** Minimum horizontal gap (px) between adjacent labels */
export const LABEL_H_PADDING = 6;
