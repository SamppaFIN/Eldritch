# BRDC-PERF-003 — Yksi valtaus ei lähetä tuhansia heksoja

| | |
|---|---|
| **Alue** | `packages/core/src/geo/`, `packages/core/src/data/cellStore`, `features/territory/{cellMarks,strengthArcs,TerritoryLayer,BuildingIconLayer}` |
| **Vaihe** | Läpileikkaava — kartan suorituskyky |
| **Effort** | L |
| **Riippuvuudet** | BRDC-PERF-002, BRDC-SCALE-001 (sen `owned:`-indeksi tehdään tässä) |
| **Status** | `todo` |
| **Valmius** | 0 % |
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

- [ ] `packages/core/src/geo/cellGeometry.ts`: memoisoitu reuna (**suljettu rengas**),
      keskipiste, naapurit ja alareunat. Keskipisteille käytetään `cellStore.ts`:n
      `centreCache`a. `terrainOf`ia ei memoisoida, koska se lukee muuttuvaa tilaa
      (survey, editori, worldseed); sitä kutsutaan kerran solua kohden
- [ ] `features/territory/territoryBuild.ts`: yhden läpikäynnin builder polygoneille,
      pisteille ja kaarille. `cellsToGeoJson`, `cellMarksToGeoJson` ja `arcsToGeoJson`
      jäävät sen kääreiksi, joten nykyiset yksikkötestit pätevät
- [ ] `features/territory/territorySync.ts`: laskee ominaisuudet ja vertaa niitä edelliseen
      lähetettyyn. Pyöristys: blight 0,05:n askelin, strength ja kaaren osuus kokonaisluvuiksi
- [ ] `updateData({add, remove, update})` kaikille neljälle lähteelle samassa tickissä.
      Yli noin 30 %:n diffi tai virhe → `setData`
- [ ] Lähteillä `promoteId: 'h3'` **ja** `feature.id = h3` (MapLibre yhdistää jonossa olevat
      diffit ilman `promoteId`tä). `work-icons`in id on `h3#slot`. `removeProperties`ia ei
      käytetä, vaan kirjoitetaan `''`
- [ ] Lähteitä **ei** yhdistetä: `promoteId` on lähdekohtainen, ja jokainen lähde saa oman
      workerinsa
- [ ] `owned:`-indeksi `cellStore.ts`:ään (SCALE-001:n jäljellä oleva kohta). `getCells` ei
      käy läpi kaikkia soluja tuotujen löytämiseksi
- [ ] Vitest: toinen build samalla syötteellä ei laske yhtään reunaa uudelleen, ja yhden
      solun muutos tuottaa enintään noin 7 päivitystä
- [ ] `claim.spec.ts`:n 5 000 heksan testi kulkee oikeaa polkua, ei suoraa `setData`a
- [ ] `perf-map.spec.ts`: valtaus → `idle` alle 300 ms (1 027 heksaa) ja alle 600 ms
      (5 000 heksaa), 4× CPU. Tarkat rajat kalibroidaan PERF-001:n baselinesta
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` vihreä, `pnpm e2e` vihreä

## Todennus

_Kirjataan toteutuksen jälkeen._

## Ei tässä

- Web Worker geometrialle. Välimuisti poistaa työn sen sijaan että siirtäisi sen
- Viewport-rajaus kartalle lähetettävään dataan. Tarvitaan vasta 10 000+ heksalla
- Paikan ja questin napautuksen korjaus → `BRDC-MAP-007` (`promoteId` tekee sen mahdolliseksi)
