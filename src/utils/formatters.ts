// ─── Number Formatters ────────────────────────────────────────────────────────
// All monetary values: 2 decimal places.
// Percentages: 1 decimal place.
// Prices: 2 decimal places.
// Large numbers: compact notation (e.g., $1.2B, $450M).

/**
 * Format a price per share (e.g., $42.15).
 */
export function formatPrice(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a currency value in $M (e.g., $1,234.56M).
 */
export function formatCurrency(value: number, suffix = 'M'): string {
  if (!isFinite(value) || isNaN(value)) return '—';
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted}${suffix}`;
}

/**
 * Format a percentage (e.g., 8.0%).
 * Input is a decimal fraction (e.g., 0.08 → "8.0%").
 */
export function formatPercent(value: number, decimals = 1): string {
  if (!isFinite(value) || isNaN(value)) return '—';
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a percentage from a raw percentage value (e.g., 8 → "8.0%").
 * Use when the value is already in percent form (not a decimal fraction).
 */
export function formatPercentRaw(value: number, decimals = 1): string {
  if (!isFinite(value) || isNaN(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a large number with B/M/K suffix (e.g., 1234.5 → "$1.2B").
 */
export function formatLargeNumber(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1000) {
    return `${sign}$${(abs / 1000).toFixed(1)}B`;
  } else if (abs >= 1) {
    return `${sign}$${abs.toFixed(0)}M`;
  } else {
    return `${sign}$${(abs * 1000).toFixed(0)}K`;
  }
}

/**
 * Format a probability (0–1) as a percentage with 1 decimal (e.g., 0.756 → "75.6%").
 */
export function formatProbability(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format a multiple (e.g., 12.5 → "12.5×").
 */
export function formatMultiple(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '—';
  return `${value.toFixed(1)}×`;
}

/**
 * Format a correlation coefficient for the tornado chart (e.g., 0.847 → "0.85").
 */
export function formatCorrelation(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '—';
  return value.toFixed(2);
}

/**
 * Format a delta percentage (e.g., 0.123 → "+12.3%", -0.05 → "-5.0%").
 */
export function formatDelta(value: number, decimals = 1): string {
  if (!isFinite(value) || isNaN(value)) return '—';
  const pct = (value * 100).toFixed(decimals);
  return value >= 0 ? `+${pct}%` : `${pct}%`;
}

/**
 * Format a number of simulation runs with comma separators (e.g., 10000 → "10,000").
 */
export function formatRunCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format a Date.now() timestamp as a short date string (e.g., "Jan 15, 2025 14:32").
 */
export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
