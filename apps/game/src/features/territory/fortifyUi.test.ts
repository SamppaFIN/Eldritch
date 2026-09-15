/**
 * BRDC-BUILD-012, part C — the UI stops promising decay on ground that cannot decay.
 *
 * Part B switched the protection on. Everything here still told the player otherwise: a
 * red arc, the Void's stain, "at risk" in the realm summary. Each case has a control, so
 * the Fortress — not a fixture quirk — is what changes the answer.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, neighboursOf } from '@es3/core';
import type { CaptureOutcome, Cell } from '@es3/core';
import { arcInk } from './strengthArcs.js';
import { dominionOf } from './dominion.js';
import { cellsToGeoJson } from './cellMarks.js';
import { claimLine } from '../hud/HudClaim.js';
import { isRewardClaim } from '../hud/claimFeedback.js';

const ME = 'me';
const T0 = Date.parse('2026-09-15T12:00:00Z');
const LONG_AGO = T0 - 400 * 86_400_000;
const FORT = cellAt({ lat: 61.47290805294704, lng: 23.725882485862012 });
const BESIDE = neighboursOf(FORT)[0] as string;
const RED = '#e05252';

const cell = (h3: string, strength: number, over: Partial<Cell> = {}): Cell => ({
  h3,
  ownerId: ME,
  strength,
  lastVisitedAt: T0,
  visitDays: [],
  ...over,
});
const fortress = cell(FORT, 500, { buildings: [{ id: 'fortress', builtAt: 0 }] });
const faded = cell(BESIDE, 5, { lastVisitedAt: LONG_AGO });
const unfortified = cell(FORT, 500);

describe('the strength arc', () => {
  it('is not red on ground under a Fortress, however long it was left', () => {
    expect(arcInk(faded, T0, true)).not.toBe(RED);
  });

  it('control: the same hex without the Fortress is red', () => {
    expect(arcInk(faded, T0)).toBe(RED);
  });
});

describe('the realm summary', () => {
  it('does not count ground under a Fortress as at risk', () => {
    const d = dominionOf([fortress, faded], T0);
    expect(d.atRisk).toBe(0);
    expect(d.weakest?.h3).not.toBe(BESIDE);
  });

  it('control: without the Fortress the same hex is at risk and the weakest', () => {
    const d = dominionOf([unfortified, faded], T0);
    expect(d.atRisk).toBe(1);
    expect(d.weakest?.h3).toBe(BESIDE);
  });
});

describe("the Void's stain", () => {
  const blightOf = (cells: Cell[]) =>
    cellsToGeoJson(cells, ME, T0).features.find((f) => f.id === BESIDE)?.properties.blight;

  it('does not mark ground under a Fortress', () => {
    expect(blightOf([fortress, faded])).toBe(0);
  });

  it('control: it marks the same hex without one', () => {
    expect(blightOf([unfortified, faded])).toBeGreaterThan(0);
  });
});

describe('a Fortress brought down', () => {
  const razed: CaptureOutcome = {
    h3: FORT,
    kind: 'razed',
    strengthBefore: 1,
    strengthAfter: 1,
    previousOwner: 'the-pale-warden',
  };

  it('leads the claim line', () => {
    expect(claimLine({ at: T0, outcomes: [razed] } as never)).toMatch(/^a Fortress brought down/);
  });

  it('is a reward moment — the chime and the burst are owed', () => {
    expect(isRewardClaim([razed])).toBe(true);
  });
});
