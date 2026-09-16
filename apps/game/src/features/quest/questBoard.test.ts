import { describe, expect, it } from 'vitest';
import type { AdventureView } from '@es3/core';
import { questBoardEntries } from './questBoard.js';

const view = (over: Partial<AdventureView>): AdventureView => ({
  id: 'fuming-lake',
  title: 'The Fuming Lake',
  state: 'active',
  ...over,
});

describe('questBoardEntries', () => {
  it('names the next site for an active chain mid-tale', () => {
    expect(questBoardEntries([view({ stageId: 'lake' })])).toEqual([
      { title: 'The Fuming Lake', step: 'Walk to The Fuming Lake.' },
    ]);
  });

  it('falls back to a plain nudge when the current stage has no site', () => {
    expect(questBoardEntries([view({ stageId: 'no-such-stage' })])).toEqual([
      { title: 'The Fuming Lake', step: 'Continue the tale.' },
    ]);
  });

  it('leaves off a chain that has not started, or has ended', () => {
    expect(questBoardEntries([view({ state: 'available' })])).toEqual([]);
    expect(questBoardEntries([view({ state: 'done' })])).toEqual([]);
  });

  it('has nothing to say with no adventures at all', () => {
    expect(questBoardEntries([])).toEqual([]);
  });
});
