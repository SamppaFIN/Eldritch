/**
 * BRDC-SHARE-001 — the client's read and write ends of the shared world.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorldSource } from '@es3/core';
import { fetchWorldShards, worldSubmissionUrl } from './worldSource.js';

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
        if (url.endsWith('/world/aaa.json')) return { ok: true, text: async () => '{"region":"aaa"}' } as Response;
        if (url.endsWith('/world/bbb.json')) return { ok: false } as Response;
        throw new Error('network down');
      }),
    );

    const texts = await fetchWorldShards(['aaa', 'bbb', 'ccc'], '/base/');
    expect(texts).toEqual(['{"region":"aaa"}']);
  });

  it('is empty when nothing is reachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline');
    }));
    expect(await fetchWorldShards(['aaa'], '/base/')).toEqual([]);
  });
});

describe('worldSubmissionUrl', () => {
  it('opens a prefilled, labelled issue on the repo', () => {
    const url = new URL(worldSubmissionUrl(SOURCE));
    expect(url.origin + url.pathname).toBe('https://github.com/SamppaFIN/Eldritch/issues/new');
    expect(url.searchParams.get('labels')).toBe('world-submission');
    // The body is the signed submission — parseable JSON with a checksum.
    const body = JSON.parse(url.searchParams.get('body') ?? '');
    expect(typeof body.sum).toBe('string');
    expect(body.id).toBe('p1');
  });
});
