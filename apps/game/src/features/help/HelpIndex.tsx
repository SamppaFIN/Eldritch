/**
 * The guide's front page (BRDC-WIKI-001, -003).
 *
 * Two halves: the hand-written topics, grouped and shown only once met (WIKI-002); and
 * the Reference — every Work, technology and Rite — always browsable, because that is
 * what makes it a wiki. A search box across the top flattens both into one filtered list.
 *
 * Lifted out of HelpPanel so that file keeps under its line limit.
 */
import { useState } from 'react';
import { GROUPS, HELP } from './help.js';
import type { HelpTopic } from './help.js';
import { REFERENCE, refTitle, searchRows } from './wikiPages.js';
import type { WikiRef } from './wikiPages.js';

export interface HelpIndexProps {
  seen: ReadonlySet<HelpTopic>;
  onNavigate: (to: WikiRef) => void;
}

export function HelpIndex({ seen, onNavigate }: HelpIndexProps) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const link = (ref: WikiRef, label: string) => (
    <li key={ref}>
      <button
        type="button"
        className="help-panel__link help-panel__index-item"
        onClick={() => onNavigate(ref)}
      >
        {label}
      </button>
    </li>
  );

  if (q.length > 0) {
    const hits = searchRows().filter(
      (r) => r.title.toLowerCase().includes(q) || r.blurb.toLowerCase().includes(q),
    );
    return (
      <nav className="help-panel__groups" aria-label="Search results">
        <input
          type="search"
          className="help-panel__search"
          placeholder="Search the guide"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search the guide"
        />
        {hits.length === 0 ? (
          <p className="help-panel__para">Nothing matches &ldquo;{query}&rdquo;.</p>
        ) : (
          <ul className="help-panel__index-list">{hits.map((r) => link(r.ref, r.title))}</ul>
        )}
      </nav>
    );
  }

  return (
    <nav className="help-panel__groups" aria-label="All topics">
      <input
        type="search"
        className="help-panel__search"
        placeholder="Search the guide"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search the guide"
      />

      {GROUPS.map((group) => {
        const topics = group.topics.filter((t) => seen.has(t));
        if (topics.length === 0) return null;
        return (
          <section key={group.heading} className="help-panel__group">
            <h3 className="help-panel__group-heading">{group.heading}</h3>
            <ul className="help-panel__index-list">
              {topics.map((t) => link(t, HELP[t].title))}
            </ul>
          </section>
        );
      })}

      <section className="help-panel__group">
        <h3 className="help-panel__group-heading">Reference</h3>
        {REFERENCE.map((g) => (
          <div key={g.heading} className="help-panel__ref-block">
            <h4 className="help-panel__ref-heading">{g.heading}</h4>
            <ul className="help-panel__index-list">
              {g.refs.map((ref) => link(ref, refTitle(ref)))}
            </ul>
          </div>
        ))}
      </section>
    </nav>
  );
}
