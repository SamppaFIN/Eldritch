import { describe, expect, it } from 'vitest';
import { siteCell } from '@es3/core';
import type { AdventureView } from '@es3/core';
import { atStageHex, questCellInfo } from './questCell.js';

const view = (over: Partial<AdventureView>): AdventureView => ({
  id: 'fuming-lake',
  title: 'The Fuming Lake',
  state: 'active',
  ...over,
});

describe('questCellInfo', () => {
  it('offers Begin on the statue before the tale starts', () => {
    expect(questCellInfo(siteCell('statue'), undefined, [])).toMatchObject({
      canAct: true,
      label: expect.stringContaining('Begin'),
    });
    expect(questCellInfo(siteCell('statue'), view({ state: 'available' }), [])?.canAct).toBe(true);
  });

  it('offers the stage verb on the current stage’s site', () => {
    const info = questCellInfo(siteCell('lake'), view({ stageId: 'lake' }), []);
    expect(info).toMatchObject({ site: 'lake', canAct: true, label: 'Investigate the lake' });
  });

  it('shows a site ahead of the stage as a landmark, no action', () => {
    expect(questCellInfo(siteCell('hermit'), view({ stageId: 'lake' }), [])).toBeNull();
    const behind = questCellInfo(siteCell('statue'), view({ stageId: 'hermit' }), []);
    expect(behind?.canAct).toBe(false);
  });

  it('shows a found secret with no action', () => {
    const info = questCellInfo(siteCell('wisdom'), view({ stageId: 'troll' }), ['wisdom']);
    expect(info).toMatchObject({ site: 'wisdom', canAct: false });
    expect(info?.history).toMatch(/found/i);
  });

  it('is null on a cell that is not a quest site', () => {
    expect(questCellInfo('8c1fb46741 near-nonsense', view({ stageId: 'lake' }), [])).toBeNull();
  });

  it('locks the step when the player is not standing on the site (BRDC-QUEST-003)', () => {
    const info = questCellInfo(siteCell('lake'), view({ stageId: 'lake' }), [], siteCell('hermit'));
    expect(info).toMatchObject({ site: 'lake', canAct: false });
    expect(info?.history).toMatch(/walk here/i);
  });

  it('locks Begin on the statue from across the map', () => {
    const info = questCellInfo(siteCell('statue'), view({ state: 'available' }), [], siteCell('lake'));
    expect(info?.canAct).toBe(false);
    expect(info?.history).toMatch(/walk to the statue/i);
  });
});

describe('atStageHex (BRDC-QUEST-003)', () => {
  it('is true only when standing on the active stage’s site', () => {
    expect(atStageHex(view({ stageId: 'lake' }), siteCell('lake'))).toBe(true);
    expect(atStageHex(view({ stageId: 'lake' }), siteCell('hermit'))).toBe(false);
  });

  it('never gates a failure loop or a tale not under way', () => {
    expect(atStageHex(view({ stageId: 'death-by-fumes' }), null)).toBe(true);
    expect(atStageHex(view({ state: 'available' }), null)).toBe(true);
    expect(atStageHex(undefined, null)).toBe(true);
  });
});
