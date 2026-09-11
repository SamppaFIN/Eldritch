/**
 * Walking a recorded track into the game (BRDC-GPX-001, PIVOT-2026-09-09 §9).
 *
 * The import has **no claiming path of its own**. It reads a file into the same
 * `TrailPoint[]` the live GPS produces and hands them to `submitTrail`, so the same
 * filters run, the same adjacency rule claims the same ground, and dwell accrues the same
 * way. An import with its own route would drift from the live one the first time either
 * changed — and the drift would be silent.
 *
 * Its own run, not the one in progress: a track recorded on Tuesday is not a continuation
 * of the walk happening now, and threading it into the live run would put a jump between
 * the last real fix and the file's first point.
 */
import { useCallback, useState } from 'react';
import { parseGpx } from '@es3/core';
import type { GameRepository, GpxFault, TrailResult } from '@es3/core';

export type ImportState =
  | { status: 'idle' }
  | { status: 'reading' }
  | { status: 'done'; points: number; result: TrailResult }
  | { status: 'failed'; fault: GpxFault | 'no-repository' };

export interface GpxImport {
  state: ImportState;
  importFile: (file: File) => void;
  reset: () => void;
}

export function useGpxImport(
  repository: GameRepository | null,
  now: () => number,
  /** Re-read the map and the pouch once a track has landed. */
  afterImport: () => void,
): GpxImport {
  const [state, setState] = useState<ImportState>({ status: 'idle' });

  const importFile = useCallback(
    (file: File) => {
      if (!repository) {
        setState({ status: 'failed', fault: 'no-repository' });
        return;
      }
      setState({ status: 'reading' });
      void (async () => {
        const parsed = parseGpx(await file.text());
        if (!parsed.ok) {
          setState({ status: 'failed', fault: parsed.fault });
          return;
        }
        const run = await repository.startRun(now());
        const result = await repository.submitTrail(run, parsed.points);
        await repository.endRun(run);
        setState({ status: 'done', points: parsed.points.length, result });
        afterImport();
      })();
    },
    [repository, now, afterImport],
  );

  return { state, importFile, reset: () => setState({ status: 'idle' }) };
}
