# BRDC-CLAIM-002 — Polygoni → H3-solut (res 11)

| | |
|---|---|
| **Vaihe** | 2 — Aluevaltaus |
| **Effort** | S (tunteja) |
| **Riippuvuudet** | BRDC-CLAIM-001 |
| **Status** | `done` — 2026-08-27 |
| **Valmius** | 100 % |

## 🔴 RED

Sulkeutunut lenkki on lista koordinaatteja. Omistajuutta ei voi tallentaa eikä
verrata pelaajien välillä ilman diskreettiä ruudukkoa.

## 🟢 GREEN

- [x] `packages/core/geo/polygonToCells.ts` — puhdas funktio
- [x] `TrailPoint[]` → `H3Index[]`, resoluutio **11** (~2 150 m² / solu)
- [x] Reunasolut mukaan johdonmukaisella säännöllä (dokumentoitu)
- [x] `regionOf(h3)` palauttaa res-6 vanhemman realtime-sharditusta varten (Vaihe 3)
- [x] Vitest-testit

## Toteutus

```ts
import { polygonToCells, cellToParent } from 'h3-js';

export const H3_RES_OWNERSHIP = 11;  // ~2150 m²
export const H3_RES_REGION    = 6;   // ~36 km², realtime-kanava

export function loopToCells(loop: TrailPoint[]): H3Index[] {
  const ring = loop.map(p => [p.lat, p.lng]);
  return polygonToCells([ring], H3_RES_OWNERSHIP);
}

export const regionOf = (h3: H3Index) => cellToParent(h3, H3_RES_REGION);
```

**Miksi res 11:** korttelin kokoinen lenkki tuottaa muutamia kymmeniä soluja — tarpeeksi,
että kartta täyttyy näkyvästi, mutta ei niin monta että kävely tuottaisi tuhansia rivejä.
Sama resoluutio on `supabase/migrations/0001_init.sql`:ssä, joten arvo **ei ole
muutettavissa** ilman migraatiota.

**Reunasäännöt:** `polygonToCells` ottaa mukaan solut, joiden keskipiste on monikulmion
sisällä. Tämä on riittävä ja deterministinen. Älä lisää omaa reunapuskuria — se ajautuisi
erilleen SQL-toteutuksesta ja rikkoisi Vaiheen 3 golden fixture -testit.

## Testit

- [x] `square.json` → soluja > 0, kaikki uniikkeja
- [x] Sama syöte → sama tulos joka ajolla (deterministinen)
- [x] Pieni lenkki (30 m × 30 m) → vähintään 1 solu
- [x] `regionOf` palauttaa saman res-6-vanhemman vierekkäisille res-11-soluille
- [x] Degeneroitunut monikulmio (kaikki pisteet samassa kohdassa) → tyhjä lista, ei kaadu

> **Lisäksi:** `cellAreaM2` ja `totalAreaM2` mittaavat solun todellisen pinta-alan
> `h3.cellArea`lla. Nimellinen 2 150 m² on globaali keskiarvo; Tampereen leveydellä
> res-11-solu on ~1 622 m². `neighboursOf` suodattaa solun itsensä pois — `gridDisk(c,1)`
> palauttaa seitsemän, ja unohdus antaisi jokaiselle solulle yhden ylimääräisen
> naapuribonuksen omasta itsestään.

## Ei kuulu tähän tikettiin

Omistajuuden ratkaisu (BRDC-CLAIM-003). Renderöinti (BRDC-CLAIM-006).

## Lähde

`PROMPTS.md` Vaihe 2 kohta 2 · `files/CLAUDE.md` §Constants, §Realtime
