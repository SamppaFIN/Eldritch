/**
 * The notices above the HUD — storage warnings, the shared world's age, the dev clock.
 *
 * They used to be four `position: fixed` paragraphs on identical coordinates, so two at
 * once drew exactly on top of each other, and none of them ever left: they were rendered
 * straight off their conditions, and a condition stays true. BRDC-HUD-004 makes them
 * behave like notices — a stack, a few seconds, and a tap to be rid of one sooner.
 *
 * What the notices *are* lives in `notices.ts`, pure and tested. This is the timing and
 * the DOM.
 */
import { useEffect, useMemo, useState } from 'react';
import { noticesFor } from './notices.js';
import type { NoticeConditions } from './notices.js';

/** Long enough to read a sentence while walking; short enough to be gone before it matters. */
const DISMISS_MS = 7_000;

export type MapNoticesProps = NoticeConditions;

export function MapNotices(props: MapNoticesProps) {
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());

  const { durable, schemaReset, razed, worldStirredMs, shifted, offsetDays } = props;
  const notices = useMemo(
    () =>
      noticesFor({ durable, schemaReset, razed, worldStirredMs, shifted, offsetDays }, dismissed),
    [durable, schemaReset, razed, worldStirredMs, shifted, offsetDays, dismissed],
  );

  // One timer per showing notice, keyed by the ids on screen. A notice dismissed by hand
  // drops out of `notices`, which re-runs this and clears its timer with it. A sticky one
  // gets no timer at all — it reports something already done, and waits to be read.
  const ids = notices.filter((n) => !n.sticky).map((n) => n.id).join(',');
  useEffect(() => {
    if (ids === '') return;
    const timers = ids.split(',').map((id) =>
      window.setTimeout(() => {
        setDismissed((prev) => new Set(prev).add(id));
      }, DISMISS_MS),
    );
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [ids]);

  if (notices.length === 0) return null;

  return (
    <div className="mapview__notices">
      {notices.map((n) => (
        <button
          key={n.id}
          type="button"
          className={`mapview__warning${n.dev ? ' mapview__warning--dev' : ''}`}
          // A real button: it is dismissible, so it is focusable, answers Enter and Space,
          // and gets the focus ring every other control has.
          aria-label={`Dismiss: ${n.text}`}
          onClick={() => setDismissed((prev) => new Set(prev).add(n.id))}
        >
          {n.text}
        </button>
      ))}
    </div>
  );
}
