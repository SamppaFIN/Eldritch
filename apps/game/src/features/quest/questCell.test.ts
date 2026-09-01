import { describe, expect, it } from 'vitest';
import { siteCell } from '@es3/core';
import type { AdventureView } from '@es3/core';
import { questCellInfo } from './questCell.js';

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
});
