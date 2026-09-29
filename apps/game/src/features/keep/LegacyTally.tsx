/**
 * What You Leave Behind — the Legacy tally (BRDC-SEASON-003, Eldritch-season.pdf S4).
 *
 * Line by line: what was built, the rule that makes it points, the points; then the
 * subtotal, the outcome's multiplier and the Legacy. The same component serves the live
 * tally in the Keep ("if the season closed now") and the sealed one (SEASON-004).
 */
import { useEffect, useState } from 'react';
import type { GameRepository, Legacy, SeasonOutcome } from '@es3/core';
import './keep.css';

export function LegacyTable({ legacy, outcome }: { legacy: Legacy; outcome?: SeasonOutcome | undefined }) {
  return (
    <table className="keep-legacy es-numeric">
      <tbody>
        {legacy.lines.map((l) => (
          <tr key={l.label}>
            <th scope="row">{l.label}</th>
            <td>
              {l.count} {l.rule}
            </td>
            <td>{l.points}</td>
          </tr>
        ))}
        <tr className="keep-legacy__sum">
          <th scope="row">Subtotal</th>
          <td />
          <td>{legacy.subtotal}</td>
        </tr>
        {outcome ? (
          <tr>
            <th scope="row">{outcome === 'quiet' ? 'The Lake Is Quiet' : 'The Ancient One Risen'}</th>
            <td>× {legacy.mult}</td>
            <td />
          </tr>
        ) : null}
        <tr className="keep-legacy__total">
          <th scope="row">Legacy</th>
          <td />
          <td>{legacy.total}</td>
        </tr>
      </tbody>
    </table>
  );
}

/** The live tally in the Keep: what would be left if the season closed now. */
export function KeepLegacy({ repository, now }: { repository: GameRepository | null; now: number }) {
  const [legacy, setLegacy] = useState<Legacy | null>(null);
  useEffect(() => {
    if (repository) void repository.legacy.tally(now).then(setLegacy);
  }, [repository, now]);
  if (!legacy) return null;
  return (
    <>
      <h3 className="hearth-panel__section">What you would leave behind</h3>
      <section className="keep-citizens" aria-label="Legacy">
        <p className="hearth-panel__line">If the season closed now, before the lake decides.</p>
        <LegacyTable legacy={legacy} />
      </section>
    </>
  );
}
