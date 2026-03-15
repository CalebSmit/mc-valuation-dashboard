import { useState, useEffect, useRef, useCallback } from 'react';
import { useExport } from '../../hooks/useExport';
import type { SnapshotTheme } from '../../hooks/useExport';

// ─── SnapshotPreviewModal ────────────────────────────────────────────────────
// Shows a rendered snapshot preview with light/dark theme toggle.
// User can copy the image to clipboard for pasting into reports.

interface SnapshotPreviewModalProps {
  open: boolean;
  onClose: () => void;
  activeTab: string;
}

export function SnapshotPreviewModal({ open, onClose, activeTab }: SnapshotPreviewModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { renderSnapshot, copySnapshotToClipboard } = useExport();

  const [theme, setTheme] = useState<SnapshotTheme>('light');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied'>('idle');

  // Render snapshot when modal opens or theme changes
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setImageUrl(null);

    renderSnapshot(activeTab, theme).then(url => {
      if (!cancelled) {
        setImageUrl(url);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [open, activeTab, theme, renderSnapshot]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTheme('light');
      setImageUrl(null);
      setCopyState('idle');
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleCopy = useCallback(async () => {
    if (!imageUrl) return;
    setCopyState('copying');
    const ok = await copySnapshotToClipboard(imageUrl);
    setCopyState(ok ? 'copied' : 'idle');
    if (ok) {
      setTimeout(() => {
        onClose();
      }, 800);
    }
  }, [imageUrl, copySnapshotToClipboard, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="method-overlay"
      onClick={handleBackdropClick}
    >
      <div className="snapshot-modal" role="dialog" aria-label="Snapshot preview">
        {/* Header */}
        <div className="snapshot-modal-header">
          <h2 className="snapshot-modal-title">Snapshot Preview</h2>
          <button
            type="button"
            onClick={onClose}
            className="snapshot-modal-close"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Theme toggle */}
        <div className="snapshot-theme-bar">
          <div className="snapshot-theme-toggle">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`snapshot-theme-btn ${theme === 'light' ? 'snapshot-theme-btn-active' : ''}`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="ui-icon-fixed">
                <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`snapshot-theme-btn ${theme === 'dark' ? 'snapshot-theme-btn-active' : ''}`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="ui-icon-fixed">
                <path d="M13.5 9.5A5.5 5.5 0 016.5 2.5 6.5 6.5 0 1013.5 9.5z" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
              Dark
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="snapshot-preview-area">
          {loading ? (
            <div className="snapshot-preview-loading">
              <svg width="24" height="24" viewBox="0 0 16 16" fill="none" className="animate-spin">
                <circle cx="8" cy="8" r="6" stroke="#8b949e" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="8" fill="none" />
              </svg>
              Rendering…
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Snapshot preview"
              className="snapshot-preview-img"
            />
          ) : (
            <div className="snapshot-preview-loading">
              Failed to render snapshot.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="snapshot-modal-actions">
          <button
            type="button"
            onClick={onClose}
            className="snapshot-cancel-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!imageUrl || copyState === 'copying'}
            className={`snapshot-copy-btn ${copyState === 'copied' ? 'snapshot-copy-btn-copied' : ''}`}
          >
            {copyState === 'copying' ? 'Copying…' : copyState === 'copied' ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
