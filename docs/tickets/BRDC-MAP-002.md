# BRDC-MAP-002 — Sumu, naapurin paljastus, maastoikonit, vihollisen väri

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus ja jaettu maailma |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-CLAIM-006, BRDC-TERRAIN-002 |
| **Status** | `done` — 2026-09-01 (visuaalinen todennus kentällä auki) |
| **Valmius** | 90 % |

## 🔴 RED

Kartalla näkyy jokaisen kilpailijan koko alue heti kun sen panoroi ruutuun, ja
maaston tyyppi näkyy vain värillisenä pisteenä omilla soluilla — väri yksin kantaa
merkityksen (AI-Koulu luku 4 kieltää). Kentässä testattaessa tämä tarkoittaa, ettei
"tutkiminen" ole mekaniikka: kaikki on jo näkyvissä. Kilpailijan alue piirtyy myös
sävyllä joka voi osua omaan `--cosmic-purple`iin ja sekoittua siihen.

## 🟢 GREEN

- [x] Näkyvä joukko = omat solut ∪ niiden naapurit (`withFogOfWar`). Muu kartta on
      sumua: suodatetaan pois ennen `MapCanvas`ia, ei koskaan piirretä
- [x] Naapurisolu (näkyvä, ei omistettu) piirtyy `REVEAL_FILL`illä (neutraali haalea),
      ei `OWN_FILL`illä
- [x] Kilpailijan solu piirtyy `ENEMY_FILL`illä (`#5c1a1a`), yksi kiinteä väri
      kaikille — `hueFor`/`HUE_MIN`/`HUE_MAX` poistettu
- [x] Näkyvä solu saa maastoikonin (`CELL_ICON_LAYER`, symbol). `plain` → `''` → ei
      ikonia. Glyfi + resurssin väri (`terrainGlyph`)
- [x] Sama glyfi ja väri `CellPanel`iin maaston nimen viereen (`terrainGlyph`)
- [~] Rakennuksen oma glyfi sen alle — siirretty: 15 rakennustyyppiä eivät saa
      erottuvia geometrisia glyfejä helposti; BuildPanel listaa rakennukset jo tekstinä
- [x] `claude.md` §13 rivi korjattu (amended 2026-09-01)

## Toteutus

**Sumu on renderöintisuodatin, ei datan latausmuutos.** `getCells(bbox, now)` hakee
edelleen kaiken ruudussa — valtauslogiikka (`claiming.ts` `cellsToLoad`) tarvitsee
naapuridatan riippumatta siitä mitä piirretään. Vain `MapCanvas`iin menevä solulista
suodattuu: `withFogOfWar(all, owned)` (`territoryFeatures.ts`, puhdas) palauttaa
`owned ∪ neighboursOf(owned)`, kukin joko tallennettuna soluna tai synteettisenä
`emptyCell(h3)`:na jotta naapuri saa haalean täytön ja ikonin vaikkei sitä ole vielä
vallattu. Kutsutaan kerran `MapView`ssä, `useMemo`lla, ennen `<MapCanvas cells=…>`.
Tapahtumat (`useSelection`, `FirstLook`, `nearestRivalBearing`) pitävät koko
`territory.cells`:n — vain piirto rajautuu.

**`cellProperties` värит kolmeen tasoon:** `mine` → `OWN_FILL`/`OWN_STROKE`
(ennallaan); muu omistettu → `ENEMY_FILL` (`#5c1a1a`, sama suhde `--danger`iin kuin
`OWN_FILL`illä `--cosmic-purple`iin); näkyvä omistamaton → `REVEAL_FILL` (neutraali
haalea). Täytön opasiteetti tulee jo `strength`istä (`CELL_FILL_LAYER` interpoloi
0→0.1), joten synteettinen naapuri (strength 0) on luonnostaan haalea eikä opasiteettia
tarvitse koskea.

**Ikonikerros:** `CELL_YIELD_LAYER` (ympyrä, vain omat) korvataan `symbol`-kerroksella
joka lukee `icon`/`iconColor` featuren propertyistä, suodatin `['!=', ['get','icon'],
'']`. Glyfit ovat samasta rekisteristä kuin `Hud.tsx`:n `⬢ ⬡ ◈ ◇` — MapLibre piirtää
ne `'Noto Sans Regular'`ista jota `PlaceMarkers.ts` jo käyttää. Emojia ei käytetä
(SDF-glyfit eivät välttämättä kanna niitä).

| Terrain | Glyfi | Resurssin väri |
|---|---|---|
| forest | `♣` | wood |
| hill | `△` | stone |
| mountain | `▲` | iron |
| lake / coast | `≈` | food |
| market | `◆` | gold |
| plain | — | — |

**`CellPanel`:** `terrainGlyph(kind)` (uusi export) antaa `{ char, color }`; paneeli
piirtää sen `GROUND[kind]`-tekstin viereen. `cell.building` → `buildingGlyph(id)` sen
alle. Ei uutta dataa — paneelilla on maasto ja rakennus jo.

## Testit

- [x] `withFogOfWar`: palauttaa omat + naapurit, ei muuta; naapuri ilman tallennettua
      solua tulee synteettisenä (`ownerId: null`, `strength: 0`)
- [x] `cellProperties`: oma → `OWN_FILL`; kilpailija → `ENEMY_FILL`; näkyvä vapaa →
      `REVEAL_FILL`, ei koskaan `ENEMY_FILL`
- [x] `terrainGlyph`: `plain` → `null`; `forest` → `♣` + `#7cbf63`; jokainen
      `TerrainKind` kattaa
- [x] `hueFor`/`HUE_MIN`/`HUE_MAX` ja niiden 4 testiä poistettu — 666 testiä vihreä,
      `tsc -b` puhdas, `lint:lines` OK (MapView 398)
- [~] 360 px viewport: e2e ei ajettu tässä (renderöintimuutos, ei layout)

## Lähde

Kenttätesti 2026-09-01 (Infinite) · `claude.md` §13–§14
