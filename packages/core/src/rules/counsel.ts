/**
 * The Keeper's Counsel — the game explains itself (BRDC-COUNSEL-001,
 * Eldritch-Progression.pdf P6 and "COUNSEL PRIORITY · FIRST TRUE WINS").
 *
 * Eight rules in priority order; each that holds becomes one piece of advice, and the
 * first true one leads. The Phase 3 gate asks that the game explain what it asks of the
 * player — this is where it does. Pure: the store gathers the realm, this reads it.
 */

export interface CounselState {
  /** Food per hour after the citizens eat, and what is in the granary's box. */
  foodBalance: number;
  granaryBox: number;
  /** Open gates within three rings of the realm. */
  gatesNear: number;
  /** Hours the stores still fill; 0 = full. null on a save with no Keep clock. */
  storesLeftH: number | null;
  idle: number;
  /** A building with a free slot and no hands in it. */
  emptyWork: string | null;
  /** Techs still needed to enter the next Age. */
  toNextAge: number;
  /** A masterwork one need short, and that need. */
  masterworkNearly: { name: string; missing: string } | null;
  citizens: number;
  housing: number;
  /** The granary's fill, 0..1. */
  granaryFill: number;
  /** The cheapest tech open to study now. */
  cheapestTech: { name: string; cost: number } | null;
}

export interface Counsel {
  id: string;
  title: string;
  why: string;
  /** Where the answer is — named, since the Keep cannot open other screens for you. */
  where: 'keep' | 'hex' | 'lore' | 'map';
}

export function counselOf(s: CounselState): Counsel[] {
  const out: Counsel[] = [];
  if (s.foodBalance < 0 && s.granaryBox / -s.foodBalance < 3) {
    out.push({ id: 'starving', title: 'The realm is starving', why: 'The granary empties within three hours. Staff a Farmstead or build one.', where: 'hex' });
  }
  if (s.gatesNear > 0) {
    out.push({ id: 'gate-near', title: 'A gate is open near your works', why: 'It drains your sanity every hour it stands. Walk to it and seal it.', where: 'map' });
  }
  if (s.storesLeftH === 0) {
    out.push({ id: 'stores-full', title: 'Your stores are full', why: 'Nothing more is made until you collect. Walk to your Keep.', where: 'map' });
  }
  if (s.idle > 0 && s.emptyWork) {
    out.push({ id: 'idle', title: 'A citizen stands idle', why: `The ${s.emptyWork} has no one in it. A work without hands yields nothing.`, where: 'hex' });
  }
  if (s.toNextAge === 1) {
    out.push({ id: 'age-near', title: 'The next Age is one tech away', why: 'Study one more of this Age and every ceiling rises.', where: 'lore' });
  }
  if (s.masterworkNearly) {
    out.push({ id: 'masterwork-near', title: `${s.masterworkNearly.name} is within reach`, why: `All that is missing: ${s.masterworkNearly.missing}.`, where: 'keep' });
  }
  if (s.citizens >= s.housing && s.granaryFill >= 0.8) {
    out.push({ id: 'housing-full', title: 'The Keep is full', why: 'No one more can be born. Raise the Keep to house more.', where: 'keep' });
  }
  if (out.length === 0) {
    out.push(
      s.cheapestTech
        ? { id: 'quiet', title: 'Nothing urgent', why: `Study ${s.cheapestTech.name} — ${s.cheapestTech.cost} wisdom.`, where: 'lore' }
        : { id: 'quiet', title: 'Nothing urgent', why: 'Walk your border. The ground rewards a daily round.', where: 'map' },
    );
  }
  return out;
}

/** "First time you see it" cards: one short page per system, read once, kept forever. */
export const CODEX_CARDS: readonly { id: string; title: string; text: string }[] = [
  { id: 'citizens', title: 'Citizens are born of food', text: 'Surplus food fills the granary. A full granary births a citizen. Each citizen eats 2 food an hour.' },
  { id: 'hands', title: 'No hands, no harvest', text: 'Every building has 1–3 worker slots. Build only what you can staff.' },
  { id: 'lore', title: 'The Age is your ceiling', text: 'Study three techs of an Age to enter the next. The Age caps every building tier and spell rank.' },
  { id: 'doom', title: 'The Doom only rises', text: 'Gates add to it. Sealing one is the only way down. At 13 the Ancient One wakes.' },
];
