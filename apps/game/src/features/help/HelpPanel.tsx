/**
 * The in-game guide, opened over the map (BRDC-WIKI-001).
 *
 * Two modes in one panel: an `index` — the grouped front page, reached from the menu —
 * and a single entry, reached from the index or straight from where a concept appears
 * (the Vigil readout, a History line, the Character screen). An entry carries a back
 * link to the index and a "See also" list, so any deep link still opens the whole book.
 *
 * Not a modal — the player may be walking, and a focus trap is the wrong shape for
 * something you glance at. ESC and the close button dismiss it; it caps its height above
 * the HUD and scrolls inside, like the cell panel.
 */
import { useEffect, useRef } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import { GROUPS, HELP } from './help.js';
import type { HelpTopic } from './help.js';
import './help-panel.css';

/** What the panel is showing: the front page, or one entry. `null` is closed. */
export type HelpView = HelpTopic | 'index';

export interface HelpPanelProps {
  topic: HelpView | null;
  onNavigate: (to: HelpView) => void;
  /** Topics the player has met — the index shows only these (BRDC-WIKI-002). */
  seen: ReadonlySet<HelpTopic>;
  onClose: () => void;
}

export function HelpPanel({ topic, onNavigate, seen, onClose }: HelpPanelProps) {
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
  const entry = topic === 'index' ? null : HELP[topic];

  return (
    <GlassPanel
      as="section"
      ref={panelRef}
      className="help-panel"
      aria-label={entry ? entry.title : 'Guide'}
      tabIndex={-1}
    >
      {entry ? (
        <button type="button" className="help-panel__back" onClick={() => onNavigate('index')}>
          <span aria-hidden>‹</span> Guide
        </button>
      ) : null}

      <div className="help-panel__head">
        <h2 className="help-panel__title">{entry ? entry.title : 'Guide'}</h2>
        <RitualButton
          variant="ghost"
          className="help-panel__close"
          onClick={onClose}
          aria-label="Close"
        >
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      {entry ? (
        <>
          {entry.body.map((para, i) => (
            <p key={i} className="help-panel__para">
              {para}
            </p>
          ))}
          {entry.see && entry.see.length > 0 ? (
            <div className="help-panel__see">
              <h3 className="help-panel__see-heading">See also</h3>
              <ul className="help-panel__see-list">
                {entry.see.map((t) => (
                  <li key={t}>
                    <button
                      type="button"
                      className="help-panel__link"
                      onClick={() => onNavigate(t)}
                    >
                      {HELP[t].title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <nav className="help-panel__groups" aria-label="All topics">
          {GROUPS.map((group) => {
            const topics = group.topics.filter((t) => seen.has(t));
            if (topics.length === 0) return null;
            return (
              <section key={group.heading} className="help-panel__group">
                <h3 className="help-panel__group-heading">{group.heading}</h3>
                <ul className="help-panel__index-list">
                  {topics.map((t) => (
                    <li key={t}>
                      <button
                        type="button"
                        className="help-panel__link help-panel__index-item"
                        onClick={() => onNavigate(t)}
                      >
                        {HELP[t].title}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </nav>
      )}
    </GlassPanel>
  );
}
