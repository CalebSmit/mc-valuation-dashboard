import { useState, type ReactNode } from 'react';

// ─── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** If true, not collapsible */
  alwaysOpen?: boolean;
}

export function SectionCard({ title, children, defaultOpen = true, alwaysOpen = false }: SectionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = alwaysOpen || isOpen;

  return (
    <div
      className="mc-card mb-3"
      style={{ borderLeft: `2px solid ${open ? 'var(--color-primary)' : 'var(--color-border)'}` }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: open ? '1px solid var(--color-border)' : 'none' }}
      >
        <h2
          className="text-12 font-semibold tracking-wide uppercase"
          style={{ color: open ? 'var(--color-primary)' : 'var(--color-text-muted)', fontFamily: 'Space Grotesk', letterSpacing: '0.08em' }}
        >
          {title}
        </h2>
        {!alwaysOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(v => !v)}
            aria-expanded={open}
            aria-label={open ? 'Collapse section' : 'Expand section'}
            className="text-12 w-5 h-5 flex items-center justify-center rounded"
            style={{ color: 'var(--color-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {open ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* Content */}
      {open && (
        <div className="px-3 py-3">
          {children}
        </div>
      )}
    </div>
  );
}
