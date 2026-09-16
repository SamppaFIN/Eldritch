/**
 * BRDC-BOUNTY-001 — bounties are deterministic, belong to their ground, and are found.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, cellsWithin } from '../geo/cells.js';
import { BOUNTIES, BOUNTY_IDS, BOUNTY_SHARE, bountiesFor, bountyBonus, bountyOn, bountyYield } from './bounty.js';
import { TERRAIN_TABLE, terrainForCell } from './terrain.js';
import type { TerrainKind } from './terrain.js';
import type { BountyId } from './bounty.js';
import type { Cell } from '../types/domain.js';
import { enableWorldseed, hexSeedOf } from '../data/hexSeedStore.js';
import { HARMALA_STATUE } from './terrainSeed.js';
import harmala from '../data/seed/harmala.json' with { type: 'json' };

const T0 = Date.parse('2026-09-10T12:00:00Z');
// ~7500 real res-11 cells around central Tampere — the same ground a player walks.
const SAMPLE = cellsWithin(cellAt({ lat: 61.4978, lng: 23.761 }), 50);
const cell = (h3: string, over: Partial<Cell> = {}): Cell => ({
  h3,
  ownerId: 'me',
  strength: 300,
  lastVisitedAt: T0,
  visitDays: [],
  ...over,
});
const all = () => SAMPLE.map((h3) => cell(h3));
const everyRevealed = Object.fromEntries(SAMPLE.map((h3) => [h3, T0]));

describe('the table', () => {
  it('only ever names ground the game has', () => {
    const kinds = new Set(Object.keys(TERRAIN_TABLE) as TerrainKind[]);
    for (const id of BOUNTY_IDS) {
      for (const t of BOUNTIES[id].terrain) expect(kinds.has(t)).toBe(true);
    }
  });

  /*
   * The plain is the point of the whole table: two thirds of the map is plain and plain
   * yields nothing, so most ground was interchangeable.
   */
  it('gives the plain something to be', () => {
    expect(bountiesFor('plain').length).toBeGreaterThan(0);
  });

  /*
   * Every kind of ground, not most of them. Market was missed first time round, which
   * would have meant a player whose neighbourhood is a place of trade never finding
   * anything at all — a silent exclusion rather than a design.
   */
  it('leaves no kind of ground unable to carry anything', () => {
    for (const kind of Object.keys(TERRAIN_TABLE) as TerrainKind[]) {
      expect(bountiesFor(kind).length, `no bounty can appear on ${kind}`).toBeGreaterThan(0);
    }
  });

  it('pays in whole units, like every other rate (SQL parity in Phase 3)', () => {
    for (const id of BOUNTY_IDS) expect(Number.isInteger(BOUNTIES[id].perHour)).toBe(true);
  });
});

describe('bountyOn', () => {
  it('is deterministic — the same hex gives the same answer, always', () => {
    const c = cell(SAMPLE[100] as string);
    const first = bountyOn(c);
    for (let i = 0; i < 500; i += 1) expect(bountyOn(c)).toEqual(first);
  });

  // A bounty that could land anywhere would read as decoration. Only the legacy pool is
  // checked against BOUNTIES here — a worldseed-pool pick belongs to BONUS_RESOURCES,
  // which BRDC-RES-001's own tests (worldseedAllocate.test.ts) already hold to this rule.
  it('never puts a legacy bounty on ground it does not belong to', () => {
    for (const h3 of SAMPLE) {
      const c = cell(h3);
      const pick = bountyOn(c);
      if (pick?.pool === 'legacy') {
        expect(BOUNTIES[pick.id as BountyId].terrain).toContain(terrainForCell(c).kind);
      }
    }
  });

  it('lands on about one hex in eight', () => {
    const hits = all().filter((c) => bountyOn(c) !== null).length;
    const share = hits / SAMPLE.length;
    expect(share).toBeGreaterThan(BOUNTY_SHARE * 0.6);
    expect(share).toBeLessThan(BOUNTY_SHARE * 1.4);
  });

  it('spreads across more than one kind — not every find is deer', () => {
    const found = new Set(all().map((c) => bountyOn(c)).filter(Boolean).map((p) => `${p!.pool}:${p!.id}`));
    expect(found.size).toBeGreaterThan(3);
  });

  it('reads a stored terrain over the hash, like everything else does', () => {
    const c = cell(SAMPLE[7] as string, { terrain: { kind: 'mountain', source: 'tiles' } });
    const pick = bountyOn(c);
    if (pick?.pool === 'legacy') expect(BOUNTIES[pick.id as BountyId].terrain).toContain('mountain');
  });
});

describe('bountyYield', () => {
  it('is the bounty resource at its rate, and nothing for bare ground', () => {
    expect(bountyYield({ id: 'gems', pool: 'legacy' })).toEqual({ gold: 3 });
    expect(bountyYield(null)).toEqual({});
  });

  it('sums every yield a worldseed-pool find has, not just one', () => {
    // Mushrooms: { food: 1, wisdom: 1 } — the whole point of BRDC-RES-001's multi-yield.
    expect(bountyYield({ id: 'mushrooms', pool: 'worldseed' })).toEqual({ food: 1, wisdom: 1 });
  });
});

describe('bountyBonus', () => {
  /*
   * The reveal gate is the mechanic, not a technicality: revealing was a one-off payout,
   * and this makes it the way you find out what your own land is worth.
   */
  it('pays nothing on ground that has not been revealed', () => {
    expect(bountyBonus(all(), {}, T0)).toEqual({});
  });

  it('pays once the ground is revealed', () => {
    const paid = bountyBonus(all(), everyRevealed, T0);
    expect(Object.keys(paid).length).toBeGreaterThan(0);
  });

  it('pays nothing on a hex nobody has walked in two days, deer or no deer', () => {
    const stale = SAMPLE.map((h3) => cell(h3, { lastVisitedAt: T0 - 90 * 3_600_000 }));
    expect(bountyBonus(stale, everyRevealed, T0)).toEqual({});
  });

  it('adds up across cells rather than reporting only the last one', () => {
    const one = bountyBonus(all().slice(0, 400), everyRevealed, T0);
    const many = bountyBonus(all(), everyRevealed, T0);
    const sum = (p: Record<string, number>) => Object.values(p).reduce((a, b) => a + b, 0);
    expect(sum(many as Record<string, number>)).toBeGreaterThan(sum(one as Record<string, number>));
  });
});

describe('bountyOn on seeded ground (BRDC-RES-001)', () => {
  it('reads the deposit straight from the seed — no roll, no hash', () => {
    enableWorldseed(true);
    try {
      const withDeposit = Object.entries(
        harmala.hexes as Record<string, { resource?: { id: string } }>,
      ).find(([, h]) => h.resource);
      expect(withDeposit).toBeDefined();
      const [h3, hex] = withDeposit!;
      expect(bountyOn(cell(h3))).toEqual({ id: hex.resource!.id, pool: 'worldseed' });

      // A seeded hex the build gave no deposit is a *known* absence, not "roll the dice".
      const statueHex = cellAt(HARMALA_STATUE);
      if (!hexSeedOf(statueHex)?.resource) expect(bountyOn(cell(statueHex))).toBeNull();
    } finally {
      enableWorldseed(false);
    }
  });
});

describe('the require flag (BRDC-RES-001)', () => {
  // Outside a seeded area there is no survey to confirm a flag against, so any
  // worldseed-pool resource that requires one (leycrystal: leyCrossing, oak: oldGrowth,
  // sauna: shoreline) must never be drawn from the unclassified hash fallback.
  it('never draws a require-gated resource from the hash fallback', () => {
    const found = new Set(
      all()
        .map((c) => bountyOn(c))
        .filter((p) => p?.pool === 'worldseed')
        .map((p) => p!.id),
    );
    for (const gated of ['leycrystal', 'oak', 'sauna']) expect(found.has(gated)).toBe(false);
  });
});
