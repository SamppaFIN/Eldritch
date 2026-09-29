import { afterEach, describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { ruinApi } from './ruinStore.js';
import { cellAt } from '../geo/cells.js';
import { RUIN_FINDS, ruinFindAt } from '../rules/ruins.js';
import { setSeasonSalt } from '../rules/seasonSalt.js';
import { bountyOn } from '../rules/bounty.js';
import { revealOf } from '../rules/reveal.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');
const RUIN = cellAt({ lat: 61.4729, lng: 23.7258 });

afterEach(() => setSeasonSalt(null));

describe('ruins (BRDC-SEASON-007)', () => {
  it('give a fixed surprise per ruin and season, varied across ruins', () => {
    expect(ruinFindAt('s2', RUIN)).toEqual(ruinFindAt('s2', RUIN));
    const many = new Set(Array.from({ length: 40 }, (_, i) => ruinFindAt(`s${i}`, RUIN).id));
    expect(many.size).toBeGreaterThan(RUIN_FINDS.length / 2);
  });

  it('are searched once, on foot, and only where a Fortress stood', async () => {
    const store = new MemoryStore();
    const ruins = ruinApi(() => store, () => 'id');
    expect(await ruins.search(RUIN, RUIN, [], 's2', T0)).toEqual({ ok: false, refused: 'not-a-ruin' });
    expect(await ruins.search(RUIN, null, [RUIN], 's2', T0)).toEqual({ ok: false, refused: 'not-there' });
    const r = await ruins.search(RUIN, RUIN, [RUIN], 's2', T0);
    expect(r).toEqual({ ok: true, find: ruinFindAt('s2', RUIN) });
    expect(await ruins.search(RUIN, RUIN, [RUIN], 's2', T0)).toEqual({ ok: false, refused: 'searched' });
  });
});

describe('the season salt moves deposits and anomaly sites, and nothing when empty', () => {
  it('an empty salt reads every hash as before; a seed moves them', () => {
    const cell = (h3: string): Cell => ({ h3, ownerId: null, strength: 0, lastVisitedAt: 0, visitDays: [] });
    const hexes = Array.from({ length: 300 }, (_, i) => cellAt({ lat: 61.4 + i * 0.001, lng: 23.7 }));
    const before = hexes.map((h) => [bountyOn(cell(h))?.id ?? null, revealOf(h)]);
    setSeasonSalt('');
    expect(hexes.map((h) => [bountyOn(cell(h))?.id ?? null, revealOf(h)])).toEqual(before);
    setSeasonSalt('s2');
    expect(hexes.map((h) => [bountyOn(cell(h))?.id ?? null, revealOf(h)])).not.toEqual(before);
  });
});
