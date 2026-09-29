/**
 * Citizens are born of food (BRDC-PROG-001).
 *
 * Eldritch-Progression.pdf, "Food Is the Clock": surplus food fills the Keep's granary;
 * when the box is full a citizen is born and the box empties. Housing caps the Keep — a
 * full Keep stops growth and the surplus is stored instead. If food goes negative the
 * granary drains first, and after `starveGraceH` hours at zero the least useful worker
 * leaves.
 *
 * Pure: `settleGranary` is handed the hourly food balance and how long it held, and says
 * what happened in that time. The store seam (and who leaves first) is PROG-002's.
 */
import { BALANCE, growBox } from './balance.js';

export interface Granary {
  citizens: number;
  /** Food in the box toward the next citizen, 0 … growBox(citizens). */
  box: number;
  /** Hours spent at an empty box while hungry, toward the next departure. */
  starvedH: number;
}

export const FIRST_GRANARY: Granary = { citizens: 1, box: 0, starvedH: 0 };

export interface GranaryResult {
  granary: Granary;
  born: number;
  left: number;
  /** Surplus that could not become a citizen (Keep full) — goes to the pouch. */
  stored: number;
}

/** Food per hour the realm makes before its citizens eat, minus what they eat. */
export const foodBalance = (producedPerH: number, citizens: number): number =>
  producedPerH - BALANCE.eatPerCitizen * citizens;

/**
 * Advance the granary `hours` at a fixed hourly food balance. The balance is held fixed
 * for the whole span; a caller that knows it changed (a birth adds a mouth) passes
 * shorter spans — `settleGranary` itself re-reads nothing.
 */
export function settleGranary(g: Granary, balancePerH: number, hours: number, housingCap: number): GranaryResult {
  let { citizens, box, starvedH } = g;
  let born = 0;
  let left = 0;
  let stored = 0;

  if (balancePerH >= 0) {
    starvedH = 0;
    let food = balancePerH * hours;
    while (food > 0) {
      if (citizens >= housingCap) {
        // A full Keep: top the box up, the rest is stored, not born.
        const room = Math.max(0, growBox(citizens) - box);
        box += Math.min(room, food);
        stored += Math.max(0, food - room);
        break;
      }
      const need = growBox(citizens) - box;
      if (food < need) {
        box += food;
        break;
      }
      food -= need;
      citizens += 1;
      born += 1;
      box = 0; // the box empties
    }
  } else {
    let hunger = -balancePerH * hours;
    const drained = Math.min(box, hunger);
    box -= drained;
    hunger -= drained;
    if (hunger > 0) {
      // The rest of the span is spent at an empty box.
      starvedH += hunger / -balancePerH;
      while (starvedH >= BALANCE.starveGraceH && citizens > 0) {
        starvedH -= BALANCE.starveGraceH;
        citizens -= 1;
        left += 1;
      }
    }
  }
  return { granary: { citizens, box, starvedH }, born, left, stored };
}

/** Hours until the next citizen at this balance, or null when none is coming. */
export function hoursToNextCitizen(g: Granary, balancePerH: number, housingCap: number): number | null {
  if (balancePerH <= 0 || g.citizens >= housingCap) return null;
  return (growBox(g.citizens) - g.box) / balancePerH;
}
