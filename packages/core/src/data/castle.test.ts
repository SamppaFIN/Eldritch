/**
 * The Keep, wired through the repository.
 *
 * Since 2026-09-01 the Keep is the Hearth cell itself — Infinite reversed the decoy after
 * testing it (BRDC-CASTLE-001). It is now the published location, not a secret.
 */
import { describe, expect, it } from 'vitest';
import { destination } from '../geo/project.js';
import { MockRepository } from './MockRepository.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-08-28T09:00:00Z');

describe('the Keep', () => {
  it('is null until a Hearth has been accepted', async () => {
    const repo = new MockRepository({ seed: 7 });
    expect(await repo.getCastle()).toBeNull();
  });

  it('is the Hearth cell, the moment a Hearth is accepted', async () => {
    const repo = new MockRepository({ seed: 7 });
    const home = await repo.setHome(ORIGIN, T0);
    expect(await repo.getCastle()).toBe(home);
  });

  it('stays put across repeated reads of the same Hearth', async () => {
    const repo = new MockRepository({ seed: 7 });
    await repo.setHome(ORIGIN, T0);
    expect(await repo.getCastle()).toBe(await repo.getCastle());
  });

  it('moves with the Hearth', async () => {
    const repo = new MockRepository({ seed: 7 });
    await repo.setHome(ORIGIN, T0);
    const first = await repo.getCastle();

    await repo.setHome(destination(ORIGIN, 90, 5_000), T0);
    expect(await repo.getCastle()).not.toBe(first);
  });

  it('two players standing in the same spot share it — it is a place, not a secret', async () => {
    const a = new MockRepository({ seed: 7 });
    const b = new MockRepository({ seed: 9 });
    await a.setHome(ORIGIN, T0);
    await b.setHome(ORIGIN, T0);
    expect(await a.getCastle()).toBe(await b.getCastle());
  });

  it('is forgotten by a reset, same as the Hearth', async () => {
    const repo = new MockRepository({ seed: 7 });
    await repo.setHome(ORIGIN, T0);
    await repo.resetAll();
    expect(await repo.getCastle()).toBeNull();
  });
});
