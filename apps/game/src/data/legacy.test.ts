/**
 * BRDC-HALL-003 — the client's calls to the Worker's Chronicles endpoint.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HallOfFameEntry } from '@es3/core';
import { WORLD_API } from './worldSource.js';
import { fetchLegacy, publishLegacy } from './legacy.js';

afterEach(() => vi.unstubAllGlobals());

const entry: HallOfFameEntry = {
  id: 'kingdom-1',
  name: 'Pyynikin Poika',
  retiredAt: 5_000,
  level: 4,
  xp: 1_500,
  cells: 3,
  areaM2: 6_000,
  population: 12,
  provinces: 2,
  achievements: 1,
  secretSites: 0,
  wonders: 0,
  cipherShards: 0,
  era: 'Stone Age',
};

describe('publishLegacy', () => {
  it('POSTs the entry with the player id folded in, and reports success', async () => {
    const fetch = vi.fn(async () => ({ ok: true, status: 200 }) as Response);
    vi.stubGlobal('fetch', fetch);

    expect(await publishLegacy('p1', entry)).toBe(true);

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${WORLD_API}/legacy`);
    expect(JSON.parse(String(init.body))).toEqual({ ...entry, playerId: 'p1' });
  });

  it('is false, never a throw, for a bad response or the network being down', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 }) as Response));
    expect(await publishLegacy('p1', entry)).toBe(false);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    expect(await publishLegacy('p1', entry)).toBe(false);
  });
});

describe('fetchLegacy', () => {
  it('returns the published entries', async () => {
    const entries = [{ ...entry, playerId: 'p1' }];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ entries }) }) as Response),
    );

    expect(await fetchLegacy()).toEqual(entries);
  });

  it('tells an empty Chronicles apart from an unreachable Worker', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 204 }) as Response));
    expect(await fetchLegacy()).toEqual([]);

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 }) as Response));
    expect(await fetchLegacy()).toBeNull();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    expect(await fetchLegacy()).toBeNull();
  });
});
