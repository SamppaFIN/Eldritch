/**
 * A zero, taught (Sigil handoff: "Every zero is an empty state").
 *
 * The rule, verbatim: *"Mark, one sentence, one verb. No dimmed rows, no 'none', no 'not
 * listed'. A new realm is mostly zeroes and each one is a chance to teach the rule that
 * would fill it."*
 *
 * So this is deliberately not a generic "nothing here" box. It takes a mark, one sentence
 * that names the rule which would fill the zero, and — where an action genuinely exists —
 * one verb. Where no button can do the thing (a Temple is earned by standing still for an
 * hour and a half; no control can stand still for you) it takes no action rather than
 * inventing a hollow one.
 *
 * The document also supplies its own body copy for four of these. It is *not* used
 * verbatim: its wording describes rules this game does not have ("Hold one cell for six
 * days and a Temple reveals itself" against `TEMPLE_THRESHOLD_MS` of ninety minutes, and
 * a thirty-cell Codex threshold that does not exist in `demographics.ts`). Shipping those
 * sentences would trade one kind of empty screen for a screen that lies, which is the
 * failure this whole pass has been removing. Structure from the document, rules from the
 * code.
 */
import type { ReactNode } from 'react';

export interface EmptyStateProps {
  /** Sacred geometry, at a moment rather than as wallpaper (claude.md §12). */
  mark?: ReactNode;
  title: string;
  body: string;
  /** One verb, only where something can actually be pressed. */
  action?: { label: string; onClick: () => void };
  /** The mark's ink — the document gives each zero its own colour. */
  ink?: string;
}

export function EmptyState({ mark, title, body, action, ink }: EmptyStateProps) {
  return (
    <div className="es-empty">
      {mark ? (
        <span className="es-empty__mark" style={ink ? { color: ink } : undefined} aria-hidden>
          {mark}
        </span>
      ) : null}
      <p className="es-empty__title">{title}</p>
      <p className="es-empty__body">{body}</p>
      {action ? (
        <button type="button" className="es-empty__cta" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
