# BRDC-PERF-003 — Yksi valtaus ei lähetä tuhansia heksoja

| | |
|---|---|
| **Alue** | `packages/core/src/geo/`, `packages/core/src/data/cellStore`, `features/territory/{cellMarks,strengthArcs,TerritoryLayer,BuildingIconLayer}` |
| **Vaihe** | Läpileikkaava — kartan suorituskyky |
| **Effort** | L |
| **Riippuvuudet** | BRDC-PERF-002, BRDC-SCALE-001 (sen `owned:`-indeksi tehdään tässä) |
| **Status** | `[~]` — toteutettu ja mitattu 2026-09-29; valtauksen idle-aikaa ei mitattu erikseen |
| **Valmius** | 90 % |
| **Lähde** | Infinite 2026-09-28: tavoite **5 000 heksaa** sulavana |

## 🔴 RED

Vaikka `BRDC-PERF-002` poistaa turhat päivitykset, jokainen oikea muutos (valtaus,
rapautumisaskel) rakentaa silti koko alueen alusta ja lähettää sen kokonaan workerille:

- `cellBoundary` (`packages/core/src/geo/cells.ts:179`) laskee `cellToBoundary`n joka kerta
  ilman välimuistia, ja palauttaa **avoimen renkaan** (6 pistettä, ensimmäinen ≠ viimeinen)
- `cellMarksToGeoJson` kutsuu `cellsToGeoJson`ia toiseen kertaan (`cellMarks.ts:119`), ja
  `strengthArcs` laskee reunat ja `fortified`in vielä kolmannen kerran
- Solua kohden: `gridDisk` 3 kertaa, `terrainOf` 2 kertaa, kaksi olion levitystä
- Neljä lähdettä (`cells`, `cell-marks`, `cell-arcs`, `work-icons`) saavat täyden `setData`n.
  Yhden heksan valtaus 5 000 heksan valtakunnassa lähettää noin 15 000 featurea
- `getOwnedCells` on yhä täysi skannaus (`MockRepository.ts:295-302`), ja `getCells` käy
  läpi kaikki solut tuotujen löytämiseksi (`:285`)

## 🟢 GREEN

- [x] `packages/core/src/geo/cellGeometry.ts`: `cellRing` (**suljettu rengas**), `cellCentreLngLat`
      ja `cellNeighbours` lasketaan kerran per heksa (enintään 50 000, sitten alusta).
      `cellBoundary` jää avoimeksi, koska sen kuusi kärkeä luetaan muualla. `terrainOf`ia ei
      memoisoida
- [~] Yksi läpikäynti: `setTerritoryData` rakentaa polygonit kerran, ja pisteet johdetaan niistä
      (`marksFromPolygons`). `cellMarksToGeoJson` on kääre, jolloin testit pätevät. Kaaret
      rakennetaan yhä omassa silmukassaan (`arcsToGeoJson`), koska niiden geometria riippuu
      vahvuudesta eikä polygonista
- [x] `features/territory/territorySync.ts`: `diffFeatures` (puhdas) vertaa lähetettyyn
      per heksa (ominaisuudet, kaarille myös geometria). **Pyöristystä ei tarvittu:**
      `now` on minuuttitikki (PERF-002), joten blight ja strength eivät muutu joka kerta
- [x] `updateData({add, remove, update})` neljälle lähteelle (`cells`, `cell-marks`,
      `cell-arcs`, `work-icons`); yli 30 %:n muutos tai virhe → `setData`
- [x] `promoteId: 'h3'` + `properties.h3`; `work-icons`in id `h3#slot`. Sivuvaikutus: solun
      napautus saa nyt aidon H3-id:n eikä putoa koordinaattien varaan
- [x] Lähteitä ei yhdistetty
- [x] **Omistettujen solujen täysi skannaus poistui**, mutta `owned:`-indeksin sijaan:
      `data/cellCache.ts` pitää selaimessa kaikki solut muistissa ensimmäisen luvun jälkeen
      (läpikirjoittava, JSON-kopio joka lukuun). Kytketään vain pelin IndexedDB-storeen
      (`createRepository`), koska yksikkötestit kirjoittavat soluja suoraan storeen
      repositorion ohi. Rajoite: toinen välilehti ei näe tämän välilehden kirjoituksia
      ennen latausta
- [x] Vitest: toinen rakennus samalla syötteellä ei laske yhtään muotoa uudelleen
      (`geometryWork`), yksi vahvistettu heksa on ≤ 7 muutosta, uusi reunaheksa on 1 add +
      naapurit (`territorySync.test.ts`, 6 testiä; `cellCache.test.ts` 5; `cellGeometry.test.ts` 3)
- [x] `claim.spec.ts`:n 5 000 heksan testi seedaa oikeat solut ja mittaa latauksen jälkeen
      idleen asti. Menee läpi molemmilla projekteilla
- [~] `perf-map.spec.ts`: valtauksesta idleen -aikaa ei vielä mitata erikseen (spec kävelee
      omalla maalla). Pisin tehtävä on alla, ja se sisältää vahvistuksen päivityksen
- [x] `pnpm test` (1 810) · `typecheck` · `lint:lines`. E2e: `map` 26/26; `claim:67`,
      `claim:251`, `nation:105` ja `step-claim:145` ovat punaisia myös `main`issa
      (vertailuajo `07d327d`)

## Todennus

`perf-map.spec.ts`, mobile-360, 4× CPU, yksi worker, ei rinnakkaista kuormaa:

| | baseline | PERF-002 | **PERF-003** |
|---|---:|---:|---:|
| 1 027: pisin longtask | 1 043 ms | 878 ms | **323 ms** |
| 1 027: longtaskit yhteensä / 20 s | 19,2 s | 11,1 s | 9,6 s |
| 1 027: panoroinnin p95 | 833 ms | 417 ms | **200 ms** |
| 5 000: pisin longtask | 2 692 ms | 4 077 ms | **723 ms** |
| 5 000: longtaskit yhteensä / 20 s | 15,0 s | 14,2 s | 15,8 s |
| 5 000: panoroinnin p95 | 2 233 ms | 1 067 ms | **200 ms** |

Longtaskien summa ei laske samaa tahtia: suurin osa siitä on headless-Chromen
ohjelmistopohjaista WebGL:ää (PERF-002:n profiili). Sitä vähentää PERF-004, joka karsii
piirrettävää zoomin mukaan.

**E2e-testien korjaukset, jotka nopeus toi esiin** (ei tuotevikoja):
- `map.spec`in veto alkoi ruudun puolivälistä oikealta. Pussi näkyy nyt mobiilissa
  ajoissa, HUD on korkeampi, ja kameranappi osuu juuri siihen kohtaan. Veto alkaa nyt
  33 %:n korkeudelta
- `waitForCameraStill` luki kameran 400 ms välein, mutta Hearth-kierros pysähtyy jokaisen
  hypyn välissä 650 ms:ksi. Nopeampi sovellus osui tähän taukoon, ja testi jatkoi kesken
  kierroksen. Väli on nyt 1 000 ms
- Retreat-testi odottaa nimettyä dialogia, koska onboarding-kortti on myös dialogi

## Ei tässä

- Web Worker geometrialle. Välimuisti poistaa työn sen sijaan että siirtäisi sen
- Viewport-rajaus kartalle lähetettävään dataan. Tarvitaan vasta 10 000+ heksalla
- Paikan ja questin napautuksen korjaus → `BRDC-MAP-007` (`promoteId` tekee sen mahdolliseksi)
