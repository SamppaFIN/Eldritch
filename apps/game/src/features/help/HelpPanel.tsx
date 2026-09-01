/**
 * A codex entry, opened over the map.
 *
 * Not a modal — the player may be walking, and a focus trap is the wrong shape for
 * something you glance at. ESC and the close button dismiss it; it caps its height above
 * the HUD and scrolls inside, like the cell panel.
 */
import { useEffect, useRef } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import { HELP } from './help.js';
import type { HelpTopic } from './help.js';
import './help-panel.css';

export interface HelpPanelProps {
  topic: HelpTopic | null;
  onClose: () => void;
}

export function HelpPanel({ topic, onClose }: HelpPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!topic) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [topic, onClose]);

  if (!topic) return null;
  const entry = HELP[topic];

  return (
    <GlassPanel
      as="section"
      ref={panelRef}
      className="help-panel"
      aria-label={entry.title}
      tabIndex={-1}
    >
      <div className="help-panel__head">
        <h2 className="help-panel__title">{entry.title}</h2>
        <RitualButton
          variant="ghost"
          className="help-panel__close"
          onClick={onClose}
          aria-label="Close"
        >
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>
      {entry.body.map((para, i) => (
        <p key={i} className="help-panel__para">
          {para}
        </p>
      ))}
    </GlassPanel>
  );
}
