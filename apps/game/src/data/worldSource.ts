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
 * Fetch the Codex of Dominion — every realm the Worker holds, measured (BRDC-CODEX-001).
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

export async function fetchDemographics(): Promise<CodexFetch> {
  try {
    const res = await fetch(`${WORLD_API}/demographics`, { cache: 'no-store' });
    // 204 is the Worker saying "asked and answered: nothing yet". Anything else that is
    // not a success — 404 from a Worker without this endpoint, a 5xx — is unreachable.
    if (res.status === 204) return { ok: false, reason: 'empty' };
    if (!res.ok) return { ok: false, reason: 'unreachable' };
    return { ok: true, text: await res.text() };
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}

export type PublishResult = 'ok' | 'rate-limited' | 'failed';

/**
 * Publish the player's own ground to the Worker. One POST, no tab, no account. `429` is
 * the Worker's one-a-minute limit; anything else that is not a success is `failed` and
 * the caller says so without drama.
 */
export async function publishSubmission(source: WorldSource): Promise<PublishResult> {
  try {
    const res = await fetch(`${WORLD_API}/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: encodeSubmission(buildSubmission(source)),
    });
    if (res.ok) return 'ok';
    if (res.status === 429) return 'rate-limited';
    return 'failed';
  } catch {
    return 'failed';
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
