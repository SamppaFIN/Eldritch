/**
 * The guide's derived pages (BRDC-WIKI-003).
 *
 * The Reference lists what a season is played with: every Work, the Lore and the temple
 * rites (Season 2 on). The old technology tree and spells keep their pages for the links
 * that still reach them, but are no longer listed.
 *
 * `help.ts` is the hand-written core — the loop, the first walk, one page per concept the
 * log links to. This is the other half: a page for every Work, technology and Rite,
 * built from `BUILDINGS` / `TECHS` / `SPELLS` and the copy in `catalogue.tsx`, so nothing
 * is written twice and a new building cannot ship without a page (the test fails the run).
 *
 * A derived page also carries a live line — how many cells you hold a Work on, whether a
 * Rite is yours yet — because a wiki that only repeats the rules is half a wiki.
 */
import {
  AGE_NAMES,
  BUILDINGS,
  LORE,
  LORE_IDS,
  RITES,
  RITE_IDS as TEMPLE_RITE_IDS,
  RITE_MANA,
  eurekaFor,
  learnCost,
  loreCost,
  SPELLS,
  TECHS,
  activeSpells,
  canResearch,
  hasTech,
  spellRemaining,
  worksOn,
} from '@es3/core';
import type { ActiveSpell, BuildingId, Cell, LoreId, RiteId, SpellId, TechId } from '@es3/core';
import { BUILDING_NAME, SPELL_NAME, titleCase } from '../territory/names.js';
import { costLine } from '../territory/gateNote.js';
import {
  BUILDING_BLURB,
  SPELL_BLURB,
  TECH_BLURB,
  buildingEffect,
  spellEffect,
  techUnlocks,
} from '../territory/catalogue.js';
import { HELP } from './help.js';
import type { HelpTopic } from './help.js';

export type WikiRef =
  | HelpTopic
  | `work:${BuildingId}`
  | `tech:${TechId}`
  | `rite:${SpellId}`
  | `lore:${LoreId}`
  | `temple:${RiteId}`;

export interface WikiPage {
  title: string;
  body: string[];
  see: WikiRef[];
  /** One live line — "Held on 3 cells", "Locked", "Running · 4 h left". */
  status?: string;
  /** For a Work page: the h3s it stands on, each a "show on map" link (BRDC-WIKI-004). */
  sites?: readonly string[];
}

export interface WikiContext {
  ownedCells: readonly Cell[];
  researched: readonly TechId[];
  spells: readonly ActiveSpell[];
  now: number;
}

const EMPTY_CTX: WikiContext = { ownedCells: [], researched: [], spells: [], now: 0 };

export const BUILDING_IDS = Object.keys(BUILDINGS) as BuildingId[];
export const TECH_IDS = Object.keys(TECHS) as TechId[];
export const RITE_IDS = Object.keys(SPELLS) as SpellId[];

const isWork = (r: WikiRef): r is `work:${BuildingId}` => r.startsWith('work:');
const isTech = (r: WikiRef): r is `tech:${TechId}` => r.startsWith('tech:');
const isRite = (r: WikiRef): r is `rite:${SpellId}` => r.startsWith('rite:');
const isLore = (r: WikiRef): r is `lore:${LoreId}` => r.startsWith('lore:');
const isTemple = (r: WikiRef): r is `temple:${RiteId}` => r.startsWith('temple:');
export const isDerived = (r: WikiRef): boolean => isWork(r) || isTech(r) || isRite(r) || isLore(r) || isTemple(r);

const workId = (r: WikiRef) => r.slice(5) as BuildingId;
const techId = (r: WikiRef) => r.slice(5) as TechId;
const riteId = (r: WikiRef) => r.slice(5) as SpellId;

/** The heading a link to `ref` shows. Hand pages keep their title; derived use the name. */
export function refTitle(ref: WikiRef): string {
  if (isWork(ref)) return BUILDING_NAME[workId(ref)];
  if (isTech(ref)) return titleCase(techId(ref));
  if (isRite(ref)) return SPELL_NAME[riteId(ref)];
  if (isLore(ref)) return LORE[ref.slice(5) as LoreId].name;
  if (isTemple(ref)) return RITES[ref.slice(7) as RiteId].name;
  return HELP[ref]?.title ?? ref;
}


/** The piece of the Lore that opens a Work — what a season plays by, not the old tree. */
const openerOf = (id: BuildingId): LoreId | undefined =>
  LORE_IDS.find((l) => LORE[l].unlocks.some((u) => u.kind === 'building' && u.id === id));

function workPage(id: BuildingId, ctx: WikiContext): WikiPage {
  const b = BUILDINGS[id];
  const opener = openerOf(id);
  const sites = ctx.ownedCells
    .filter((c) => worksOn(c).some((w) => w.id === id))
    .map((c) => c.h3);
  const held = sites.length;
  const terrain = b.terrain === 'any' ? 'any ground' : b.terrain.map(titleCase).join(' / ');
  const body = [
    BUILDING_BLURB[id],
    `Effect: ${buildingEffect(id) || 'none on its own'}.`,
    `Costs ${costLine(b.cost)}. Stands on ${terrain}.`,
    b.requires.length > 0
      ? `Upgrades ${b.requires.map((r) => BUILDING_NAME[r]).join(', ')} in place.`
      : opener
        ? `Opened by ${LORE[opener].name}, in the Lore.`
        : 'Buildable from the start.',
  ];
  const see: WikiRef[] = ['work'];
  if (opener) see.push(`lore:${opener}`);
  for (const r of b.requires) see.push(`work:${r}`);
  return {
    title: BUILDING_NAME[id],
    body,
    see,
    status: held > 0 ? `Held on ${held} cell${held === 1 ? '' : 's'}` : 'None built yet',
    sites,
  };
}

function techPage(id: TechId, ctx: WikiContext): WikiPage {
  const t = TECHS[id];
  const body = [
    TECH_BLURB[id],
    `Costs ${t.cost} wisdom. ${t.school ? `Studied at a ${t.school} temple.` : 'Studied in the Keep.'}`,
    t.requires.length > 0
      ? `Needs ${t.requires.map(titleCase).join(', ')} first.`
      : 'One of the starting technologies.',
    `${techUnlocks(id) || 'A step toward a later age.'}.`,
  ];
  const see: WikiRef[] = ['rite'];
  for (const r of t.requires) see.push(`tech:${r}`);
  for (const w of BUILDING_IDS) if (BUILDINGS[w].tech === id) see.push(`work:${w}`);
  for (const s of RITE_IDS) if (SPELLS[s].tech === id) see.push(`rite:${s}`);
  const status = hasTech(ctx.researched, id)
    ? 'Researched'
    : canResearch(ctx.researched, id)
      ? 'Ready to research'
      : 'Locked — an earlier technology first';
  return { title: titleCase(id), body, see, status };
}

function ritePage(id: SpellId, ctx: WikiContext): WikiPage {
  const s = SPELLS[id];
  const body = [
    SPELL_BLURB[id],
    `Effect: ${spellEffect(id)}.`,
    `A ${s.school} Rite, unlocked by the ${titleCase(s.tech)} technology.`,
    s.via === 'wager' ? 'Cast inside a Wager, not at home.' : 'Cast on your own ground.',
  ];
  const running = activeSpells(ctx.spells, ctx.now).find((a) => a.id === id);
  const status = !ctx.researched.includes(s.tech)
    ? `Locked — research ${titleCase(s.tech)}`
    : running
      ? `Running · ${Math.max(1, Math.round(spellRemaining(running, ctx.now) / 3_600_000))} h left`
      : 'Yours to cast';
  return { title: SPELL_NAME[id], body, see: [`tech:${s.tech}`, 'rite'], status };
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
const NO_EUREKA = { owned: [], temples: 0, revealed: 0 };

/** One piece of the Lore (BRDC-PROG-004): its Age, what it opens, and its eureka (BRDC-EUREKA-001). */
function lorePage(id: LoreId): WikiPage {
  const l = LORE[id];
  const opens = l.unlocks.map((u) => (u.kind === 'building' ? BUILDING_NAME[u.id] : u.kind === 'masterwork' ? titleCase(u.id) : u.text)).join(' · ');
  const see: WikiRef[] = ['rite', 'eureka', 'ages'];
  for (const u of l.unlocks) if (u.kind === 'building') see.push(`work:${u.id}`);
  return {
    title: l.name,
    body: [
      l.lore,
      `Age ${ROMAN[l.age]} · ${AGE_NAMES[l.age]}, on the ${l.path} path. Costs ${loreCost(l.age)} wisdom in the Lore.`,
      `Opens: ${opens}.`,
      `Eureka: ${eurekaFor(id, NO_EUREKA).text} — and it costs half.`,
    ],
    see,
    status: `Age ${ROMAN[l.age]} · ${loreCost(l.age)} wisdom`,
  };
}

/** One temple rite (BRDC-PROG-007): its school and tier, each rank's value, and the price. */
function templePage(id: RiteId): WikiPage {
  const r = RITES[id];
  return {
    title: r.name,
    body: [
      r.text.replace('{v}', r.values.join(' / ')),
      `The ${r.school === 'ward' ? 'Ward' : r.school === 'tide' ? 'Tide' : 'Whisper'}, tier ${ROMAN[r.tier]}. Ranks I / II / III give the three numbers above.`,
      `Learned at a dedicated temple for ${learnCost(id)} mana; every cast costs ${RITE_MANA[r.tier]} mana and rests a day. A page of the Book can teach it too.`,
    ],
    see: ['rite', 'mana', 'the-book'],
    status: `Tier ${ROMAN[r.tier]} · ${RITE_MANA[r.tier]} mana a cast`,
  };
}

/** The page for any derived ref, or `null` for a hand-written topic. */
export function wikiEntry(ref: WikiRef, ctx: WikiContext = EMPTY_CTX): WikiPage | null {
  if (isWork(ref)) return workPage(workId(ref), ctx);
  if (isTech(ref)) return techPage(techId(ref), ctx);
  if (isRite(ref)) return ritePage(riteId(ref), ctx);
  if (isLore(ref)) return lorePage(ref.slice(5) as LoreId);
  if (isTemple(ref)) return templePage(ref.slice(7) as RiteId);
  return null;
}

/** The always-on Reference part of the index — one row per Work, piece of Lore and temple rite. */
export const REFERENCE: readonly { heading: string; refs: readonly WikiRef[] }[] = [
  { heading: 'Works', refs: BUILDING_IDS.map((id) => `work:${id}` as WikiRef) },
  { heading: 'The Lore', refs: LORE_IDS.map((id) => `lore:${id}` as WikiRef) },
  { heading: 'Temple rites', refs: TEMPLE_RITE_IDS.map((id) => `temple:${id}` as WikiRef) },
];

/** Flat title + blurb list across hand and derived pages, for the index search. */
export function searchRows(): { ref: WikiRef; title: string; blurb: string }[] {
  const hand = (Object.keys(HELP) as HelpTopic[]).map((t) => ({
    ref: t as WikiRef,
    title: HELP[t].title,
    blurb: HELP[t].body[0] ?? '',
  }));
  const derived = REFERENCE.flatMap((g) =>
    g.refs.map((ref) => ({
      ref,
      title: refTitle(ref),
      blurb: wikiEntry(ref)?.body[0] ?? '',
    })),
  );
  return [...hand, ...derived];
}
