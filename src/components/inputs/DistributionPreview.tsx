import { useMemo } from 'react';
import type { DistributionType } from '../../types/inputs';

// ─── DistributionPreview ──────────────────────────────────────────────────────
// Mini inline SVG sparkline showing the shape of a distribution.
// Uses path-based rendering (no Chart.js) for tiny embedded preview.

interface DistributionPreviewProps {
  distribution: DistributionType;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  mostLikely?: number | null;
}

const W = 72;
const H = 28;
const POINTS = 40;

export function DistributionPreview({ distribution, mean, stdDev, min, max, mostLikely }: DistributionPreviewProps) {
  const path = useMemo(() => {
    const pts = buildPoints(distribution, mean, stdDev, min, max, mostLikely ?? mean);
    if (pts.length === 0) return '';

    const yMax = Math.max(...pts.map(p => p.y), 0.001);
    const xRange = max - min || 1;

    const svgPts = pts.map(p => {
      const x = ((p.x - min) / xRange) * (W - 4) + 2;
      const y = H - 2 - (p.y / yMax) * (H - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${svgPts[0]} ` + svgPts.slice(1).map(p => `L ${p}`).join(' ')
      + ` L ${W - 2},${H - 2} L 2,${H - 2} Z`;
  }, [distribution, mean, stdDev, min, max, mostLikely]);

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d={path}
        fill="rgba(88,166,255,0.25)"
        stroke="rgba(88,166,255,0.7)"
        strokeWidth="1"
      />
    </svg>
  );
}

// ─── Point Generation ─────────────────────────────────────────────────────────

function buildPoints(
  dist: DistributionType,
  mean: number,
  stdDev: number,
  min: number,
  max: number,
  mostLikely: number
): { x: number; y: number }[] {
  const range = max - min;
  if (range <= 0) return [];

  const xs = Array.from({ length: POINTS }, (_, i) => min + (i / (POINTS - 1)) * range);

  switch (dist) {
    case 'normal': {
      const sd = stdDev > 0 ? stdDev : range * 0.1;
      return xs.map(x => ({
        x,
        y: Math.exp(-0.5 * ((x - mean) / sd) ** 2),
      }));
    }
    case 'lognormal': {
      const sd = stdDev > 0 ? stdDev : range * 0.1;
      return xs.filter(x => x > 0).map(x => ({
        x,
        y: (1 / (x * sd)) * Math.exp(-0.5 * ((Math.log(x) - mean) / sd) ** 2),
      }));
    }
    case 'uniform':
      return xs.map(x => ({ x, y: 1 }));
    case 'triangular': {
      const mode = mostLikely;
      return xs.map(x => {
        if (x < min || x > max) return { x, y: 0 };
        const rangeLocal = max - min;
        if (x <= mode) return { x, y: 2 * (x - min) / (rangeLocal * (mode - min + 0.001)) };
        return { x, y: 2 * (max - x) / (rangeLocal * (max - mode + 0.001)) };
      });
    }
    default:
      return [];
  }
}
