import { describe, expect, it } from 'vitest';
import { rewardLine } from './AdventureDialog.js';

describe('a closed tale’s rewards (BRDC-QUEST-008)', () => {
  it('reads XP first, then what the pouch gained or paid', () => {
    expect(rewardLine({ xp: 560, pool: { wisdom: -20, gold: 5 } })).toBe('+560 XP · −20 wisdom · +5 gold');
    expect(rewardLine({ xp: 0, pool: {} })).toBe('');
  });
});
