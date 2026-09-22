/**
 * The founder's own view: rename the clan, remove a member (BRDC-CLAN-003).
 *
 * Shown only when this device holds the clan's `founderToken` — the one bearer secret
 * that proves it, not a password behind an account. Said plainly in the panel itself:
 * lose the device (or wipe it) and the admin rights are gone with it, unrecoverable.
 */
import { useEffect, useState } from 'react';
import { RitualButton } from '@es3/ui';
import type { PlayerId } from '@es3/core';
import { fetchClanRoster, kickMember, renameClan } from '../../data/clanSource.js';
import type { ClanMember } from '../../data/clanSource.js';

export interface ClanAdminProps {
  clanId: string;
  clanName: string;
  founderToken: string;
  /** So the founder's own row offers no "Remove" — kicking yourself would lock you out
   *  of your own clan's admin the next time you publish. */
  meId: PlayerId | null;
  onRenamed: (name: string) => void;
}

export function ClanAdmin({ clanId, clanName, founderToken, meId, onRenamed }: ClanAdminProps) {
  const [roster, setRoster] = useState<ClanMember[] | null>(null);
  const [name, setName] = useState(clanName);
  const [busy, setBusy] = useState<'rename' | string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchClanRoster(clanId).then((members) => {
      if (alive) setRoster(members);
    });
    return () => {
      alive = false;
    };
  }, [clanId]);

  const rename = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === clanName) return;
    setBusy('rename');
    setError(null);
    const result = await renameClan(clanId, founderToken, trimmed);
    setBusy(null);
    if (result === 'ok') onRenamed(trimmed);
    else setError('Could not reach the world. Try again in a moment.');
  };

  const kick = async (playerId: PlayerId) => {
    setBusy(playerId);
    setError(null);
    const result = await kickMember(clanId, founderToken, playerId);
    setBusy(null);
    if (result === 'ok') setRoster((r) => r?.filter((m) => m.id !== playerId) ?? r);
    else setError('Could not reach the world. Try again in a moment.');
  };

  return (
    <div className="clan__admin">
      <p className="clan__hint">
        Only this device can manage {clanName} — the admin key lives here, not on an account.
        Losing this device loses it too, for good.
      </p>

      <label className="clan__label" htmlFor="clan-rename">
        Rename
      </label>
      <div className="clan__row">
        <input
          id="clan-rename"
          className="clan__input"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
        <RitualButton
          variant="ghost"
          disabled={busy === 'rename' || !name.trim() || name.trim() === clanName}
          onClick={() => void rename()}
        >
          {busy === 'rename' ? 'Saving…' : 'Save'}
        </RitualButton>
      </div>

      <p className="clan__label">Members</p>
      {roster === null ? (
        <p className="clan__hint">Reading the roster…</p>
      ) : roster.length === 0 ? (
        <p className="clan__hint">Nobody has published under this clan yet.</p>
      ) : (
        <ul className="clan__roster">
          {roster.map((m) => (
            <li key={m.id} className="clan__member">
              <span>{m.name}</span>
              {m.id !== meId ? (
                <RitualButton
                  variant="ghost"
                  disabled={busy === m.id}
                  onClick={() => void kick(m.id)}
                >
                  {busy === m.id ? 'Removing…' : 'Remove'}
                </RitualButton>
              ) : (
                <span className="clan__hint">you</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {error ? <p className="clan__error">{error}</p> : null}
    </div>
  );
}
