/**
 * The Character screen (BRDC-CHAR-001).
 *
 * Opened from the footer. Who you are: your name, what your Consciousness level means in
 * words, the things you have found in adventures, and the achievements — recognition,
 * timestamped, no reward attached yet. Non-modal like the rest of the map's panels.
 */
import { useEffect, useRef, useState } from 'react';
import { QUEST_ITEMS, SECRET_SITES, SHARD_COUNT, levelState } from '@es3/core';
import type { AchievementView, GameRepository, SecretSiteId } from '@es3/core';
import { GlassPanel, RitualButton } from '@es3/ui';
import type { HelpTopic } from '../help/help.js';
import { relativeTime } from '../log/describe.js';
import { Heptagram } from '../cipher/heptagram.js';
import { MILESTONES, milestoneForLevel } from './consciousness.js';
import { useCharacter } from './useCharacter.js';
import './character.css';

export interface CharacterPanelProps {
  open: boolean;
  repository: GameRepository | null;
  now: () => number;
  version: number;
  onTopic: (topic: HelpTopic) => void;
  onClose: () => void;
}

function Achievements({ list, now }: { list: readonly AchievementView[]; now: number }) {
  return (
    <ul className="character__achievements">
      {list.map((a) => (
        <li key={a.id} className={`character__ach${a.unlockedAt === null ? '' : ' character__ach--got'}`}>
          <span className="character__ach-mark" aria-hidden>
            {a.unlockedAt === null ? '◇' : '✦'}
          </span>
          <span>
            <span className="character__ach-name">{a.name}</span>
            <span className="character__ach-hint">
              {a.unlockedAt === null ? a.hint : `unlocked ${relativeTime(a.unlockedAt, now)}`}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Found({ finds, onTopic }: { finds: readonly SecretSiteId[]; onTopic: (t: HelpTopic) => void }) {
  if (finds.length === 0) {
    return (
      <p className="character__empty">
        Nothing yet. The Fuming Lake hides three things — a trinket, a staff, a stone —
        each on the ground you must walk onto to find.{' '}
        <button type="button" className="character__link" onClick={() => onTopic('adventures')}>
          ?
        </button>
      </p>
    );
  }
  return (
    <ul className="character__found">
      {finds.map((id) => (
        <li key={id}>
          <span className="character__found-name">{QUEST_ITEMS[id].name}</span>
          <span className="character__found-blurb">{QUEST_ITEMS[id].blurb}</span>
        </li>
      ))}
    </ul>
  );
}

export function CharacterPanel({ open, repository, now, version, onTopic, onClose }: CharacterPanelProps) {
  const { profile, finds, achievements, cipher, onRename } = useCharacter(repository, now, open, version);
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    setDraft(profile?.name ?? '');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, profile?.name, onClose]);

  if (!open) return null;

  const state = levelState(profile?.xp ?? 0);
  const milestone = milestoneForLevel(state.level);
  const commit = () => {
    if (draft.trim() && draft.trim() !== profile?.name) onRename(draft);
  };

  return (
    <GlassPanel as="section" ref={ref} className="character" aria-label="Character" tabIndex={-1}>
      <div className="character__head">
        <h2 className="character__title">Character</h2>
        <RitualButton variant="ghost" className="character__close" onClick={onClose} aria-label="Close">
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      <label className="character__label" htmlFor="character-name">
        Name
      </label>
      <input
        id="character-name"
        className="character__name"
        value={draft}
        maxLength={24}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
      />

      <h3 className="character__section">Consciousness</h3>
      <p className="character__level es-numeric">
        {state.level} · {state.name}
      </p>
      <div className="character__xp" aria-hidden>
        <div className="character__xp-fill" style={{ inlineSize: `${state.progress * 100}%` }} />
      </div>
      <p className="character__lore">{milestone.long}</p>
      <ul className="character__ladder">
        {MILESTONES.map((m) => (
          <li key={m.level} className={m.name === milestone.name ? 'character__rung--here' : undefined}>
            <span className="es-numeric">{m.level}</span> {m.name} — {m.blurb}
          </li>
        ))}
      </ul>

      <h3 className="character__section">Found ({finds.length}/{SECRET_SITES.length})</h3>
      <Found finds={finds} onTopic={onTopic} />

      {cipher.held.length > 0 ? (
        <>
          <h3 className="character__section">
            The Cipher ({cipher.held.length}/{SHARD_COUNT})
          </h3>
          <div className="character__cipher">
            <span className="character__cipher-sigil" aria-hidden>
              <Heptagram held={cipher.held} size={104} />
            </span>
            <ul className="character__cipher-lines">
              {cipher.fragments
                .filter((f) => f.held)
                .map((f) => (
                  <li key={f.index}>{f.line}</li>
                ))}
            </ul>
          </div>
          {cipher.inscription ? (
            <p className="character__cipher-whole">{cipher.inscription}</p>
          ) : (
            <p className="character__cipher-note">
              More is scattered on the ground out there. Walk, and it gathers.
            </p>
          )}
        </>
      ) : null}

      <h3 className="character__section">Achievements</h3>
      <Achievements list={achievements} now={now()} />
    </GlassPanel>
  );
}
