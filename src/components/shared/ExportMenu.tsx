import { useState, useRef, useEffect } from 'react';
import { useResultsStore } from '../../store/resultsSlice';

// ─── ExportMenu ───────────────────────────────────────────────────────────────
// Wired actions are stubbed here; useExport hook (Phase 3) will provide real exports.
// For now, ExportMenu accepts optional handler props so Phase 3 can inject them.

interface ExportMenuProps {
  onExportPDF?: () => Promise<void>;
  onExportCSV?: () => void;
  onExportConfig?: () => void;
  onImportConfig?: (file: File) => Promise<void>;
}

export function ExportMenu({ onExportPDF, onExportCSV, onExportConfig, onImportConfig }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasResults = useResultsStore(s => s.output !== null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handlePDF = async () => {
    if (!onExportPDF || !hasResults) return;
    setLoading(true); setOpen(false);
    try { await onExportPDF(); } finally { setLoading(false); }
  };

  const handleCSV = () => {
    if (!onExportCSV || !hasResults) return;
    onExportCSV(); setOpen(false);
  };

  const handleConfig = () => {
    onExportConfig?.(); setOpen(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportConfig) { onImportConfig(file); }
    setOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="text-12 px-3 py-2 rounded flex items-center gap-1"
        style={{
          background: 'var(--color-surface-alt)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
          fontFamily: 'Space Grotesk',
          cursor: 'pointer',
        }}
      >
        {loading ? '…' : '↓'} Export
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 rounded z-50"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            minWidth: '180px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {[
            { label: '📄 Export PDF', action: handlePDF, disabled: !hasResults || !onExportPDF },
            { label: '📊 Export CSV', action: handleCSV, disabled: !hasResults || !onExportCSV },
            { label: '💾 Save Config (JSON)', action: handleConfig, disabled: !onExportConfig },
          ].map(item => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={item.action}
              disabled={item.disabled}
              className="w-full text-left text-12 px-3 py-2"
              style={{
                background: 'transparent',
                border: 'none',
                color: item.disabled ? 'var(--color-text-faint)' : 'var(--color-text)',
                fontFamily: 'Space Grotesk',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                display: 'block',
              }}
              onMouseEnter={e => { if (!item.disabled) (e.target as HTMLElement).style.background = 'var(--color-surface-alt)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; }}
            >
              {item.label}
            </button>
          ))}

          <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

          <label
            className="w-full text-left text-12 px-3 py-2 block"
            style={{
              color: onImportConfig ? 'var(--color-text)' : 'var(--color-text-faint)',
              fontFamily: 'Space Grotesk',
              cursor: onImportConfig ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={e => { if (onImportConfig) (e.target as HTMLElement).style.background = 'var(--color-surface-alt)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; }}
          >
            📂 Load Config (JSON)
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="sr-only"
              onChange={handleImport}
              disabled={!onImportConfig}
            />
          </label>
        </div>
      )}
    </div>
  );
}
