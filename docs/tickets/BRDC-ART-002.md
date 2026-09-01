# BRDC-ART-002 — Rakennukset kartalla grafiikkana

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S–M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-001/002, BRDC-MAP-002 (territory-layerit) |
| **Status** | `todo` |
| **Valmius** | 0 % |
| **Lähde** | Infinite 2026-09-02: *"haluan että saat myös nähdä eri rakennukset kartassa grafiikkana"* |

## 🔴 RED

Rakennus on `cell.building.id` tallessa ja `CellPanel` kertoo siitä sanoin, mutta kartalla
ruutu näyttää samalta rakennettuna kuin tyhjänä. Sivilisaatiokerros on näkymätön kunnes
avaat solun. `PlaceMarkers` osoittaa mallin (symbol-layer + inline-SVG-sigili), ja
`CELL_ICON_LAYER` piirtää jo terrain-glyfin — rakennukselle tarvitaan sama.

## 🟢 GREEN

- [ ] **Yksi stroke-SVG-glyfi per `BuildingId`** (§12: stroke, ei täyttöä, `stroke-dasharray`
      jos animoitu). Sawmill = teräpyörä, market = kolmio kolikoita, fortress = bastioni,
      granary = viljalyhde, jne. `features/territory/buildingGlyphs.ts` (puhdas, testattava
      `char`/`path` per id).
- [ ] Glyfi renderöityy **rakennuksen ruudulle**, terrain-glyfin päälle/tilalle — rakennus
      on tärkeämpi kuin maasto sen alla.
- [ ] Näkyy vain riittävällä zoomilla (kuten `PLACE_LABEL_LAYER`, `minzoom 13`) — kaupungin
      mittakaavassa ei glyfimössöä.
- [ ] Oma väri per rooli: tuotanto `--awareness-green`, puolustus `--danger`, kulttuuri
      `--sacred-gold`. Väri ei kanna tietoa yksin — glyfi on eri muoto (§14).
- [ ] `cellProperties` (`territoryFeatures.ts`) saa `buildingGlyph`-propin kuten `anomaly`
      sai; `TerritoryLayer` uusi symbol-layer tai olemassa olevan filtterin laajennus.
- [ ] `territoryFeatures.test.ts`: jokainen `BuildingId` tuottaa glyfin, tyhjä ruutu ei.

## Ei tässä

- Rasteri / 3D / isometriset rakennukset — inline-SVG, crisp joka koossa (§12).
- Animoidut rakennukset (savuava savupiippu tms.) — staattinen glyfi v1:ssä.
- Rakentaminen kartalta suoraan — pysyy `CellPanel`issa (ks. BRDC-KEEP-002 Buildings-tab).
