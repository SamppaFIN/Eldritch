/**
 * A recovery code: the same public name and clan on a new phone (BRDC-IDENTITY-001).
 *
 * The first `/submit` from an id is given a code — three ordinary words and two digits —
 * stored as `recovery:<code> → id` (and `recovery-of:<id> → code`, so it is issued once).
 * `/recover` turns a code back into what `player:<id>` already says in public: the id,
 * the name, the nation and banner, the clan. Nothing new and nothing private — the realm
 * itself stays on the phone it was walked on. No password, no e-mail: whoever knows the
 * code *is* that player to the game, the same honest trust as the id itself today. Real
 * accounts are Phase 5's.
 */
import type { KV } from './index.js';
import { CLAN, type ClanRecord } from './clan.js';

const CODE = 'recovery:';
const OF = 'recovery-of:';
const PLAYER = 'player:';

/** Short, common, unambiguous when read aloud or typed on a phone. */
const WORDS = [
  'amber', 'anchor', 'ash', 'bell', 'birch', 'boat', 'brook', 'candle', 'cedar', 'cloud', 'coal', 'copper',
  'crow', 'dawn', 'deep', 'dusk', 'ember', 'fern', 'fog', 'frost', 'gate', 'glass', 'harbor', 'hill',
  'iron', 'lake', 'lamp', 'lantern', 'leaf', 'moss', 'moon', 'oak', 'owl', 'pier', 'pine', 'rain',
  'raven', 'reed', 'river', 'salt', 'shell', 'shore', 'slate', 'smoke', 'snow', 'spire', 'star', 'stone',
  'storm', 'sun', 'tide', 'tower', 'wave', 'well', 'willow', 'wind', 'wolf', 'wren', 'yarrow', 'birchwood',
  'bramble', 'cinder', 'marsh', 'thorn',
] as const;

const pick = (n: number) => {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return (a[0] as number) % n;
};

/** "moss-lantern-tide-42". */
export function newCode(): string {
  const w = () => WORDS[pick(WORDS.length)] as string;
  return `${w()}-${w()}-${w()}-${String(pick(100)).padStart(2, '0')}`;
}

/** Spaces, capitals and stray dashes forgiven — it is typed by thumb, maybe in the rain. */
export function normaliseCode(text: string): string {
  return text.trim().toLowerCase().split(/[\s-]+/).filter(Boolean).join('-');
}

/** The id's code if it has none yet — once, ever; null when it already has one. */
export async function issueRecovery(kv: KV, id: string): Promise<string | null> {
  if (await kv.get(OF + id)) return null;
  for (let tries = 0; tries < 5; tries += 1) {
    const code = newCode();
    if (await kv.get(CODE + code)) continue;
    await kv.put(CODE + code, id);
    await kv.put(OF + id, code);
    return code;
  }
  return null;
}

export interface Recovered {
  playerId: string;
  name: string;
  nation?: string;
  banner?: string;
  clanId?: string;
  clanName?: string;
}

/** What a code stands for, from the player's own public file; null for an unknown code. */
export async function recover(kv: KV, text: string): Promise<Recovered | null> {
  const id = await kv.get(CODE + normaliseCode(text));
  if (!id) return null;
  const raw = await kv.get(PLAYER + id);
  if (!raw) return null;
  const s = (JSON.parse(raw) as { source?: { name?: string; nation?: string; banner?: string; clanId?: string } }).source ?? {};
  const out: Recovered = { playerId: id, name: s.name ?? '' };
  if (s.nation) out.nation = s.nation;
  if (s.banner) out.banner = s.banner;
  if (s.clanId) {
    const clan = await kv.get(CLAN + s.clanId);
    out.clanId = s.clanId;
    if (clan) out.clanName = (JSON.parse(clan) as ClanRecord).name;
  }
  return out;
}
