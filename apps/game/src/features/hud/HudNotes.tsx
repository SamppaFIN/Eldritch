/**
 * The walking sheet's warnings — ground fading, ground lost, a spell running, a new
 * waypoint, the streets gone. Said in the narrow sheet and the wide one alike (BRDC-HUD-006): a warning the
 * player has to open the sheet to see is not a warning.
 */
export interface HudNotesProps {
  fading: number;
  fadingInHours: number | null;
  released: readonly string[];
  spellLine: string;
  waypoint: string | null;
  onWaypointSeen?: (() => void) | undefined;
  /** The map's tiles could not be reached; the game goes on without them. */
  basemapVoid?: boolean | undefined;
}

/** Hours, said the way a person would say them. */
function formatHours(hours: number): string {
  if (hours <= 1) return 'under an hour';
  if (hours < 24) return `${Math.round(hours)} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'a day' : `${days} days`;
}

export function HudNotes({ fading, fadingInHours, released, spellLine, waypoint, onWaypointSeen, basemapVoid }: HudNotesProps) {
  return (
    <>
      {fading > 0 ? (
        <p className="hud__note hud__note--warn" role="status">
          {fading} {fading === 1 ? 'cell fades' : 'cells fade'}
          {fadingInHours !== null ? ` in ${formatHours(fadingInHours)}` : ''} — the blight is on them, walk them
        </p>
      ) : null}

      {released.length > 0 ? (
        <p className="hud__note hud__note--loss" role="status">
          The Void reclaims {released.length} {released.length === 1 ? 'warded cell' : 'warded cells'}
        </p>
      ) : null}

      {spellLine ? (
        <p className="hud__note" role="status">
          <span aria-hidden>◇</span> {spellLine}
        </p>
      ) : null}

      {basemapVoid ? (
        <p className="hud__note" role="status">
          The streets are unreachable. Your line is still being drawn.
        </p>
      ) : null}

      {waypoint ? (
        <button type="button" className="hud__note hud__waypoint" aria-live="polite" onClick={onWaypointSeen}>
          <span aria-hidden>✦</span> New waypoint · {waypoint} — walk there
        </button>
      ) : null}
    </>
  );
}
