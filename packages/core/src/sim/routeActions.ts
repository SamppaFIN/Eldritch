/**
 * What a played-back route does, not just where it goes (BRDC-SIM-003).
 *
 * A GPX file carries positions and nothing else, so a route that should *play* — begin
 * the Fuming Lake, choose at the bridge, raise a Monument — says so on the track point
 * where it happens, in the file's own extension slot:
 *
 *   <trkpt lat="…" lon="…"><time>…</time>
 *     <extensions><es3:do>adventure choose 0</es3:do></extensions></trkpt>
 *
 * Any other GPX tool ignores the extension and still reads a walk. The verbs are few on
 * purpose — each is one thing a player does with a tap — and an unknown one is skipped
 * and reported, never guessed at.
 */

export type RouteAction =
  /** Top every resource up (the dev grant) — so a route can build without a week's walk. */
  | { kind: 'grant' }
  | { kind: 'collect' }
  /** Raise a Work on the hex you stand on, or the nearest of yours it fits. */
  | { kind: 'build'; id: string }
  | { kind: 'research'; id: string }
  | { kind: 'start'; id: string }
  /** Take choice `index` in the running adventure — only on the stage's own hex. */
  | { kind: 'choose'; index: number }
  /** Walk to a quest site and back — for one that moves every week, like the wisdom stone. */
  | { kind: 'go'; site: string };

/** An action and the point it happens at (an index into the route's sorted points). */
export interface RouteStep {
  at: number;
  do: string;
}

/** Read one instruction; `null` for one it does not know. */
export function parseAction(text: string): RouteAction | null {
  const [verb, a, b] = text.trim().split(/\s+/);
  if (verb === 'grant' && !a) return { kind: 'grant' };
  if (verb === 'collect' && !a) return { kind: 'collect' };
  if (verb === 'build' && a) return { kind: 'build', id: a };
  if (verb === 'research' && a) return { kind: 'research', id: a };
  if (verb === 'adventure' && a === 'start' && b) return { kind: 'start', id: b };
  if (verb === 'adventure' && a === 'choose' && b !== undefined && /^\d+$/.test(b)) return { kind: 'choose', index: Number(b) };
  if (verb === 'go' && a && !b) return { kind: 'go', site: a };
  return null;
}

const TRKPT = /<trkpt\b[^>]*>([\s\S]*?)<\/trkpt>/gi;
const TIME = /<time>\s*([^<]+?)\s*<\/time>/i;
const DO = /<es3:do>\s*([^<]+?)\s*<\/es3:do>/gi;

/** Every `<es3:do>` in a GPX file, by the time of the point it sits on. */
export function gpxActions(text: string): { t: number; do: string }[] {
  const out: { t: number; do: string }[] = [];
  for (const m of text.matchAll(TRKPT)) {
    const body = m[1] ?? '';
    if (!body.includes('es3:do')) continue;
    const t = Date.parse(TIME.exec(body)?.[1] ?? '');
    if (!Number.isFinite(t)) continue;
    for (const d of body.matchAll(DO)) out.push({ t, do: (d[1] ?? '').trim() });
  }
  return out;
}
