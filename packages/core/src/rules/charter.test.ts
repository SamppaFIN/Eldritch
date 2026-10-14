import { describe, expect, it } from 'vitest';
import { CHARTER_RATE, CHARTER_REALM, CHARTER_STEPS, alreadyDone, charterView, groundFor, scarcest } from './charter.js';
import type { CharterState } from './charter.js';
import { HEARTH_RING } from './constants.js';
import { BUILDINGS } from './build.js';
import { LORE, loreCost } from './lore.js';

const nothing = { loops: 0, keepLevel: 1, standard: false, temples: 0, rites: false, investigator: false, tasks: 0, rumours: 0, gatesSealed: 0, ambition: false, adventure: false, routes: 0, clues: 0 };
const fresh: CharterState = { owned: HEARTH_RING, revealed: 0, lore: [], works: {}, hands: 0, perHour: { food: 10 }, ...nothing };
const veteran: CharterState = {
  owned: 40, revealed: 5, lore: ['lookouts'], works: { watchtower: 1 }, hands: 2, perHour: { food: 12, stone: 8 },
  loops: 1, keepLevel: 2, standard: true, temples: 1, rites: true, investigator: true, tasks: 1, rumours: 2, gatesSealed: 1, ambition: true, adventure: true, routes: 1, clues: 3,
};

describe('the Keeper\'s Charter (BRDC-ONBOARD-001/002)', () => {
  it('opens a fresh realm on its first step, not yet done', () => {
    const v = charterView(fresh, []);
    expect(v?.step.id).toBe('first-step');
    expect(v?.ready).toBe(false);
    expect(v?.chapterName).toBe('The Ground');
    expect([v?.at, v?.of]).toEqual([1, 3]);
  });

  it('reads done from state: one hex past the Hearth finishes the first step', () => {
    const v = charterView({ ...fresh, owned: HEARTH_RING + 1 }, []);
    expect(v?.ready).toBe(true);
  });

  it('holds the current step until it is claimed, even once later ones are done', () => {
    expect(charterView(veteran, [])?.step.id).toBe('first-step');
    expect(charterView(veteran, ['first-step'])?.step.id).toBe('realm');
  });

  it('counts progress, capped at the need', () => {
    expect(charterView({ ...fresh, owned: 9 }, ['first-step'])).toMatchObject({ have: 9, need: CHARTER_REALM, ready: false });
    expect(charterView({ ...fresh, owned: 30 }, ['first-step'])).toMatchObject({ have: CHARTER_REALM, ready: true });
  });

  it('each Works step is done by the thing itself', () => {
    const at = (id: string, s: CharterState) => charterView(s, CHARTER_STEPS.slice(0, CHARTER_STEPS.findIndex((x) => x.id === id)).map((x) => x.id));
    expect(at('lookouts', { ...fresh, lore: ['lookouts'] })?.ready).toBe(true);
    expect(at('watchtower', { ...fresh, works: { watchtower: 1 } })?.ready).toBe(true);
    expect(at('watchtower', { ...fresh, works: { sawmill: 1 } })?.ready).toBe(false);
    expect(at('hands', { ...fresh, hands: 1 })?.ready).toBe(true);
  });

  it('names the scarcest of what the Keep costs, and is done when both reach the rate (BRDC-ONBOARD-003)', () => {
    const before = CHARTER_STEPS.slice(0, CHARTER_STEPS.findIndex((x) => x.id === 'supply')).map((x) => x.id);
    const v = charterView(fresh, before);
    expect(v).toMatchObject({ title: `Raise stone to ${CHARTER_RATE}/h.`, short: `Raise stone to ${CHARTER_RATE}/h`, have: 0, ready: false });
    expect(v?.why).toContain('hill');
    expect(scarcest({ ...fresh, perHour: { food: 2, stone: 9 } })).toBe('food');
    expect(groundFor('food')).toBe('lake or coast or marsh');
    expect(charterView({ ...fresh, perHour: { food: 7, stone: 3.9 } }, before)).toMatchObject({ have: 3, ready: false });
    expect(charterView({ ...fresh, perHour: { food: 7, stone: 6 } }, before)?.ready).toBe(true);
  });

  it('chapters III–V are each done by the record the realm keeps (BRDC-ONBOARD-006)', () => {
    const at = (id: string, s: CharterState) => charterView(s, CHARTER_STEPS.slice(0, CHARTER_STEPS.findIndex((x) => x.id === id)).map((x) => x.id));
    const done: [string, Partial<CharterState>][] = [
      ['loop', { loops: 1 }], ['keep-2', { keepLevel: 2 }], ['standard', { standard: true }], ['temple', { temples: 1 }], ['rite', { rites: true }],
      ['investigator', { investigator: true }], ['task', { tasks: 1 }], ['rumour', { rumours: 1 }], ['gate', { gatesSealed: 1 }],
      ['ambition', { ambition: true }], ['adventure', { adventure: true }], ['route', { routes: 1 }], ['mysteries', { clues: 1 }],
    ];
    for (const [id, patch] of done) {
      expect(at(id, fresh), id).toMatchObject({ step: { id }, ready: false });
      expect(at(id, { ...fresh, ...patch })?.ready, id).toBe(true);
    }
    expect(at('gate', fresh)?.chapterName).toBe('The Town');
    expect(at('route', fresh)).toMatchObject({ chapterName: 'The Season', at: 3, of: 4 });
  });

  it('is finished once every step is claimed', () => {
    expect(charterView(veteran, CHARTER_STEPS.map((x) => x.id))).toBeNull();
  });

  it('a veteran\'s realm ticks off everything it already did, and a fresh one nothing', () => {
    expect(alreadyDone(veteran)).toEqual(CHARTER_STEPS.map((x) => x.id));
    expect(alreadyDone(fresh)).toEqual([]);
    expect(alreadyDone({ ...veteran, revealed: 0 })).not.toContain('reveal');
  });

  it('rewards lead on: the steps before Lookouts pay its wisdom, Lookouts pays the Watchtower', () => {
    const reward = (id: string) => CHARTER_STEPS.find((x) => x.id === id)?.reward ?? {};
    expect((reward('first-step').wisdom ?? 0) + (reward('realm').wisdom ?? 0)).toBeGreaterThanOrEqual(loreCost(LORE.lookouts.age));
    expect(reward('lookouts')).toEqual(BUILDINGS.watchtower.cost);
  });

  it('every step has a chapter name and a one-clause why', () => {
    for (const s of CHARTER_STEPS) {
      expect(charterView(fresh, CHARTER_STEPS.slice(0, CHARTER_STEPS.indexOf(s)).map((x) => x.id))?.chapterName).not.toBe('');
      expect(s.why.split(' ').length).toBeLessThan(20);
    }
  });
});
