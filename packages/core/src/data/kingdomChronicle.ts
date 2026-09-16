/**
 * The chronicle a retired kingdom gets when nothing else can write it (BRDC-HALL-002).
 *
 * The reward for retiring is a short story about the kingdom you once had — normally
 * written by the Worker's call to an AI, since that call needs a key the client never
 * holds. But the Worker is not always reachable, and the reward must not depend on it:
 * this builds the same kind of sentence from the entry's own numbers, entirely locally,
 * so a kingdom is never told "no story available" for something outside its control.
 */
import type { HallOfFameEntry } from './hallOfFameStore.js';

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/** Mirrors `apps/game`'s own `formatArea` (`features/codex/figures.ts`) — duplicated
 *  rather than imported, since core cannot reach into the app layer. */
function formatArea(m2: number): string {
  if (m2 < 10_000) return `${Math.round(m2)} m²`;
  if (m2 < 1_000_000) return `${(m2 / 10_000).toFixed(1)} ha`;
  return `${(m2 / 1_000_000).toFixed(2)} km²`;
}

export function fallbackChronicle(entry: HallOfFameEntry): string {
  const finds = [
    entry.wonders > 0 ? plural(entry.wonders, 'wonder') : null,
    entry.secretSites > 0 ? plural(entry.secretSites, 'secret site') : null,
    entry.cipherShards > 0 ? plural(entry.cipherShards, 'cipher shard') : null,
  ].filter((s): s is string => s !== null);

  const findLine =
    finds.length > 0 ? ` Along the way it uncovered ${finds.join(', ')}.` : '';
  const achieveLine =
    entry.achievements > 0
      ? ` ${entry.achievements === 1 ? 'One deed was' : `${entry.achievements} deeds were`} remembered enough to be recorded.`
      : '';

  return (
    `The kingdom of ${entry.name} reached Consciousness level ${entry.level} before its ` +
    `ruler chose to let it go. In its time it held ${formatArea(entry.areaM2)} across ` +
    `${plural(entry.provinces, 'province')}, home to some ${entry.population.toLocaleString()} ` +
    `souls.${achieveLine}${findLine} The Void keeps the rest; this much is written down.`
  );
}
