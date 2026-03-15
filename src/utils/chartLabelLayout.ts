// ─── Chart Label Collision Resolution ─────────────────────────────────────────
// Shared utility for preventing overlapping labels on Chart.js custom plugins.
// Used by HistogramChart and CDFChart vertical reference line labels.

import { LABEL_TIERS, LABEL_H_PADDING } from './chartConfig';

export interface LabelInput {
  label: string;
  color: string;
  xPx: number;
  priority: number; // lower = more important, gets preferred tier
}

export interface LabelPlacement {
  label: string;
  color: string;
  xPx: number;   // original x (for the vertical line)
  labelX: number; // resolved x (may be nudged)
  labelY: number; // resolved y (tiered to avoid overlap)
}

/**
 * Resolves label positions so they don't overlap horizontally.
 * Labels are assigned to vertical tiers when collisions are detected.
 *
 * @param inputs  - Labels with pixel positions and draw priority
 * @param ctx     - Canvas context (for measureText)
 * @param chartArea - { left, right, top } from Chart.js
 * @param font    - CSS font string, e.g. '10px DM Mono'
 */
export function resolveLabels(
  inputs: LabelInput[],
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; top: number },
  font: string,
): LabelPlacement[] {
  if (inputs.length === 0) return [];

  ctx.save();
  ctx.font = font;

  // Measure each label and build rects
  const measured = inputs.map(inp => {
    const width = ctx.measureText(inp.label).width;
    return { ...inp, width };
  });

  ctx.restore();

  // Sort by x position (left to right) for greedy placement
  measured.sort((a, b) => a.xPx - b.xPx);

  // Track occupied rectangles per tier: { left, right }
  const occupied: { left: number; right: number }[][] = LABEL_TIERS.map(() => []);

  const placements: LabelPlacement[] = [];

  // Sort by priority first (lower = placed first, gets preferred tier),
  // but process in x-order within same priority
  const byPriority = [...measured].sort((a, b) =>
    a.priority !== b.priority ? a.priority - b.priority : a.xPx - b.xPx
  );

  for (const item of byPriority) {
    const halfW = item.width / 2;
    const clampedX = Math.min(
      Math.max(item.xPx, chartArea.left + halfW),
      chartArea.right - halfW,
    );
    const itemLeft = clampedX - halfW - LABEL_H_PADDING;
    const itemRight = clampedX + halfW + LABEL_H_PADDING;

    // Find the first tier with no horizontal overlap
    let assignedTier = 0;
    for (let t = 0; t < LABEL_TIERS.length; t++) {
      const hasOverlap = occupied[t].some(
        rect => itemLeft < rect.right && itemRight > rect.left,
      );
      if (!hasOverlap) {
        assignedTier = t;
        break;
      }
      // If last tier also overlaps, use it anyway (best effort)
      if (t === LABEL_TIERS.length - 1) {
        assignedTier = t;
      }
    }

    occupied[assignedTier].push({ left: itemLeft, right: itemRight });

    placements.push({
      label: item.label,
      color: item.color,
      xPx: item.xPx,
      labelX: clampedX,
      labelY: chartArea.top + LABEL_TIERS[assignedTier],
    });
  }

  return placements;
}
