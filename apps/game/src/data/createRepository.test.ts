/**
 * BRDC-ECON-005 — the starter pouch is handed out once per game, not once per deploy.
 *
 * The regression this locks: `granted !== APP_VERSION` topped every resource back to its
 * floor on every version bump, so a player could never tell production from a gift.
 */
import { describe, expect, it } from 'vitest';
import { giftIsOwed } from './createRepository.js';

describe('giftIsOwed', () => {
  it('owes a brand new game its one starter pouch', () => {
    expect(giftIsOwed(null, false, true)).toBe(true);
  });

  it('never owes it twice, whatever version stamped it', () => {
    expect(giftIsOwed('0.4.0', false, false)).toBe(false);
    expect(giftIsOwed('0.5.39', true, false)).toBe(false);
  });

  it('refills a live game that is sitting on nothing at all', () => {
    expect(giftIsOwed('0.5.39', true, true)).toBe(true);
  });

  it('leaves an empty pouch alone before there is a Hearth to spend it from', () => {
    expect(giftIsOwed('0.5.39', false, true)).toBe(false);
  });
});
