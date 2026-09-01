/**
 * What changed, version by version (BRDC-CHANGELOG-001).
 *
 * Same shape as `HelpPanel` / `LogPanel`: non-modal `GlassPanel`, ESC to close, capped
 * above the HUD and scrolling inside. `changelog.json` is the file that gets a new block
 * on every push; this renders it, newest first.
 */
import { useEffect, useRef } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import entries from './changelog.json';
import './changelog-panel.css';

export interface ChangelogPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ChangelogPanel({ open, onClose }: ChangelogPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <GlassPanel
      as="section"
      ref={panelRef}
      className="changelog-panel"
      aria-label="What's new"
      tabIndex={-1}
    >
      <div className="changelog-panel__head">
        <h2 className="changelog-panel__title">What&rsquo;s new</h2>
        <RitualButton
          variant="ghost"
          className="changelog-panel__close"
          onClick={onClose}
          aria-label="Close"
        >
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      {entries.map((release) => (
        <section key={release.version} className="changelog-panel__release">
          <h3 className="changelog-panel__version">
            v{release.version} <span className="changelog-panel__date">· {release.date}</span>
          </h3>
          <ul className="changelog-panel__notes">
            {release.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </section>
      ))}
    </GlassPanel>
  );
}
