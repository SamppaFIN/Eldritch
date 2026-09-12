/**
 * Spells: what mana is for (BRDC-SPELL-001).
 *
 * Four schools from the plan — research, protection, block, dominion. Two of them act on
 * your own ground and work today; two need an enemy hex, which does not exist in real time
 * without a server, so they travel in a Wager instead and land in `BRDC-SPELL-002`. Every
 * spell in the table names which (`via`), and `castSpell` refuses a `wager` spell cast at
 * home rather than pretending.
 *
 * An effect is always time-limited and ends itself: `activeSpells` drops the expired ones
 * at read time, the same decay-not-a-timer model as territory. A permanent effect is a
 * building, not a spell.
 *
 * Pure, `ward.ts`'s shape: `castSpell` returns `{ ok, … } | { refused }`, pays through
 * `terrain.ts#spend`, and only `activeSpells`/`spellRemaining` look at the clock.
 */
import { neighboursOf } from '../geo/cells.js';
import { spend } from './terrain.js';
import type { ResourcePool } from './terrain.js';
import type { TechId, TempleSchool } from './tech.js';
import type { Cell, H3Index, PlayerId } from '../types/domain.js';

/**
 * A spell's school is the same six elements a temple specialises in (BRDC-TEMPLE-002)
 * — one concept, defined once in `tech.ts` since `Tech` needs it too.
 */
export type SpellSchool = TempleSchool;
export type SpellId =
  | 'insight'
  | 'bulwark'
  | 'forgeheart'
  | 'wellspring'
  | 'greenwake'
  | 'snare'
  | 'dominion'
  | 'farsight'
  | 'quickening'
  | 'scrying'
  | 'aegis';

/** Where a spell's effect lands, and what `castSpell` has to check. */
export type SpellScope = 'domain' | 'own-cell' | 'enemy-cell' | 'any-cell' | 'border-cell';

/** `home` spells act now; `wager` spells are carried in a challenge (BRDC-SPELL-002). */
export type SpellVia = 'home' | 'wager';

export interface Spell {
  school: SpellSchool;
  via: SpellVia;
  scope: SpellScope;
  /** Mana to cast. */
  cost: number;
  /**
   * How long the effect lasts, ms.
   *
   * Zero means the Rite does not run: a `wager` spell resolves in one duel, and an
   * instant `home` spell (PIVOT-2026-09-09 §7) does its whole work at the moment of the
   * cast. `activeSpells` drops a zero-duration spell on sight, so neither is ever stored
   * among the running ones. A *lasting* effect that never ends is a building, not a Rite.
   */
  durationMs: number;
  /** The technology that unlocks it. */
  tech: TechId;
  /** For a wired `home` effect: the per-hour resource bonus to the caster's domain. */
  domainBonusPerH?: Partial<ResourcePool>;
  /**
   * Rings of cells the Rite touches around its target (PIVOT-2026-09-09 §7).
   *
   * Here rather than in `constants.ts` for the same reason `cost` and `durationMs` are:
   * it is a number belonging to one Rite, and the table is where a Rite's numbers live.
   */
  reach?: number;
}

const HOUR = 3_600_000;

/**
 * The table. Numbers live here, like `BUILDINGS` and `TECHS`.
 *
 * Every school has a home Rite except air: `insight`, `bulwark` and the three domain
 * trickles below (BRDC-TEMPLE-003) are wired — a running `domain` spell folds into
 * `pouch.ts#perHourBonus` through `domainSpellBonus`, no per-spell effect code.
 * `snare` and `dominion` are the enemy-facing pair; `castSpell` sends them back with
 * `carry-in-a-wager` until BRDC-SPELL-002.
 */
export const SPELLS: Readonly<Record<SpellId, Spell>> = {
  insight: {
    school: 'spirit',
    via: 'home',
    scope: 'domain',
    cost: 40,
    durationMs: 12 * HOUR,
    tech: 'astronomy',
    domainBonusPerH: { wisdom: 6 },
  },
  bulwark: {
    school: 'earth',
    via: 'home',
    scope: 'own-cell',
    cost: 50,
    durationMs: 24 * HOUR,
    tech: 'fortification',
  },
  forgeheart: {
    school: 'fire',
    via: 'home',
    scope: 'domain',
    cost: 50,
    durationMs: 18 * HOUR,
    tech: 'smithing',
    domainBonusPerH: { iron: 4 },
  },
  wellspring: {
    school: 'water',
    via: 'home',
    scope: 'domain',
    cost: 45,
    durationMs: 16 * HOUR,
    tech: 'tide-lore',
    domainBonusPerH: { food: 5 },
  },
  greenwake: {
    school: 'nature',
    via: 'home',
    scope: 'domain',
    cost: 40,
    durationMs: 16 * HOUR,
    tech: 'wildcraft',
    domainBonusPerH: { wood: 6 },
  },
  snare: {
    school: 'earth',
    via: 'wager',
    scope: 'enemy-cell',
    cost: 60,
    durationMs: 0,
    tech: 'fortification',
  },
  dominion: {
    school: 'air',
    via: 'wager',
    scope: 'enemy-cell',
    cost: 80,
    durationMs: 0,
    tech: 'guild-craft',
  },

  /* --- PIVOT-2026-09-09 §7: the two Rites that reach past your feet --------- */

  // Air's home Rite, and the school's first: seeing at a distance is what air is for.
  // Cheap, because what it buys is knowledge, and knowledge only tells you where to walk.
  farsight: {
    school: 'air',
    via: 'home',
    scope: 'any-cell',
    cost: 30,
    durationMs: 0,
    tech: 'guild-craft',
    // Two rings is nineteen hexes of ground read before deciding where to walk. Generous,
    // because all it buys is knowing — it still takes feet to own any of it.
    reach: 2,
  },
  /*
   * The most expensive thing mana buys, on purpose.
   *
   * At 6 mana an hour from one place, 120 is twenty hours — far slower than walking the
   * same seven hexes. That is the point: this is not a shortcut, it is a way to reach
   * ground your feet cannot (across water, behind a fence, on the far side of a motorway).
   * It takes unheld ground only. A rival's cell is taken by siege, never by a Rite.
   */
  quickening: {
    school: 'earth',
    via: 'home',
    scope: 'border-cell',
    cost: 120,
    durationMs: 0,
    tech: 'fortification',
    // One ring. Seven hexes at most, and only the free ones: taking ground without
    // walking is the one thing this game must never make comfortable.
    reach: 1,
  },

  /*
   * --- BRDC-SPELL-002 -------------------------------------------------------
   *
   * The ticket asks for three: a far look, a dominion Rite and a block Rite. Two are here.
   *
   * **The block Rite is not, and it is not an oversight.** "Slow the work an opponent did
   * against decay" has to reach a rival's cell, and this device is not allowed to age one:
   * `projectCell` returns an imported cell untouched on purpose, because ageing somebody
   * else's ground here would invent a decay its owner never agreed to and eventually
   * release a cell they still hold. A Wither cast at home would therefore cost mana and do
   * exactly nothing to any real rival — the version written first did, and `spell.test.ts`'s
   * own "every home spell does not target an enemy cell" caught it. `snare` already carries
   * the block into a Wager, which is where it can be adjudicated, and it stays the answer
   * until Phase 5 puts a server behind it.
   */

  /*
   * Scrying: see wide, and forget.
   *
   * The ticket was written a week before `farsight` existed and asks for the same verb, so
   * the two have to be told apart or one of them is dead weight. The line the ticket draws
   * is the right one and this is it: **walking and a watchtower reveal for good; magic
   * shows and forgets.** Farsight is short and permanent — two rings, written to the store,
   * yours from then on. Scrying is wide and temporary — reach grows with Consciousness,
   * nothing is written, and when the six hours are up the ground goes dark again.
   *
   * That makes them worth having both: farsight is how you learn your own neighbourhood,
   * scrying is how you look at somebody else's before deciding to walk there.
   *
   * `reach` is absent on purpose — this one's range is not a constant, it is `scryReach`.
   */
  scrying: {
    school: 'water',
    via: 'home',
    scope: 'any-cell',
    cost: 55,
    durationMs: 6 * HOUR,
    tech: 'tide-lore',
  },

  /*
   * Aegis: Bulwark, but over ground you cannot stand on.
   *
   * The dominion Rite the plan asked for and `BRDC-SPELL-001` deferred. Bulwark buys one
   * cell time off the decay clock; this buys it for every cell of yours within reach, which
   * is what "strengthen your own land from a distance" has to mean in a game whose only
   * currency against the Void is time. Dear, and it should be: it is a week away from home
   * made survivable.
   */
  aegis: {
    school: 'air',
    via: 'home',
    scope: 'own-cell',
    cost: 90,
    durationMs: 24 * HOUR,
    tech: 'guild-craft',
    reach: 2,
  },

};

export interface ActiveSpell {
  id: SpellId;
  /** The cell a `own-cell` spell was cast on; absent for a `domain` spell. */
  target?: H3Index;
  castAt: number;
}

export type CastRefusal =
  | 'unknown-spell'
  | 'locked'
  | 'cannot-afford'
  | 'carry-in-a-wager'
  | 'needs-a-target'
  | 'not-your-cell'
  | 'not-on-your-border'
  | 'already-held'
  | 'already-running';

export interface CastContext {
  playerId: PlayerId;
  researched: readonly TechId[];
  pool: ResourcePool;
  /** The caster's cells, to check an `own-cell` target. */
  owned: readonly Cell[];
  /** What is already running, so a domain spell is not stacked on itself. */
  active: readonly ActiveSpell[];
}

export type CastResult =
  | { ok: true; spell: ActiveSpell; pool: ResourcePool }
  | { ok: false; refused: CastRefusal };

/**
 * Cast `id` at `target`, paying mana. Pure and clock-free — `castAt` is supplied, not read.
 *
 * Order of objections, most fundamental first: the spell has to exist, be a `home` spell,
 * be unlocked, have a valid target, not already be running, and be affordable.
 */
export function castSpell(
  ctx: CastContext,
  id: SpellId,
  target: H3Index | null,
  castAt: number,
): CastResult {
  const spell = SPELLS[id];
  if (!spell) return { ok: false, refused: 'unknown-spell' };
  if (spell.via === 'wager') return { ok: false, refused: 'carry-in-a-wager' };
  if (!ctx.researched.includes(spell.tech)) return { ok: false, refused: 'locked' };

  if (spell.scope !== 'domain' && !target) return { ok: false, refused: 'needs-a-target' };
  const mine = (h3: H3Index) => ctx.owned.some((c) => c.h3 === h3 && c.ownerId === ctx.playerId);

  if (spell.scope === 'own-cell' && target && !mine(target)) {
    return { ok: false, refused: 'not-your-cell' };
  }
  // Quickening reaches one ring past your border, so the hex it is aimed at has to be on
  // that border and has to be free. Ground you already hold is not somewhere to expand to.
  if (spell.scope === 'border-cell' && target) {
    if (mine(target)) return { ok: false, refused: 'already-held' };
    if (!neighboursOf(target).some(mine)) return { ok: false, refused: 'not-on-your-border' };
  }

  const already = ctx.active.some((a) =>
    a.id === id && (spell.scope !== 'own-cell' || a.target === target),
  );
  if (already) return { ok: false, refused: 'already-running' };

  const paid = spend(ctx.pool, { mana: spell.cost });
  if (!paid) return { ok: false, refused: 'cannot-afford' };

  const active: ActiveSpell =
    spell.scope === 'own-cell' && target ? { id, target, castAt } : { id, castAt };
  return { ok: true, spell: active, pool: paid };
}

/**
 * Those still within their duration at `now`. The rest are simply gone (GREEN 6) — and a
 * zero-duration Rite is never among them, which is what keeps an instant one out of the
 * stored list without a second flag to check.
 */
export function activeSpells(spells: readonly ActiveSpell[], now: number): ActiveSpell[] {
  return spells.filter((s) => now - s.castAt < SPELLS[s.id].durationMs);
}

/** Milliseconds left before a spell ends, clamped at zero. */
export function spellRemaining(spell: ActiveSpell, now: number): number {
  return Math.max(0, SPELLS[spell.id].durationMs - (now - spell.castAt));
}
