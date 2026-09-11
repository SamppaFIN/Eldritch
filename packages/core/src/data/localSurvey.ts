/**
 * Terrain the game read off the map itself, before anyone claimed it (BRDC-SURVEY-001).
 *
 * The problem this exists for is in `terrain.ts`'s own docstring: `addClaimYield` is keyed
 * on the h3 alone, so the moment ground changes hands it pays whatever the *hash* says,
 * and the tile reading only arrives a few hundred milliseconds later — by which time the
 * hex the player was paid stone for has quietly become a lake. Reading the ground ahead of
 * the player's feet is what closes that gap.
 *
 * Why not `setStoredTerrain`: that one is a deliberate no-op for ground nobody owns
 * (`cellStore.ts`), and the rule is right — unclaimed ground must not grow rows in the
 * store. So machine readings live here instead, in memory, for the session.
 *
 * Module-level and set once, the same shape as `enableTerrainSurvey`, `anchorQuestSites`
 * and `loadDrawings`: one fact about the world that every reader should see without being
 * handed it. Session-scoped on purpose — the tiles are already on screen, so rebuilding it
 * on the next boot costs hit-tests and no network, and persisting it would buy a migration
 * and nothing else.
 *
 * It ranks *below* both hand answers and *above* the hash. A person who painted a hex or
 * surveyed a district looked at it and said so; this only looked at a tag.
 */
import type { H3Index, Terrain, TerrainKind } from '../types/domain.js';

const readings = new Map<H3Index, TerrainKind>();

/**
 * Record what the tiles said about a batch of hexes.
 *
 * Last write wins, so a re-read at a closer zoom — where the geometry is less generalised
 * — corrects an earlier one rather than being ignored.
 */
export function recordSurvey(batch: Readonly<Record<H3Index, TerrainKind>>): void {
  for (const [h3, kind] of Object.entries(batch)) readings.set(h3, kind);
}

/** What the map said about this hex, or null if it was never read. */
export function surveyedTerrainOf(h3: H3Index): Terrain | null {
  const kind = readings.get(h3);
  return kind ? { kind, source: 'tiles' } : null;
}

/** How many hexes have been read. For the HUD's survey count, and for tests. */
export function surveySize(): number {
  return readings.size;
}

/** Forget everything read. Tests, and a deliberate reset. */
export function clearSurvey(): void {
  readings.clear();
}
