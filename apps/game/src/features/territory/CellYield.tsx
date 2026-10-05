/**
 * Where this hex's yield comes from (BRDC-CARD-006, handoff F-02).
 *
 * Read from `repository.yields`, the same per-hex model the pouch is paid by
 * (BRDC-YIELD-001), so the card can never say one thing while the pouch does another.
 * One line per resource: its total, then each source; what takes away is in red.
 */
import { useEffect, useState } from 'react';
import type { GameRepository, H3Index, HexYield, ResourceKind } from '@es3/core';
import { RESOURCE_COLOUR, RESOURCE_WORD } from './territoryFeatures.js';
import './cell-yield.css';

/** One decimal at most, and none when it is whole: "+2", "+1.5", "−0.8". */
export function signed(n: number): string {
  const r = Math.round(n * 10) / 10;
  const s = Number.isInteger(r) ? String(Math.abs(r)) : Math.abs(r).toFixed(1);
  return `${r < 0 ? '−' : '+'}${s}`;
}

/** The hex's yield grouped by resource, largest total first; zero totals dropped. */
export function groupYield(y: HexYield): { resource: ResourceKind; total: number; lines: { label: string; amount: number }[] }[] {
  const by = new Map<ResourceKind, { label: string; amount: number }[]>();
  for (const c of y.contributions) by.set(c.resource, [...(by.get(c.resource) ?? []), { label: c.label, amount: c.amount }]);
  return [...by.entries()]
    .map(([resource, lines]) => ({ resource, total: lines.reduce((s, l) => s + l.amount, 0), lines }))
    .filter((g) => Math.abs(g.total) >= 0.05)
    .sort((a, z) => z.total - a.total);
}

export interface CellYieldProps {
  repository: GameRepository | null;
  h3: H3Index;
  now: number;
}

export function CellYield({ repository, h3, now }: CellYieldProps) {
  const [y, setY] = useState<HexYield | null>(null);
  useEffect(() => {
    if (!repository) return;
    let live = true;
    void repository.yields.at(h3, now).then((r) => live && setY(r));
    return () => {
      live = false;
    };
  }, [repository, h3, now]);

  if (!y) return null;
  const groups = groupYield(y);
  return (
    <section className="cell-yield" aria-label="Yield per hour">
      <p className="cell-yield__title">Per hour</p>
      {groups.length === 0 ? (
        <p className="cell-yield__line">Nothing yet. Walk here, or put someone to work.</p>
      ) : (
        <ul className="cell-yield__list">
          {groups.map((g) => (
            <li key={g.resource} className="cell-yield__line">
              <strong className="es-numeric" style={{ color: RESOURCE_COLOUR[g.resource] }}>
                {RESOURCE_WORD[g.resource]} {signed(g.total)}
              </strong>
              {' → '}
              {g.lines.map((l, i) => (
                <span key={i} className={l.amount < 0 ? 'cell-yield__minus' : undefined}>
                  {i > 0 ? ' · ' : ''}
                  {l.label} <span className="es-numeric">{signed(l.amount)}</span>
                </span>
              ))}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
