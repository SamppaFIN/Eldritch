/**
 * Achievements through the repository (BRDC-CHAR-001).
 *
 * The store stamps and lists (`achievementStore.js`); this assembles the snapshot the
 * pure `earnedNow` needs from what the repository already knows. Lifted out so
 * MockRepository stays under its line limit — the same split as `storyRepo.js`.
 */
import { levelForXp } from '../rules/level.js';
import type { AchievementSnapshot } from '../rules/achievements.js';
import { syncAchievements } from './achievementStore.js';
import type { AchievementView } from './achievementStore.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, PlayerProfile, RevealedPlace } from '../types/domain.js';
import type { TechId } from '../rules/tech.js';

/** The public reads a snapshot is built from — MockRepository is passed as `this`. */
export interface AchievementDeps {
  getProfile(): Promise<PlayerProfile>;
  getOwnedCells(now: number): Promise<Cell[]>;
  getQuestFinds(): Promise<readonly string[]>;
  getAdventures(now: number): Promise<readonly { id: string; state: string }[]>;
  getPlaces(): Promise<RevealedPlace[]>;
  getResearched(): Promise<readonly TechId[]>;
  getHome(): Promise<H3Index | null>;
}

async function snapshotFor(d: AchievementDeps, now: number): Promise<AchievementSnapshot> {
  const [profile, owned, finds, advs, places, tech, home] = await Promise.all([
    d.getProfile(),
    d.getOwnedCells(now),
    d.getQuestFinds(),
    d.getAdventures(now),
    d.getPlaces(),
    d.getResearched(),
    d.getHome(),
  ]);
  return {
    level: levelForXp(profile.xp),
    ownedCount: owned.length,
    maxOwnedDays: owned.reduce((m, c) => Math.max(m, c.ownedDays ?? 0), 0),
    finds,
    adventuresDone: advs.filter((a) => a.state === 'done').map((a) => a.id),
    templeCount: places.filter((p) => p.kind === 'temple').length,
    techCount: tech.length,
    hearthFounded: home !== null,
  };
}

export async function achievementsFor(
  store: KeyValueStore,
  d: AchievementDeps,
  now: number,
): Promise<{ view: AchievementView[]; unlocked: string[] }> {
  return syncAchievements(store, await snapshotFor(d, now), now);
}
