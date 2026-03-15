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
    <div className="slider-field mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="slider-field-label text-12">
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
            className="slider-field-input text-right text-12 rounded"
            aria-label={`${label} value`}
            title={`${label} value`}
          />
          {units && (
            <span className="slider-field-units text-11">
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
        aria-valuetext={displayValue}
      />
    </div>
  );
}
