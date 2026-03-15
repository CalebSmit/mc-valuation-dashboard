import { useState, type ReactNode } from 'react';

// ─── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** If true, not collapsible */
  alwaysOpen?: boolean;
}

export function SectionCard({ title, subtitle, children, defaultOpen = true, alwaysOpen = false }: SectionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = alwaysOpen || isOpen;

  return (
    <div
      className={`mc-card section-card mb-3 ${open ? 'section-card-open' : 'section-card-closed'}`}
    >
      {/* Header */}
      <div
        className={`section-card-header flex items-center justify-between px-3 py-2 ${open ? 'section-card-header-open' : ''}`}
      >
        <h2
          className={`section-card-title text-12 font-semibold tracking-wide uppercase ${open ? 'section-card-title-open' : 'section-card-title-closed'}`}
        >
          {title}
        </h2>
        {subtitle && open && (
          <span className="section-card-subtitle text-11 ml-auto mr-2">{subtitle}</span>
        )}
        {!alwaysOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(v => !v)}
            aria-label={open ? 'Collapse section' : 'Expand section'}
            className="section-card-toggle text-12 w-5 h-5 flex items-center justify-center rounded"
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
