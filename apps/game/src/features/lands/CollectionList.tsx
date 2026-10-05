/**
 * One list for every collection in the Ledger (BRDC-LEDGER-001, handoff F-20): hexes,
 * Works, temples, anomalies. Filter chips with their counts, one sort, and the rows — each
 * row is its tab's own, and a row's tap is what flies the map there and opens the card.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';

export interface CollectionFilter<T> {
  id: string;
  label: string;
  keep: (item: T) => boolean;
}

export interface CollectionSort<T> {
  id: string;
  label: string;
  /** Absent: the tab's own order, as handed in. */
  compare?: (a: T, b: T) => number;
}

export interface CollectionListProps<T> {
  /** Names the list for a screen reader: "Works", "Temples"… */
  label: string;
  items: readonly T[];
  keyOf: (item: T) => string;
  row: (item: T) => ReactNode;
  filters?: readonly CollectionFilter<T>[];
  sorts?: readonly CollectionSort<T>[];
  /** Said when nothing passes the filter. */
  empty: string;
}

export function CollectionList<T>({ label, items, keyOf, row, filters = [], sorts = [], empty }: CollectionListProps<T>) {
  const [filter, setFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<string>(sorts[0]?.id ?? '');
  const active = filters.find((f) => f.id === filter);
  const shown = active ? items.filter(active.keep) : [...items];
  const cmp = sorts.find((s) => s.id === sort)?.compare;
  if (cmp) shown.sort(cmp);

  return (
    <>
      {filters.length > 0 || sorts.length > 1 ? (
        <div className="ledger__tools">
          {filters.length > 0 ? (
            <div className="ledger__chips" role="group" aria-label={`Filter ${label}`}>
              <button type="button" className="ledger__chip" aria-pressed={filter === null} onClick={() => setFilter(null)}>
                All · {items.length}
              </button>
              {filters.map((f) => (
                <button key={f.id} type="button" className="ledger__chip" aria-pressed={filter === f.id} onClick={() => setFilter(filter === f.id ? null : f.id)}>
                  {f.label} · {items.filter(f.keep).length}
                </button>
              ))}
            </div>
          ) : null}
          {sorts.length > 1 ? (
            <label className="ledger__sort">
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {sorts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}
      {shown.length === 0 ? (
        <p className="lands__note">{empty}</p>
      ) : (
        <ul className="lands__list" aria-label={label}>
          {shown.map((item) => (
            <Keyed key={keyOf(item)}>{row(item)}</Keyed>
          ))}
        </ul>
      )}
    </>
  );
}

/** A row is an `<li>` its tab draws; this only carries the key. */
function Keyed({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
