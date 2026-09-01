import { describe, expect, it } from 'vitest';
import { EMPTY_POOL } from './terrain.js';
import type { ResourcePool } from './terrain.js';
import { applyChoice, parseChains } from './chain.js';
import type { Chain } from './chain.js';
import bundle from '../data/chains.json';

const pool = (over: Partial<ResourcePool> = {}): ResourcePool => ({ ...EMPTY_POOL, ...over });

describe('parseChains', () => {
  it('accepts the shipped bundle', () => {
    const chains = parseChains(bundle);
    expect(Object.keys(chains).length).toBeGreaterThan(0);
    for (const c of Object.values(chains)) expect(c.stages.length).toBeGreaterThan(0);
  });

  it('rejects a chain with no stages', () => {
    expect(() => parseChains({ bad: { stages: [] } })).toThrow(/stages/);
  });

  it('rejects a stage with no choices', () => {
    expect(() => parseChains({ bad: { stages: [{ text: 'x', choices: [] }] } })).toThrow(/choice/);
  });

  it('rejects a choice whose next points past the last stage', () => {
    expect(() =>
      parseChains({ bad: { stages: [{ text: 'x', choices: [{ text: 'y', next: 9 }] }] } }),
    ).toThrow(/out of range/);
  });
});

const chain: Chain = {
  id: 't',
  stages: [
    { text: 's0', choices: [{ text: 'pay', effect: { pool: { wisdom: -10, gold: 5 }, xp: 3 }, next: 1 }] },
    { text: 's1', choices: [{ text: 'done', next: 'end' }] },
  ],
};

describe('applyChoice', () => {
  it('applies the effect and returns where the chain goes next', () => {
    const r = applyChoice(chain, 0, 0, pool({ wisdom: 20 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.pool.wisdom).toBe(10);
    expect(r.pool.gold).toBe(5);
    expect(r.xp).toBe(3);
    expect(r.next).toBe(1);
  });

  it('refuses a bad stage or choice index', () => {
    expect(applyChoice(chain, 9, 0, pool())).toEqual({ ok: false, refused: 'no-such-stage' });
    expect(applyChoice(chain, 0, 9, pool())).toEqual({ ok: false, refused: 'no-such-choice' });
  });

  it('refuses an effect it cannot pay for', () => {
    expect(applyChoice(chain, 0, 0, pool({ wisdom: 3 }))).toEqual({
      ok: false,
      refused: 'cannot-afford',
    });
  });

  it('ends the chain', () => {
    const r = applyChoice(chain, 1, 0, pool());
    expect(r.ok && r.next).toBe('end');
  });
});
