/**
 * The named places of the Fuming Lake (BRDC-QUEST-001, BRDC-QUEST-004).
 *
 * Real Härmälä coordinates, lifted from v2's `QuestFumingLake.js`. The statue is the
 * canonical origin; the lake at (61.4753, 23.7280) is what fixes the water in
 * `terrainSeed.ts`. An adventure gate can require the player to *hold* one of these
 * cells — you walked there and claimed it.
 *
 * **The table is now a layout, not an address.** Every site was a fixed coordinate in one
 * Tampere park, which meant the whole tale was unreachable for anybody who lives anywhere
 * else — it could not be started at all, because starting it means standing on the statue.
 * Infinite hit exactly that: *"koitin käydä seikkailua läpi, mutta en saanut mitään tarina
 * dialogia.. se toimi jo joskus."* It had worked, once, near Pyynikki.
 *
 * So the coordinates below are kept as the **authored shape** — the bearings and distances
 * between the statue, the lake, the hermit and the bridge are a hand-made walk, and they
 * are worth keeping exactly. `anchorQuestSites` moves that shape to a player's own Hearth
 * without changing it. Unanchored, it stays where it was written.
 */
import { cellAt } from '../geo/cells.js';
import { bearing, destination } from '../geo/project.js';
import { haversine } from '../geo/haversine.js';
import type { H3Index, LatLng } from '../types/domain.js';

export type QuestSiteId =
  | 'statue'
  | 'lake'
  | 'trinket'
  | 'hermit'
  | 'staff'
  | 'troll'
  | 'wisdom'
  | 'deep'
  | 'healing-shrine'
  | 'sanity-shrine';

export const QUEST_SITES: Readonly<Record<QuestSiteId, LatLng & { label: string }>> = {
  statue: { lat: 61.47290805294704, lng: 23.725882485862012, label: 'Statue of the Boy' },
  lake: { lat: 61.47525973065058, lng: 23.728040739777192, label: 'The Fuming Lake' },
  trinket: { lat: 61.47414451871632, lng: 23.728673812249834, label: 'Shiny Trinket' },
  hermit: { lat: 61.47307544507844, lng: 23.732610983055974, label: "Hermit's Hovel" },
  staff: { lat: 61.473586729904675, lng: 23.733321862539352, label: 'Ancient Staff' },
  troll: { lat: 61.47658474193526, lng: 23.730553569085355, label: 'Troll Bridge' },
  wisdom: { lat: 61.475937533235395, lng: 23.724059855235694, label: 'Wisdom Stone' },
  deep: { lat: 61.477750840409435, lng: 23.7272125677718, label: 'The Deep' },
  'healing-shrine': { lat: 61.47295360880876, lng: 23.726675342590156, label: 'Healing Shrine' },
  'sanity-shrine': { lat: 61.476970066258765, lng: 23.730978272652262, label: 'Sanity Shrine' },
};

export const QUEST_SITE_IDS = Object.keys(QUEST_SITES) as QuestSiteId[];

/**
 * Each site as a bearing and a distance from the statue — the authored walk, as a shape.
 *
 * Derived from the table rather than written twice, so the two can never drift: change a
 * coordinate above and the shape follows.
 */
const SHAPE: Readonly<Record<QuestSiteId, { bearing: number; metres: number }>> =
  Object.fromEntries(
    QUEST_SITE_IDS.map((id) => [
      id,
      {
        bearing: bearing(QUEST_SITES.statue, QUEST_SITES[id]),
        metres: haversine(QUEST_SITES.statue, QUEST_SITES[id]),
      },
    ]),
  ) as Record<QuestSiteId, { bearing: number; metres: number }>;

/**
 * Where the tale is being walked. Null means where it was written.
 *
 * A module-level anchor rather than a parameter threaded through eleven call sites — the
 * same shape `enableTerrainSurvey` already uses, and for the same reason: it is one fact
 * about the world, set once, that almost nothing wants to talk about.
 */
let anchor: LatLng | null = null;

/** Move the tale to a player's own ground. `null` puts it back where it was written. */
export function anchorQuestSites(home: LatLng | null): void {
  anchor = home;
}

/** Where a site stands — at the anchor if there is one, in Härmälä if there is not. */
export function questSiteAt(id: QuestSiteId): LatLng {
  if (!anchor) return QUEST_SITES[id];
  const { bearing: deg, metres } = SHAPE[id];
  return metres === 0 ? anchor : destination(anchor, deg, metres);
}

/** The ownership cell a quest site falls in. */
export function siteCell(id: QuestSiteId): H3Index {
  return cellAt(questSiteAt(id));
}

/**
 * The Fuming Lake's main path, in order. The map reveals one landmark at a time: the
 * statue always, then each next stop as the adventure reaches the stage before it
 * (`statue` visible from the start, `lake` once you are at `statue`, and so on).
 */
export const FUMING_PATH = ['statue', 'lake', 'hermit', 'troll', 'deep'] as const;

/** The three ways past the troll. Never on the map — found by walking onto the cell. */
export const SECRET_SITES = ['trinket', 'staff', 'wisdom'] as const;
export type SecretSiteId = (typeof SECRET_SITES)[number];

/** A found secret, in the player's hands — what the reveal toast says. */
export const QUEST_ITEMS: Readonly<Record<SecretSiteId, { name: string; blurb: string }>> = {
  trinket: {
    name: 'A Shiny Trinket',
    blurb: 'It catches light that is not there. A troll would want this. A troll would take this and let you pass.',
  },
  staff: {
    name: 'An Ancient Staff',
    blurb: 'Heavier than wood should be, and it hums when a bridge is mentioned. Raise it and Grug may reconsider.',
  },
  wisdom: {
    name: 'The Wisdom Stone',
    blurb: 'Smooth, cool, and faintly smug. Hold it and the troll’s riddle stops sounding clever.',
  },
};

/**
 * Which landmarks the map should draw: the statue always, the path up to and including
 * the stop after the current stage, plus any secret the player has already walked into.
 */
export function visibleQuestSites(
  stage: string | null,
  finds: readonly string[],
): QuestSiteId[] {
  let upto: number;
  if (stage === null) {
    upto = 1; // not started — only the statue that starts it
  } else {
    const i = FUMING_PATH.indexOf(stage as (typeof FUMING_PATH)[number]);
    // A stage past the last path node (`servitude`, or a finished run) shows everything.
    upto = i < 0 ? FUMING_PATH.length : Math.min(i + 2, FUMING_PATH.length);
  }
  return [...FUMING_PATH.slice(0, upto), ...SECRET_SITES.filter((s) => finds.includes(s))];
}

/** The secret site whose cell this is, if any — for the walk-onto reveal. */
export function secretSiteAt(h3: H3Index): SecretSiteId | null {
  return SECRET_SITES.find((s) => siteCell(s) === h3) ?? null;
}

/**
 * Which quest site a stage of The Fuming Lake is acted on (BRDC-QUEST-002).
 *
 * The adventure is begun and advanced from the hex it happens at, not from the Keep. The
 * two endings (`deep`, `servitude`) both play out at the water; the failure loops
 * (`death-by-fumes`, `death-by-troll`) have no site — they send you back a step.
 */
export const STAGE_SITE: Readonly<Record<string, QuestSiteId>> = {
  statue: 'statue',
  lake: 'lake',
  hermit: 'hermit',
  troll: 'troll',
  deep: 'deep',
  servitude: 'deep',
};

/** The verb on a quest site's action button, per site. Copy, kept beside the sites. */
export const SITE_VERB: Readonly<Record<QuestSiteId, string>> = {
  statue: 'Begin — The Fuming Lake',
  lake: 'Investigate the lake',
  hermit: 'Speak to the hermit',
  troll: 'Face the troll',
  deep: 'Approach the water',
  trinket: 'A Shiny Trinket lies here',
  staff: 'An Ancient Staff lies here',
  wisdom: 'The Wisdom Stone lies here',
  'healing-shrine': 'A Healing Shrine',
  'sanity-shrine': 'A Sanity Shrine',
};
