/**
 * The Hexes tab of Your lands — every hex you hold (BRDC-LANDS-001), on the Ledger's
 * shared list since BRDC-LEDGER-001: filter by what wants doing, sort by what matters.
 */
import { RitualButton } from '@es3/ui';
import { MAX_STRENGTH } from '@es3/core';
import type { Holding, HoldingsSummary, TerrainKind } from '@es3/core';
import { BUILDING_NAME, TERRAIN_NAME } from '../territory/names.js';
import { bountyPickGlyph, bountyPickName } from '../territory/bounty.js';
import { RESOURCE_COLOUR, RESOURCE_WORD, terrainGlyph } from '../territory/territoryFeatures.js';
import type { Revealed } from './useLands.js';
import { CollectionList } from './CollectionList.js';

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

/** "3 h" · "5 d" · "safe" for ground that cannot be lost. */
function untilLost(hours: number | null): string {
  if (hours === null) return 'safe';
  return hours < 48 ? `${hours} h` : `${Math.round(hours / 24)} d`;
}

/** `terrainGlyph` hands back a char and a colour; the list wants both. */
const glyph = (kind: string) => terrainGlyph(kind as Parameters<typeof terrainGlyph>[0]);


/** The row's hex. A named reader so the reveal handler reads as an action on a land. */
const h3OfRow = (h: Holding): string => h.h3;

export interface HexesTabProps {
  list: readonly Holding[];
  summary: HoldingsSummary;
  found: Readonly<Record<string, Revealed>>;
  reveal: (h3: string) => void;
  revealAll: () => void;
  onShowCell: (h3: string) => void;
}

export function HexesTab({ list, summary, found, reveal, revealAll, onShowCell }: HexesTabProps) {
  const row = (h: Holding) => (
    <li key={h.h3} className="lands__row">
      <button type="button" className="lands__cell" onClick={() => onShowCell(h.h3)}>
        <span className="lands__ground">
          <span className="lands__glyph" style={{ color: glyph(h.terrain)?.color }} aria-hidden>
            {glyph(h.terrain)?.char ?? '·'}
          </span>
          {TERRAIN_NAME[h.terrain as TerrainKind] ?? h.terrain}
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
          {/*
            * Out of MAX_STRENGTH, not bare (BRDC-LANDS-003). This was `340` with
            * `title="strength"` on it — and a title is a hover, which a phone does not
            * have. `gateNote.ts` says so in its own docstring: on a touchscreen there is
            * no hover to explain anything. The ratio needs no label; it is the same
            * shape the cell card shows, and it says what the number is out of.
            */}
          <span>
            {h.strength}/{MAX_STRENGTH}
          </span>
          <span>{h.days} d walked</span>
          <span className={h.hoursLeft !== null && h.hoursLeft <= 24 ? 'lands__fading' : undefined}>
            {untilLost(h.hoursLeft)}
          </span>
        </span>

        {h.bounty || h.work ? (
          <span className="lands__work">
            {h.bounty ? (
              <span className="lands__bounty">
                <span aria-hidden>{bountyPickGlyph(h.bounty)}</span> {bountyPickName(h.bounty)}
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
          aria-label={`Reveal this ${TERRAIN_NAME[h.terrain as TerrainKind] ?? h.terrain}`}
          onClick={() => reveal(h3OfRow(h))}
        >
          Reveal
        </RitualButton>
      )}
      {found[h.h3] ? <p className="lands__found">{foundLine(found[h.h3] as Revealed)}</p> : null}
    </li>
  );

  return (
    <>
      <p className="lands__note es-numeric">
        {summary.total} held · <strong>{summary.unrevealed} unrevealed</strong> ·{' '}
        {summary.works} {summary.works === 1 ? 'Work' : 'Works'}
        {summary.fading > 0 ? ` · ${summary.fading} fading within a day` : ''}
      </p>
      {summary.unrevealed > 1 ? (
        <RitualButton variant="ghost" onClick={revealAll}>
          {`Reveal all · ${summary.unrevealed} hexes`}
        </RitualButton>
      ) : null}
      <CollectionList
        label="Hexes"
        items={list}
        keyOf={(h) => h.h3}
        row={row}
        empty="Nothing here passes the filter."
        filters={[
          { id: 'unrevealed', label: 'Unrevealed', keep: (h) => !h.revealed },
          { id: 'works', label: 'With a Work', keep: (h) => h.work !== null },
          { id: 'fading', label: 'Fading', keep: (h) => h.hoursLeft !== null && h.hoursLeft <= 24 },
        ]}
        sorts={[
          { id: 'ledger', label: 'What wants doing' },
          { id: 'strength', label: 'Strength', compare: (a, b) => b.strength - a.strength },
          { id: 'days', label: 'Days walked', compare: (a, b) => b.days - a.days },
        ]}
      />
    </>
  );
}
