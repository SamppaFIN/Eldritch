/**
 * The in-game guide, opened over the map (BRDC-WIKI-001, -003).
 *
 * Two modes in one panel: an `index` — the grouped front page plus the searchable
 * Reference, in `HelpIndex` — and a single entry, hand-written (`HELP`) or derived for a
 * Work / technology / Rite (`wikiEntry`). An entry carries a back link and a "See also"
 * list, so any deep link still opens the whole book.
 *
 * Not a modal — the player may be walking, and a focus trap is the wrong shape for
 * something you glance at. ESC and the close button dismiss it; it caps its height above
 * the HUD and scrolls inside, like the cell panel.
 */
import { useEffect, useRef } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import { HELP } from './help.js';
import type { HelpEntry, HelpTopic } from './help.js';
import { HelpIndex } from './HelpIndex.js';
import { refTitle, wikiEntry } from './wikiPages.js';
import type { WikiContext, WikiPage, WikiRef } from './wikiPages.js';
import './help-panel.css';

/** What the panel is showing: the front page, or one page. `null` is closed. */
export type HelpView = WikiRef | 'index';

export interface HelpPanelProps {
  topic: HelpView | null;
  onNavigate: (to: HelpView) => void;
  /** Topics the player has met — the grouped index shows only these (BRDC-WIKI-002). */
  seen: ReadonlySet<HelpTopic>;
  /** Live data for a derived page's status line (BRDC-WIKI-003). */
  ctx?: WikiContext;
  onClose: () => void;
}

export function HelpPanel({ topic, onNavigate, seen, ctx, onClose }: HelpPanelProps) {
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
  const hand: HelpEntry | undefined =
    topic === 'index' ? undefined : (HELP as Record<string, HelpEntry | undefined>)[topic];
  const entry: HelpEntry | WikiPage | null =
    topic === 'index' ? null : (hand ?? wikiEntry(topic as WikiRef, ctx));
  const see: readonly WikiRef[] = entry?.see ?? [];
  const status = entry && 'status' in entry ? entry.status : undefined;

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
          {status ? (
            <p className="help-panel__status" role="status">
              {status}
            </p>
          ) : null}
          {entry.body.map((para, i) => (
            <p key={i} className="help-panel__para">
              {para}
            </p>
          ))}
          {see.length > 0 ? (
            <div className="help-panel__see">
              <h3 className="help-panel__see-heading">See also</h3>
              <ul className="help-panel__see-list">
                {see.map((t) => (
                  <li key={t}>
                    <button
                      type="button"
                      className="help-panel__link"
                      onClick={() => onNavigate(t)}
                    >
                      {refTitle(t)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <HelpIndex seen={seen} onNavigate={onNavigate} />
      )}
    </GlassPanel>
  );
}
