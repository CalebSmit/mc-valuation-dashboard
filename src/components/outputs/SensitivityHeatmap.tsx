import { useSensitivityData } from '../../hooks/useSensitivityData';
import { formatPrice, formatPercent } from '../../utils/formatters';

// ─── SensitivityHeatmap ───────────────────────────────────────────────────────
// 5×5 HTML table (not Chart.js) with red→green color gradient.
// Rows = WACC values, Columns = TGR values.

export function SensitivityHeatmap() {
  const { cells, rowValues, colValues } = useSensitivityData();

  if (cells.length === 0) return null;

  // Find min/max prices for gradient scaling
  const allPrices = cells.flat().map(c => c.price).filter(p => !isNaN(p));
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;

  function cellBackground(price: number): string {
    if (isNaN(price)) return 'var(--color-surface-alt)';
    const t = (price - minPrice) / priceRange; // 0 = min (red), 1 = max (green)
    // Interpolate red → amber → green
    if (t < 0.5) {
      const f = t * 2;
      return `rgba(248, ${Math.round(81 + (180 - 81) * f)}, ${Math.round(73 + (41 - 73) * f)}, 0.35)`;
    }
    const f = (t - 0.5) * 2;
    return `rgba(${Math.round(240 - (240 - 63) * f)}, ${Math.round(180 + (185 - 180) * f)}, ${Math.round(41 + (80 - 41) * f)}, 0.35)`;
  }

  function isBaseCell(ri: number, ci: number): boolean {
    return ri === Math.floor(rowValues.length / 2) && ci === Math.floor(colValues.length / 2);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-1 mb-3">
        <div className="text-13 font-medium" style={{ color: 'var(--color-text)', fontFamily: 'Space Grotesk' }}>
          Sensitivity Analysis — WACC × Terminal Growth Rate
        </div>
        <div className="text-11" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
          Implied share price ($) at each WACC / TGR combination. Base case highlighted. Δ% vs. base shown in parentheses.
        </div>
      </div>

      <div className="overflow-auto">
        <table style={{ borderCollapse: 'separate', borderSpacing: '3px', fontFamily: 'DM Mono' }}>
          <thead>
            <tr>
              {/* Corner header */}
              <th
                className="text-11 px-3 py-2 text-right"
                style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk', background: 'transparent', border: 'none' }}
              >
                WACC ↓ / TGR →
              </th>
              {colValues.map(tgr => (
                <th
                  key={tgr}
                  className="text-12 px-3 py-2 text-center"
                  style={{
                    color: 'var(--color-text-muted)',
                    fontFamily: 'DM Mono',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '2px',
                    minWidth: '100px',
                  }}
                >
                  TGR {formatPercent(tgr)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowValues.map((wacc, ri) => (
              <tr key={wacc}>
                {/* Row header */}
                <td
                  className="text-12 px-3 py-2 text-right"
                  style={{
                    color: 'var(--color-text-muted)',
                    fontFamily: 'DM Mono',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  WACC {formatPercent(wacc)}
                </td>
                {colValues.map((_, ci) => {
                  const cell = cells[ri][ci];
                  const isBase = isBaseCell(ri, ci);
                  const bg = cellBackground(cell.price);
                  const delta = isNaN(cell.deltaVsBase) ? '' : ` (${cell.deltaVsBase >= 0 ? '+' : ''}${(cell.deltaVsBase * 100).toFixed(1)}%)`;

                  return (
                    <td
                      key={ci}
                      className="text-12 px-3 py-2 text-center"
                      style={{
                        background: bg,
                        border: isBase
                          ? '2px solid var(--color-primary)'
                          : '1px solid rgba(48,54,61,0.5)',
                        borderRadius: '2px',
                        color: isNaN(cell.price) ? 'var(--color-error)' : 'var(--color-text)',
                        fontWeight: isBase ? 600 : 400,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isNaN(cell.price) ? 'N/A' : formatPrice(cell.price)}
                      {!isBase && delta && (
                        <div
                          className="text-11 mt-0.5"
                          style={{
                            color: cell.deltaVsBase >= 0 ? 'var(--color-bull)' : 'var(--color-bear)',
                            fontFamily: 'DM Mono',
                          }}
                        >
                          {delta.slice(2, -1)}
                        </div>
                      )}
                      {isBase && (
                        <div className="text-11 mt-0.5" style={{ color: 'var(--color-primary)' }}>base</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-3 text-11" style={{ fontFamily: 'Space Grotesk', color: 'var(--color-text-muted)' }}>
        <div className="flex items-center gap-1">
          <span className="w-4 h-3 inline-block rounded" style={{ background: 'rgba(248,81,73,0.35)' }} />
          Lower price
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-3 inline-block rounded" style={{ background: 'rgba(63,185,80,0.35)' }} />
          Higher price
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-3 inline-block rounded" style={{ border: '2px solid var(--color-primary)' }} />
          Base case
        </div>
      </div>
    </div>
  );
}
