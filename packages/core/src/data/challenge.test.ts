import { describe, expect, it } from 'vitest';
import { CHALLENGE_VERSION } from '../rules/constants.js';
import { cellAt } from '../geo/cells.js';
import { destination } from '../geo/project.js';
import { projectCell } from '../rules/decay.js';
import {
  MAX_CHALLENGE_CELLS,
  buildChallenge,
  challengeToCells,
  encodeChallenge,
  parseChallenge,
} from './challenge.js';
import type { Cell } from '../types/domain.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-08-28T18:00:00Z');
const ME = 'me';
const THEM = 'the-pale-warden';

function ground(count: number, owner = THEM): Cell[] {
  return Array.from({ length: count }, (_, i) => ({
    h3: cellAt(destination(ORIGIN, (i * 31) % 360, 40 + i * 30)),
    ownerId: owner,
    strength: 100 + (i % 7) * 40,
    lastVisitedAt: T0,
    visitDays: [],
  }));
}

const source = (cells = ground(6), extra: { nation?: string; banner?: string } = {}) => ({
  name: 'Infinite',
  ...extra,
  id: THEM,
  level: 4,
  cells,
  home: cells[0]?.h3 ?? null,
  defence: 'orcs' as const,
  now: T0,
});

const sent = (cells?: Cell[]) => encodeChallenge(buildChallenge(source(cells)));

describe('a challenge sent by hand', () => {
  it('survives the round trip', () => {
    const result = parseChallenge(sent(), ME);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.challenge.name).toBe('Infinite');
    expect(result.challenge.level).toBe(4);
    expect(result.challenge.cells).toHaveLength(6);
  });

  it('carries only what the other player has to see', () => {
    // No trail, no dwell, no pouch. A challenge is ground and a name.
    const keys = Object.keys(buildChallenge(source())).sort();
    expect(keys).toEqual([
      'cells',
      'defence',
      'home',
      'id',
      'level',
      'name',
      'sentAt',
      'sum',
      'v',
    ]);
  });

  it('is refused when a chat app eats the end of it', () => {
    const text = sent();
    expect(parseChallenge(text.slice(0, text.length - 40), ME)).toEqual({
      ok: false,
      fault: 'not-json',
    });
  });

  it('is refused when someone edits their strength upward', () => {
    // Not security — a client cannot have that — but an honest tamper detector for the
    // ordinary case, and it says "damaged" rather than pretending to know intent.
    const text = sent().replace(/"strength": \d+/, '"strength": 9999');
    expect(parseChallenge(text, ME)).toEqual({ ok: false, fault: 'damaged' });
  });

  it('is refused when it is not a challenge at all', () => {
    expect(parseChallenge('hello?', ME).ok).toBe(false);
    expect(parseChallenge('hello?', ME)).toEqual({ ok: false, fault: 'not-json' });
    expect(parseChallenge('{"hello":true}', ME)).toEqual({ ok: false, fault: 'not-a-challenge' });
    expect(parseChallenge('[]', ME)).toEqual({ ok: false, fault: 'not-a-challenge' });
  });

  it('is refused when it comes from a different version of the game', () => {
    const text = sent().replace(`"v": ${CHALLENGE_VERSION}`, `"v": ${CHALLENGE_VERSION + 1}`);
    expect(parseChallenge(text, ME)).toEqual({ ok: false, fault: 'wrong-version' });
  });

  it('refuses your own export, which would make you your own rival', () => {
    expect(parseChallenge(sent(), THEM)).toEqual({ ok: false, fault: 'yourself' });
  });

  it('keeps the strongest ground when there is more than a message can hold', () => {
    const many = ground(MAX_CHALLENGE_CELLS + 50);
    const built = buildChallenge(source(many));

    expect(built.cells).toHaveLength(MAX_CHALLENGE_CELLS);
    expect(built.cells[0]?.strength).toBe(Math.max(...many.map((c) => c.strength)));
  });

  it('refuses a payload larger than the cap, whoever built it', () => {
    const built = buildChallenge(source(ground(4)));
    const bloated = { ...built, cells: ground(MAX_CHALLENGE_CELLS + 1) };
    expect(parseChallenge(JSON.stringify(bloated), ME)).toEqual({
      ok: false,
      fault: 'too-large',
    });
  });
});

describe('challengeToCells', () => {
  it('gives the rival their ground, owned by them', () => {
    const result = parseChallenge(sent(), ME);
    if (!result.ok) throw new Error('expected a challenge');

    const cells = challengeToCells(result.challenge, T0 + 86_400_000);
    expect(cells.every((c) => c.ownerId === THEM)).toBe(true);
    expect(cells).toHaveLength(6);
  });

  it('dates the ground to the import, not to their clock', () => {
    /*
     * Their timestamps arrive from another phone and cannot be trusted to be sane — a
     * wrong system clock would either hand them ground that never decays or ground that
     * is already dust. Imported territory starts its life here.
     */
    const result = parseChallenge(sent(), ME);
    if (!result.ok) throw new Error('expected a challenge');

    const at = T0 + 30 * 86_400_000;
    expect(challengeToCells(result.challenge, at).every((c) => c.lastVisitedAt === at)).toBe(true);
  });

  it('marks every cell imported, so it does not decay or produce here', () => {
    const result = parseChallenge(sent(), ME);
    if (!result.ok) throw new Error('expected a challenge');
    const cells = challengeToCells(result.challenge, T0);
    expect(cells.every((c) => c.imported === true)).toBe(true);

    // A month on with no visit — projectCell leaves an imported cell exactly as it is.
    const far = T0 + 30 * 86_400_000;
    expect(cells.map((c) => projectCell(c, far))).toEqual(cells);
  });
});

describe('the extended metadata (BRDC-WAGER-JSON-004)', () => {
  // buildChallenge sorts by strength, so identify metadata cells by their h3, not index.
  const withMeta = () => {
    const cells = ground(3);
    cells[0] = { ...cells[0]!, terrain: { kind: 'forest', source: 'tiles' } };
    cells[1] = { ...cells[1]!, building: { id: 'sawmill', builtAt: T0 } };
    return { text: sent(cells), forestH3: cells[0]!.h3, millH3: cells[1]!.h3, bareH3: cells[2]!.h3 };
  };

  it('round-trips terrain, building, nation and flag', () => {
    const cells = ground(3);
    cells[0] = { ...cells[0]!, terrain: { kind: 'mountain', source: 'seed' } };
    cells[1] = { ...cells[1]!, building: { id: 'library', builtAt: T0 } };
    const text = encodeChallenge(
      buildChallenge(source(cells, { nation: 'The Pale March', banner: 'eye' })),
    );

    const parsed = parseChallenge(text, ME);
    if (!parsed.ok) throw new Error('expected a challenge');
    expect(parsed.challenge.nation).toBe('The Pale March');
    expect(parsed.challenge.banner).toBe('eye');
    const byH3 = new Map(parsed.challenge.cells.map((c) => [c.h3, c]));
    expect(byH3.get(cells[0]!.h3)?.t).toBe('mountain');
    expect(byH3.get(cells[1]!.h3)?.b).toBe('library');
    expect(byH3.get(cells[2]!.h3)?.t).toBeUndefined();
  });

  it('still reads a message from before the metadata existed', () => {
    // A plain `source()` produces exactly the old shape: no nation/banner keys, cells
    // with only h3 and strength. It must parse, and the new fields come back undefined.
    const built = buildChallenge(source(ground(2)));
    expect('nation' in built).toBe(false);
    expect('banner' in built).toBe(false);

    const parsed = parseChallenge(encodeChallenge(built), ME);
    if (!parsed.ok) throw new Error('expected a challenge');
    expect(parsed.challenge.nation).toBeUndefined();
    expect(parsed.challenge.cells[0]?.t).toBeUndefined();
    expect(challengeToCells(parsed.challenge, T0)).toHaveLength(2);
  });

  it('carries the sender terrain into the imported cell as an estimate', () => {
    const { text, forestH3, millH3, bareH3 } = withMeta();
    const parsed = parseChallenge(text, ME);
    if (!parsed.ok) throw new Error('expected a challenge');
    const byH3 = new Map(challengeToCells(parsed.challenge, T0 + 86_400_000).map((c) => [c.h3, c]));
    expect(byH3.get(forestH3)?.terrain).toEqual({ kind: 'forest', source: 'hash' });
    expect(byH3.get(millH3)?.building?.id).toBe('sawmill');
    expect(byH3.get(bareH3)?.terrain).toBeUndefined();
  });

  it('records who the ground was seen from, and when', () => {
    const text = encodeChallenge(
      buildChallenge(source(ground(2), { nation: 'The Pale March', banner: 'eye' })),
    );
    const parsed = parseChallenge(text, ME);
    if (!parsed.ok) throw new Error('expected a challenge');
    const cell = challengeToCells(parsed.challenge, T0 + 3 * 86_400_000)[0]!;
    expect(cell.importedFrom).toEqual({ name: 'The Pale March', banner: 'eye', seenAt: T0 });
  });

  it('falls back to the player name when there is no nation', () => {
    const parsed = parseChallenge(sent(ground(1)), ME);
    if (!parsed.ok) throw new Error('expected a challenge');
    expect(challengeToCells(parsed.challenge, T0)[0]?.importedFrom?.name).toBe('Infinite');
  });

  it('is refused when the terrain is edited on the way', () => {
    const text = withMeta().text.replace('"forest"', '"market"');
    expect(parseChallenge(text, ME)).toEqual({ ok: false, fault: 'damaged' });
  });
});
