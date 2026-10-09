/**
 * An open gate, a found wonder, the three chimneys (BRDC-CHIMNEY-001) and a walking
 * creature (BRDC-MONSTER-001), as structures on their hex (field report 2026-09-30:
 * *"Sain viestin että Gate on auennut.. haluan että siinä on näkyvissä grafiikkana
 * portaali"*, and a found Arkham nowhere on the map).
 *
 * Same construction as `placeSprites.ts`: procedural SVG on the 64-unit iso plinth,
 * rasterised once into the map's atlas. Hex literals, not tokens: the SVG is decoded by an
 * `Image`, outside the document, where `var()` does not resolve.
 */
import { rasteriseSvgs } from '../territory/spriteRaster.js';

export type SeasonMarkKind = 'gate' | 'wonder' | 'chimney' | 'monster';
export const SEASON_MARK_KINDS: readonly SeasonMarkKind[] = ['gate', 'wonder', 'chimney', 'monster'];
export const SEASON_SPRITE_PX = 192;
export const seasonSpriteId = (kind: SeasonMarkKind): string => `season-${kind}`;

const plinth = (top: string, edge: string): string =>
  `<polygon points="6,51 32,64 58,51 58,53 32,66 6,53" fill="${edge}"/>` +
  `<polygon points="6,50 32,37 58,50 32,63" fill="${top}"/>`;

/** An upright ring of cyan fire around a violet swirl, standing on scorched ground. */
const GATE =
  plinth('#2a1030', '#160818') +
  `<ellipse cx="32" cy="50" rx="16" ry="6" fill="#b04cff" opacity="0.28"/>` +
  `<ellipse cx="32" cy="30" rx="12.5" ry="19" fill="#1a0624"/>` +
  `<ellipse cx="32" cy="30" rx="10" ry="16" fill="#6a1f9a" opacity="0.85"/>` +
  `<path d="M32 16 C41 20 40 34 32 36 C25 38 24 28 32 27 C37 26 37 32 33 32" fill="none" stroke="#e0a8ff" stroke-width="1.8" stroke-linecap="round"/>` +
  `<ellipse cx="32" cy="30" rx="12.5" ry="19" fill="none" stroke="#00d4ff" stroke-width="3"/>` +
  `<ellipse cx="32" cy="30" rx="15" ry="21.5" fill="none" stroke="#00d4ff" stroke-width="1" opacity="0.45"/>`;

/** A gold-capped monolith of old stone: the wonder is found, and it stands here. */
const WONDER =
  plinth('#3a3222', '#211c12') +
  `<polygon points="24,50 32,54 40,50 32,46" fill="#5a4f38"/>` +
  `<polygon points="26,49 26,18 32,14 32,52" fill="#8a8170"/>` +
  `<polygon points="32,52 32,14 38,18 38,49" fill="#5e5747"/>` +
  `<path d="M29 26 L29 42 M35 24 L35 40" stroke="#ffd700" stroke-width="1.2" opacity="0.7"/>` +
  `<circle cx="32" cy="10" r="6" fill="#ffd700" opacity="0.3"/><circle cx="32" cy="10" r="3.2" fill="#ffd700"/>`;

/** A tall brick factory chimney with an ember at its lip (BRDC-CHIMNEY-001). */
const CHIMNEY =
  plinth('#3a2420', '#21140f') +
  `<polygon points="27,50 32,53 37,50 32,47" fill="#4a2c22"/>` +
  `<polygon points="28,49 29,14 32,12 32,52" fill="#9a5a40"/>` +
  `<polygon points="32,52 32,12 35,14 36,49" fill="#6a3a2a"/>` +
  `<path d="M28.7 24 H35.3 M28.5 34 H35.5 M28.3 43 H35.7" stroke="#3a1f16" stroke-width="1"/>` +
  `<ellipse cx="32" cy="12" rx="3.4" ry="1.4" fill="#ff8a3d"/>` +
  `<circle cx="32" cy="9" r="3.4" fill="#ffd700" opacity="0.35"/>`;

/** A hunched thing of too many limbs, eyes lit cyan, on churned ground (BRDC-MONSTER-001). */
const MONSTER =
  plinth('#241a2e', '#120c18') +
  `<ellipse cx="32" cy="50" rx="14" ry="5" fill="#6a1f9a" opacity="0.3"/>` +
  `<path d="M20 50 Q22 38 28 34 M44 50 Q42 38 36 34 M24 50 Q30 44 32 40 M40 50 Q34 44 32 40" stroke="#6a4a8a" stroke-width="2.5" fill="none" stroke-linecap="round"/>` +
  `<ellipse cx="32" cy="30" rx="10" ry="9" fill="#7a54a0"/>` +
  `<path d="M24 26 Q32 14 40 26" fill="#8e64b8"/>` +
  `<circle cx="28.5" cy="29" r="1.8" fill="#00d4ff"/><circle cx="35.5" cy="29" r="1.8" fill="#00d4ff"/><circle cx="32" cy="25" r="1.3" fill="#00d4ff"/>`;

const BODY: Readonly<Record<SeasonMarkKind, string>> = { gate: GATE, wonder: WONDER, chimney: CHIMNEY, monster: MONSTER };

export function seasonSvg(kind: SeasonMarkKind): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 2 64 64" width="${SEASON_SPRITE_PX}" height="${SEASON_SPRITE_PX}">${BODY[kind]}</svg>`;
}

export async function rasteriseSeasonMarks(): Promise<Map<string, ImageData> | null> {
  return rasteriseSvgs(SEASON_MARK_KINDS, seasonSvg, seasonSpriteId, SEASON_SPRITE_PX);
}
