/**
 * The hex the player is standing in, held against GPS jitter while they are still
 * (BRDC-DWELL-002).
 *
 * `cellAt(point)` alone flickers between adjacent hexes when a stationary phone's fixes
 * wander the ~46 m width of a res-11 cell. That flicker resets the dwell readout and
 * scatters an hour of standing in one spot across two or three cells. This keeps the
 * cell put until a fix lands a full hex away, the player is actually moving
 * (`pace >= STILL_SPEED_MS`), or a neighbour holds long enough to be a real move — the
 * same `stickyDwell` rule the walk-recording path uses.
 */
import { useRef } from 'react';
import { STILL_SPEED_MS, cellAt, dwellAnchorAt, stickyDwell } from '@es3/core';
import type { DwellAnchor, H3Index, TrailPoint } from '@es3/core';

interface State {
  anchor: DwellAnchor | null;
  lastPoint: TrailPoint | null;
  cell: H3Index | null;
}

export function useStandingCell(point: TrailPoint | null, paceMs: number | null): H3Index | null {
  const state = useRef<State>({ anchor: null, lastPoint: null, cell: null });

  // Advance only on a genuinely new fix, so a re-render with the same point (or a
  // concurrent double-invoke) is a no-op.
  if (point && point !== state.current.lastPoint) {
    const raw = cellAt(point);
    const anchor = state.current.anchor ?? dwellAnchorAt(raw);
    const stationary = paceMs !== null && paceMs < STILL_SPEED_MS;
    const settled = stickyDwell(anchor, raw, point.t, stationary);
    state.current = { anchor: settled.anchor, lastPoint: point, cell: settled.cell };
  }

  return state.current.cell;
}
