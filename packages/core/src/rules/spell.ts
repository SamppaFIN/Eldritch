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
  | 'dominion';

/** Where a spell's effect lands, and what `castSpell` has to check. */
export type SpellScope = 'domain' | 'own-cell' | 'enemy-cell';

/** `home` spells act now; `wager` spells are carried in a challenge (BRDC-SPELL-002). */
export type SpellVia = 'home' | 'wager';

export interface Spell {
  school: SpellSchool;
  via: SpellVia;
  scope: SpellScope;
  /** Mana to cast. */
  cost: number;
  /** How long the effect lasts, ms. Zero for a `wager` spell — it resolves in one duel. */
  durationMs: number;
  /** The technology that unlocks it. */
  tech: TechId;
  /** For a wired `home` effect: the per-hour resource bonus to the caster's domain. */
  domainBonusPerH?: Partial<ResourcePool>;
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

  if (spell.scope === 'own-cell') {
    if (!target) return { ok: false, refused: 'needs-a-target' };
    const mine = ctx.owned.some((c) => c.h3 === target && c.ownerId === ctx.playerId);
    if (!mine) return { ok: false, refused: 'not-your-cell' };
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

/** Those still within their duration at `now`. The rest are simply gone (GREEN 6). */
export function activeSpells(spells: readonly ActiveSpell[], now: number): ActiveSpell[] {
  return spells.filter((s) => now - s.castAt < SPELLS[s.id].durationMs);
}

/** Milliseconds left before a spell ends, clamped at zero. */
export function spellRemaining(spell: ActiveSpell, now: number): number {
  return Math.max(0, SPELLS[spell.id].durationMs - (now - spell.castAt));
}

/**
 * The decay-clock time a fresh Bulwark grants a cell (BRDC-SPELL-001).
 *
 * Baked into `Cell.shelteredMs` at cast, not applied from the running spell — the hours
 * are bought once and stay off the clock even after the spell's countdown ends.
 */
export const BULWARK_SHELTER_MS = SPELLS.bulwark.durationMs;

/**
 * The per-hour resource bonus from every running `domain` spell.
 *
 * Folds in beside `buildingBonus` and `manaBonus` in `pouch.ts#perHourBonus`; that is the
 * whole wiring of the research school. `{}` when nothing is running.
 */
export function domainSpellBonus(
  spells: readonly ActiveSpell[],
  now: number,
): Partial<ResourcePool> {
  const out: Partial<ResourcePool> = {};
  for (const s of activeSpells(spells, now)) {
    const bonus = SPELLS[s.id].domainBonusPerH;
    if (!bonus || SPELLS[s.id].scope !== 'domain') continue;
    for (const [k, v] of Object.entries(bonus) as [keyof ResourcePool, number][]) {
      out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}
