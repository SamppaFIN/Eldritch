/**
 * Your identity on the You screen (BRDC-IDENTITY-001): the recovery code to write down,
 * and the way back in on a new phone. Says plainly what it does not do — the realm stays
 * on the phone it was walked on.
 */
import { useState } from 'react';
import { RitualButton } from '@es3/ui';
import type { GameRepository } from '@es3/core';
import { fetchRecovery, readRecoveryCode } from '../../data/recovery.js';
import { writeNation, resolveBannerId } from '../nation/nation.js';
import { writeClan } from '../clan/clan.js';

const FAULT: Readonly<Record<string, string>> = {
  unknown: 'No identity has that code. Check the words and the number.',
  'too-soon': 'Too many tries. Wait a minute, then try again.',
  failed: 'The shared world cannot be reached. Try again with a signal.',
};

export function RecoveryCard({ repository }: { repository: GameRepository | null }) {
  const code = readRecoveryCode();
  const [typed, setTyped] = useState('');
  const [said, setSaid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const recover = async () => {
    if (!repository || !typed.trim()) return;
    setBusy(true);
    const r = await fetchRecovery(typed);
    if (!r.ok) {
      setSaid(FAULT[r.fault] ?? FAULT.failed ?? null);
      setBusy(false);
      return;
    }
    const id = r.identity;
    await repository.adoptIdentity(id.playerId, id.name);
    if (id.nation || id.banner) writeNation({ name: id.nation ?? '', bannerId: resolveBannerId(id.banner) });
    writeClan(id.clanId ? { clanId: id.clanId, clanName: id.clanName ?? '', founderToken: null } : { clanId: '', clanName: '', founderToken: null });
    setSaid(`You are ${id.nation || id.name || 'yourself'} again. Reloading…`);
    // Every screen reads the profile, the nation and the clan; a reload is the honest refresh.
    window.setTimeout(() => window.location.reload(), 1_200);
  };

  return (
    <section className="character__identity" aria-label="Your identity">
      {code ? (
        <p className="character__identity-line">
          Your recovery code: <strong className="es-numeric">{code}</strong>. Write it down — it brings your name and clan to a
          new phone.
        </p>
      ) : (
        <p className="character__identity-line">Raise your banner in the shared world once, and you get a recovery code here.</p>
      )}
      <details className="character__more">
        <summary>I already have an identity</summary>
        <p className="character__identity-line">
          This brings back your name and clan on this phone. Your earlier kingdom stays on the phone you walked it on.
        </p>
        <label className="character__identity-line">
          Recovery code{' '}
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="moss-lantern-tide-42" autoComplete="off" />
        </label>
        <RitualButton variant="ghost" disabled={busy || !typed.trim()} onClick={() => void recover()}>
          Recover
        </RitualButton>
      </details>
      {said ? (
        <p className="character__identity-line" role="status">
          {said}
        </p>
      ) : null}
    </section>
  );
}
