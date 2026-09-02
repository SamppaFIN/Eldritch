/**
 * The Keep's Realm section (BRDC-KEEP-004).
 *
 * State-of-the-nation, gathered from the loose lines that used to trail the panel: what
 * fades and when, the dark time on the calendar, the one privacy sentence
 * BRDC-CASTLE-001 asks for, and the two things you do from here — face the Wager, or
 * jump to the cell about to be lost.
 */
import { RitualButton } from '@es3/ui';
import './keep.css';

/** Hours to a phrase. Duplicated from HearthPanel — five lines, not worth a shared import. */
function hours(h: number | null): string {
  if (h === null) return '—';
  if (h <= 1) return 'within the hour';
  if (h < 48) return `${Math.round(h)} h`;
  return `${Math.round(h / 24)} days`;
}

export interface KeepRealmProps {
  weakestH3: string | null;
  atRisk: number;
  firstLossInHours: number | null;
  dark: { active: boolean; inDays: number };
  onWager: () => void;
  onWeakest: (h3: string) => void;
}

export function KeepRealm({
  weakestH3,
  atRisk,
  firstLossInHours,
  dark,
  onWager,
  onWeakest,
}: KeepRealmProps) {
  return (
    <section className="keep-section" aria-label="Realm">
      <h3 className="keep-section__head">Realm</h3>

      {dark.active ? (
        <p className="hearth-panel__line hearth-panel__line--warn">
          The dark time holds. Everything you make comes slower — {dark.inDays}{' '}
          {dark.inDays === 1 ? 'day' : 'days'} until it lifts.
        </p>
      ) : dark.inDays <= 21 ? (
        <p className="hearth-panel__line">
          The dark time comes in {dark.inDays} days. Production will slow while it lasts.
        </p>
      ) : null}

      {weakestH3 && firstLossInHours !== null ? (
        <p className={`hearth-panel__line${atRisk > 0 ? ' hearth-panel__line--warn' : ''}`}>
          {atRisk > 0
            ? `${atRisk} ${atRisk === 1 ? 'cell fades' : 'cells fade'} within the day.`
            : 'Nothing fades today.'}{' '}
          The first goes {hours(firstLossInHours)} from now.
        </p>
      ) : null}

      <p className="hearth-panel__line">
        Other players will only ever see your Keep, never your Hearth.
      </p>
      <p className="hearth-panel__line">Troops to raise come later.</p>

      <div className="hearth-panel__actions">
        {weakestH3 ? (
          <RitualButton variant="ghost" onClick={() => onWeakest(weakestH3)}>
            Show the first to fade
          </RitualButton>
        ) : null}
        <RitualButton variant="ghost" onClick={onWager}>
          The Wager
        </RitualButton>
      </div>
    </section>
  );
}
