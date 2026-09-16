/**
 * BRDC-CLAN-001 — the client's two calls to the Worker's clan endpoints.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WORLD_API } from './worldSource.js';
import { createClan, findClan } from './clanSource.js';

afterEach(() => vi.unstubAllGlobals());

describe('createClan', () => {
  it('POSTs the name and founder id, and reports the new code and token', async () => {
    const fetch = vi.fn(
      async () =>
        ({
          ok: true,
          status: 200,
          json: async () => ({ id: 'WYRM42', founderToken: 'secret-token' }),
        }) as Response,
    );
    vi.stubGlobal('fetch', fetch);

    const result = await createClan('The Pale March', 'p1');
    expect(result).toEqual({ ok: true, id: 'WYRM42', founderToken: 'secret-token' });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${WORLD_API}/clan`);
    expect(JSON.parse(String(init.body))).toEqual({ name: 'The Pale March', founderId: 'p1' });
  });

  it('is failed, not a throw, for a bad response or the network being down', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 }) as Response));
    expect(await createClan('X', 'p1')).toEqual({ ok: false, reason: 'failed' });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    expect(await createClan('X', 'p1')).toEqual({ ok: false, reason: 'failed' });
  });
});

describe('findClan', () => {
  it('reports the clan name for a code that exists', async () => {
    const fetch = vi.fn(
      async () =>
        ({ ok: true, status: 200, json: async () => ({ id: 'WYRM42', name: 'The Pale March' }) }) as Response,
    );
    vi.stubGlobal('fetch', fetch);

    expect(await findClan('wyrm42')).toEqual({ ok: true, id: 'WYRM42', name: 'The Pale March' });
    const [url] = fetch.mock.calls[0] as unknown as [string];
    expect(url).toBe(`${WORLD_API}/clan/wyrm42`);
  });

  it('tells a missing code apart from an unreachable Worker', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 }) as Response));
    expect(await findClan('NOPE00')).toEqual({ ok: false, reason: 'not-found' });

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 }) as Response));
    expect(await findClan('NOPE00')).toEqual({ ok: false, reason: 'failed' });
  });

  it('is failed, not a throw, when the network is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    expect(await findClan('NOPE00')).toEqual({ ok: false, reason: 'failed' });
  });
});
