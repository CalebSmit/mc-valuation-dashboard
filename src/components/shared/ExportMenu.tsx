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
  onCopySnapshot?: () => void;
}

export function ExportMenu({ onExportPDF, onExportCSV, onExportConfig, onImportConfig, onCopySnapshot }: ExportMenuProps) {
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

  const handleSnapshot = () => {
    if (!onCopySnapshot || !hasResults) return;
    onCopySnapshot();
    setOpen(false);
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
        aria-haspopup="menu"
        className="export-menu-trigger text-12 px-3 py-2 rounded flex items-center gap-1"
      >
        {loading ? '…' : '↓'} Export
      </button>

      {open && (
        <div
          role="menu"
          className="export-menu-panel absolute right-0 mt-1 rounded z-50"
        >
          {[
            { label: '📋 Copy Snapshot', action: handleSnapshot, disabled: !hasResults || !onCopySnapshot },
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
              className={`export-menu-item w-full text-left text-12 px-3 py-2 ${item.disabled ? 'export-menu-item-disabled' : ''}`}
            >
              {item.label}
            </button>
          ))}

          <div className="export-menu-divider" />

          <button
            type="button"
            role="menuitem"
            onClick={() => fileInputRef.current?.click()}
            disabled={!onImportConfig}
            className={`export-menu-item w-full text-left text-12 px-3 py-2 ${!onImportConfig ? 'export-menu-item-disabled' : ''}`}
          >
            📂 Load Config (JSON)
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="sr-only"
        onChange={handleImport}
        disabled={!onImportConfig}
        aria-label="Load configuration JSON file"
        title="Load configuration JSON file"
      />
    </div>
  );
}
