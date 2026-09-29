/**
 * Highscores, the Hall of Records and the Hall of Ages (BRDC-SEASON-005, S5 and S6).
 *
 * Opening it publishes this realm's Legacy (the Worker keeps one an hour — the board's
 * "1 h delay") and reads the board back: the top ten with your row always pinned, the seven
 * titles, and the realms whose best three seasons weigh most. Titles already won are shown
 * under the board — they stay on the sigil forever. Nothing before a season is open.
 */
import { useEffect, useState } from 'react';
import type { GameRepository, Title } from '@es3/core';
import { fetchAges, fetchBoards, postLegacy, seasonOnce } from '../../data/season.js';
import type { Boards } from '../../data/season.js';
import '../keep/keep.css';

export function SeasonBoards({ repository, now }: { repository: GameRepository | null; now: number }) {
  const [boards, setBoards] = useState<Boards | null>(null);
  const [ages, setAges] = useState<{ realm: string; name: string; score: number }[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [titles, setTitles] = useState<string[]>([]);

  useEffect(() => {
    if (!repository) return;
    void (async () => {
      setTitles(await repository.legacy.titles());
      const season = await seasonOnce();
      if (!season) return;
      const profile = await repository.getProfile();
      setMe(profile.id);
      const legacy = await repository.legacy.tally(now, season.outcome);
      await postLegacy({ realm: profile.id, name: profile.name, legacy: legacy.total, counts: legacy.counts });
      setBoards(await fetchBoards(season.n));
      setAges((await fetchAges()) ?? []);
    })();
    // Once per opening of the Keep: the Worker is shared. `now` is read on fire.
  }, [repository]);

  if (!boards && titles.length === 0) return null;
  const top = boards?.board.slice(0, 10) ?? [];
  const myIndex = boards?.board.findIndex((r) => r.realm === me) ?? -1;
  const pinned = myIndex >= 10 ? boards?.board[myIndex] : undefined;

  return (
    <>
      <h3 className="hearth-panel__section">Codex of the season</h3>
      <section className="keep-citizens" aria-label="Season boards">
        {boards ? (
          <table className="keep-legacy es-numeric">
            <tbody>
              {top.map((r, i) => (
                <tr key={r.realm} className={r.realm === me ? 'keep-legacy__total' : undefined}>
                  <th scope="row">
                    {i + 1} · {r.name}
                    {r.realm === me ? ' (you)' : ''}
                  </th>
                  <td>{r.legacy}</td>
                </tr>
              ))}
              {pinned ? (
                <tr className="keep-legacy__total">
                  <th scope="row">
                    {myIndex + 1} · {pinned.name} (you)
                  </th>
                  <td>{pinned.legacy}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        ) : null}
        {boards ? <HallOfRecords records={boards.records} me={me} /> : null}
        {ages.length > 1 ? (
          <p className="hearth-panel__line">
            Hall of Ages · {ages.slice(0, 3).map((a) => `${a.name} ${a.score}`).join(' · ')}
          </p>
        ) : null}
        {titles.length > 0 ? <p className="hearth-panel__line">Your titles · {titles.join(' · ')}</p> : null}
      </section>
    </>
  );
}

function HallOfRecords({ records, me }: { records: readonly Title[]; me: string | null }) {
  return (
    <ul className="keep-masterwork__needs" aria-label="Hall of Records">
      {records.map((t) => (
        <li key={t.id}>
          <strong>{t.name}</strong> — {t.what}:{' '}
          {t.holder ? `${t.holder.name}${t.holder.realm === me ? ' (you)' : ''} · ${t.holder.value}` : 'unclaimed'}
        </li>
      ))}
    </ul>
  );
}
