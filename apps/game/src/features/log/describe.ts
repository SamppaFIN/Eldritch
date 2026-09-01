/**
 * A log entry, in words. Pure.
 *
 * Core stores entries as `{ kind, ref, count }` — it has no display names. This turns one
 * into a sentence with the app's name tables, and hands back the codex topic the line
 * links to.
 */
import type { LogEntry, LogKind, SecretSiteId } from '@es3/core';
import { QUEST_ITEMS } from '@es3/core';
import { BUILDING_NAME, SPELL_NAME, titleCase } from '../territory/names.js';
import type { HelpTopic } from '../help/help.js';

const TOPIC: Partial<Record<LogKind, HelpTopic>> = {
  awaken: 'awakening',
  corrupt: 'corruption',
  reinforce: 'reinforcement',
  reclaim: 'decay',
  build: 'work',
  demolish: 'work',
  research: 'rite',
  spell: 'rite',
  ward: 'warding',
  expand: 'mana',
  mana: 'mana',
  anomaly: 'anomaly',
  quest: 'adventures',
  wager: 'the-wager',
  hearth: 'hearth',
};

const cells = (n = 0) => `${n} ${n === 1 ? 'cell' : 'cells'}`;
const building = (ref?: string) =>
  BUILDING_NAME[ref as keyof typeof BUILDING_NAME] ?? titleCase(ref ?? 'building');
const spell = (ref?: string) => SPELL_NAME[ref as keyof typeof SPELL_NAME] ?? titleCase(ref ?? 'spell');

export function describeLogEntry(e: LogEntry): { text: string; topic?: HelpTopic | undefined } {
  const topic = TOPIC[e.kind];
  switch (e.kind) {
    case 'awaken':
      return { text: `Awakened ${cells(e.count)} of new ground`, topic };
    case 'corrupt':
      return { text: `Corrupted ${cells(e.count)} from a rival`, topic };
    case 'reinforce':
      return { text: `Reinforced ${cells(e.count)}`, topic };
    case 'reclaim':
      return { text: `The Void reclaimed ${cells(e.count)}`, topic };
    case 'build':
      return { text: `Built a ${building(e.ref)}`, topic };
    case 'demolish':
      return { text: `Demolished a ${building(e.ref)}`, topic };
    case 'research':
      return { text: `Learned ${titleCase(e.ref ?? 'a Rite')}`, topic };
    case 'spell':
      return { text: `Cast ${spell(e.ref)}`, topic };
    case 'ward':
      return { text: 'Warded a cell', topic };
    case 'route':
      return { text: 'Laid a Trade Route', topic };
    case 'expand':
      return { text: `Expanded a Temple${e.count ? ` to rank ${e.count}` : ''}`, topic };
    case 'mana':
      return {
        text:
          e.ref === 'channel'
            ? `Channelled mana into ${e.count ?? 0} wisdom`
            : `Raised the Altar${e.count ? ` to level ${e.count}` : ''}`,
        topic,
      };
    case 'anomaly':
      return {
        text:
          e.ref === 'begin'
            ? 'Began investigating an anomaly'
            : e.ref === 'resolve'
              ? 'An anomaly gave up what it held'
              : e.ref === 'choice'
                ? 'Made a choice at an anomaly'
                : 'Dealt with an anomaly',
        topic,
      };
    case 'quest': {
      const found = e.ref?.startsWith('found:') ? (e.ref.slice(6) as SecretSiteId) : null;
      return {
        text: found ? `Found ${QUEST_ITEMS[found]?.name ?? 'something'}` : 'Took a step in an adventure',
        topic,
      };
    }
    case 'wager':
      return { text: `Fought the Wager against ${e.ref ?? 'a rival'} — ${e.won ? 'won' : 'lost'}`, topic };
    case 'hearth':
      return { text: 'Founded the Hearth', topic };
  }
}

/** "just now", "5 min ago", "yesterday", "3 days ago". */
export function relativeTime(at: number, now: number): string {
  const min = Math.floor((now - at) / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const days = Math.floor(hr / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}
