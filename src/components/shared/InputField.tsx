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
        <label className="input-field-label text-12 font-medium">
          {label}
        </label>
        {tooltip && <TooltipIcon text={tooltip} />}
      </div>

      <div className="relative">
        {readOnly ? (
          <div className="input-field-readonly mc-input flex items-center">
            {readOnlyValue ?? '—'}
          </div>
        ) : (
          <input
            {...inputProps}
            className={`mc-input ${units ? 'input-field-has-units' : ''} ${error ? 'error' : ''} ${className}`}
            aria-describedby={error ? `${String(inputProps.id)}-error` : undefined}
          />
        )}

        {units && (
          <span className="input-field-units absolute right-2 top-1/2 -translate-y-1/2 text-11 pointer-events-none">
            {units}
          </span>
        )}
      </div>

      {error && (
        <p
          id={`${String(inputProps.id)}-error`}
          className="input-field-error text-11 mt-1"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
