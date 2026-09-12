/**
 * Numbers v2 measured, parked until the phase that uses them (BRDC-EVENT-002 split).
 *
 * Lifted out of `constants.ts` when that file hit four hundred lines. These two blocks
 * were the right thing to move because they are the only ones in it that nothing reads:
 * both are labelled "Phase 6" in their own comments and neither has a consumer yet.
 * `constants.ts` re-exports them, so §11's single import path is unchanged and no caller
 * knows the difference.
 */

/* --- Discoveries (v2 GameConfig.discovery) — Phase 6, parked here so the
       numbers are not lost. Not used before Phase 6. ---------------------- */

export const DISCOVERY = {
  spawnRadiusM: 150,
  collectRadiusM: 5,
  maxActive: 10,
  respawnCooldownMs: 300_000,
  rarities: {
    common: { chance: 0.6, xp: 50, glyph: '🌸' },
    uncommon: { chance: 0.25, xp: 100, glyph: '🌟' },
    rare: { chance: 0.12, xp: 150, glyph: '🔮' },
    epic: { chance: 0.03, xp: 200, glyph: '💫' },
  },
  types: ['cosmic-fragment', 'sacred-geometry', 'ancient-sigil', 'void-essence'],
} as const;

/* --- Anchor Stone (v2 TerritorySystem) — Phase 6 ------------------------- */

export const ANCHOR = {
  expansionRangeM: 50,
  minExpansionDistanceM: 5,
  maxExpansionPerMarkerM: 50,
  borderPointCount: 12,
  initialRadiusM: 20,
  cooldownMs: 900_000,
  maxCarrySteps: 100,
  stepMarkerInterval: 50,
} as const;
