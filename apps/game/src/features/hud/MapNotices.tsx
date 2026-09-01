/**
 * The row of status lines above the HUD — storage warnings, the shared world's age,
 * the dev time-shift. Lifted out of MapView, which was at its four-hundred-line ceiling;
 * these four `<p>`s are one concern (things the player should know that are not the
 * game itself) and none of the rest of the screen depends on them.
 */
export interface MapNoticesProps {
  /** False when this device will not persist progress. */
  durable: boolean;
  /** True when a save from an older schema was found and reset. */
  schemaReset: boolean;
  /** Age of the newest world shard in ms, or null when there is none. */
  worldStirredMs: number | null;
  /** Dev clock running ahead. */
  shifted: boolean;
  offsetDays: number;
}

export function MapNotices({
  durable,
  schemaReset,
  worldStirredMs,
  shifted,
  offsetDays,
}: MapNoticesProps) {
  return (
    <>
      {!durable ? (
        <p className="mapview__warning" role="status">
          This device will not keep your progress. The Void forgets between visits.
        </p>
      ) : null}

      {schemaReset ? (
        <p className="mapview__warning" role="status">
          A sanctuary from an older age was found, and could not be read. It has returned to the Void.
        </p>
      ) : null}

      {worldStirredMs !== null ? (
        <p className="mapview__warning" role="status">
          Other realms last stirred {Math.max(1, Math.round(worldStirredMs / 3_600_000))} h ago.
        </p>
      ) : null}

      {shifted ? (
        <p className="mapview__warning mapview__warning--dev" role="status">
          Time is running {offsetDays} days ahead · T to advance · Shift+T to return
        </p>
      ) : null}
    </>
  );
}
