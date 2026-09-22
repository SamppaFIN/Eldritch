/**
 * The one chronicle a retired kingdom gets (BRDC-HALL-002).
 *
 * Split out of `index.ts` once that file reached its 400-line ceiling — this is a
 * self-contained concern (one AI call, one prompt) that only needs the Worker's `Env`
 * for the key, not any of the shared-world or clan state around it.
 */
import type { Env } from './index.js';

/** The numbers a chronicle is written from — the parts of `HallOfFameEntry` worth prose. */
export interface KingdomFacts {
  name: unknown;
  level: unknown;
  areaM2: unknown;
  population: unknown;
  provinces: unknown;
  achievements: unknown;
  wonders: unknown;
  secretSites: unknown;
  cipherShards: unknown;
}

export function isKingdomFacts(v: unknown): v is KingdomFacts {
  const f = v as Partial<KingdomFacts> | null;
  return (
    !!f &&
    typeof f.name === 'string' &&
    typeof f.level === 'number' &&
    typeof f.areaM2 === 'number' &&
    typeof f.population === 'number'
  );
}

function chroniclePrompt(f: KingdomFacts): string {
  return (
    `Write a short (120-180 word) in-universe chronicle of a fallen kingdom in a ` +
    `Lovecraftian cosmic-horror territory game, as if it were a passage from a historical ` +
    `record. Tone: cosmic void, sacred geometry, awe rather than gore. Do not invent ` +
    `named characters, battles or enemies not implied below — work only from these facts. ` +
    `No title, no preamble, just the passage.\n\n` +
    `Kingdom: ${f.name}\nConsciousness level reached: ${f.level}\n` +
    `Ground held: ${f.areaM2} square metres across ${f.provinces} provinces\n` +
    `Population: ${f.population}\nAchievements earned: ${f.achievements}\n` +
    `Wonders found: ${f.wonders}\nSecret sites found: ${f.secretSites}\n` +
    `Cipher shards gathered: ${f.cipherShards}`
  );
}

/** One call to Claude Haiku — cheap and fast, right-sized for a paragraph of flavour text. */
export async function craftChronicle(env: Env, facts: KingdomFacts): Promise<string | null> {
  if (!env.AI_API_KEY) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.AI_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: chroniclePrompt(facts) }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((b) => b.type === 'text')?.text;
    return text && text.trim().length > 0 ? text.trim() : null;
  } catch {
    return null;
  }
}
