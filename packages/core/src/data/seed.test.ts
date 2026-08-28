/**
 * The neighbourhood a player is dropped into.
 */
import { describe, expect, it } from 'vitest';
import { gridDisk } from 'h3-js';
import { BASE_STRENGTH } from '../rules/constants.js';
import { SEED_NEIGHBOURS, seedCells } from './seed.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-08-28T09:00:00Z');

describe('seedCells', () => {
  const cells = seedCells(ORIGIN, T0);
  const owned = new Set(cells.map((c) => c.h3));

  it('gives every rival ground', () => {
    for (const n of SEED_NEIGHBOURS) {
      expect(cells.filter((c) => c.ownerId === n.id).length).toBeGreaterThan(5);
    }
  });

  it('leaves no holes inside a rival territory', () => {
    /*
     * The ragged-edge roll used to apply to every cell, so it punched gaps through the
     * middle of a blob — and the map draws a gap exactly like ground somebody has
     * fought their way into. Three neighbourhoods looked half-besieged on first launch.
     *
     * A cell all six of whose neighbours are owned by the same rival, but which is
     * itself empty, is such a hole.
     */
    const byOwner = new Map(cells.map((c) => [c.h3, c.ownerId]));
    const holes: string[] = [];

    for (const [h3, ownerId] of byOwner) {
      for (const ring of gridDisk(h3, 1)) {
        if (owned.has(ring)) continue;
        const around = gridDisk(ring, 1).filter((n) => n !== ring);
        if (around.every((n) => byOwner.get(n) === ownerId)) holes.push(ring);
      }
    }

    expect(holes).toEqual([]);
  });

  it('still has ragged edges — a perfect hexagon reads as generated', () => {
    // The blobs must not be complete disks either, or the fix has gone too far.
    const disks = SEED_NEIGHBOURS.map(
      (n) => cells.filter((c) => c.ownerId === n.id).length,
    );
    expect(disks.some((count) => count !== 19 && count !== 37)).toBe(true);
  });

  it('never starts a rival below the strength the map draws as contested', () => {
    expect(Math.min(...cells.map((c) => c.strength))).toBeGreaterThanOrEqual(BASE_STRENGTH);
  });

  it('is deterministic for a given seed', () => {
    expect(seedCells(ORIGIN, T0, 99).map((c) => c.h3)).toEqual(
      seedCells(ORIGIN, T0, 99).map((c) => c.h3),
    );
  });
});
