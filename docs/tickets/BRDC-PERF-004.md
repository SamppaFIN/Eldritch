# BRDC-PERF-004 — Tarkkuus zoomin mukaan

| | |
|---|---|
| **Alue** | `features/territory/{TerritoryLayer,territoryMarks,strengthArcs,BuildingIconLayer}`, `packages/core/src/geo/cellGeometry` |
| **Vaihe** | Läpileikkaava — kartan suorituskyky |
| **Effort** | M |
| **Riippuvuudet** | BRDC-PERF-003 |
| **Status** | `[~]` — toteutettu ja mitattu 2026-09-29; kiekkomerkit ja puhelinhyväksyntä auki |
| **Valmius** | 70 % |
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

- [x] **Alle 14:** täyttö (zoomista 9, Atlaksen alla) ja **valtakunnan ääriviiva yhtenä
      monipolygonina** (`packages/core/src/geo/realmOutline.ts`, h3-js:n `cellsToMultiPolygon`,
      muistissa viimeisin joukko, 4 testiä; taso `features/territory/realmOutlineLayer.ts`,
      9–14). Ääriviiva lasketaan vain kun se näkyy, idle-hetkellä, ja päivitetään seuraavan
      loitonnuksen jälkeen: 5 000 heksan yhdistäminen maksoi muuten sekunnin jokaisella
      valtauksella. Heksakohtaiset viivat, glyfit ja symbolit alkavat zoomista 14
      (`CELL_DETAIL_MINZOOM` 13 → 14)
- [~] **14–16:** heksakohtainen reuna ja rival-katkoviiva ovat mukana zoomista 14. **Yhden
      kiekkomerkin sääntöä** (rakennus tai resurssi `northEast`-slottiin) ei tehty: se on
      näkyvä muutos, joka kuuluu grafiikkatyöhön (ART-006), ja nykyiset merkit ovat jo
      zoomista 14
- [~] **16 ja yli:** voimakaari 15 → 16. Iso-spritet ja jalusta ovat zoomista 15 (ennen
      spritet 13, jalusta 15), numerot jo 16. Resurssi maassa pysyi 15:ssä
- [x] Pelkillä tasojen `minzoom`/`maxzoom`-arvoilla; ääriviivan ainoa JS on
      `zoomend`-kuuntelija, joka käynnistää idle-laskennan vain, jos tieto on vanhentunut
- [ ] Lähteen `buffer`/`maxzoom`-kokeilu — ei tehty
- [x] `claim.spec.ts`in zoom-testi päivitetty (täyttö 9, viivat 14)
- [~] `perf-map.spec.ts`: loitonnettu (zoom 13) ja kävelyzoomin panorointi mitattu. p95 on
      183–267 ms, ei alle 33 ms: headless-Chromessa WebGL on ohjelmistopohjainen
      (SwiftShader), joten kuva-aika ei vastaa puhelimen GPU:ta. Raja pitää todentaa
      puhelimella
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines`; e2e alla
- [ ] Infinite hyväksyy ulkoasun puhelimella kolmella zoomitasolla

## Todennus

`perf-map.spec.ts`, mobile-360, 4× CPU, yksi worker:

| | PERF-003 | **PERF-004** |
|---|---:|---:|
| 1 027: longtaskit / 20 s kävely | 10,0 s | **5,0 s** |
| 1 027: pisin | 293 ms | 219 ms |
| 1 027: panorointi zoom 13, p95 | 217 ms | **183 ms** |
| 5 000: pisin | 738 ms | 689 ms |
| 5 000: panorointi zoom 13, p95 | 517 ms | **233 ms** |

Ensimmäinen versio laski ääriviivan joka kerta, kun alue muuttui, ja 5 000 heksan pisin
tehtävä kasvoi 1 112 ms:iin. Laiska laskenta palautti sen alle p2:n tason.

## Ei tässä

- Uudet spritet → `BRDC-ART-006`
- Kansallinen näkymä alle zoomin 11 on jo `BRDC-ATLAS-001`:n `nation-regions`-taso
