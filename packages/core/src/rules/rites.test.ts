import { describe, expect, it } from 'vitest';
import {
  EMPTY_BOOK,
  RITES,
  RITE_COOLDOWN_MS,
  RITE_IDS,
  castRite,
  dedicate,
  deepenRite,
  learnCost,
  learnRite,
  rankCeiling,
  riteText,
  rivalRite,
  schoolSlots,
  tierCeiling,
} from './rites.js';
import type { LoreId } from './lore.js';

const AGE_II: LoreId[] = ['husbandry', 'woodcraft', 'kindling', 'ley-reading'];
const AGE_III: LoreId[] = [...AGE_II, 'granaries', 'stone-and-bellows'];

describe('the three schools', () => {
  it('has 21 rites, seven a school, and tiers III and V are a choice of two', () => {
    expect(RITE_IDS).toHaveLength(21);
    for (const school of ['ward', 'tide', 'whisper'] as const) {
      const tiers = RITE_IDS.filter((id) => RITES[id].school === school).map((id) => RITES[id].tier);
      expect(tiers.sort()).toEqual([1, 2, 3, 3, 4, 5, 5]);
    }
    expect(rivalRite('drowned-harvest')).toBe('undertow');
    expect(rivalRite('call-the-shoal')).toBeNull();
    expect(riteText('call-the-shoal', 2)).toBe('A Farmstead gains +6 food/h for 12 h.');
  });

  it('Kindling opens one school and tier I; Ley Reading a second and tier II; then the Age', () => {
    expect(schoolSlots([])).toBe(0);
    expect(schoolSlots(['kindling'])).toBe(1);
    expect(schoolSlots(AGE_II)).toBe(2);
    expect(tierCeiling([])).toBe(0);
    expect(tierCeiling(['kindling'])).toBe(1);
    expect(tierCeiling(AGE_III)).toBe(3);
    expect(rankCeiling(1)).toBe(1);
    expect(rankCeiling(5)).toBe(3);
  });

  it('dedicates within the slots, learns within the tier, and a choice closes its twin', () => {
    const d = dedicate(EMPTY_BOOK, 'tide', ['kindling']);
    expect(d.ok).toBe(true);
    if (!d.ok) return;
    expect(dedicate(d.book, 'ward', ['kindling'])).toEqual({ ok: false, refused: 'no-slot' });
    expect(learnRite(d.book, 'salt-circle', ['kindling'], 999)).toEqual({ ok: false, refused: 'not-dedicated' });
    expect(learnRite(d.book, 'brackish-blessing', ['kindling'], 999)).toEqual({ ok: false, refused: 'sealed' });
    const shoal = learnRite(d.book, 'call-the-shoal', ['kindling'], 100);
    expect(shoal.ok && shoal.mana).toBe(100 - learnCost('call-the-shoal'));
    const harvest = learnRite(d.book, 'drowned-harvest', AGE_III, 999);
    expect(harvest.ok).toBe(true);
    if (!harvest.ok) return;
    expect(learnRite(harvest.book, 'undertow', AGE_III, 999)).toEqual({ ok: false, refused: 'closed' });
  });

  it('deepens to the Age, casts for mana, and rests a day between casts', () => {
    const book = { schools: ['tide' as const], learned: { 'call-the-shoal': 1 as const }, castAt: {} };
    expect(deepenRite(book, 'call-the-shoal', ['kindling'], 999)).toEqual({ ok: false, refused: 'max-rank' });
    const deeper = deepenRite(book, 'call-the-shoal', AGE_II, 999);
    expect(deeper.ok && deeper.book.learned['call-the-shoal']).toBe(2);

    const cast = castRite(book, 'call-the-shoal', 25, 1_000);
    expect(cast).toMatchObject({ ok: true, rank: 1, mana: 5 });
    if (!cast.ok) return;
    expect(castRite(cast.book, 'call-the-shoal', 99, 1_000 + RITE_COOLDOWN_MS - 1)).toEqual({ ok: false, refused: 'cooling' });
    expect(castRite(cast.book, 'call-the-shoal', 99, 1_000 + RITE_COOLDOWN_MS).ok).toBe(true);
    expect(castRite(book, 'call-the-shoal', 19, 1_000)).toEqual({ ok: false, refused: 'cannot-afford' });
  });
});
