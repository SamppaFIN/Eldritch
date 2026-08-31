/**
 * The Keep, wired through the repository.
 */
import { describe, expect, it } from 'vitest';
import { haversine } from '../geo/haversine.js';
import { cellToLatLng } from 'h3-js';
import { CASTLE_MAX_RADIUS_M, CASTLE_MIN_RADIUS_M } from '../rules/constants.js';
import { destination } from '../geo/project.js';
import { MockRepository } from './MockRepository.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-08-28T09:00:00Z');

describe('the Keep', () => {
  it('is null until a Hearth has been accepted', async () => {
    const repo = new MockRepository({ seed: 7 });
    expect(await repo.getCastle()).toBeNull();
  });

  it('appears the moment a Hearth is accepted, near it but not on it', async () => {
    const repo = new MockRepository({ seed: 7 });
    await repo.setHome(ORIGIN, T0);

    const castle = await repo.getCastle();
    expect(castle).not.toBeNull();
    if (!castle) return;

    const [lat, lng] = cellToLatLng(castle);
    const distance = haversine(ORIGIN, { lat, lng });
    expect(distance).toBeGreaterThanOrEqual(CASTLE_MIN_RADIUS_M - 50);
    expect(distance).toBeLessThanOrEqual(CASTLE_MAX_RADIUS_M + 50);
  });

  it('stays put across repeated reads of the same Hearth', async () => {
    const repo = new MockRepository({ seed: 7 });
    await repo.setHome(ORIGIN, T0);

    const first = await repo.getCastle();
    const second = await repo.getCastle();
    expect(second).toBe(first);
  });

  it('gets a fresh Keep when the Hearth moves, same as the Hearth itself does', async () => {
    const repo = new MockRepository({ seed: 7 });
    await repo.setHome(ORIGIN, T0);
    const firstCastle = await repo.getCastle();

    await repo.setHome(destination(ORIGIN, 90, 5_000), T0);
    const secondCastle = await repo.getCastle();

    expect(secondCastle).not.toBe(firstCastle);
  });

  it('two players standing in the same spot get different Keeps', async () => {
    const a = new MockRepository({ seed: 7 });
    const b = new MockRepository({ seed: 7 });
    await a.setHome(ORIGIN, T0);
    await b.setHome(ORIGIN, T0);

    expect(await a.getCastle()).not.toBe(await b.getCastle());
  });

  it('is forgotten by a reset, same as the Hearth', async () => {
    const repo = new MockRepository({ seed: 7 });
    await repo.setHome(ORIGIN, T0);
    await repo.resetAll();
    expect(await repo.getCastle()).toBeNull();
  });
});
