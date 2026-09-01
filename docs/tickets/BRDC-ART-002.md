# BRDC-ART-002 — Rakennukset kartalla grafiikkana

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S–M (päivä) |
| **Riippuvuudet** | BRDC-BUILD-001/002, BRDC-MAP-002 (territory-layerit) |
| **Status** | `done` |
| **Valmius** | 100 % |
| **Lähde** | Infinite 2026-09-02: *"haluan että saat myös nähdä eri rakennukset kartassa grafiikkana"* |

## 🔴 RED

Rakennus on `cell.building.id` tallessa ja `CellPanel` kertoo siitä sanoin, mutta kartalla
ruutu näyttää samalta rakennettuna kuin tyhjänä. Sivilisaatiokerros on näkymätön kunnes
avaat solun. `PlaceMarkers` osoittaa mallin (symbol-layer + inline-SVG-sigili), ja
`CELL_ICON_LAYER` piirtää jo terrain-glyfin — rakennukselle tarvitaan sama.

## 🟢 GREEN

- [x] **Yksi glyfi per rooli** — `features/territory/buildingGlyphs.ts` (puhdas):
      `BUILDING_ROLE` (15 → 5 roolia), `buildingGlyph(id) → { char, color }`.
      - **Muutos suunnitelmasta:** Unicode-glyfi per *rooli*, ei stroke-SVG per rakennus.
        MapLibre symbol-layer render­öi fonttiglyfejä, ei inline-SVG:tä — sama valinta kuin
        terrain- ja anomalia­glyfeillä. §12:n stroke-SVG on sacred-geometry-hetkille, ei
        kartan dataglyfeille. `⚒` tuotanto · `▤` varasto · `❋` tieto · `▣` puolustus ·
        `❦` kulttuuri.
- [x] Glyfi renderöityy **rakennuksen ruudulle**, terrain-glyfin **alle** (`text-offset
      [0, 1.1]`) — anomalia on yllä, tämä alla, joten kolme merkkiä mahtuu samaan ruutuun.
- [x] Näkyy vain `minzoom CELL_DETAIL_MINZOOM` (13) — putoaa muiden soluglyfien mukana.
- [x] Väri per rooli, glyfi eri muoto — ei kanna tietoa värillä yksin (§14). Näkyy myös
      **rivaalin** rakennuksesta rajaruudulla (tiedustelua).
- [x] `cellProperties` saa `building` + `buildingColor` -propit kuten `anomaly`;
      `CELL_BUILDING_LAYER` peilaa `CELL_ANOMALY_LAYER`ia. Ei muutosta MapCanvas/MapView.
- [x] `buildingGlyphs.test.ts` + `territoryFeatures.test.ts` laajennettu. 815 vihreää.

## Ei tässä

- Rasteri / 3D / isometriset rakennukset — inline-SVG, crisp joka koossa (§12).
- Animoidut rakennukset (savuava savupiippu tms.) — staattinen glyfi v1:ssä.
- Rakentaminen kartalta suoraan — pysyy `CellPanel`issa (ks. BRDC-KEEP-002 Buildings-tab).
