/**
 * The guide's derived pages (BRDC-WIKI-003).
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
  BUILDINGS,
  SPELLS,
  TECHS,
  activeSpells,
  canResearch,
  hasTech,
  spellRemaining,
  worksOn,
} from '@es3/core';
import type { ActiveSpell, BuildingId, Cell, SpellId, TechId } from '@es3/core';
import { BUILDING_NAME, SPELL_NAME, titleCase } from '../territory/names.js';
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
  | `rite:${SpellId}`;

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
export const isDerived = (r: WikiRef): boolean => isWork(r) || isTech(r) || isRite(r);

const workId = (r: WikiRef) => r.slice(5) as BuildingId;
const techId = (r: WikiRef) => r.slice(5) as TechId;
const riteId = (r: WikiRef) => r.slice(5) as SpellId;

/** The heading a link to `ref` shows. Hand pages keep their title; derived use the name. */
export function refTitle(ref: WikiRef): string {
  if (isWork(ref)) return BUILDING_NAME[workId(ref)];
  if (isTech(ref)) return titleCase(techId(ref));
  if (isRite(ref)) return SPELL_NAME[riteId(ref)];
  return HELP[ref]?.title ?? ref;
}

const costLine = (cost: Readonly<Record<string, number>>): string =>
  Object.entries(cost)
    .map(([k, v]) => `${v} ${k}`)
    .join(' · ');

function workPage(id: BuildingId, ctx: WikiContext): WikiPage {
  const b = BUILDINGS[id];
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
      : b.tech
        ? `Needs the ${titleCase(b.tech)} technology first.`
        : 'Buildable from the start.',
  ];
  const see: WikiRef[] = ['work'];
  if (b.tech) see.push(`tech:${b.tech}`);
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

/** The page for any derived ref, or `null` for a hand-written topic. */
export function wikiEntry(ref: WikiRef, ctx: WikiContext = EMPTY_CTX): WikiPage | null {
  if (isWork(ref)) return workPage(workId(ref), ctx);
  if (isTech(ref)) return techPage(techId(ref), ctx);
  if (isRite(ref)) return ritePage(riteId(ref), ctx);
  return null;
}

/** The always-on Reference part of the index — one row per Work, technology and Rite. */
export const REFERENCE: readonly { heading: string; refs: readonly WikiRef[] }[] = [
  { heading: 'Works', refs: BUILDING_IDS.map((id) => `work:${id}` as WikiRef) },
  { heading: 'Research', refs: TECH_IDS.map((id) => `tech:${id}` as WikiRef) },
  { heading: 'Rites', refs: RITE_IDS.map((id) => `rite:${id}` as WikiRef) },
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
