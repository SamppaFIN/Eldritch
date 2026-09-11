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
import { cellsWithin, encodeDrawing, loadDrawings, newDrawing, paint, parseDrawing } from '@es3/core';
import type { BountyId, DrawingFault, MapDrawing, PaintedCell, TerrainKind } from '@es3/core';

/** What the brush is loaded with. `null` scrubs a hex back to the hash. */
export interface Brush {
  terrain: TerrainKind | null;
  bounty: BountyId | null;
  /**
   * Rings painted around the hex under the pointer: 0 is one hex, 1 is seven, 3 is
   * thirty-seven (BRDC-MAP-EDIT-002). One hex at a time is the right tool for a shoreline
   * and a terrible one for a forest.
   */
  size: number;
}

/** The sizes offered, and what each actually covers. `cellsWithin` is the arithmetic. */
export const BRUSH_SIZES = [0, 1, 2, 3] as const;

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

/**
 * What a drag does (BRDC-MAP-EDIT-002).
 *
 * A drag cannot both paint and pan, and guessing between them is worse than either. So it
 * is a stated mode: `paint` while drawing, `move` to get somewhere. The first version had
 * no toggle, disabled panning outright, and left the map unreachable — Infinite:
 * *"karttaa ei pysty liikuttamaan editori tilassa"*.
 */
export type EditorMode = 'paint' | 'move';

export interface Editor {
  on: boolean;
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  drawing: MapDrawing;
  brush: Brush;
  /** How many hexes have been said something about. */
  painted: number;
  fault: DrawingFault | null;
  toggle: () => void;
  setBrush: (brush: Brush) => void;
  /** Paint under the pointer — the hex, and `brush.size` rings around it. */
  onCell: (h3: string) => void;
  /** True when the map is too far out for the grid to be drawable. */
  zoomedOut: boolean;
  setZoomedOut: (on: boolean) => void;
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
  const [brush, setBrush] = useState<Brush>({ terrain: 'plain', bounty: null, size: 1 });
  const [zoomedOut, setZoomedOut] = useState(false);
  const [mode, setMode] = useState<EditorMode>('paint');
  const [fault, setFault] = useState<DrawingFault | null>(null);

  /**
   * Every change goes through here, and it takes a *function* of the current drawing.
   *
   * It took the next drawing directly at first, which meant the brush closed over whatever
   * the drawing was when the listener was attached. A drag across twenty hexes then
   * painted each stroke onto the same stale picture and only the last one survived — the
   * drag looked like a single tap. Nothing here may assume it knows the current drawing.
   */
  const apply = useCallback((change: (current: MapDrawing) => MapDrawing) => {
    setDrawing((current) => {
      const next = change(current);
      if (next === current) return current;
      setHistory((h) => [...h.slice(-49), current]);
      // Applied live, so the map redraws in the colours the file will actually produce —
      // painting blind and checking afterwards is how a drawing ends up subtly wrong.
      loadDrawings(next);
      return next;
    });
  }, []);

  const onCell = useCallback(
    (h3: string) => {
      const what = strokeOf(brush);
      // One entry in the history for the whole stroke, so Undo takes back a brush-load
      // rather than thirty-seven hexes one at a time.
      apply((current) => {
        let next = current;
        for (const cell of cellsWithin(h3, brush.size)) next = paint(next, cell, what);
        return next;
      });
    },
    [apply, brush],
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
      apply(() => parsed.drawing);
    },
    [apply],
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
    mode,
    setMode,
    drawing,
    brush,
    // Counted from the drawing, not from what is loaded: the drawing is React state, so
    // the number moves when the picture does.
    painted: Object.keys(drawing.cells).length,
    fault,
    toggle,
    setBrush,
    onCell,
    zoomedOut,
    setZoomedOut,
    undo,
    exportJson: () => encodeDrawing(drawing),
    importJson,
  };
}
