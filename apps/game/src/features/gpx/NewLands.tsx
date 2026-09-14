/**
 * The ground a track just won, gone through card by card (BRDC-GPX-002).
 *
 * Infinite: *"kun käyttäjä importoi .gpx fileen, niin sillä saa myös alueen heksat
 * itselleen.. tee siitä sellainen, että käyttäjä voi halutessaan avata uudet maakortit
 * yksi kerrallaan tai sitten kaikki kerralla."*
 *
 * An import can land forty hexes at once. Before this it said "38 walked" and that was
 * the whole of it — the ground appeared on the map with nothing to look at and nothing to
 * do, and every one of those hexes was unrevealed. So the import ends in a review, and it
 * offers the two speeds a person actually wants: savour them, or get it over with.
 *
 * **One at a time** is the interesting one. Each card is revealed as it is reached, so the
 * tier and whatever was found arrive as a small event rather than a list. **All at once**
 * is for the forty-hex case, and it says what the whole haul came to in one line.
 *
 * Reveals go through `repository.revealCell` like every other one — the payout, the log
 * entry and a wonder all behave identically to a reveal on the map or in the ledger.
 */
import { useCallback, useState } from 'react';
import { RitualButton } from '@es3/ui';
import { RESOURCE_KINDS, TERRAIN_TABLE, terrainOf } from '@es3/core';
import type { Collected, GameRepository, H3Index, ResourceKind, ResourcePool } from '@es3/core';
import { RESOURCE_COLOUR, RESOURCE_WORD, terrainGlyph } from '../territory/territoryFeatures.js';

export interface NewLandsProps {
  /** The hexes the track took. Empty means the walk claimed nothing, which is not failure. */
  hexes: readonly H3Index[];
  repository: GameRepository | null;
  now: () => number;
  /** Payouts go to the one toast the map owns, the same as every other reveal. */
  onGain: (collected: Collected) => void;
  /** Re-read the map and the pouch once ground has been revealed. */
  afterReveal: () => void;
}

/** What one revealed hex turned up, kept so a card can say it after the fact. */
interface Found {
  tier: string;
  bonus: Partial<ResourcePool>;
}

const GROUND: Readonly<Record<string, string>> = {
  plain: 'Plain',
  forest: 'Forest',
  hill: 'Hill',
  mountain: 'Mountain',
  lake: 'Lake',
  coast: 'Coast',
  market: 'Market',
};

/** "+12 timber · +3 gold", or the tier alone when the ground held nothing. */
function spoils(found: Found): string {
  const parts = (RESOURCE_KINDS as readonly ResourceKind[])
    .filter((k) => (found.bonus[k] ?? 0) > 0)
    .map((k) => `+${found.bonus[k]} ${RESOURCE_WORD[k]}`);
  const tier = `${found.tier[0]?.toUpperCase()}${found.tier.slice(1)}`;
  return parts.length > 0 ? `${tier} · ${parts.join(' · ')}` : `${tier} — nothing hidden here.`;
}

export function NewLands({ hexes, repository, now, onGain, afterReveal }: NewLandsProps) {
  /** null until a pace is chosen: the review does not start until the player says how. */
  const [pace, setPace] = useState<'one' | 'all' | null>(null);
  const [at, setAt] = useState(0);
  const [found, setFound] = useState<Readonly<Record<H3Index, Found>>>({});

  const revealOne = useCallback(
    async (h3: H3Index) => {
      if (!repository) return;
      const stamp = now();
      const r = await repository.revealCell(h3, stamp);
      if (!r.ok) return;
      setFound((all) => ({ ...all, [h3]: { tier: r.tier, bonus: r.bonus } }));
      const total = Object.values(r.bonus).reduce((sum, n) => sum + n, 0);
      if (total > 0) onGain({ delta: r.bonus, total, hours: 0, at: stamp });
    },
    [repository, now, onGain],
  );

  const startOne = useCallback(() => {
    setPace('one');
    void revealOne(hexes[0] as H3Index).then(afterReveal);
  }, [hexes, revealOne, afterReveal]);

  const startAll = useCallback(() => {
    setPace('all');
    // One after another rather than in parallel: each reveal settles the pouch, and
    // several settles racing each other is how a payout goes missing.
    void (async () => {
      for (const h3 of hexes) await revealOne(h3);
      afterReveal();
    })();
  }, [hexes, revealOne, afterReveal]);

  const next = useCallback(() => {
    const to = at + 1;
    setAt(to);
    if (to < hexes.length) void revealOne(hexes[to] as H3Index).then(afterReveal);
  }, [at, hexes, revealOne, afterReveal]);

  if (hexes.length === 0) return null;

  if (pace === null) {
    return (
      <div className="gpx__lands">
        <p className="gpx__lands-head">
          <strong>{hexes.length}</strong> {hexes.length === 1 ? 'new land' : 'new lands'}, none of
          them looked at yet.
        </p>
        <div className="gpx__lands-pace">
          <RitualButton onClick={startOne}>One at a time</RitualButton>
          <RitualButton variant="ghost" onClick={startAll}>
            All at once
          </RitualButton>
        </div>
      </div>
    );
  }

  if (pace === 'all') {
    const done = Object.values(found);
    const total = done.reduce(
      (sum, f) => sum + Object.values(f.bonus).reduce((n, v) => n + v, 0),
      0,
    );
    return (
      <div className="gpx__lands">
        <p className="gpx__lands-head">
          {done.length} of {hexes.length} looked at
          {total > 0 ? (
            <>
              {' '}
              · <strong>{total}</strong> in all
            </>
          ) : null}
        </p>
        <ul className="gpx__lands-list">
          {hexes.map((h3) => {
            const kind = terrainOf(h3).kind;
            const g = terrainGlyph(kind);
            const f = found[h3];
            return (
              <li key={h3} className="gpx__lands-row">
                <span style={{ color: g?.color }} aria-hidden>
                  {g?.char ?? '·'}
                </span>
                <span>{GROUND[kind] ?? kind}</span>
                <span className="gpx__lands-spoils">{f ? spoils(f) : '…'}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // One at a time. Past the end is the summary, not a dead screen.
  if (at >= hexes.length) {
    return (
      <div className="gpx__lands">
        <p className="gpx__lands-head">That is all {hexes.length} of them.</p>
      </div>
    );
  }

  const h3 = hexes[at] as H3Index;
  const kind = terrainOf(h3).kind;
  const g = terrainGlyph(kind);
  const resource = TERRAIN_TABLE[kind].resource;
  const f = found[h3];

  return (
    <div className="gpx__lands">
      <p className="gpx__lands-head es-numeric">
        {at + 1} of {hexes.length}
      </p>
      <div className="gpx__card">
        <span className="gpx__card-glyph" style={{ color: g?.color }} aria-hidden>
          {g?.char ?? '·'}
        </span>
        <h3 className="gpx__card-name">{GROUND[kind] ?? kind}</h3>
        {resource ? (
          <p className="gpx__card-yield" style={{ color: RESOURCE_COLOUR[resource] }}>
            {RESOURCE_WORD[resource]}
          </p>
        ) : (
          <p className="gpx__card-yield gpx__card-yield--none">no yield of its own</p>
        )}
        <p className="gpx__card-found">{f ? spoils(f) : 'Looking…'}</p>
      </div>
      <RitualButton onClick={next}>
        {at + 1 === hexes.length ? 'Done' : 'Next land'}
      </RitualButton>
    </div>
  );
}
