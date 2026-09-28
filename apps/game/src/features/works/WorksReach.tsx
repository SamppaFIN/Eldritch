/**
 * The building's one radius, drawn as rings (BRDC-WORKS-001): solid is what it reaches
 * now, dashed is what research can still buy. Stroke only, no fill (§12).
 */
import { cellsInRings, isWired } from '@es3/core';
import type { BuildingDef } from '@es3/core';

const HEX = (r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

export function WorksReach({ def, rings }: { def: BuildingDef; rings: number }) {
  if (!def.reach) return null;
  const reach = def.reach;
  const awake = isWired(def, { kind: 'reach', rings: 1 }) || Boolean(reach.effect);
  const extent = rings === 0 ? 'this cell only' : `${rings} ring${rings > 1 ? 's' : ''} · ${cellsInRings(rings)} cells`;
  return (
    <section className="works__reach" aria-label={reach.label}>
      <svg className="works__rings" viewBox="-60 -60 120 120" width="96" height="96" aria-hidden focusable="false">
        <polygon points={HEX(8)} className="works__ring works__ring--core" />
        {Array.from({ length: reach.maxRings }, (_, i) => (
          <polygon
            key={i}
            points={HEX(8 + (i + 1) * 16)}
            className={`works__ring${i + 1 <= rings ? '' : ' works__ring--later'}`}
          />
        ))}
      </svg>
      <div>
        <p className="works__label">
          {reach.label} <span className="es-numeric">{extent}</span>
          {awake ? null : <span className="works__asleep"> · not yet awake</span>}
        </p>
        <p className="works__note">{reach.text}</p>
      </div>
    </section>
  );
}
