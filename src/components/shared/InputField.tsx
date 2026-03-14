import type { InputHTMLAttributes } from 'react';
import { TooltipIcon } from './TooltipIcon';

// ─── InputField ───────────────────────────────────────────────────────────────

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  tooltip?: string;
  error?: string;
  units?: string;
  readOnly?: boolean;
  readOnlyValue?: string;
}

export function InputField({
  label,
  tooltip,
  error,
  units,
  readOnly,
  readOnlyValue,
  className = '',
  ...inputProps
}: InputFieldProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1 mb-1">
        <label className="text-12 font-medium" style={{ color: 'var(--color-text-muted)', fontFamily: 'Space Grotesk' }}>
          {label}
        </label>
        {tooltip && <TooltipIcon text={tooltip} />}
      </div>

      <div className="relative">
        {readOnly ? (
          <div
            className="mc-input flex items-center"
            style={{ color: 'var(--color-text-faint)', cursor: 'default' }}
          >
            {readOnlyValue ?? '—'}
          </div>
        ) : (
          <input
            {...inputProps}
            className={`mc-input ${error ? 'error' : ''} ${className}`}
            style={{ paddingRight: units ? '40px' : undefined }}
            aria-invalid={!!error}
            aria-describedby={error ? `${String(inputProps.id)}-error` : undefined}
          />
        )}

        {units && (
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-11 pointer-events-none"
            style={{ color: 'var(--color-text-faint)', fontFamily: 'DM Mono' }}
          >
            {units}
          </span>
        )}
      </div>

      {error && (
        <p
          id={`${String(inputProps.id)}-error`}
          className="text-11 mt-1"
          style={{ color: 'var(--color-error)' }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
