/**
 * A building's research tree (BRDC-WORKS-001): five tiers down a spine, a choice tier
 * framed as one, and every node saying what it changes, what it costs and — under the
 * rule, never above it — what the ground remembers about it.
 */
import { nodeState } from '@es3/core';
import type { BuildingDef, ResourceKind, WorksNode } from '@es3/core';
import { RESOURCE_COLOUR, RESOURCE_WORD } from '../territory/territoryFeatures.js';
import { ROMAN, STATE_LABEL, effectResource } from './worksCopy.js';

export interface WorksTreeProps {
  def: BuildingDef;
  learned: readonly string[];
  selected: string | null;
  onSelect: (id: string) => void;
  showLore: boolean;
  /** A rival's page is read-only: the tree shows, nothing is selectable. */
  readOnly: boolean;
}

function Rule({ node }: { node: WorksNode }) {
  const at = node.text.indexOf(node.hl);
  const res = effectResource(node.effects);
  const colour = res ? RESOURCE_COLOUR[res] : 'var(--sacred-gold)';
  if (at < 0) return <p className="works__rule">{node.text}</p>;
  return (
    <p className="works__rule">
      {node.text.slice(0, at)}
      <b className="works__hl" style={{ color: colour }}>
        {node.hl}
      </b>
      {node.text.slice(at + node.hl.length)}
    </p>
  );
}

export function WorksTree({ def, learned, selected, onSelect, showLore, readOnly }: WorksTreeProps) {
  const card = (n: WorksNode, tier: number) => {
    const state = nodeState(def, learned, n.id);
    const pickable = !readOnly && state === 'available';
    return (
      <li key={n.id} className={`works__node works__node--${state}${selected === n.id ? ' works__node--picked' : ''}`}>
        <button
          type="button"
          className="works__node-btn"
          disabled={!pickable}
          aria-pressed={pickable ? selected === n.id : undefined}
          onClick={() => onSelect(n.id)}
        >
          <span className="works__node-head">
            <span className="works__node-name">{n.name}</span>
            <span className="works__state">{STATE_LABEL[state]}</span>
          </span>
          <Rule node={n} />
          {showLore ? <span className="works__lore">{n.lore}</span> : null}
          <span className="works__cost es-numeric">
            {(Object.entries(n.cost) as [ResourceKind, number][]).map(([k, v]) => `${v} ${RESOURCE_WORD[k]}`).join(' · ')}
            {state === 'locked' && tier > 1 ? ` · Needs ${ROMAN[tier - 2]}` : ''}
          </span>
        </button>
      </li>
    );
  };

  return (
    <ol className="works__tiers">
      {def.tree.tiers.map((t) => (
        <li key={t.tier} className="works__tier">
          <span className="works__spine" aria-label={`Tier ${ROMAN[t.tier - 1]}`}>
            {ROMAN[t.tier - 1]}
          </span>
          {t.choice ? (
            <div className="works__choice">
              <p className="works__label">Choose one · the other closes</p>
              <ul className="works__nodes">
                {t.nodes.map((n, i) => (
                  <li key={n.id} className="works__or-wrap">
                    {i > 0 ? <p className="works__or">or</p> : null}
                    <ul className="works__nodes">{card(n, t.tier)}</ul>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ul className="works__nodes">{t.nodes.map((n) => card(n, t.tier))}</ul>
          )}
        </li>
      ))}
    </ol>
  );
}
