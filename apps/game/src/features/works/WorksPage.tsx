/**
 * What stands on the ground, opened (BRDC-WORKS-001).
 *
 * The top half answers what this is, whose it is and what it gives; the bottom half is
 * the building's own research tree. A rival's building opens too, read-only — knowing
 * what you would win is the reason to walk there.
 */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BUILDINGS, canAfford, cellsInRings, nodeById, nodeCount, nodeState, reachRings, worksLevel } from '@es3/core';
import type { BuildingDef, BuildingId, Cell, ResourceKind, ResourcePool } from '@es3/core';
import { FlowerOfLife, MetatronsCube, Modal, RitualButton } from '@es3/ui';
import { RESOURCE_COLOUR, RESOURCE_WORD } from '../territory/territoryFeatures.js';
import { spriteSvg } from '../territory/buildingSprites.js';
import { WorksReach } from './WorksReach.js';
import { WorksTree } from './WorksTree.js';
import { REFUSAL_TEXT, givesOf, shortLine } from './worksCopy.js';
import type { WorksPageBinding } from './useWorksPage.js';
import './works.css';

const LORE_KEY = 'es3:works-lore';
function readLore(): boolean {
  try {
    return localStorage.getItem(LORE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export interface WorksPageProps {
  def: BuildingDef;
  page: WorksPageBinding;
  cell: Cell;
  mine: boolean;
  /** "Yours" or "Held by another", as the card already says it. */
  owner: string;
  /** "Plain · Wheat" — the ground and what is on it. */
  ground: string;
  pool: ResourcePool | null;
  placeMana: number;
  /** The hex's own one-press actions, the same row the card shows (BRDC-DETAIL-003). */
  actions: ReactNode;
}

function Sprite({ def }: { def: BuildingDef }) {
  if (def.kind in BUILDINGS) {
    const svg = spriteSvg(def.kind as BuildingId);
    return <img className="works__sprite" src={`data:image/svg+xml,${encodeURIComponent(svg)}`} width="96" height="96" alt="" />;
  }
  return def.kind === 'keep' ? <MetatronsCube size={96} className="works__sprite" /> : <FlowerOfLife size={96} className="works__sprite" />;
}

export function WorksPage({ def, page, cell, mine, owner, ground, pool, placeMana, actions }: WorksPageProps) {
  const learned = page.view?.learned ?? [];
  const [picked, setPicked] = useState<string | null>(null);
  const [lore, setLore] = useState(readLore);
  const rings = reachRings(def, learned);

  // The first thing open to learn is the one the CTA offers, until the player picks another.
  useEffect(() => {
    if (picked && nodeState(def, learned, picked) === 'available') return;
    const first = def.tree.tiers.flatMap((t) => t.nodes).find((n) => nodeState(def, learned, n.id) === 'available');
    setPicked(first?.id ?? null);
  }, [def, learned.join(',')]);

  const toggleLore = () => {
    setLore((v) => {
      try {
        localStorage.setItem(LORE_KEY, v ? 'off' : 'on');
      } catch {
        /* private window: the choice lasts this page only */
      }
      return !v;
    });
  };

  const node = picked ? nodeById(def, picked) : null;
  const affordable = node ? pool !== null && canAfford(pool, node.cost) : false;
  const gives = givesOf(def, learned, placeMana);
  const cost = node ? (Object.entries(node.cost) as [ResourceKind, number][]).map(([k, v]) => `${v} ${RESOURCE_WORD[k]}`).join(', ') : '';

  const footer = mine ? (
    <div className="works__cta">
      <RitualButton disabled={!node || !affordable} onClick={() => node && page.research(node.id)}>
        {node ? `Research · ${node.name} · ${cost}` : 'Nothing to research yet'}
      </RitualButton>
      {node && !affordable ? (
        <p className="cell-panel__why" role="status">
          {shortLine(node.cost, pool, (k) => RESOURCE_WORD[k])}
        </p>
      ) : null}
      {page.refusal ? (
        <p className="cell-panel__why" role="status">
          {REFUSAL_TEXT[page.refusal]}
        </p>
      ) : null}
    </div>
  ) : (
    <p className="works__note" role="status">
      Held by another. Step onto it to take it — what it has learned comes with it.
    </p>
  );

  return (
    <Modal open={page.open} title={def.name} onClose={() => page.setOpen(false)} footer={footer}>
      <div className="works" style={{ '--works-hue': `oklch(${def.hue} / 0.28)` } as React.CSSProperties}>
        <p className="works__bar">
          <span>{def.subtitle}</span>
          <span className="es-numeric">Level {worksLevel(def, learned)} / 5</span>
        </p>

        {actions}

        <div className="works__hero">
          <Sprite def={def} />
          <p className="works__chips">
            <span className="works__chip">{owner}</span>
            <span className="works__chip">{ground}</span>
          </p>
        </div>

        {lore ? (
          <blockquote className="works__quote">
            <p>“{def.lore.text}”</p>
            <footer>— {def.lore.source}</footer>
          </blockquote>
        ) : null}

        <dl className="works__tiles">
          <div>
            <dt>Strength</dt>
            <dd className="es-numeric">{Math.round(cell.strength)}</dd>
          </div>
          <div>
            <dt>Reach</dt>
            <dd className="es-numeric">{rings === 0 ? 'this cell' : `${cellsInRings(rings)} cells`}</dd>
          </div>
          <div>
            <dt>Learned</dt>
            <dd className="es-numeric">
              {learned.length} / {nodeCount(def)}
            </dd>
          </div>
        </dl>

        <section className="works__gives" aria-label="What it gives">
          <p className="works__label">It gives</p>
          <p className="works__chips">
            {(Object.entries(gives) as [ResourceKind, number][]).map(([k, v]) => (
              <span key={k} className="works__chip es-numeric" style={{ color: RESOURCE_COLOUR[k] }}>
                {v > 0 ? '+' : ''}
                {v} {RESOURCE_WORD[k]}/h
              </span>
            ))}
            {Object.keys(gives).length === 0 ? <span className="works__note">Nothing an hour yet.</span> : null}
          </p>
          <p className="works__note">{def.note}</p>
        </section>

        <WorksReach def={def} rings={rings} />

        <section aria-label="Research tree">
          <p className="works__tree-head">
            <span>{def.tree.name}</span>
            <button type="button" className="works__lore-toggle" aria-pressed={lore} onClick={toggleLore}>
              Lore
            </button>
          </p>
          <WorksTree def={def} learned={learned} selected={picked} onSelect={setPicked} showLore={lore} readOnly={!mine} />
        </section>
      </div>
    </Modal>
  );
}
