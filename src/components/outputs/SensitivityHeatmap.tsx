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

  function cellTone(price: number): string {
    if (isNaN(price)) return 'heatmap-cell-na';
    const t = (price - minPrice) / priceRange; // 0 = min (red), 1 = max (green)
    if (t < 0.17) return 'heatmap-tone-0';
    if (t < 0.34) return 'heatmap-tone-1';
    if (t < 0.5) return 'heatmap-tone-2';
    if (t < 0.67) return 'heatmap-tone-3';
    if (t < 0.84) return 'heatmap-tone-4';
    return 'heatmap-tone-5';
  }

  function isBaseCell(ri: number, ci: number): boolean {
    return ri === Math.floor(rowValues.length / 2) && ci === Math.floor(colValues.length / 2);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-1 mb-3">
        <div className="heatmap-title text-13 font-medium">
          Sensitivity Analysis — WACC × Terminal Growth Rate
        </div>
        <div className="heatmap-subtitle text-11">
          Implied share price ($) at each WACC / TGR combination. Base case highlighted. Δ% vs. base shown in parentheses.
        </div>
        <div className="ui-banner-blue mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-11">
          Deterministic — point estimates at mean inputs. Not stochastic.
        </div>
      </div>

      <div className="overflow-auto">
        <table className="ui-table-separate-3 heatmap-table">
          <thead>
            <tr>
              {/* Corner header */}
              <th className="heatmap-header-corner text-11 px-3 py-2 text-right">
                WACC ↓ / TGR →
              </th>
              {colValues.map(tgr => (
                <th
                  key={tgr}
                  className="heatmap-col-header text-12 px-3 py-2 text-center"
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
                <td className="heatmap-row-header text-12 px-3 py-2 text-right">
                  WACC {formatPercent(wacc)}
                </td>
                {colValues.map((_, ci) => {
                  const cell = cells[ri][ci];
                  const isBase = isBaseCell(ri, ci);
                  const tone = cellTone(cell.price);
                  const delta = isNaN(cell.deltaVsBase) ? '' : ` (${cell.deltaVsBase >= 0 ? '+' : ''}${(cell.deltaVsBase * 100).toFixed(1)}%)`;

                  return (
                    <td
                      key={ci}
                      className={`heatmap-cell text-12 px-3 py-2 text-center ${tone} ${isBase ? 'heatmap-cell-base' : 'heatmap-cell-regular'}`}
                    >
                      {isNaN(cell.price) ? 'N/A' : formatPrice(cell.price)}
                      {!isBase && delta && (
                        <div className={`text-11 mt-0.5 ${cell.deltaVsBase >= 0 ? 'heatmap-delta-pos' : 'heatmap-delta-neg'}`}>
                          {delta.slice(2, -1)}
                        </div>
                      )}
                      {isBase && (
                        <div className="heatmap-base-note text-11 mt-0.5">base</div>
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
      <div className="heatmap-legend mt-3 flex items-center gap-3 text-11">
        <div className="flex items-center gap-1">
          <span className="heatmap-legend-lower w-4 h-3 inline-block rounded" />
          Lower price
        </div>
        <div className="flex items-center gap-1">
          <span className="heatmap-legend-higher w-4 h-3 inline-block rounded" />
          Higher price
        </div>
        <div className="flex items-center gap-1">
          <span className="heatmap-legend-base w-4 h-3 inline-block rounded" />
          Base case
        </div>
      </div>
    </div>
  );
}
