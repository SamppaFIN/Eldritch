/**
 * A village's suzerain (BRDC-SUZERAIN-001) — Civ's city-state envoys: do a village's own
 * tasks and each one sends it envoys; whoever has sent the most, at least three, is its
 * suzerain and has its speciality — the fishing village's catch, every hour.
 *
 * The tasks run on the Tavern's engine (QUEST-009); the envoys are read from how they
 * ended, never counted twice. Across players the comparison is the shared world's
 * (`/envoys` on the Worker); alone, it is with nobody.
 *
 * Pure.
 */
import type { CityStateId } from './cityState.js';
import type { ResourcePool } from './terrain.js';
import type { Task } from './tasks.js';

export const SUZERAIN_MIN = 3;

/** What a village gives its suzerain each hour. */
export const SUZERAIN_BONUS: Readonly<Record<CityStateId, Partial<ResourcePool>>> = {
  'harmala-fishers': { food: 4 },
};

export const VILLAGE_TASKS: readonly Task[] = [
  {
    id: 'fishers-driftwood', title: 'Driftwood for the Smokehouse', giver: 'The harbour master of Härmälänranta',
    text: '"Walk eight of your hexes and tell me where the wood washes up. The lake moves it at night."',
    objective: { kind: 'visit', count: 8 }, reward: { xp: 40, pool: { food: 20 } },
    done: 'The smokehouse burns through the night. Nobody asks where the wood came from.',
    village: 'harmala-fishers', envoys: 1,
  },
  {
    id: 'fishers-count', title: 'Count the Boats', giver: 'The harbour master of Härmälänranta',
    text: 'Eleven boats went out. The harbour master needs to know how many came back, and whether all of them are boats.',
    objective: { kind: 'check', skill: 'observe', need: 2 }, reward: { xp: 60, pool: { food: 30 } },
    done: 'Eleven, and all of them boats. The harbour master writes it down twice.',
    fail: { text: 'Twelve. Then eleven again. You stop counting.', sanity: 1 },
    village: 'harmala-fishers', envoys: 1,
  },
  {
    id: 'fishers-eel', title: 'The Eel Under the Jetty', giver: 'A fisherwoman with a bandaged hand',
    text: '"It took my net, my bucket and two fingers of my glove. Pull it out, and the village will remember you."',
    objective: { kind: 'check', skill: 'fight', need: 2 }, reward: { xp: 80, pool: { food: 40 } },
    done: 'It is longer than the jetty. The village eats for a week and names a bench after you.',
    fail: { text: 'The eel keeps the net, and now the rope.', sanity: 1 },
    village: 'harmala-fishers', envoys: 2,
  },
  {
    id: 'fishers-farm', title: 'Bread for the Nets', giver: 'The baker of the fishing village',
    text: '"Fish we have. Flour we do not. Raise a Farm and we will trade the mornings for it."',
    objective: { kind: 'build', id: 'farm' }, reward: { xp: 50, pool: { gold: 20 } },
    done: 'The first loaf comes down to the quay wrapped in a net, out of habit.',
    village: 'harmala-fishers', envoys: 1,
  },
];

/** Envoys a realm has sent each village: the sum of its finished village tasks. */
export function envoysFrom(outcomes: Readonly<Record<string, { status: string }>>): Partial<Record<CityStateId, number>> {
  const out: Partial<Record<CityStateId, number>> = {};
  for (const t of VILLAGE_TASKS) {
    if (t.village && outcomes[t.id]?.status === 'completed') out[t.village] = (out[t.village] ?? 0) + (t.envoys ?? 1);
  }
  return out;
}

/** Who leads a village: the most envoys, at least `SUZERAIN_MIN`, and alone at the top. */
export function suzerainOf(rows: readonly { playerId: string; envoys: number }[]): string | null {
  const top = rows.filter((r) => r.envoys >= SUZERAIN_MIN).sort((a, b) => b.envoys - a.envoys);
  const [first, second] = top;
  if (!first) return null;
  return second && second.envoys === first.envoys ? null : first.playerId;
}
