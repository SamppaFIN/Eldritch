/**
 * What each technology, rite and Work is — one line — and the concrete good it does.
 *
 * `names.ts` gave the rule tables their display names; this is the next layer of copy
 * they do not carry (claude.md §16): a sentence, and a computed effect string read
 * straight off `BUILDINGS` / `SPELLS` so the numbers can never drift from the rules.
 * Every research row, rite button and build row shows both (BRDC-TEMPLE-003).
 */
import type { ReactNode } from 'react';
import { RESOURCE_KINDS } from '@es3/core';
import type { BuildingId, ResourceKind, SpellId, TechId, TempleSchool } from '@es3/core';
import { BUILDINGS, SPELLS, TECHS } from '@es3/core';
import { BUILDING_NAME, SPELL_NAME, titleCase } from './names.js';
import { RESOURCE_COLOUR, RESOURCE_WORD } from './territoryFeatures.js';

export const TECH_BLURB: Readonly<Record<TechId, string>> = {
  'early-farming': 'Sowing and reaping one plot — the first surplus a settlement keeps.',
  forestry: 'Managed woodland: timber you can count on, not just what has fallen.',
  toolmaking: 'Worked stone and bone — the edge every later craft builds on.',
  irrigation: 'Water carried to the field, so a harvest no longer waits on rain.',
  masonry: 'Cut and fitted stone — stores and walls that outlast their builders.',
  mining: 'Following a seam underground for ore and clean-cut stone.',
  seafaring: 'Boats that hold a course out of sight of land.',
  fortification: 'Ground shaped for defence — a Fortress, and the Bulwark rite.',
  'guild-craft': 'Craftsmen bound into guilds — the vineyards, and the Dominion rite.',
  astronomy: 'Reading the turning sky — the calendar, and the Insight rite.',
  smithing: 'Ore worked hot at the forge — iron, and the Forgeheart rite.',
  'tide-lore': "The moon's pull on water read closely — the Wellspring rite.",
  wildcraft: "The forest's own husbandry — the Greenwake rite.",
};

export const SPELL_BLURB: Readonly<Record<SpellId, string>> = {
  insight: 'The night sky read for meaning — wisdom gathers across your whole domain.',
  bulwark: 'This cell set against the Void — it holds without a visit.',
  forgeheart: 'The forge lit under the whole realm — iron flows while it burns.',
  wellspring: 'A source opened beneath the land — food rises across the domain.',
  greenwake: 'Every wood you hold quickened — timber comes in faster.',
  snare: "A rival's ground caught fast. Carried into a Wager, not cast at home.",
  dominion: "Another's people turned to your word. Carried into a Wager.",
};

export const BUILDING_BLURB: Readonly<Record<BuildingId, string>> = {
  granary: 'Stores grain, and makes room for more Work across the realm.',
  monument: 'A raised stone that turns passers-by into culture.',
  storehouse: "Deeper stores — every resource's ceiling rises.",
  market: 'A place to trade — a steady trickle of gold.',
  sawmill: 'Cuts timber from the forest it stands in.',
  lumbermill: 'A sawmill driven harder — far more timber, paid for in iron.',
  mine: 'Ore cut from the mountainside.',
  quarry: 'The same rock worked deeper, for dressed stone.',
  farm: 'Irrigated fields — food well past what a Granary gathers.',
  fishery: 'The catch off a lake or coast, and a token each day.',
  vineyard: 'Terraced vines on a hillside — culture, and the wine trade.',
  library: 'Beside a temple, it draws wisdom from the cells around it.',
  'temple-grove': 'Consecrated trees that raise mana in the ground nearby.',
  lighthouse: 'Its light reaches the water; boats come back with more.',
  fortress: 'Blunts every attack on the ground around it.',
};

/** The one Rite each school leads to. Every value's `SPELLS[v].school` is its own key
 *  — `catalogue.test.ts` locks that. Air's is a Wager rite; the rest are cast at home. */
export const SCHOOL_RITE: Readonly<Record<TempleSchool, SpellId>> = {
  fire: 'forgeheart',
  water: 'wellspring',
  earth: 'bulwark',
  air: 'dominion',
  nature: 'greenwake',
  spirit: 'insight',
};

const word = (k: ResourceKind): string => RESOURCE_WORD[k];
const andList = (xs: readonly string[]): string =>
  xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

/** "+5 timber / h · +1 tokens / day" — read off the building's own row, never hand-kept. */
export function buildingEffect(id: BuildingId): string {
  const b = BUILDINGS[id];
  const parts: string[] = [];
  for (const [k, v] of Object.entries(b.produces ?? {})) parts.push(`+${v} ${word(k as ResourceKind)} / h`);
  for (const [k, v] of Object.entries(b.producesPerDay ?? {}))
    parts.push(`+${v} ${word(k as ResourceKind)} / day`);
  if (b.storageCapBonus) parts.push(`+${b.storageCapBonus} storage cap`);
  if (b.buildingCapacity) parts.push(`+${b.buildingCapacity} build slots`);
  if (b.aura) {
    parts.push(
      b.aura.kind === 'defence'
        ? `−${b.aura.amount} to attacks within ${b.aura.radius}`
        : `+${b.aura.amount} ${b.aura.kind} / h within ${b.aura.radius}`,
    );
  }
  return parts.join(' · ');
}

/** "+6 wisdom / h to the domain · 12 h" — from `SPELLS`; Bulwark and the Wager pair by hand. */
export function spellEffect(id: SpellId): string {
  const s = SPELLS[id];
  const hours = Math.round(s.durationMs / 3_600_000);
  if (id === 'bulwark') return `Shelters this cell from decay · ${hours} h`;
  const bonus = Object.entries(s.domainBonusPerH ?? {})[0];
  if (bonus) return `+${bonus[1]} ${word(bonus[0] as ResourceKind)} / h to the domain · ${hours} h`;
  return 'Carried into a Wager';
}

/** "Unlocks Library and the Insight rite" / "Leads to Masonry and Mining" / "". */
export function techUnlocks(id: TechId): string {
  const buildings = (Object.keys(BUILDINGS) as BuildingId[]).filter((b) => BUILDINGS[b].tech === id);
  const rites = (Object.keys(SPELLS) as SpellId[]).filter((r) => SPELLS[r].tech === id);
  const named = [
    ...buildings.map((b) => BUILDING_NAME[b]),
    ...rites.map((r) => `the ${SPELL_NAME[r]} rite`),
  ];
  if (named.length > 0) return `Unlocks ${andList(named)}`;
  const leadsTo = (Object.keys(TECHS) as TechId[]).filter((t) => TECHS[t].requires.includes(id));
  return leadsTo.length > 0 ? `Leads to ${andList(leadsTo.map(titleCase))}` : '';
}

const TINT: Readonly<Record<string, string>> = Object.fromEntries(
  RESOURCE_KINDS.map((k) => [RESOURCE_WORD[k], RESOURCE_COLOUR[k]]),
);
const AMOUNT = new RegExp(`([+−]\\d+ (?:${Object.keys(TINT).join('|')}))`, 'g');

/**
 * An effect string with every "+N timber" / "−N iron" span painted the resource's own
 * colour — the same hues the HUD pouch and the map's yield pips use, so a number in the
 * build menu and the same resource on a hexagon read as one thing (BRDC-TEMPLE-003 field
 * report). Everything between the amounts stays plain text.
 */
export function renderEffect(effect: string): ReactNode {
  return effect.split(AMOUNT).map((piece, i) => {
    const m = /^([+−]\d+) (.+)$/.exec(piece);
    const tint = m ? TINT[m[2] ?? ''] : undefined;
    return tint ? (
      <span key={i} style={{ color: tint }}>
        {piece}
      </span>
    ) : (
      piece
    );
  });
}
