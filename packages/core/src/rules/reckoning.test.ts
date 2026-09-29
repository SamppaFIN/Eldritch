import { describe, expect, it } from 'vitest';
import { rankOf, riteDamage, sealDamage, strikeDamage } from './reckoning.js';
import type { Roll } from './investigator.js';

const roll = (successes: number): Roll => ({ faces: [], successes, need: 1, pass: successes >= 1, luck: 'normal' });
const plain = { fortresses: 0, cathedral: false, lampPct: 0 };

describe('the Reckoning (BRDC-DOOM-004)', () => {
  it('a strike lands per success; a miss deals nothing', () => {
    expect(strikeDamage(roll(0), { ...plain, fortresses: 3 })).toBe(0);
    expect(strikeDamage(roll(2), plain)).toBe(200);
  });

  it('Fortresses add their weight, the Lamp its share, a Cathedral doubles rites', () => {
    expect(strikeDamage(roll(2), { ...plain, fortresses: 2 })).toBe(300);
    expect(strikeDamage(roll(2), { ...plain, lampPct: 40 })).toBe(280);
    expect(riteDamage(plain)).toBe(150);
    expect(riteDamage({ ...plain, cathedral: true })).toBe(300);
    expect(sealDamage({ ...plain, lampPct: 25 })).toBe(250);
  });

  it('ranks by damage dealt', () => {
    const s = [{ realm: 'a', damage: 10 }, { realm: 'b', damage: 400 }, { realm: 'c', damage: 90 }];
    expect(rankOf(s, 'b')).toBe(1);
    expect(rankOf(s, 'a')).toBe(3);
    expect(rankOf(s, 'z')).toBe(4);
  });
});
