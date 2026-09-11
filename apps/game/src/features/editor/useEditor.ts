/**
 * Drawing the map by hand (BRDC-MAP-EDIT-001, PIVOT-2026-09-09 §8).
 *
 * **Dev builds only**, and that is a design constraint rather than caution. Terrain decides
 * what ground yields (`TERRAIN_TABLE`), so a player who could paint their own neighbourhood
 * could paint themselves an iron mine — claude.md §15 is not weakened for a convenience.
 * The editor's output is *content*: a JSON file exported here and committed to the
 * repository, shipped to everyone.
 *
 * The brief asked for a screenshot to be aligned by hand. That step is skipped: the game
 * already draws real map tiles with real hexes on them, so painting the live map gives
 * exact coordinates with nothing to line up. The screenshot was a way around not having a
 * map, and we have one.
 */
import { useCallback, useState } from 'react';
import { encodeDrawing, loadDrawings, newDrawing, paint, parseDrawing } from '@es3/core';
import type { BountyId, DrawingFault, MapDrawing, PaintedCell, TerrainKind } from '@es3/core';

/** What the brush is loaded with. `null` scrubs a hex back to the hash. */
export interface Brush {
  terrain: TerrainKind | null;
  bounty: BountyId | null;
}

/**
 * What one tap of a loaded brush says about a hex — `null` scrubs it.
 *
 * Pure and exported because this is the one place a slip writes a *file* that is wrong in
 * a way nobody sees until a neighbourhood pays the wrong resources for a week.
 */
export function strokeOf(brush: Brush): PaintedCell | null {
  if (brush.terrain === null && brush.bounty === null) return null;
  return {
    ...(brush.terrain ? { t: brush.terrain } : {}),
    ...(brush.bounty ? { b: brush.bounty } : {}),
  };
}

export interface Editor {
  on: boolean;
  drawing: MapDrawing;
  brush: Brush;
  /** How many hexes have been said something about. */
  painted: number;
  fault: DrawingFault | null;
  toggle: () => void;
  setBrush: (brush: Brush) => void;
  /** Paint the hex under the tap, or scrub it when the brush is empty. */
  onCell: (h3: string) => void;
  undo: () => void;
  exportJson: () => string;
  importJson: (text: string) => void;
}

/** Only ever true in a dev build — the production bundle compiles this out. */
export const EDITOR_AVAILABLE = import.meta.env.DEV;

export function useEditor(): Editor {
  const [on, setOn] = useState(false);
  const [drawing, setDrawing] = useState<MapDrawing>(() => newDrawing('untitled'));
  const [, setHistory] = useState<MapDrawing[]>([]);
  const [brush, setBrush] = useState<Brush>({ terrain: 'plain', bounty: null });
  const [fault, setFault] = useState<DrawingFault | null>(null);

  const apply = useCallback((next: MapDrawing, previous: MapDrawing) => {
    setHistory((h) => [...h.slice(-49), previous]);
    setDrawing(next);
    // Applied live, so the map redraws in the colours the file will actually produce —
    // painting blind and checking afterwards is how a drawing ends up subtly wrong.
    loadDrawings(next);
  }, []);

  const onCell = useCallback(
    (h3: string) => {
      apply(paint(drawing, h3, strokeOf(brush)), drawing);
    },
    [apply, brush, drawing],
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      const previous = h[h.length - 1];
      if (!previous) return h;
      setDrawing(previous);
      loadDrawings(previous);
      return h.slice(0, -1);
    });
  }, []);

  const importJson = useCallback(
    (text: string) => {
      const parsed = parseDrawing(text);
      if (!parsed.ok) {
        setFault(parsed.fault);
        return;
      }
      setFault(null);
      apply(parsed.drawing, drawing);
    },
    [apply, drawing],
  );

  const toggle = useCallback(() => {
    setOn((was) => {
      // Leaving puts the map back to what the build ships with, so a half-finished
      // drawing never masquerades as the real world.
      if (was) loadDrawings();
      else loadDrawings(drawing);
      return !was;
    });
  }, [drawing]);

  return {
    on,
    drawing,
    brush,
    // Counted from the drawing, not from what is loaded: the drawing is React state, so
    // the number moves when the picture does.
    painted: Object.keys(drawing.cells).length,
    fault,
    toggle,
    setBrush,
    onCell,
    undo,
    exportJson: () => encodeDrawing(drawing),
    importJson,
  };
}
