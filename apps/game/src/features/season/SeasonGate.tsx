/**
 * The door between seasons (BRDC-SEASON-004, Eldritch-season.pdf S3).
 *
 * Reads the shared season once a session and acts on it:
 * - Season 2 (or later) open, and this save is a Season 1 realm → it must retire first.
 *   Infinite 2026-09-29: *"kun season 2 julkaistaan, siihen tulee ilmoitus että Retire your
 *   kingdom to the history books"*. The notice cannot be dismissed; retiring writes the
 *   kingdom to the Chronicles and starts a clean save.
 * - Season open, and this save is fresh → it joins: its Keep is founded.
 * - Season sealed → the map is a fossil: claims stop, and the season's close is shown
 *   with the Legacy tally.
 */
import { useEffect, useState } from 'react';
import { Modal, RitualButton } from '@es3/ui';
import { clearAll } from '@es3/core';
import type { GameRepository, Legacy, Season } from '@es3/core';
import { seasonOnce } from '../../data/season.js';
import { publishLegacy } from '../../data/legacy.js';
import { LegacyTable } from '../keep/LegacyTally.js';
import './season-panel.css';

type Gate = { kind: 'retire'; season: Season } | { kind: 'sealed'; season: Season; legacy: Legacy } | null;

export function SeasonGate({ repository }: { repository: GameRepository | null }) {
  const [gate, setGate] = useState<Gate>(null);
  const [era, setEra] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!repository) return;
    void (async () => {
      const season = await seasonOnce();
      if (!season) return;
      const now = Date.now();
      const sealed = season.phase === 'sealed' || season.phase === 'interregnum' || season.phase === 'next';
      await repository.legacy.freeze(sealed);
      if (sealed) {
        setGate({ kind: 'sealed', season, legacy: await repository.legacy.tally(now, season.outcome) });
        return;
      }
      if (season.n < 2 || (await repository.keep.view(now))) return;
      if ((await repository.getOwnedCells(now)).length > 0) {
        setEra(`Season ${season.n - 1}`);
        setGate({ kind: 'retire', season });
      } else {
        await repository.keep.found(now); // a fresh save joins the open season
      }
    })();
  }, [repository]);

  if (!gate || !repository) return null;

  if (gate.kind === 'sealed') {
    const quiet = gate.season.outcome === 'quiet';
    return (
      <Modal open title={quiet ? 'The Lake Is Quiet' : 'It Has Risen'} onClose={() => setGate(null)}>
        <p>
          {gate.season.name} is sealed. {quiet ? 'The Ancient One fell in time — every Legacy is multiplied by 1.2.' : 'The Ancient One outlasted the Reckoning.'}
        </p>
        <LegacyTable legacy={gate.legacy} outcome={gate.season.outcome} />
        <p>The map is frozen. Walk it for 48 hours as a fossil; nothing more can be claimed.</p>
      </Modal>
    );
  }

  const retire = () => {
    if (busy) return;
    setBusy(true);
    void (async () => {
      const profile = await repository.getProfile();
      const entry = await repository.retireKingdom(Date.now(), era);
      const shared = await publishLegacy(profile.id, entry);
      if (shared) await repository.setKingdomShared(entry.id, Date.now());
      clearAll();
      window.location.reload();
    })();
  };

  return (
    <Modal open dismissible={false} title="Retire your kingdom to the history books" onClose={() => {}}>
      <p>
        {gate.season.name} has begun. Your realm from the last season goes into the Chronicles, where everyone can
        read it. Then you start again, on the same shoreline.
      </p>
      <label className="season-gate__era">
        <span>The age it stood in</span>
        <input value={era} maxLength={60} onChange={(e) => setEra(e.target.value)} />
      </label>
      <RitualButton disabled={busy} onClick={retire}>
        Retire to the history books
      </RitualButton>
    </Modal>
  );
}
