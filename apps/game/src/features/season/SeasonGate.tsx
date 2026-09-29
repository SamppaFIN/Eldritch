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
import { clearAll, utcDay } from '@es3/core';
import type { GameRepository, HeirloomId, Legacy, Season } from '@es3/core';
import { fetchBoards, seasonOnce } from '../../data/season.js';
import { publishLegacy } from '../../data/legacy.js';
import { LegacyTable } from '../keep/LegacyTally.js';
import { HeirloomChoice } from './HeirloomChoice.js';
import { SeasonIntro } from './SeasonIntro.js';
import './season-panel.css';

type Gate =
  | { kind: 'retire'; season: Season }
  | { kind: 'sealed'; season: Season; legacy: Legacy }
  | { kind: 'intro'; season: Season; heirloom: HeirloomId | null }
  | null;

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
        // The Hall of Records is final at sealing; a title won stays on the sigil (SEASON-005).
        const me = (await repository.getProfile()).id;
        const won = (await fetchBoards(season.n))?.records.filter((t) => t.holder?.realm === me) ?? [];
        await repository.legacy.award(won.map((t) => `Season ${season.n} · ${t.name}`));
        return;
      }
      if (season.n < 2 || (await repository.keep.view(now))) return;
      // A realm from the last season has walked before this one opened. A new player, or a
      // save just retired, has not — its Hearth ring is today's — so it joins instead.
      const opened = utcDay(season.opensAt);
      const old = (await repository.getOwnedCells(now)).some((c) => c.visitDays.some((d) => d < opened));
      if (old) {
        setEra(`Season ${season.n - 1}`);
        setGate({ kind: 'retire', season });
      } else {
        // A fresh save joins the open season: its Keep, then whatever heirloom it carried.
        await repository.keep.found(now);
        setGate({ kind: 'intro', season, heirloom: await repository.heirloom.claim(now) });
      }
    })();
  }, [repository]);

  if (!gate || !repository) return null;

  if (gate.kind === 'intro') {
    return <SeasonIntro season={gate.season} heirloom={gate.heirloom} onClose={() => setGate(null)} />;
  }

  if (gate.kind === 'sealed') {
    const quiet = gate.season.outcome === 'quiet';
    return (
      <Modal open title={quiet ? 'The Lake Is Quiet' : 'It Has Risen'} onClose={() => setGate(null)}>
        <p>
          {gate.season.name} is sealed. {quiet ? 'The Ancient One fell in time — every Legacy is multiplied by 1.2.' : 'The Ancient One outlasted the Reckoning.'}
        </p>
        <LegacyTable legacy={gate.legacy} outcome={gate.season.outcome} />
        <p>The map is frozen. Walk it for 48 hours as a fossil; nothing more can be claimed.</p>
        <HeirloomChoice repository={repository} season={gate.season.n} />
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
