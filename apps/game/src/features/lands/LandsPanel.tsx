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
import type { Collected, GameRepository, Holding } from '@es3/core';
import { useEscape } from '../hud/useEscape.js';
import { BUILDING_NAME } from '../territory/names.js';
import { BOUNTY_GLYPH, BOUNTY_NAME } from '../territory/bounty.js';
import { RESOURCE_COLOUR, RESOURCE_WORD, terrainGlyph } from '../territory/territoryFeatures.js';
import { useLands } from './useLands.js';
import type { Revealed } from './useLands.js';
import { WonderMoment } from '../wonder/WonderMoment.js';
import './lands-panel.css';

export interface LandsPanelProps {
  open: boolean;
  repository: GameRepository | null;
  now: () => number;
  /** Show this hex on the map, and close. A different act from revealing it. */
  onShowCell: (h3: string) => void;
  /** A payout from this page, for the toast and the pling the map already owns. */
  onGain: (collected: Collected) => void;
  onClose: () => void;
}

/**
 * What a reveal turned up, in one line.
 *
 * Named resources rather than a bare total: "+12 timber" is a thing that happened to your
 * realm, "+12" is a number. The tier is said too, because on most ground it is the whole
 * of what was found and saying nothing there reads as a button that did nothing.
 */
function foundLine(r: Revealed): string {
  const parts = Object.entries(r.bonus)
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([k, n]) => `+${n} ${RESOURCE_WORD[k as keyof typeof RESOURCE_WORD] ?? k}`);
  const tier = r.tier === 'common' ? 'Common ground' : `${r.tier[0]?.toUpperCase()}${r.tier.slice(1)}`;
  return parts.length > 0 ? `${tier} · ${parts.join(' · ')}` : `${tier} — nothing hidden here.`;
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

/** The row's hex. A named reader so the reveal handler reads as an action on a land. */
const h3OfRow = (h: Holding): string => h.h3;

export function LandsPanel({ open, repository, now, onShowCell, onGain, onClose }: LandsPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const { list, summary, loading, reveal, found, gain, wonder, clearWonder } = useLands(
    repository,
    open,
    now,
  );

  // One toast and one pling for every payout in the game, wherever it was earned (§14).
  const lastGain = useRef<number>(0);
  if (gain && gain.at !== lastGain.current) {
    lastGain.current = gain.at;
    onGain(gain);
  }
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

        {h.bounty || h.work ? (
          <span className="lands__work">
            {h.bounty ? (
              <span className="lands__bounty">
                <span aria-hidden>{BOUNTY_GLYPH[h.bounty]}</span> {BOUNTY_NAME[h.bounty]}
              </span>
            ) : null}
            {h.bounty && h.work ? ' · ' : ''}
            {h.work ? BUILDING_NAME[h.work] : null}
          </span>
        ) : null}
      </button>

      {/* The ledger's whole opinion is "these want revealing", so the doing of it belongs
          here and not two screens away (BRDC-LANDS-002). Pressing it does not close the
          page: the next unrevealed hex is the row below. */}
      {h.revealed ? null : (
        <RitualButton
          className="lands__reveal"
          // Named, because "Reveal" seven times over is useless read aloud — and because
          // the row's own button says "unrevealed", which a bare name match collides with.
          aria-label={`Reveal this ${GROUND[h.terrain] ?? h.terrain}`}
          onClick={() => reveal(h3OfRow(h))}
        >
          Reveal
        </RitualButton>
      )}
      {found[h.h3] ? <p className="lands__found">{foundLine(found[h.h3] as Revealed)}</p> : null}
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

      {/* A ledger reveal reaches any hex you hold, so a wonder can be found from here.
          The moment is the same one the map shows — finding one in silence because it was
          the wrong screen would be the worst place in the game to be inconsistent. */}
      {wonder ? <WonderMoment id={wonder} onClose={clearWonder} /> : null}
    </GlassPanel>
  );
}
