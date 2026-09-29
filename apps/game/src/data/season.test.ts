/** BRDC-SEASON-002 — the client's read of the shared season. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openSeason } from '@es3/core';
import { fetchSeason } from './season.js';

afterEach(() => vi.unstubAllGlobals());

const reply = (status: number, body?: unknown) =>
  vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status }));

describe('fetchSeason', () => {
  it('returns the season the Worker holds', async () => {
    const season = openSeason(2, 'The Low Water', 'seed-2', 1_000);
    vi.stubGlobal('fetch', reply(200, season));
    expect(await fetchSeason()).toEqual(season);
  });

  it('is null before any season is opened, on junk, and offline', async () => {
    vi.stubGlobal('fetch', reply(204));
    expect(await fetchSeason()).toBeNull();
    vi.stubGlobal('fetch', reply(200, { hello: 1 }));
    expect(await fetchSeason()).toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    expect(await fetchSeason()).toBeNull();
  });
});
