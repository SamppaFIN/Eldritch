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
import { buildingsOf, population, provinceCount } from '@es3/core';
import type { Cell } from '@es3/core';
import { Banner } from './Banner.js';
import { BannerPicker } from './BannerPicker.js';
import { NationNameField } from './NationNameField.js';
import { displayName } from './nation.js';
import type { BannerId } from './nation.js';
import { useNation } from './useNation.js';
import './nation.css';

export function NationIdentity({ owned }: { owned: readonly Cell[] }) {
  // Shared, so the map sees a banner change here at once (BRDC-NATION field report).
  const [nation, setNation] = useNation();
  const [picking, setPicking] = useState(false);

  const commitName = (name: string) => {
    if (name.trim() !== nation.name) setNation({ ...nation, name });
  };
  const pickBanner = (bannerId: BannerId) => {
    setNation({ ...nation, bannerId });
    setPicking(false);
  };

  const buildings = buildingsOf(owned).length;

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
          <NationNameField
            initial={nation.name}
            placeholder={displayName({ ...nation, name: '' })}
            onCommit={commitName}
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
