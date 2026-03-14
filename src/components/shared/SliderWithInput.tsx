import { useCallback } from 'react';

// ─── SliderWithInput ──────────────────────────────────────────────────────────

interface SliderWithInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Format the displayed value (e.g. x => x.toFixed(1) + '%') */
  format?: (value: number) => string;
  /** Parse string input back to number */
  parse?: (raw: string) => number;
  /** Display units suffix in the text input */
  units?: string;
}

export function SliderWithInput({
  label,
  value,
  min,
  max,
  step = 0.001,
  onChange,
  format,
  parse,
  units,
}: SliderWithInputProps) {
  const displayValue = format ? format(value) : value.toFixed(3);

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value);
    if (!isNaN(raw)) onChange(raw);
  }, [onChange]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parse ? parse(raw) : parseFloat(raw);
    if (!isNaN(parsed)) {
      const clamped = Math.min(Math.max(parsed, min), max);
      onChange(clamped);
    }
  }, [onChange, parse, min, max]);

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-12" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
          {label}
        </span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={parse ? value : value}
            step={step}
            min={min}
            max={max}
            onChange={handleInput}
            className="text-right text-12 rounded"
            style={{
              width: '72px',
              background: 'var(--color-surface-alt)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-primary)',
              fontFamily: 'DM Mono',
              padding: '2px 4px',
              outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
          />
          {units && (
            <span className="text-11" style={{ color: 'var(--color-text-faint)', fontFamily: 'DM Mono', minWidth: '24px' }}>
              {units}
            </span>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSlider}
        className="w-full"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={displayValue}
      />
    </div>
  );
}
