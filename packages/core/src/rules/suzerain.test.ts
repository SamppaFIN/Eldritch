/** BRDC-SUZERAIN-001 — envoys from a village's tasks, and who leads it. */
import { describe, expect, it } from 'vitest';
import { VILLAGE_TASKS, envoysFrom, suzerainOf } from './suzerain.js';
import { taskById } from './taskContent.js';

describe('envoysFrom', () => {
  it('sums the envoys of finished village tasks only', () => {
    const outcomes = { 'fishers-driftwood': { status: 'completed' }, 'fishers-eel': { status: 'completed' }, 'fishers-count': { status: 'failed' }, 'grug-riddle': { status: 'completed' } };
    expect(envoysFrom(outcomes)).toEqual({ 'harmala-fishers': 3 });
    expect(envoysFrom({})).toEqual({});
  });
  it('every village task is a task the board can find', () => {
    for (const t of VILLAGE_TASKS) expect(taskById(t.id)?.village).toBe('harmala-fishers');
  });
});

describe('suzerainOf', () => {
  it('the most envoys, at least three, and alone at the top', () => {
    expect(suzerainOf([{ playerId: 'a', envoys: 3 }, { playerId: 'b', envoys: 2 }])).toBe('a');
    expect(suzerainOf([{ playerId: 'a', envoys: 2 }])).toBeNull();
    expect(suzerainOf([{ playerId: 'a', envoys: 4 }, { playerId: 'b', envoys: 4 }])).toBeNull();
    expect(suzerainOf([{ playerId: 'a', envoys: 3 }, { playerId: 'b', envoys: 5 }])).toBe('b');
  });
});
