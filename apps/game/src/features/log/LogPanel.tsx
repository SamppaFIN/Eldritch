/**
 * The action log, opened over the map (BRDC-LOG-001).
 *
 * Same shape as `HelpPanel`: non-modal `GlassPanel`, ESC to close, capped above the HUD
 * and scrolling inside. Newest first. A line with a codex topic ends in a cyan link that
 * opens the entry for it.
 */
import { useEffect, useRef } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import type { LogEntry } from '@es3/core';
import type { HelpTopic } from '../help/help.js';
import { describeLogEntry, relativeTime } from './describe.js';
import './log-panel.css';

export interface LogPanelProps {
  open: boolean;
  entries: readonly LogEntry[];
  now: number;
  onTopic: (topic: HelpTopic) => void;
  onClose: () => void;
}

export function LogPanel({ open, entries, now, onTopic, onClose }: LogPanelProps) {
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
      className="log-panel"
      aria-label="History"
      tabIndex={-1}
    >
      <div className="log-panel__head">
        <h2 className="log-panel__title">History</h2>
        <RitualButton
          variant="ghost"
          className="log-panel__close"
          onClick={onClose}
          aria-label="Close"
        >
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      {entries.length === 0 ? (
        <p className="log-panel__empty">Nothing has happened yet. Walk a loop.</p>
      ) : (
        <ul className="log-panel__list">
          {entries.map((entry, i) => {
            const { text, topic } = describeLogEntry(entry);
            return (
              <li key={`${entry.at}-${i}`} className="log-panel__row">
                <span className="log-panel__when">{relativeTime(entry.at, now)}</span>
                <span className="log-panel__what">
                  {text}
                  {topic ? (
                    <button
                      type="button"
                      className="log-panel__link"
                      onClick={() => onTopic(topic)}
                      aria-label={`What is this? ${text}`}
                    >
                      {' '}?
                    </button>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </GlassPanel>
  );
}
