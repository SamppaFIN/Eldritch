/**
 * The repository's side of encounters (BRDC-EVENT-002).
 *
 * The same seam `storyRepo.ts` makes, and for the same reason: `MockRepository` is a class
 * of one-line delegates and the bodies belong outside it. Each of these needs two or three
 * things the repository knows — the owned cells, the profile, the Hearth — and assembling
 * those inside the class is what makes it grow past four hundred lines.
 */
import { dailyOmen, encounterOnStep, takeEncounterChoice } from './encounterStore.js';
import type { ChoiceOutcome } from './encounterStore.js';
import type { Encounter } from '../rules/encounter.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, PlayerProfile } from '../types/domain.js';

/** What these need from the repository, and nothing more. */
export interface EncounterDeps {
  getOwnedCells(now: number): Promise<Cell[]>;
  getProfile(): Promise<PlayerProfile>;
  getHome(): Promise<H3Index | null>;
  addXp(n: number): Promise<unknown>;
}

/**
 * What a newly claimed hex turned up. Null on most steps, by design.
 *
 * Goes straight to the store rather than through the repository: this runs on every
 * step-claim, and the deps here are the expensive ones.
 */
export async function encounterOnStepFor(
  store: KeyValueStore,
  _d: EncounterDeps,
  h3: H3Index,
  now: number,
): Promise<Encounter | null> {
  return encounterOnStep(store, h3, now);
}

export async function dailyOmenFor(
  store: KeyValueStore,
  d: EncounterDeps,
  now: number,
): Promise<Encounter | null> {
  return dailyOmen(store, (await d.getProfile()).id, await d.getHome(), now);
}

/** XP is added through the repository so the level curve and its cap stay in one place. */
export async function takeEncounterChoiceFor(
  store: KeyValueStore,
  d: EncounterDeps,
  id: string,
  choiceIndex: number,
  now: number,
): Promise<ChoiceOutcome> {
  const r = await takeEncounterChoice(store, id, choiceIndex, await d.getOwnedCells(now), now);
  if (r.ok && r.xp) await d.addXp(r.xp);
  return r;
}
