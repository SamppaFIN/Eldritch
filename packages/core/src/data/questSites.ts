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
import { SEED_BOX } from '../rules/terrainSeed.js';
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

/**
 * A home already inside the district the tale was written in (BRDC-QUEST-006).
 *
 * `SHAPE.statue` is a zero-metre bearing — anchoring makes `questSiteAt('statue')` return
 * the anchor itself, so a Keep raised in Härmälä placed the statue exactly on the Keep, and
 * every other site slid by the same vector (Keep − the real statue). A Keep already inside
 * `SEED_BOX` does not need the tale carried to it; it is already there.
 */
function inHarmala(pos: LatLng): boolean {
  return (
    pos.lat >= SEED_BOX.south && pos.lat <= SEED_BOX.north && pos.lng >= SEED_BOX.west && pos.lng <= SEED_BOX.east
  );
}

/**
 * Move the tale to a player's own ground. `null` puts it back where it was written, and so
 * does a home already inside Härmälä (`BRDC-QUEST-006`) — the tale is not carried to
 * somewhere it already is.
 */
export function anchorQuestSites(home: LatLng | null): void {
  anchor = home && !inHarmala(home) ? home : null;
}

/**
 * The hex each site was pinned to, once it has been (BRDC-QUEST-005).
 *
 * Field report: the tale's places moved while the map stayed put. They were never stored
 * — `siteCell` *recomputed* them from the anchor on every call, and the anchor is the
 * castle's centre, which is re-assigned whenever the Hearth is. Re-anchor and every site
 * slides; a site sitting near a hex boundary can slide a whole hex on a few metres.
 *
 * So the derivation runs once and the answer is kept. A pinned tale cannot drift, which
 * is the point: a place the player walked to has to still be there tomorrow.
 */
let pinnedCells: Partial<Record<QuestSiteId, H3Index>> = {};

/** Restore pins from storage. Empty means "not pinned yet", not "pinned to nothing". */
export function pinQuestCells(cells: Partial<Record<QuestSiteId, H3Index>>): void {
  pinnedCells = { ...cells };
}

/** Every site's hex as it stands now — what a first boot writes down and pins to. */
export function resolveQuestCells(): Record<QuestSiteId, H3Index> {
  return Object.fromEntries(
    QUEST_SITE_IDS.map((id) => [id, pinnedCells[id] ?? cellAt(questSiteAt(id))]),
  ) as Record<QuestSiteId, H3Index>;
}

/** Whether the tale has been fixed to the map yet. */
export function questCellsPinned(): boolean {
  return QUEST_SITE_IDS.every((id) => pinnedCells[id] !== undefined);
}

/**
 * The troll's hoard changes hands every week (BRDC-QUEST-007).
 *
 * Infinite: *"trollin aarteet arvotaan viikoittain"*. The three secrets — the trinket, the
 * staff and the wisdom stone — are the only places on the tale nobody is told about, so
 * they are the ones re-hidden: each week they turn up somewhere new around the statue,
 * between `SECRET_MIN_M` and `SECRET_MIN_M + SECRET_SPREAD_M` from it. The authored path
 * (statue, lake, hermit, troll, deep) never moves — a place the player walked to has to
 * still be there tomorrow (`BRDC-QUEST-005`). `null` until the boot sets the week, and
 * then only the secrets read it.
 */
let secretWeek: number | null = null;
const SECRET_MIN_M = 100;
const SECRET_SPREAD_M = 300;

/** Monday-to-Sunday weeks since the epoch. Day 0 was a Thursday, hence the three. */
export function weekOf(now: number): number {
  return Math.floor((Math.floor(now / 86_400_000) + 3) / 7);
}

/** FNV-1a over a string to [0, 1) — the same cheap, stable spread `terrain.ts` uses. */
function roll(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

const isSecret = (id: QuestSiteId): id is SecretSiteId => (SECRET_SITES as readonly string[]).includes(id);

/**
 * Re-hide the secrets for `week`, and pin them there.
 *
 * `stored` is what the last boot wrote for the same week — reading it back is what keeps a
 * week's hoard from wandering when the Hearth is re-assigned mid-week. A different week (or
 * none) rolls afresh. Returns what to write down.
 */
export function pinWeeklySecrets(
  week: number,
  stored: { week: number; cells: Partial<Record<SecretSiteId, H3Index>> } | null,
): { week: number; cells: Partial<Record<SecretSiteId, H3Index>> } {
  secretWeek = week;
  const cells: Partial<Record<SecretSiteId, H3Index>> =
    stored?.week === week && SECRET_SITES.every((id) => stored.cells[id])
      ? stored.cells
      : Object.fromEntries(SECRET_SITES.map((id) => [id, cellAt(questSiteAt(id))]));
  pinnedCells = { ...pinnedCells, ...cells };
  return { week, cells };
}

/** Where a site stands — at the anchor if there is one, in Härmälä if there is not. */
export function questSiteAt(id: QuestSiteId): LatLng {
  if (secretWeek !== null && isSecret(id)) {
    const from = anchor ?? QUEST_SITES.statue;
    const deg = roll(`secret:${id}:${secretWeek}:bearing`) * 360;
    const metres = SECRET_MIN_M + roll(`secret:${id}:${secretWeek}:metres`) * SECRET_SPREAD_M;
    return destination(from, deg, metres);
  }
  if (!anchor) return QUEST_SITES[id];
  const { bearing: deg, metres } = SHAPE[id];
  return metres === 0 ? anchor : destination(anchor, deg, metres);
}

/**
 * The ownership cell a quest site falls in.
 *
 * The pin wins whenever there is one. Without it this falls back to the derivation, which
 * is what a brand-new game does for the one boot before its pins are written.
 */
export function siteCell(id: QuestSiteId): H3Index {
  return pinnedCells[id] ?? cellAt(questSiteAt(id));
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
