import { describe, expect, it } from 'vitest';
import { CODEX_CARDS, counselOf } from './counsel.js';
import type { CounselState } from './counsel.js';

const calm: CounselState = {
  foodBalance: 4, granaryBox: 20, gatesNear: 0, storesLeftH: 6, idle: 0, emptyWork: null, toNextAge: 2,
  masterworkNearly: null, citizens: 3, housing: 6, granaryFill: 0.2, cheapestTech: { name: 'Husbandry', cost: 30 },
};

describe('the Keeper’s Counsel (BRDC-COUNSEL-001)', () => {
  it('with nothing urgent, suggests the cheapest tech', () => {
    expect(counselOf(calm)).toEqual([{ id: 'quiet', title: 'Nothing urgent', why: 'Study Husbandry — 30 wisdom.', where: 'lore' }]);
  });

  it('puts starving first, then gates, full stores and an idle citizen, in the document’s order', () => {
    const all = counselOf({
      ...calm, foodBalance: -4, granaryBox: 8, gatesNear: 1, storesLeftH: 0, idle: 1, emptyWork: 'Watchtower',
      toNextAge: 1, masterworkNearly: { name: 'The Fortress', missing: 'Lore · signal-fires' }, citizens: 6, granaryFill: 0.9,
    });
    expect(all.map((c) => c.id)).toEqual(['starving', 'gate-near', 'stores-full', 'idle', 'age-near', 'masterwork-near', 'housing-full']);
    expect(all.find((c) => c.id === 'idle')?.why).toContain('Watchtower');
  });

  it('a hungry realm with a full granary is not yet starving', () => {
    expect(counselOf({ ...calm, foodBalance: -2, granaryBox: 30 }).map((c) => c.id)).toEqual(['quiet']);
  });

  it('keeps its codex cards short', () => {
    expect(CODEX_CARDS.every((c) => c.text.split(/[.!?]/).every((s) => s.trim().split(/\s+/).length < 20))).toBe(true);
  });
});
