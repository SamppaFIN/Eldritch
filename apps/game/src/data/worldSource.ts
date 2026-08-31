/**
 * Reading the shared world, and the way into it (BRDC-SHARE-001).
 *
 * `world/<res6>.json` is published by a cron job. It may not exist — nobody has submitted
 * for that region yet, or there is no network — so every failure here is swallowed. The
 * game is fully playable without a single shard.
 */
import { buildSubmission, encodeSubmission } from '@es3/core';
import type { WorldSource } from '@es3/core';

/** The repo whose Issues are the write path. */
const REPO = 'SamppaFIN/Eldritch';

/**
 * Fetch the shards for these res-6 regions. A missing or unreachable shard is simply
 * absent from the result — never an error.
 */
export async function fetchWorldShards(
  regions: readonly string[],
  base: string = import.meta.env.BASE_URL,
): Promise<string[]> {
  const texts: string[] = [];
  await Promise.all(
    regions.map(async (region) => {
      try {
        const res = await fetch(`${base}world/${region}.json`, { cache: 'no-store' });
        if (res.ok) texts.push(await res.text());
      } catch {
        /* offline or blocked — the world is optional */
      }
    }),
  );
  return texts;
}

/**
 * The URL that opens a prefilled GitHub issue carrying the player's territory.
 *
 * This is the whole write path: no key on the client, one tap from a phone browser, and
 * the cron job already has permission to read its own repo's issues.
 */
export function worldSubmissionUrl(source: WorldSource): string {
  const params = new URLSearchParams({
    title: `world: ${source.name}`,
    body: encodeSubmission(buildSubmission(source)),
    labels: 'world-submission',
  });
  return `https://github.com/${REPO}/issues/new?${params.toString()}`;
}
