import { describe, expect, it } from 'vitest';
import { EMPTY_POOL, RESOURCE_KINDS } from '../terrain.js';
import type { ResourcePool } from '../terrain.js';
import { WORKS_DEFS, WORKS_KINDS } from './defs/index.js';
import {
  canResearch,
  cellsInRings,
  isDormant,
  nodeCount,
  nodeState,
  reachRings,
  researchNode,
  worksLevel,
} from './tree.js';

const RICH: ResourcePool = Object.fromEntries(RESOURCE_KINDS.map((k) => [k, 10_000])) as ResourcePool;
const FARM = WORKS_DEFS.farm;
const KEEP = WORKS_DEFS.keep;

describe('every tree has the same shape (BRDC-WORKS-003)', () => {
  it.each(WORKS_KINDS)('%s', (kind) => {
    const def = WORKS_DEFS[kind];
    expect(def.kind).toBe(kind);
    expect(def.tree.tiers.map((t) => t.tier)).toEqual([1, 2, 3, 4, 5]);
    for (const t of def.tree.tiers) {
      expect(t.nodes.length).toBe(t.choice ? 2 : 1);
      for (const n of t.nodes) {
        expect(n.id.startsWith(`${kind}.`)).toBe(true);
        expect(n.text).toContain(n.hl);
        expect(n.lore.length).toBeGreaterThan(0);
        for (const k of Object.keys(n.cost)) expect(RESOURCE_KINDS).toContain(k);
      }
    }
    // Tier III is always a choice; tier V may be.
    expect(def.tree.tiers[2]?.choice).toBe(true);
    expect(def.lore.source.length).toBeGreaterThan(0);
  });

  it('node ids are unique across every tree', () => {
    const ids = WORKS_KINDS.flatMap((k) => WORKS_DEFS[k].tree.tiers.flatMap((t) => t.nodes.map((n) => n.id)));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(57);
  });
});

describe('nodeState', () => {
  it('tier I is available on an unlearned building', () => {
    expect(nodeState(FARM, [], 'farm.tilled-rows')).toBe('available');
  });

  it('a tier waits for the learnable tier above it', () => {
    expect(nodeState(FARM, [], 'farm.granary-loft')).toBe('locked');
    expect(nodeState(FARM, ['farm.tilled-rows'], 'farm.granary-loft')).toBe('available');
  });

  it('a choice closes its sibling', () => {
    const learned = ['farm.tilled-rows', 'farm.granary-loft', 'farm.rotation'];
    expect(nodeState(FARM, learned, 'farm.rotation')).toBe('learned');
    expect(nodeState(FARM, learned, 'farm.scarecrow')).toBe('closed');
  });

  it('a node the game cannot apply yet is dormant, and does not block the tier below', () => {
    expect(nodeState(KEEP, ['keep.warded-walls'], 'keep.mustering-yard')).toBe('dormant');
    // Tiers II and III are all asleep on the Keep, so IV opens straight after I.
    expect(nodeState(KEEP, ['keep.warded-walls'], 'keep.council')).toBe('available');
    expect(isDormant(KEEP, WORKS_DEFS.keep.tree.tiers[4]!.nodes[0]!)).toBe(true);
  });

  it('a wider ring is learnable only where something reads the ring', () => {
    expect(isDormant(FARM, FARM.tree.tiers[2]!.nodes[0]!)).toBe(false); // Harvest pays per plain
    expect(isDormant(KEEP, KEEP.tree.tiers[2]!.nodes[1]!)).toBe(true); // Influence does nothing yet
  });

  it("the Tavern's board is what the Tavern already does — learnable", () => {
    expect(nodeState(WORKS_DEFS.tavern, [], 'tavern.quest-board')).toBe('available');
  });
});

describe('canResearch / researchNode', () => {
  it('refuses each way, in words the page can say', () => {
    expect(canResearch(FARM, [], 'farm.tilled-rows', RICH, false)).toEqual({ ok: false, refused: 'not-yours' });
    expect(canResearch(FARM, [], 'farm.nope', RICH, true)).toEqual({ ok: false, refused: 'unknown' });
    expect(canResearch(FARM, ['farm.tilled-rows'], 'farm.tilled-rows', RICH, true)).toEqual({ ok: false, refused: 'already' });
    expect(canResearch(FARM, [], 'farm.granary-loft', RICH, true)).toEqual({ ok: false, refused: 'locked' });
    expect(canResearch(KEEP, ['keep.warded-walls', 'keep.council'], 'keep.crown', RICH, true)).toEqual({ ok: false, refused: 'dormant' });
    expect(canResearch(FARM, [], 'farm.tilled-rows', EMPTY_POOL, true)).toEqual({ ok: false, refused: 'short' });
  });

  it('takes exactly the price and records the node', () => {
    const r = researchNode(FARM, [], 'farm.tilled-rows', { ...EMPTY_POOL, wood: 25 }, true);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.pool.wood).toBe(5);
    expect(r.learned).toEqual(['farm.tilled-rows']);
  });

  it('closed by choice is a refusal', () => {
    const learned = ['farm.tilled-rows', 'farm.granary-loft', 'farm.rotation'];
    expect(canResearch(FARM, learned, 'farm.scarecrow', RICH, true)).toEqual({ ok: false, refused: 'closed' });
  });
});

describe('level and reach', () => {
  it('level counts tiers, not nodes', () => {
    expect(worksLevel(KEEP, [])).toBe(0);
    expect(worksLevel(KEEP, ['keep.warded-walls', 'keep.council'])).toBe(2);
    expect(nodeCount(KEEP)).toBe(7);
  });

  it('reach grows with learned rings and stops at the cap', () => {
    expect(reachRings(FARM, [])).toBe(1);
    expect(reachRings(FARM, ['farm.tilled-rows', 'farm.granary-loft', 'farm.rotation'])).toBe(2);
    expect(reachRings(WORKS_DEFS.quarry, ['quarry.deep-gallery'])).toBe(2);
  });

  it('rings to cells: 6, 18, 36', () => {
    expect([0, 1, 2, 3].map(cellsInRings)).toEqual([0, 6, 18, 36]);
  });
});
