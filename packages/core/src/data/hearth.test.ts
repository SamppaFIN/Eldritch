/**
 * Accepting a Hearth — what the first screen of the game actually writes.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { destination } from '../geo/project.js';
import { cellAt } from '../geo/cells.js';
import { BASE_STRENGTH } from '../rules/constants.js';
import { MockRepository } from './MockRepository.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-08-28T09:00:00Z');

describe('the Hearth', () => {
  let repo: MockRepository;

  beforeEach(() => {
    repo = new MockRepository({ seed: 7 });
  });

  it('is null until the player accepts one', async () => {
    expect(await repo.getHome()).toBeNull();
  });

  it('claims the ground it stands on, so the map is never empty afterwards', async () => {
    const h3 = await repo.setHome(ORIGIN, T0);
    const me = await repo.getProfile();

    const owned = await repo.getOwnedCells(T0);
    expect(owned.map((c) => c.h3)).toContain(h3);
    expect(owned.find((c) => c.h3 === h3)).toMatchObject({
      ownerId: me.id,
      strength: BASE_STRENGTH,
    });
  });

  it('holds the Anchor Stone from the moment it is accepted', async () => {
    const h3 = await repo.setHome(ORIGIN, T0);
    // No time has been spent anywhere yet. The Hearth is an Anchor by agreement, not
    // by dwell, and a player must see it on the map on their first walk.
    const places = await repo.getPlaces();
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({ h3, kind: 'anchor', dwellMs: 0, rank: 0 });
  });

  it('seeds the world, so rivals exist before the first step', async () => {
    await repo.setHome(ORIGIN, T0);
    const box = {
      west: ORIGIN.lng - 0.02,
      east: ORIGIN.lng + 0.02,
      south: ORIGIN.lat - 0.02,
      north: ORIGIN.lat + 0.02,
    };
    expect((await repo.getCells(box, T0)).length).toBeGreaterThan(1);
  });

  it('moves when set again, which is what a deliberate restart needs', async () => {
    const first = await repo.setHome(ORIGIN, T0);
    const second = await repo.setHome(destination(ORIGIN, 90, 800), T0);

    expect(second).not.toBe(first);
    expect(await repo.getHome()).toBe(second);
    expect((await repo.getPlaces())[0]?.h3).toBe(second);
  });

  it('is forgotten by a reset', async () => {
    await repo.setHome(ORIGIN, T0);
    await repo.resetAll();
    expect(await repo.getHome()).toBeNull();
  });

  it('lands in the cell the player was standing in', async () => {
    expect(await repo.setHome(ORIGIN, T0)).toBe(cellAt(ORIGIN));
  });
});
