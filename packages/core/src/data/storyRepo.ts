/**
 * The repository half of the story features — anomalies, event chains, adventures.
 *
 * The orchestration already lives in `anomalyStore.js` and `adventureStore.js`; this is
 * the thin seam that feeds them what the repository knows (held ground, the pouch, the
 * profile) and pays out XP on success. Lifted out of MockRepository to keep it under its
 * line limit — the same split as `wagerRepo.js`.
 *
 * MockRepository passes its store and itself (`StoryDeps`); every function is a one-liner
 * there. `store` is kept a separate argument because it is private on MockRepository.
 */
import {
  chooseAt as chooseChainAt,
  describeAnomalies,
  investigateAt,
  resolveAt,
  type Anomaly,
  type ChoiceOutcome,
  type InvestigateOutcome,
  type ResolveOutcome,
} from './anomalyStore.js';
import {
  abandonAt as abandonAdvAt,
  chooseAt as chooseAdvAt,
  listAdventures,
  startAt as startAdvAt,
  type AdventureChoiceOutcome,
  type AdventureView,
  type StartOutcome,
} from './adventureStore.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, PlayerProfile } from '../types/domain.js';
import type { ResourcePool } from '../rules/terrain.js';

/** The public repository reads a story seam needs — MockRepository is passed as `this`. */
export interface StoryDeps {
  getProfile(): Promise<PlayerProfile>;
  getOwnedCells(now: number): Promise<Cell[]>;
  getResources(now: number): Promise<ResourcePool>;
  addXp(amount: number): Promise<unknown>;
}

export function getAnomaliesFor(d: StoryDeps, now: number): Promise<Anomaly[]> {
  return d.getOwnedCells(now).then((owned) => describeAnomalies(owned, now));
}

export async function investigateAnomalyFor(
  store: KeyValueStore,
  d: StoryDeps,
  h3: string,
  now: number,
): Promise<InvestigateOutcome> {
  return investigateAt(store, h3, (await d.getProfile()).id, await d.getOwnedCells(now), now);
}

export async function resolveAnomalyFor(
  store: KeyValueStore,
  d: StoryDeps,
  h3: string,
  now: number,
): Promise<ResolveOutcome> {
  const r = await resolveAt(store, h3, (await d.getProfile()).id, await d.getOwnedCells(now), now);
  if (r.ok && r.xp) await d.addXp(r.xp);
  return r;
}

export async function chooseInChainFor(
  store: KeyValueStore,
  d: StoryDeps,
  h3: string,
  choiceIndex: number,
  now: number,
): Promise<ChoiceOutcome> {
  const me = (await d.getProfile()).id;
  const r = await chooseChainAt(store, h3, me, await d.getOwnedCells(now), choiceIndex, now);
  if (r.ok && r.xp) await d.addXp(r.xp);
  return r;
}

export async function getAdventuresFor(
  store: KeyValueStore,
  d: StoryDeps,
  now: number,
): Promise<AdventureView[]> {
  return listAdventures(store, await d.getOwnedCells(now), await d.getResources(now));
}

export function startAdventureFor(
  store: KeyValueStore,
  id: string,
  now: number,
): Promise<StartOutcome> {
  return startAdvAt(store, id, now);
}

export async function chooseInAdventureFor(
  store: KeyValueStore,
  d: StoryDeps,
  id: string,
  choiceIndex: number,
  now: number,
): Promise<AdventureChoiceOutcome> {
  const r = await chooseAdvAt(store, id, choiceIndex, await d.getOwnedCells(now), now);
  if (r.ok && r.xp) await d.addXp(r.xp);
  return r;
}

export function abandonAdventureFor(store: KeyValueStore, id: string): Promise<void> {
  return abandonAdvAt(store, id);
}
