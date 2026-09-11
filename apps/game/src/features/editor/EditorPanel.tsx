/**
 * The map editor's controls (BRDC-MAP-EDIT-001, PIVOT-2026-09-09 §8).
 *
 * A strip rather than a sheet: the whole point is to see the map while painting it, so
 * this takes as little of the screen as it can and never covers the middle.
 *
 * Dev builds only. The output is content — a file exported here and committed — because
 * terrain decides what ground yields, and a player able to paint their own neighbourhood
 * could paint themselves an iron mine (claude.md §15).
 */
import { BOUNTY_IDS, TERRAIN_TABLE, cellAt, cellsWithin } from '@es3/core';
import type { BountyId, TerrainKind } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { BOUNTY_GLYPH, BOUNTY_NAME } from '../territory/bounty.js';
import { terrainGlyph } from '../territory/territoryFeatures.js';
import { BRUSH_SIZES } from './useEditor.js';
import type { Editor } from './useEditor.js';
import './editor-panel.css';

const KINDS = Object.keys(TERRAIN_TABLE) as TerrainKind[];
/** Any cell will do: a ring's size is the same everywhere, so this only labels the chips. */
const SAMPLE = cellAt({ lat: 61.4729, lng: 23.7259 });

const FAULT: Readonly<Record<string, string>> = {
  'not-json': 'That file is not JSON.',
  'not-a-drawing': 'That JSON is not a drawing.',
  'wrong-version': 'That drawing was made by a different version of the editor.',
};

export interface EditorPanelProps {
  editor: Editor;
}

export function EditorPanel({ editor }: EditorPanelProps) {
  if (!editor.on) return null;

  const { brush, setBrush } = editor;

  const download = () => {
    const blob = new Blob([editor.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editor.drawing.name || 'drawing'}.map.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const upload = (file: File | undefined) => {
    if (!file) return;
    void file.text().then(editor.importJson);
  };

  const chip = (key: string, label: string, glyph: string, on: boolean, pick: () => void) => (
    <button
      key={key}
      type="button"
      className={on ? 'editor__chip editor__chip--on' : 'editor__chip'}
      onClick={pick}
      title={label}
    >
      <span aria-hidden>{glyph}</span> {label}
    </button>
  );

  return (
    <section className="editor" aria-label="Map editor">
      <div className="editor__bar">
        <strong className="editor__name">{editor.drawing.name}</strong>
        <span className="editor__count es-numeric">{editor.painted} painted</span>
        <RitualButton variant="ghost" className="editor__btn" onClick={editor.undo}>
          Undo
        </RitualButton>
        <RitualButton variant="ghost" className="editor__btn" onClick={download}>
          Export
        </RitualButton>
        <label className="editor__btn editor__file">
          Import
          <input
            type="file"
            accept="application/json,.json"
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </label>
        <RitualButton variant="ghost" className="editor__btn" onClick={editor.toggle}>
          Close
        </RitualButton>
      </div>

      <div className="editor__row">
        {/* A drag cannot both paint and pan, so which it does is said rather than guessed. */}
        {chip('paint', 'Paint', '✎', editor.mode === 'paint', () => editor.setMode('paint'))}
        {chip('move', 'Move map', '✥', editor.mode === 'move', () => editor.setMode('move'))}
      </div>

      <div className="editor__row">
        {chip('scrub', 'Scrub', '␡', brush.terrain === null && brush.bounty === null, () =>
          setBrush({ ...brush, terrain: null, bounty: null }),
        )}
        {KINDS.map((k) =>
          chip(k, k, terrainGlyph(k)?.char ?? '·', brush.terrain === k, () =>
            setBrush({ ...brush, terrain: k }),
          ),
        )}
      </div>

      <div className="editor__row">
        {/* How far a stroke reaches — one hex for a shoreline, thirty-seven for a forest. */}
        {BRUSH_SIZES.map((r) =>
          chip(`size-${r}`, `${cellsWithin(SAMPLE, r).length} hex`, '◎', brush.size === r, () =>
            setBrush({ ...brush, size: r }),
          ),
        )}
      </div>

      <div className="editor__row">
        {chip('no-bounty', 'no find', '·', brush.bounty === null, () =>
          setBrush({ ...brush, bounty: null }),
        )}
        {BOUNTY_IDS.map((b: BountyId) =>
          chip(b, BOUNTY_NAME[b], BOUNTY_GLYPH[b], brush.bounty === b, () =>
            setBrush({ ...brush, bounty: b }),
          ),
        )}
      </div>

      {editor.zoomedOut ? (
        <p className="editor__fault" role="status">
          Too far out to draw — come closer and the grid appears.
        </p>
      ) : null}

      {editor.fault ? (
        <p className="editor__fault" role="status">
          {FAULT[editor.fault] ?? 'That file could not be read.'}
        </p>
      ) : (
        <p className="editor__hint">Tap a hex to paint it. Export writes a file to commit.</p>
      )}
    </section>
  );
}
