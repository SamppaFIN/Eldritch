import { describe, expect, it } from 'vitest';
import { walksToTake } from './siege.js';
import { MAX_STRENGTH } from '../rules/constants.js';

/**
 * The siege, measured (BRDC-CLAIM-016).
 *
 * `claude.md` §11 promises: *"Taking someone's established home block should require two
 * or three separate walks on separate days."* Every constant behind that came from v2 and
 * none had been run in this game. These are the answers, and they are pinned here so the
 * next person to touch a constant finds out immediately which promise they moved.
 *
 * Established means what it says: a cell at MAX_STRENGTH whose holder is still walking it.
 */
const ESTABLISHED = { defenderStrength: MAX_STRENGTH, defenderHolds: true };

describe('taking an established home block', () => {
  it('keeps §11 promise for a besieger pushing in from their own ground', () => {
    // Six owned neighbours is a besieger whose realm already wraps the cell — the case
    // the sentence is actually about.
    const r = walksToTake({ ...ESTABLISHED, attackerLevel: 5, attackerNeighbours: 6 });
    expect(r.walks).toBe(3);
  });

  it('holds across the levels a real player passes through', () => {
    for (const level of [5, 10, 20]) {
      const r = walksToTake({ ...ESTABLISHED, attackerLevel: level, attackerNeighbours: 6 });
      expect(r.walks, `level ${level}`).toBeGreaterThanOrEqual(2);
      expect(r.walks, `level ${level}`).toBeLessThanOrEqual(3);
    }
  });

  it('costs a stranger with no ground of their own far more', () => {
    /*
     * Not a fault: the game is adjacency-first, and someone who borders nothing should
     * not be able to walk in and take a block. Recorded because it is the other end of
     * the range, and because "why does this take six walks" has an answer now.
     */
    const r = walksToTake({ ...ESTABLISHED, attackerLevel: 5, attackerNeighbours: 0 });
    expect(r.walks).toBe(6);
  });

  it('FINDING: the Anchor Stone erases every other input', () => {
    /*
     * ANCHOR_BONUS is 200 against a MAX_STRENGTH of 500, so an anchored attack lands at
     * least 305 and any cell in the game falls in exactly two walks. Measured across the
     * whole matrix: level, owned neighbours and whether the holder is still walking their
     * block all stop mattering the moment an anchor backs the attack.
     *
     * §11's own warning is *"do not simplify this back to a single comparison"* — and at
     * 200 the anchor is that single comparison. This test does not call that wrong; it
     * makes it impossible to change the constant without seeing what it was doing.
     */
    const anchored = [
      { attackerLevel: 1, attackerNeighbours: 0 },
      { attackerLevel: 20, attackerNeighbours: 6 },
      { attackerLevel: 5, attackerNeighbours: 2 },
    ].map((a) => walksToTake({ ...ESTABLISHED, ...a, anchored: true }).walks);

    expect(anchored).toEqual([2, 2, 2]);
  });

  it('a Fortress aura buys the holder walks back', () => {
    const bare = walksToTake({ ...ESTABLISHED, attackerLevel: 5, attackerNeighbours: 6 });
    const warded = walksToTake({
      ...ESTABLISHED,
      attackerLevel: 5,
      attackerNeighbours: 6,
      defence: 80,
    });
    expect(warded.walks).toBeGreaterThan(bare.walks as number);
  });
});

describe('bringing down a Fortress (BRDC-BUILD-012)', () => {
  /*
   * Its ground never decays, so a siege is the only way a Fortress ever falls. These make
   * sure that way exists — and that it is a siege, not a single walk.
   */
  const FORTIFIED = {
    defenderStrength: MAX_STRENGTH,
    attackerLevel: 5,
    attackerNeighbours: 6,
    fortress: true,
  };

  it('falls, even when its owner walks it every day', () => {
    const r = walksToTake({ ...FORTIFIED, defenderHolds: true });
    expect(r.razedOn).not.toBeNull();
    expect(r.walks).not.toBeNull();
  });

  it('takes more than one walk to bring down, and the ground falls only after it', () => {
    const r = walksToTake({ ...FORTIFIED, defenderHolds: true });
    expect(r.razedOn as number).toBeGreaterThan(1);
    expect(r.walks as number).toBeGreaterThan(r.razedOn as number);
  });

  it('costs more walks than the same block unfortified', () => {
    const bare = walksToTake({ ...FORTIFIED, fortress: false, defenderHolds: true });
    const fort = walksToTake({ ...FORTIFIED, defenderHolds: true });
    expect(fort.walks as number).toBeGreaterThan(bare.walks as number);
  });

  it('an abandoned Fortress does not rot, but a patient siege still brings it down', () => {
    const r = walksToTake({ ...FORTIFIED, defenderHolds: false });
    expect(r.razedOn).not.toBeNull();
    expect(r.walks).not.toBeNull();
  });
});
