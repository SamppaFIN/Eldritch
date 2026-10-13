import { describe, expect, it } from 'vitest';
import { SURFACES, SURFACE_STEP, openSurfaces } from './surfaces.js';
import { CHARTER_STEPS } from './charter.js';
import type { CharterState } from './charter.js';
import { HEARTH_RING } from './constants.js';

const fresh: CharterState = {
  owned: HEARTH_RING, revealed: 0, lore: [], works: {}, hands: 0, perHour: {},
  keepLevel: 1, standard: false, temples: 0, rites: false, investigator: false, tasks: 0, rumours: 0, gatesSealed: 0, ambition: false, adventure: false, routes: 0, clues: 0,
};
const upTo = (id: string) => CHARTER_STEPS.slice(0, CHARTER_STEPS.findIndex((x) => x.id === id)).map((x) => x.id);

describe('progressive disclosure (BRDC-ONBOARD-005)', () => {
  it('a new realm sees none of them', () => {
    expect(openSurfaces(fresh, [])).toEqual([]);
  });

  it('each opens when the Charter reaches the step that teaches it', () => {
    expect(openSurfaces(fresh, upTo('realm'))).toEqual(['lands']);
    expect(openSurfaces(fresh, upTo('lookouts'))).toEqual(['lands', 'research']);
    expect(openSurfaces(fresh, upTo('keep-2'))).toContain('realm-tab');
    expect(openSurfaces(fresh, upTo('keep-2'))).not.toContain('investigator-tab');
    expect(openSurfaces(fresh, upTo('ambition'))).toEqual(SURFACES);
  });

  it('use opens it too: a step already done opens its surface, whatever the Charter says', () => {
    expect(openSurfaces({ ...fresh, investigator: true }, [])).toEqual(['investigator-tab']);
    expect(openSurfaces({ ...fresh, lore: ['lookouts'], ambition: true }, [])).toEqual(['research', 'season-tab']);
  });

  it('a finished Charter opens everything, and every surface names a real step', () => {
    expect(openSurfaces(fresh, CHARTER_STEPS.map((x) => x.id))).toEqual(SURFACES);
    for (const s of SURFACES) expect(CHARTER_STEPS.some((x) => x.id === SURFACE_STEP[s])).toBe(true);
  });
});
