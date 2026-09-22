/**
 * Create or join a clan (BRDC-CLAN-001).
 *
 * A friend circle, not an account: no member list or clan-vs-clan league here yet —
 * that needs the Worker to aggregate every clan's published ground, which is
 * `BRDC-CLAN-002`'s job. This screen only does the two things that have to come first:
 * getting a code to exist, and a device carrying it into what it publishes.
 *
 * Same sheet as `HallOfFamePanel`/`CodexPanel`: non-modal, ESC closes.
 */
import { useEffect, useRef, useState } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import type { GameRepository, PlayerId } from '@es3/core';
import { useEscape } from '../hud/useEscape.js';
import { createClan, findClan } from '../../data/clanSource.js';
import { useClan } from './useClan.js';
import { ClanAdmin } from './ClanAdmin.js';
import './clan-panel.css';

export interface ClanPanelProps {
  open: boolean;
  repository: GameRepository | null;
  onClose: () => void;
}

type Mode = 'create' | 'join';

export function ClanPanel({ open, repository, onClose }: ClanPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const { clan, set, leave } = useClan();
  const [mode, setMode] = useState<Mode>('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meId, setMeId] = useState<PlayerId | null>(null);
  useEscape(open, onClose);

  useEffect(() => {
    if (!open || !repository) return;
    void repository.getProfile().then((p) => setMeId(p.id));
  }, [open, repository]);

  if (!open) return null;

  const create = async () => {
    if (!repository || !name.trim()) return;
    setBusy(true);
    setError(null);
    const me = await repository.getProfile();
    const result = await createClan(name.trim(), me.id);
    setBusy(false);
    if (!result.ok) {
      setError('Could not reach the world. Try again in a moment.');
      return;
    }
    set({ clanId: result.id, clanName: name.trim(), founderToken: result.founderToken });
  };

  const join = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    const result = await findClan(code.trim());
    setBusy(false);
    if (!result.ok) {
      setError(
        result.reason === 'not-found'
          ? "That code doesn't match a clan."
          : 'Could not reach the world. Try again in a moment.',
      );
      return;
    }
    set({ clanId: result.id, clanName: result.name, founderToken: null });
  };

  return (
    <GlassPanel as="section" ref={panelRef} className="clan" aria-label="Clan" tabIndex={-1}>
      <div className="clan__bar">
        <h2 className="clan__title">Clan</h2>
        <RitualButton variant="ghost" className="clan__close" onClick={onClose} aria-label="Close">
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      {clan.clanId ? (
        <>
          <p className="clan__note">
            You march under <strong>{clan.clanName}</strong>.
          </p>
          <p className="clan__code es-numeric">Code: {clan.clanId}</p>
          <p className="clan__hint">Share this code so friends can join the same clan.</p>
          {clan.founderToken ? (
            <ClanAdmin
              clanId={clan.clanId}
              clanName={clan.clanName}
              founderToken={clan.founderToken}
              meId={meId}
              onRenamed={(next) => set({ ...clan, clanName: next })}
            />
          ) : null}
          <RitualButton variant="ghost" onClick={leave}>
            Leave clan
          </RitualButton>
        </>
      ) : (
        <>
          <div className="clan__toggle">
            <RitualButton
              {...(mode !== 'create' ? { variant: 'ghost' as const } : {})}
              aria-pressed={mode === 'create'}
              onClick={() => setMode('create')}
            >
              Create
            </RitualButton>
            <RitualButton
              {...(mode !== 'join' ? { variant: 'ghost' as const } : {})}
              aria-pressed={mode === 'join'}
              onClick={() => setMode('join')}
            >
              Join
            </RitualButton>
          </div>

          {mode === 'create' ? (
            <>
              <label className="clan__label" htmlFor="clan-name">
                Clan name
              </label>
              <input
                id="clan-name"
                className="clan__input"
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
              />
              <RitualButton disabled={busy || !name.trim()} onClick={() => void create()}>
                {busy ? 'Creating…' : 'Create clan'}
              </RitualButton>
            </>
          ) : (
            <>
              <label className="clan__label" htmlFor="clan-code">
                Clan code
              </label>
              <input
                id="clan-code"
                className="clan__input"
                value={code}
                maxLength={6}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
              <RitualButton disabled={busy || !code.trim()} onClick={() => void join()}>
                {busy ? 'Joining…' : 'Join clan'}
              </RitualButton>
            </>
          )}
          {error ? <p className="clan__error">{error}</p> : null}
        </>
      )}
    </GlassPanel>
  );
}
