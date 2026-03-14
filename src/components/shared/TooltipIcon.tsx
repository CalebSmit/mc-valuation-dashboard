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
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-10"
        style={{
          background: 'var(--color-surface-alt)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          fontSize: '10px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ?
      </button>

      {visible && (
        <div
          role="tooltip"
          className="absolute z-50 text-11 rounded p-2"
          style={{
            background: 'var(--color-surface-alt)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            fontFamily: 'Space Grotesk',
            lineHeight: 1.5,
            maxWidth: '260px',
            width: 'max-content',
            left: '20px',
            top: '-4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
