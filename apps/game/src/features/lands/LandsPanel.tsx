/**
 * The ledger of held ground — what you have, and what it wants (BRDC-LANDS-001).
 *
 * The map answers "where am I". Past a few dozen hexes it cannot answer "what have I got",
 * and Infinite holds three hundred and forty: auditing those by scrolling a map is not
 * something a person does. So this is a list, and its order is its opinion — unrevealed
 * first, because revealing is free, pays every time, and is the one thing here that can be
 * done without walking anywhere; then whatever is closest to being lost.
 *
 * Same sheet as `CodexPanel` and `LogPanel`: non-modal, ESC closes, capped clear of the
 * HUD and scrolling inside.
 */
import { useRef } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import type { GameRepository, Holding } from '@es3/core';
import { useEscape } from '../hud/useEscape.js';
import { BUILDING_NAME } from '../territory/names.js';
import { RESOURCE_COLOUR, RESOURCE_WORD, terrainGlyph } from '../territory/territoryFeatures.js';
import { useLands } from './useLands.js';
import './lands-panel.css';

export interface LandsPanelProps {
  open: boolean;
  repository: GameRepository | null;
  now: () => number;
  /** Show this hex on the map, and close. */
  onShowCell: (h3: string) => void;
  onClose: () => void;
}

/** "3 h" · "5 d" · "—" for ground that cannot be lost. */
function untilLost(hours: number | null): string {
  if (hours === null) return 'safe';
  return hours < 48 ? `${hours} h` : `${Math.round(hours / 24)} d`;
}

/** `terrainGlyph` hands back a char and a colour; the list wants both. */
const glyph = (kind: string) => terrainGlyph(kind as Parameters<typeof terrainGlyph>[0]);

const GROUND: Readonly<Record<string, string>> = {
  plain: 'Plain',
  forest: 'Forest',
  hill: 'Hill',
  mountain: 'Mountain',
  lake: 'Lake',
  coast: 'Coast',
  market: 'Market',
};

export function LandsPanel({ open, repository, now, onShowCell, onClose }: LandsPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const { list, summary, loading } = useLands(repository, open, now);
  useEscape(open, onClose);

  if (!open) return null;

  const row = (h: Holding) => (
    <li key={h.h3} className="lands__row">
      <button type="button" className="lands__cell" onClick={() => onShowCell(h.h3)}>
        <span className="lands__ground">
          <span className="lands__glyph" style={{ color: glyph(h.terrain)?.color }} aria-hidden>
            {glyph(h.terrain)?.char ?? '·'}
          </span>
          {GROUND[h.terrain] ?? h.terrain}
          {h.home ? <span className="lands__tag lands__tag--home">Hearth</span> : null}
          {h.revealed ? null : <span className="lands__tag lands__tag--new">unrevealed</span>}
        </span>

        <span className="lands__facts es-numeric">
          {h.resource ? (
            <span className="lands__res">
              <span
                className="lands__pip"
                style={{ background: RESOURCE_COLOUR[h.resource] }}
                aria-hidden
              />
              {RESOURCE_WORD[h.resource]}
            </span>
          ) : (
            <span className="lands__res lands__res--none">no yield</span>
          )}
          <span title="strength">{h.strength}</span>
          <span title="days walked">{h.days} d walked</span>
          <span className={h.hoursLeft !== null && h.hoursLeft <= 24 ? 'lands__fading' : undefined}>
            {untilLost(h.hoursLeft)}
          </span>
        </span>

        {h.work ? <span className="lands__work">{BUILDING_NAME[h.work]}</span> : null}
      </button>
    </li>
  );

  return (
    <GlassPanel as="section" ref={panelRef} className="lands" aria-label="Your lands" tabIndex={-1}>
      <div className="lands__bar">
        <h2 className="lands__title">Your lands</h2>
        <RitualButton variant="ghost" className="lands__close" onClick={onClose} aria-label="Close">
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      {loading && list.length === 0 ? <p className="lands__note">Counting your ground…</p> : null}

      {!loading && list.length === 0 ? (
        <p className="lands__note">You hold nothing yet. Walk into the hex beside you.</p>
      ) : null}

      {list.length > 0 ? (
        <>
          <p className="lands__note es-numeric">
            {summary.total} held · <strong>{summary.unrevealed} unrevealed</strong> ·{' '}
            {summary.works} {summary.works === 1 ? 'Work' : 'Works'}
            {summary.fading > 0 ? ` · ${summary.fading} fading within a day` : ''}
          </p>
          <ul className="lands__list">{list.map(row)}</ul>
        </>
      ) : null}
    </GlassPanel>
  );
}
