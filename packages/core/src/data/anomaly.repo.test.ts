/**
 * BRDC-EVENT-001 — anomalies through the repository.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { ANOMALY_INVESTIGATE_MS, EMPTY_POOL, anomalyAt, cellAt, neighboursOf } from '@es3/core';
import { MockRepository } from './MockRepository.js';
import { MemoryStore } from './kv.js';
import { K } from './keys.js';
import { SCHEMA_KEY, SCHEMA_VERSION } from './schema.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-09-01T12:00:00Z');
const DONE = T0 + ANOMALY_INVESTIGATE_MS;

/** Real cells grown from a hash-terrain origin, split by anomaly kind. */
function sample(n = 4000): string[] {
  const start = cellAt({ lat: 62.6, lng: 25.7 });
  const seen = new Set<string>([start]);
  const queue = [start];
  while (seen.size < n && queue.length) {
    for (const nb of neighboursOf(queue.shift() as string)) {
      if (!seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
      }
    }
  }
  return [...seen];
}
const CELLS = sample();
const REWARD = CELLS.find((h) => anomalyAt(h) === 'reward') as string;
const CHAIN = CELLS.find((h) => anomalyAt(h) === 'chain') as string;

let repo: MockRepository;
let store: MemoryStore;

beforeEach(async () => {
  store = new MemoryStore();
  await store.set(SCHEMA_KEY, SCHEMA_VERSION);
  await store.set('resources', { pool: { ...EMPTY_POOL, food: 100 }, since: T0, sinceDay: T0 });
  repo = new MockRepository({ store, newId: () => 'me', seed: 7 });
});

const own = (h3: string): Promise<void> =>
  store.set(K.cell(h3), { h3, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] } as Cell);

describe('the anomaly flow', () => {
  it('lists a held rare cell as dormant', async () => {
    await own(REWARD);
    const [a] = await repo.getAnomalies(T0);
    expect(a).toMatchObject({ h3: REWARD, state: 'dormant' });
  });

  it('investigating spends food and starts the clock; the reward waits for the resolve', async () => {
    await own(REWARD);
    expect((await repo.investigateAnomaly(REWARD, T0)).ok).toBe(true);
    expect((await repo.getResources(T0)).food).toBe(80);
    expect((await repo.getAnomalies(T0)).find((x) => x.h3 === REWARD)?.state).toBe('investigating');

    // Halfway: still nothing.
    expect((await repo.getResources(T0 + ANOMALY_INVESTIGATE_MS / 2)).food).toBe(80);

    const before = (await repo.getResources(DONE)).food;
    const r = await repo.resolveAnomaly(REWARD, DONE);
    expect(r.ok && r.reward).not.toBeNull();
    const after = (await repo.getResources(DONE)).food;
    // The reward may or may not be food, but the pouch grew by something.
    expect(after).toBeGreaterThanOrEqual(before);

    // Spent — a second resolve is refused, and it drops off the list.
    expect(await repo.resolveAnomaly(REWARD, DONE)).toEqual({ ok: false, refused: 'nothing-here' });
    expect((await repo.getAnomalies(DONE)).some((x) => x.h3 === REWARD)).toBe(false);

    const log = await repo.getLog();
    expect(log.some((e) => e.kind === 'anomaly')).toBe(true);
  });

  it('a chain anomaly opens its story, and a choice moves it on', async () => {
    await own(CHAIN);
    await repo.investigateAnomaly(CHAIN, T0);

    const opened = await repo.resolveAnomaly(CHAIN, DONE);
    expect(opened.ok && opened.chainOpened).toBe(true);

    const a = (await repo.getAnomalies(DONE)).find((x) => x.h3 === CHAIN);
    expect(a?.state).toBe('chain');
    expect(a?.stage?.text.length).toBeGreaterThan(0);
    expect((a?.stage?.choices.length ?? 0)).toBeGreaterThan(0);

    const chosen = await repo.chooseInChain(CHAIN, 0, DONE);
    expect(chosen.ok).toBe(true);
    if (!chosen.ok) return;
    // Either it advanced to another stage or it ended.
    const after = (await repo.getAnomalies(DONE)).find((x) => x.h3 === CHAIN);
    if (chosen.next === 'end') expect(after).toBeUndefined();
    else expect(after?.state).toBe('chain');
  });

  it('refuses to resolve before the clock is up', async () => {
    await own(REWARD);
    await repo.investigateAnomaly(REWARD, T0);
    expect(await repo.resolveAnomaly(REWARD, T0 + 60_000)).toEqual({ ok: false, refused: 'not-ready' });
  });
});
