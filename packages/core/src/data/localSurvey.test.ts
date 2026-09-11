/**
 * BRDC-SURVEY-001. The registry, its place in the chain, and the thing it exists for:
 * a claim that pays the ground rather than a die roll.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { clearSurvey, recordSurvey, surveySize, surveyedTerrainOf } from './localSurvey.js';
import { loadDrawings, newDrawing, paint } from './mapData.js';
import { cellAt } from '../geo/cells.js';
import { EMPTY_POOL, addClaimYield, terrainOf } from '../rules/terrain.js';

const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };
const HERE = cellAt(ORIGIN);
const THERE = cellAt({ lat: 61.4801, lng: 23.7331 });

afterEach(() => {
  clearSurvey();
  loadDrawings();
});

describe('the survey registry', () => {
  it('returns null for ground never read', () => {
    expect(surveyedTerrainOf(HERE)).toBeNull();
    expect(surveySize()).toBe(0);
  });

  it('gives back what was recorded, tagged as a tile reading', () => {
    recordSurvey({ [HERE]: 'lake' });
    expect(surveyedTerrainOf(HERE)).toEqual({ kind: 'lake', source: 'tiles' });
    expect(surveySize()).toBe(1);
  });

  it('lets a closer re-read correct an earlier one', () => {
    recordSurvey({ [HERE]: 'lake' });
    recordSurvey({ [HERE]: 'coast' });
    expect(surveyedTerrainOf(HERE)?.kind).toBe('coast');
    expect(surveySize()).toBe(1);
  });

  it('forgets everything on clear', () => {
    recordSurvey({ [HERE]: 'hill', [THERE]: 'forest' });
    expect(surveySize()).toBe(2);
    clearSurvey();
    expect(surveySize()).toBe(0);
  });
});

describe('where a machine reading ranks', () => {
  it('beats the hash — that is the whole point', () => {
    const byHash = terrainOf(HERE).kind;
    const other = byHash === 'lake' ? 'mountain' : 'lake';
    recordSurvey({ [HERE]: other });
    expect(terrainOf(HERE)).toEqual({ kind: other, source: 'tiles' });
  });

  it('loses to a hex somebody painted by hand', () => {
    recordSurvey({ [HERE]: 'lake' });
    loadDrawings(paint(newDrawing('by hand'), HERE, { t: 'market' }));
    expect(terrainOf(HERE).kind).toBe('market');
  });

  it('leaves ground it never read to the hash', () => {
    const before = terrainOf(THERE);
    recordSurvey({ [HERE]: 'lake' });
    expect(terrainOf(THERE)).toEqual(before);
  });
});

// The RED of BRDC-SURVEY-001, stated as a test: `addClaimYield` is keyed on the h3 alone,
// so before this ticket it could only ever pay what the hash said — and the tile reading
// landed after the payment, leaving a player paid stone for a lake.
describe('the claim yield', () => {
  it('pays the surveyed ground, not the hash', () => {
    // A hex the hash calls plain pays nothing; surveyed as forest it must pay wood.
    const plainByHash = [HERE, THERE, cellAt({ lat: 61.4712, lng: 23.7203 })].find(
      (h3) => terrainOf(h3).kind === 'plain',
    );
    expect(plainByHash).toBeDefined();
    expect(addClaimYield(EMPTY_POOL, plainByHash!).wood).toBe(0);

    recordSurvey({ [plainByHash!]: 'forest' });
    expect(addClaimYield(EMPTY_POOL, plainByHash!).wood).toBeGreaterThan(0);
  });
});
