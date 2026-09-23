/**
 * Reading the shared world, and the way into it (BRDC-SHARE-001, -003).
 *
 * A Cloudflare Worker over KV is the whole thing now: `GET /world/<res6>` for the shards,
 * `POST /submit` to publish your own. No key on the client — the Worker trusts `id` +
 * checksum exactly as far as the old GitHub-issue path did. Every failure here is
 * swallowed: the game is fully playable without a single shard.
 */
import { buildSubmission, encodeSubmission } from '@es3/core';
import type { WorldSource } from '@es3/core';

/** The Worker (BRDC-SHARE-003). Overridable per deploy; the default is the live one. */
export const WORLD_API =
  import.meta.env.VITE_WORLD_API ?? 'https://eldritch-world.es3-world-worker.workers.dev';

/** The old GitHub repo — kept only for `worldSubmissionUrl`, the manual fallback. */
const REPO = 'SamppaFIN/Eldritch';

/**
 * Fetch the shards for these res-6 regions. A missing or unreachable shard (204, 404, no
 * network) is simply absent from the result — never an error.
 */
export async function fetchWorldShards(regions: readonly string[]): Promise<string[]> {
  const texts: string[] = [];
  await Promise.all(
    regions.map(async (region) => {
      try {
        const res = await fetch(`${WORLD_API}/world/${region}`, { cache: 'no-store' });
        if (res.ok && res.status !== 204) texts.push(await res.text());
      } catch {
        /* offline or blocked — the world is optional */
      }
    }),
  );
  return texts;
}

/**
 * Fetch a demographics table — every realm, or every clan (BRDC-CODEX-001,
 * BRDC-CLAN-002), the Worker holds, measured.
 *
 * One request, not one per region: the Worker builds the table on write and serves it
 * from a single KV read.
 *
 * The three outcomes are kept apart on purpose, because collapsing them lies to the
 * player. This first shipped returning `null` for all of them, and the very first person
 * to open it had just published their realm and was told nobody had — the Worker had not
 * been redeployed, so the endpoint 404'd. "Nobody is here" and "I could not ask" are
 * different sentences and the panel has to be able to say both.
 */
export type CodexFetch =
  | { ok: true; text: string }
  | { ok: false; reason: 'empty' | 'unreachable' };

/** `path` is `/demographics` (players), `/clan-codex` (BRDC-CLAN-002) or `/atlas`
 *  (BRDC-ATLAS-001) — same three outcomes, different bodies once parsed. */
export async function fetchTable(path: '/demographics' | '/clan-codex' | '/atlas'): Promise<CodexFetch> {
  try {
    const res = await fetch(`${WORLD_API}${path}`, { cache: 'no-store' });
    // 204 is the Worker saying "asked and answered: nothing yet". Anything else that is
    // not a success — 404 from a Worker without this endpoint, a 5xx — is unreachable.
    if (res.status === 204) return { ok: false, reason: 'empty' };
    if (!res.ok) return { ok: false, reason: 'unreachable' };
    return { ok: true, text: await res.text() };
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}

/**
 * The weeks a stored Atlas snapshot exists for, oldest first — what a "compare to N
 * weeks ago" toggle offers (BRDC-ATLAS-001). An empty list either way: no snapshot yet
 * is not a fault, just nothing to compare against.
 */
export async function fetchAtlasHistoryWeeks(): Promise<string[]> {
  try {
    const res = await fetch(`${WORLD_API}/atlas/history`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => null)) as { weeks?: string[] } | null;
    return Array.isArray(data?.weeks) ? data.weeks : [];
  } catch {
    return [];
  }
}

/** One named week's Atlas snapshot — same three outcomes as `fetchTable`, a dynamic
 *  path being the only reason this is not simply another one of its cases. */
export async function fetchAtlasSnapshot(weekKey: string): Promise<CodexFetch> {
  try {
    const res = await fetch(`${WORLD_API}/atlas/history/${weekKey}`, { cache: 'no-store' });
    if (res.status === 204) return { ok: false, reason: 'empty' };
    if (!res.ok) return { ok: false, reason: 'unreachable' };
    return { ok: true, text: await res.text() };
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}

export type PublishResult = 'ok' | 'rate-limited' | 'failed';

export interface PublishOutcome {
  status: PublishResult;
  /** The founder removed this player from the clan they published under
   *  (BRDC-CLAN-003) — never true unless `clanId` was actually sent. */
  kicked: boolean;
}

/**
 * Publish the player's own ground to the Worker. One POST, no tab, no account. `429` is
 * the Worker's one-a-minute limit; anything else that is not a success is `failed` and
 * the caller says so without drama.
 */
export async function publishSubmission(source: WorldSource): Promise<PublishOutcome> {
  try {
    const res = await fetch(`${WORLD_API}/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: encodeSubmission(buildSubmission(source)),
    });
    if (res.status === 429) return { status: 'rate-limited', kicked: false };
    if (!res.ok) return { status: 'failed', kicked: false };
    const data = (await res.json().catch(() => null)) as { kicked?: boolean } | null;
    return { status: 'ok', kicked: data?.kicked === true };
  } catch {
    return { status: 'failed', kicked: false };
  }
}

/**
 * A prefilled GitHub issue carrying the player's territory — the pre-Worker write path,
 * kept as a manual fallback if the Worker is ever unreachable.
 */
export function worldSubmissionUrl(source: WorldSource): string {
  const params = new URLSearchParams({
    title: `world: ${source.name}`,
    body: encodeSubmission(buildSubmission(source)),
    labels: 'world-submission',
  });
  return `https://github.com/${REPO}/issues/new?${params.toString()}`;
}
