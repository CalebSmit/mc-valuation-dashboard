import { useState, useRef, useEffect } from 'react';

// ─── TooltipIcon ──────────────────────────────────────────────────────────────

interface TooltipIconProps {
  text: string;
}

export function TooltipIcon({ text }: TooltipIconProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisible(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible]);

  // Close on outside click
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible]);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label="Show help"
        className="tooltip-button inline-flex items-center justify-center w-4 h-4 rounded-full text-10"
      >
        ?
      </button>

      {visible && (
        <div
          role="tooltip"
          className="tooltip-bubble absolute z-50 text-11 rounded p-2"
        >
          {text}
        </div>
      )}
    </div>
  );
}
