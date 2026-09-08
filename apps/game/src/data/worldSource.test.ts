/**
 * BRDC-SHARE-001, -003 — the client's read and write ends of the shared world.
 * The write end is now a POST to the Worker; the read end fetches its shards.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorldSource } from '@es3/core';
import {
  WORLD_API,
  fetchWorldShards,
  publishSubmission,
  worldSubmissionUrl,
} from './worldSource.js';

const SOURCE: WorldSource = {
  id: 'p1',
  name: 'Seeker',
  castle: '8b112492eb03fff',
  cells: [{ h3: '8b112492eb03fff', strength: 200 }],
};

afterEach(() => vi.unstubAllGlobals());

describe('fetchWorldShards', () => {
  it('returns only the shards that came back ok, and never throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === `${WORLD_API}/world/aaa`)
          return { ok: true, status: 200, text: async () => '{"region":"aaa"}' } as Response;
        if (url === `${WORLD_API}/world/bbb`) return { ok: true, status: 204 } as Response;
        throw new Error('network down');
      }),
    );

    const texts = await fetchWorldShards(['aaa', 'bbb', 'ccc']);
    expect(texts).toEqual(['{"region":"aaa"}']);
  });

  it('is empty when nothing is reachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    expect(await fetchWorldShards(['aaa'])).toEqual([]);
  });
});

describe('publishSubmission', () => {
  it('POSTs the sealed submission to the Worker and reports ok', async () => {
    const fetch = vi.fn(async () => ({ ok: true, status: 200 }) as Response);
    vi.stubGlobal('fetch', fetch);

    expect(await publishSubmission(SOURCE)).toBe('ok');
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${WORLD_API}/submit`);
    expect(init.method).toBe('POST');
    const body = JSON.parse(String(init.body));
    expect(typeof body.sum).toBe('string');
    expect(body.id).toBe('p1');
  });

  it('maps 429 to rate-limited and anything else to failed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 429 }) as Response));
    expect(await publishSubmission(SOURCE)).toBe('rate-limited');

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 }) as Response));
    expect(await publishSubmission(SOURCE)).toBe('failed');
  });

  it('is failed, not a throw, when the network is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    expect(await publishSubmission(SOURCE)).toBe('failed');
  });
});

describe('worldSubmissionUrl', () => {
  it('opens a prefilled, labelled issue on the repo — the manual fallback', () => {
    const url = new URL(worldSubmissionUrl(SOURCE));
    expect(url.origin + url.pathname).toBe('https://github.com/SamppaFIN/Eldritch/issues/new');
    expect(url.searchParams.get('labels')).toBe('world-submission');
    const body = JSON.parse(url.searchParams.get('body') ?? '');
    expect(typeof body.sum).toBe('string');
    expect(body.id).toBe('p1');
  });
});
