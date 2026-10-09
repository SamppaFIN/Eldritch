/**
 * Doing what a played-back route says on the way (BRDC-SIM-003): the same repository verbs
 * a tap calls, on the hex the route stands on — and the same place rule the dialog keeps:
 * a tale is begun and advanced only on its own hex.
 *
 * Every outcome is one line for the panel's log, refusals included: a route that cannot
 * build here says why, rather than walking on as if it had. `go` also says where to walk:
 * a secret site moves every week, so only the game knows where it is today.
 */
import { ADVENTURE_PATH, QUEST_SITES, STAGE_SITE, cellAt, cellCentre, hexDistance, siteCell } from '@es3/core';
import type { BuildingId, GameRepository, LatLng, QuestSiteId, TechId, TrailPoint } from '@es3/core';
import { parseAction } from '@es3/core/sim';
import type { RouteAction } from '@es3/core/sim';
import { atSite } from '../quest/questCell.js';

const notAt = (site: QuestSiteId) => `not at ${QUEST_SITES[site].label}`;

/** How many of your hexes a build tries, nearest first, before it gives up. */
const BUILD_TRIES = 60;

export interface ActionResult {
  line: string;
  /** Walk here and back before going on (`go`). */
  goTo?: LatLng;
}

export async function runAction(repo: GameRepository, text: string, at: TrailPoint, now: number): Promise<ActionResult> {
  const a = parseAction(text);
  if (!a) return { line: `✗ ${text} — not a verb playback knows` };
  if (a.kind === 'go') {
    if (!(a.site in QUEST_SITES)) return { line: `✗ go ${a.site}: no such place` };
    const site = a.site as QuestSiteId;
    return { line: `→ go to ${QUEST_SITES[site].label} and back`, goTo: cellCentre(siteCell(site)) };
  }
  return { line: await act(repo, a, cellAt(at), now) };
}

async function act(repo: GameRepository, a: Exclude<RouteAction, { kind: 'go' }>, here: string, now: number): Promise<string> {

  switch (a.kind) {
    case 'grant':
      await repo.debugGrant(now);
      return '✓ grant — 200 of everything';
    case 'collect':
      await repo.collect(now);
      return '✓ collected the stores';
    case 'research': {
      const r = await repo.researchTech(a.id as TechId, now);
      return r.ok ? `✓ researched ${a.id}` : `✗ research ${a.id}: ${r.refused}`;
    }
    case 'build': {
      // Here first, then your own hexes nearest first — a route cannot know which ground a
      // Market will take, so it takes the closest that fits, however far.
      const mine = (await repo.getOwnedCells(now)).map((c) => c.h3).sort((x, y) => hexDistance(here, x) - hexDistance(here, y));
      let first: string | null = null;
      for (const h3 of mine.slice(0, BUILD_TRIES)) {
        const r = await repo.build(h3, a.id as BuildingId, now);
        if (r.ok) {
          const d = hexDistance(here, h3);
          return `✓ built ${a.id}${d === 0 ? ' here' : ` ${d} hex${d === 1 ? '' : 'es'} away`}`;
        }
        first ??= r.refused;
        if (r.refused === 'cannot-afford' || r.refused === 'locked') break;
      }
      return `✗ build ${a.id}: ${first ?? 'none of your ground'}`;
    }
    case 'start': {
      const site = ADVENTURE_PATH[a.id]?.[0];
      if (site && !atSite(siteCell(site), here)) return `✗ begin ${a.id}: ${notAt(site)}`;
      const r = await repo.startAdventure(a.id, now);
      return r.ok ? `✓ began ${a.id}` : `✗ begin ${a.id}: ${r.refused}`;
    }
    case 'choose': {
      const active = (await repo.getAdventures(now)).find((t) => t.state === 'active');
      if (!active) return '✗ choose: no tale under way';
      const site = STAGE_SITE[active.stageId ?? ''];
      if (site && !atSite(siteCell(site), here)) return `✗ choose at ${active.stageId}: ${notAt(site)}`;
      const label = active.choices?.[a.index]?.text ?? `choice ${a.index}`;
      const r = await repo.chooseInAdventure(active.id, a.index, now);
      if (!r.ok) return `✗ ${active.stageId} · ${label}: ${r.refused}`;
      return `✓ ${active.stageId} · ${label}${r.ended ? ` — ${active.title} ends` : ''}`;
    }
  }
}
