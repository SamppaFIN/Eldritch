/**
 * The nation's name, flag and figures — the first thing in the Keep (BRDC-NATION-001).
 *
 * The Keep is the face other players see (`claude.md` §10), so it starts with who you
 * are: a name you set, a banner you pick, and two numbers — how many provinces you hold
 * and a rough population. The numbers are gauges, not mechanics.
 *
 * The name field keeps a local draft and commits on blur, so a keystroke never re-renders
 * the panel around it (BRDC-CHAR-001's field-jank note).
 */
import { useState } from 'react';
import { population, provinceCount } from '@es3/core';
import type { Cell } from '@es3/core';
import { Banner } from './Banner.js';
import { BannerPicker } from './BannerPicker.js';
import { displayName, readNation, writeNation } from './nation.js';
import type { BannerId } from './nation.js';
import './nation.css';

export function NationIdentity({ owned }: { owned: readonly Cell[] }) {
  const [nation, setNation] = useState(readNation);
  const [draft, setDraft] = useState(nation.name);
  const [picking, setPicking] = useState(false);

  const commitName = () => {
    if (draft.trim() === nation.name) return;
    setNation(writeNation({ ...nation, name: draft }));
  };
  const pickBanner = (bannerId: BannerId) => {
    setNation(writeNation({ ...nation, bannerId }));
    setPicking(false);
  };

  const buildings = owned.reduce((n, c) => n + (c.building ? 1 : 0), 0);

  return (
    <section className="nation" aria-label="Your nation">
      <div className="nation__head">
        <button
          type="button"
          className="nation__flag"
          aria-label={`Banner: ${nation.bannerId}. Change`}
          aria-expanded={picking}
          onClick={() => setPicking((v) => !v)}
        >
          <Banner id={nation.bannerId} size={44} />
        </button>
        <div className="nation__name-wrap">
          <label className="nation__label" htmlFor="nation-name">
            Nation
          </label>
          <input
            id="nation-name"
            className="nation__name"
            value={draft}
            placeholder={displayName({ ...nation, name: '' })}
            maxLength={28}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
        </div>
      </div>

      {picking ? <BannerPicker current={nation.bannerId} onPick={pickBanner} /> : null}

      <p className="nation__stats es-numeric">
        <span>{provinceCount(owned)} {provinceCount(owned) === 1 ? 'province' : 'provinces'}</span>
        <span> · {population(owned.length, buildings).toLocaleString()} souls</span>
      </p>
    </section>
  );
}
