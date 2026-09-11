/**
 * The editor's own hands on the map (BRDC-MAP-EDIT-002).
 *
 * Two things the game's own map deliberately does not do, and the editor needs both:
 *
 * 1. **Show the grid.** Fog of war is right for a player (claude.md §13) and is the whole
 *    problem for somebody drawing — the first editor asked people to paint hexes they
 *    could not see.
 * 2. **Paint by dragging**, in `paint` mode. A drag cannot both paint and pan, and
 *    guessing between them is worse than either — so it is a stated mode, and `move`
 *    hands the map back exactly as the game has it.
 *
 * Both are wired here rather than in `MapCanvas`, so the game's map does not grow a branch
 * for a dev tool. Everything is undone on close.
 */
import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellAt } from '@es3/core';
import { ensureEditorLayers, removeEditorLayers, setGrid, setPainted } from './EditorGrid.js';
import type { Editor } from './useEditor.js';

export function useEditorPaint(
  map: MapLibreMap | null,
  ready: boolean,
  /** Null in a player's build: there is no editor, and nothing here runs. */
  editor: Editor | null,
): void {
  const on = editor?.on ?? false;
  const painting = on && editor?.mode === 'paint';
  const drawing = editor?.drawing;
  const { onCell, setZoomedOut } = editor ?? {};

  /*
   * Pressed-ness is a ref, not state.
   *
   * As state it was a dependency of the listener effect, so the first `mousedown`
   * re-subscribed every handler mid-drag and the `mousemove` closure kept the value it was
   * created with — a drag across twenty hexes painted the one it started on. A ref is read
   * live and never re-subscribes anything.
   */
  const pressed = useRef(false);

  // The mesh: created on open, redrawn as the viewport moves, gone on close.
  useEffect(() => {
    if (!map || !ready || !on || !setZoomedOut) return;
    ensureEditorLayers(map);
    const redraw = () => setZoomedOut(setGrid(map, map.getZoom()) === 0);
    redraw();
    map.on('moveend', redraw);
    map.on('zoomend', redraw);
    return () => {
      map.off('moveend', redraw);
      map.off('zoomend', redraw);
      removeEditorLayers(map);
    };
  }, [map, ready, on, setZoomedOut]);

  useEffect(() => {
    if (!map || !ready || !on || !drawing) return;
    setPainted(map, drawing.cells);
  }, [map, ready, on, drawing]);

  /*
   * Drag to paint. `dragPan` is switched off for as long as the editor is open, because a
   * drag that sometimes paints and sometimes pans is worse than either — the camera is
   * moved with the zoom controls and the keyboard while drawing.
   */
  useEffect(() => {
    if (!map || !ready || !painting || !onCell) return;
    map.dragPan.disable();

    const paintAt = (e: { lngLat: { lat: number; lng: number } }) =>
      onCell(cellAt({ lat: e.lngLat.lat, lng: e.lngLat.lng }));

    const down = (e: { lngLat: { lat: number; lng: number } }) => {
      pressed.current = true;
      paintAt(e);
    };
    const move = (e: { lngLat: { lat: number; lng: number } }) => {
      if (pressed.current) paintAt(e);
    };
    const up = () => {
      pressed.current = false;
    };

    map.on('mousedown', down);
    map.on('mousemove', move);
    map.on('mouseup', up);
    map.on('touchstart', down);
    map.on('touchmove', move);
    map.on('touchend', up);
    return () => {
      map.off('mousedown', down);
      map.off('mousemove', move);
      map.off('mouseup', up);
      map.off('touchstart', down);
      map.off('touchmove', move);
      map.off('touchend', up);
      map.dragPan.enable();
      pressed.current = false;
    };
  }, [map, ready, painting, onCell]);
}
