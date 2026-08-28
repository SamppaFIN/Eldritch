/**
 * A challenge crossing between two games, through the repository.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { destination } from '../geo/project.js';
import { MockRepository } from './MockRepository.js';
import type { TrailPoint } from '../types/domain.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const T0 = Date.parse('2026-08-28T18:00:00Z');
const BOX = {
  west: ORIGIN.lng - 0.02,
  east: ORIGIN.lng + 0.02,
  south: ORIGIN.lat - 0.02,
  north: ORIGIN.lat + 0.02,
};

function walk(from = ORIGIN, startT = T0): TrailPoint[] {
  return Array.from({ length: 20 }, (_, i) => ({
    ...destination(from, 0, i * 14),
    t: startT + i * 10_000,
    accuracy: 8,
  }));
}

/** A player who has been out walking and holds real ground. */
async function played(seed: number, from = ORIGIN) {
  const repo = new MockRepository({ seed });
  await repo.setHome(from, T0);
  const run = await repo.startRun(T0);
  await repo.submitTrail(run, walk(from));
  return repo;
}

/** Four hundred metres east: a different street, which is the ordinary case. */
const ELSEWHERE = destination(ORIGIN, 90, 400);

describe('the Wager, carried by hand', () => {
  let sender: MockRepository;
  let receiver: MockRepository;

  beforeEach(async () => {
    sender = await played(3, ELSEWHERE);
    receiver = await played(9);
  });

  it('gives the sender ground on the receiver\'s map', async () => {
    const them = await sender.getProfile();
    const text = await sender.exportChallenge(T0);

    const result = await receiver.importChallenge(text, T0);
    expect(result.ok).toBe(true);

    const theirs = (await receiver.getCells(BOX, T0)).filter((c) => c.ownerId === them.id);
    expect(theirs.length).toBeGreaterThan(0);
  });

  it('never takes the receiver\'s own ground', async () => {
    /*
     * The two players walked the same street, so their claims overlap completely. A
     * message from a friend is not a capture, and corrupting the receiver's map is not a
     * game mechanic — every cell they walked for is still theirs afterwards.
     */
    const me = await receiver.getProfile();
    const before = (await receiver.getOwnedCells(T0)).map((c) => c.h3).sort();

    await receiver.importChallenge(await sender.exportChallenge(T0), T0);

    const after = (await receiver.getOwnedCells(T0)).map((c) => c.h3).sort();
    expect(after).toEqual(before);
    expect((await receiver.getCells(BOX, T0)).some((c) => c.ownerId === me.id)).toBe(true);
  });

  it('refuses a challenge the player exported themselves', async () => {
    const text = await sender.exportChallenge(T0);
    expect(await sender.importChallenge(text, T0)).toEqual({ ok: false, fault: 'yourself' });
  });

  it('refuses a message that arrived damaged, and changes nothing', async () => {
    const before = (await receiver.getCells(BOX, T0)).length;
    const text = (await sender.exportChallenge(T0)).replace(/"strength": \d+/, '"strength": 500');

    expect(await receiver.importChallenge(text, T0)).toEqual({ ok: false, fault: 'damaged' });
    expect((await receiver.getCells(BOX, T0)).length).toBe(before);
  });

  it('sends ground that is still standing, not ground the Void already took', async () => {
    // Exported forty days later: everything of theirs has decayed away, and an empty
    // challenge is the honest thing to send.
    const late = T0 + 40 * 86_400_000;
    const text = await sender.exportChallenge(late);
    expect(JSON.parse(text).cells).toEqual([]);
  });

  it('carries their Anchor Stone', async () => {
    const text = await sender.exportChallenge(T0);
    expect(JSON.parse(text).home).toBe(await sender.getHome());
  });

  it('decays on the receiver\'s clock, from the moment it landed', async () => {
    const them = await sender.getProfile();
    await receiver.importChallenge(await sender.exportChallenge(T0), T0 + 10 * 86_400_000);

    const theirs = (await receiver.getCells(BOX, T0 + 10 * 86_400_000)).filter(
      (c) => c.ownerId === them.id,
    );
    expect(theirs.every((c) => c.lastVisitedAt === T0 + 10 * 86_400_000)).toBe(true);
  });
});
