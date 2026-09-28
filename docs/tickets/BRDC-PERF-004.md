# BRDC-PERF-004 — Tarkkuus zoomin mukaan

| | |
|---|---|
| **Alue** | `features/territory/{TerritoryLayer,territoryMarks,strengthArcs,BuildingIconLayer}`, `packages/core/src/geo/cellGeometry` |
| **Vaihe** | Läpileikkaava — kartan suorituskyky |
| **Effort** | M |
| **Riippuvuudet** | BRDC-PERF-003 |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-09-28; Claude Designin suositus: *"kaukaa pelkkä väri ja reuna, keskietäisyydeltä ikonit, läheltä rakennukset ja resurssit"* |

## 🔴 RED

Kaukaa katsottuna kartta piirtää samat asiat kuin läheltä. Zoomilla 13 näytölle mahtuu
noin 3 600 heksaa (säde noin 5 px), ja jokainen saa oman reunaviivansa viidellä
viivatasolla sekä bannerin. Pikselit ovat pienempiä kuin viivat, eikä niistä saa selvää.

Heksan säde 360×780-näytöllä (`cellMarks.ts`in mittaus: 43,5 px zoomilla 16):

| Zoom | Säde | Heksoja näytöllä |
|---|---|---|
| 13 | ~5 px | ~3 600 |
| 14 | ~11 px | ~900 |
| 15 | ~22 px | ~230 |
| 16 | ~43 px | ~57 |

## 🟢 GREEN

- [ ] **Alle 14:** täyttö ja **valtakunnan ääriviiva yhtenä polygonina**
      (`cellsToMultiPolygon(owned, true)` coressa, memoisoitu owned-joukon mukaan). Ei
      heksakohtaisia viivoja, symboleita eikä kaaria
- [ ] **14–16:** + heksakohtainen reuna, rival-katkoviiva ja **kiekkomerkit** (enintään yksi
      solua kohden: rakennus tai resurssi, `northEast`-slotti)
- [ ] **16 ja yli:** + iso-spritet, resurssi maassa (`southWest`), voimakaari ja numerot
- [ ] Toteutus pelkillä tasojen `minzoom`/`maxzoom`-arvoilla ja zoom-`step`-lausekkeilla.
      Ei JavaScriptiä zoomatessa
- [ ] Lähteen `buffer`- ja `maxzoom`-asetuksia kokeiltu mitattuina, tulos kirjattu
- [ ] `claim.spec.ts:295-315` päivitetty (odottaa nyt fill-tason minzoomiksi 0, koodissa 9)
- [ ] `perf-map.spec.ts`: panoroinnin ja zoomauksen kuva-ajan p95 alle 33 ms 5 000 heksalla
      (4× CPU)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` vihreä, `pnpm e2e` vihreä
- [ ] Infinite hyväksyy ulkoasun puhelimella kolmella zoomitasolla

## Todennus

_Kirjataan toteutuksen jälkeen._

## Ei tässä

- Uudet spritet → `BRDC-ART-006`
- Kansallinen näkymä alle zoomin 11 on jo `BRDC-ATLAS-001`:n `nation-regions`-taso
