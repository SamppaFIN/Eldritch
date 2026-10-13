/**
 * The Guide's pages for what the Keeper's Charter used to leave to other voices
 * (BRDC-ONBOARD-004): what each resource is and buys — once the "New resource" lesson
 * cards — and how a realm runs — once the Counsel's codex cards. Always in the Guide: they
 * are instructions, not a reward. The Works each resource buys are read from `BUILDINGS`,
 * so the list never goes stale.
 */
import { BUILDINGS, CODEX_CARDS } from '@es3/core';
import type { BuildingId, ResourceKind } from '@es3/core';
import { BUILDING_NAME } from '../territory/names.js';
import type { HelpEntry } from './help.js';

export type RealmTopic = 'resources' | 'running-a-realm';
export const REALM_TOPICS: readonly RealmTopic[] = ['resources', 'running-a-realm'];

const RESOURCE_WHAT: Readonly<Record<Exclude<ResourceKind, 'tokens'>, [string, string]>> = {
  wood: ['Timber', 'Forest hexes and Sawmills give it.'],
  stone: ['Stone', 'Hills and Quarries give it.'],
  iron: ['Iron', 'Hills and Forges give it.'],
  food: ['Food', 'Your citizens eat it. A full granary births a new one.'],
  gold: ['Gold', 'Markets and settlements give it.'],
  wisdom: ['Wisdom', 'Watchtowers, temples and the Keep give it. Spend it in Research.'],
  mana: ['Mana', 'Temples and the Keep give it. Rites are cast with it.'],
  culture: ['Culture', 'Monuments and Taverns give it.'],
};

function usesOf(kind: ResourceKind): string {
  const works = (Object.keys(BUILDINGS) as BuildingId[])
    .filter((id) => !BUILDINGS[id].masterwork && (BUILDINGS[id].cost[kind] ?? 0) > 0)
    .map((id) => BUILDING_NAME[id]);
  if (works.length === 0) return '';
  const shown = works.slice(0, 4);
  return ` Works that cost it: ${shown.join(', ')}${works.length > shown.length ? ' and more' : ''}.`;
}

export const REALM_HELP: Readonly<Record<RealmTopic, HelpEntry>> = {
  resources: {
    title: 'Resources',
    body: (Object.entries(RESOURCE_WHAT) as [ResourceKind, [string, string]][]).map(([k, [name, what]]) => `${name}: ${what}${usesOf(k)}`),
    see: ['work', 'awakening'],
  },
  'running-a-realm': {
    title: 'Running a Realm',
    body: CODEX_CARDS.map((c) => `${c.title}. ${c.text}`),
    see: ['resources', 'rite'],
  },
};
