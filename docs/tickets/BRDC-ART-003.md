# BRDC-ART-003 — Isometriset rakennuskuvakkeet ja kartan ensimmäinen filtteri

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | M |
| **Riippuvuudet** | BRDC-ART-002, BRDC-BUILD-007, BRDC-MAP-002 |
| **Status** | `done` (2026-09-06, v0.5.40) |
| **Valmius** | 100 % |
| **Lähde** | Infinite, kenttätesti 2026-09-06: *"eri rakennuksilla on 3d kuvake (pieni, mutta niin, että se erottuu kartasta.. Tämän layerin voi togglettaa sitten pois valikosta.. muutenkin tehdään lopulta karttafiltereitä)"* + AskUserQuestion → *"Isometrinen SVG-sprite"* |

## 🔴 RED

`BRDC-ART-002` merkitsi rakennetun heksan yhdellä rooliglyfillä (5 kpl 15 rakennukselle).
Kenttä: rakennukset pitäisi nähdä — kaikki niistä — ja erottaa toisistaan yhdellä
vilkaisulla. Ja vastustajan rakennukset kartalta.

## 🟢 GREEN

- [x] **15 proseduraalista isometrista SVG-spriteä** (`buildingSprites.ts`): jaettu
      iso-lohko (ylärombi + kaksi sivupintaa) + per-rakennus `cap` (sahanterä, hakku,
      vaot, sakarat, kupoli…). Rooliväritys samoista hexeistä kuin glyfi. `viewBox 0 0
      64 64`, `SPRITE_PX = 44`. Ei sprite-sheettiä repoon, ei CDN:ää (`claude.md` §7).
- [x] **Rasterointi kerran** `map.addImage`iin (`rasteriseSprites`): SVG → `data:`-URI →
      `img.decode()` → canvas → `getImageData`, `pixelRatio: 2`. Palauttaa `null`
      alustalla jolla ei ole canvasia (testiajuri) → kutsuja no-op.
- [x] **Oma pistelähde ja -taso** (`BuildingIconLayer.ts` + `buildingIconFeatures.ts`):
      yksi Point per Työ per näkyvä solu, `slot`-ominaisuus jolla `icon-offset` levittää
      rypään (yksi keskelle, kaksi jakaa, kolme viuhkaksi). MapLibre piirtää yhden
      symbolin per feature, siksi lista ei riitä — tarvitaan piste per Työ.
- [x] **Vastustajan Työt piirtyvät** samalla tavalla, `icon-opacity` 0.7 — sprite kantaa
      jo roolin, ei väriä uusiksi. `challengeToCells` palauttaa jo `buildings`-listan.
- [x] **Toggle** `settings.ts` → `buildingIcons` (oletus **päällä**), `SettingsMenu`-rivi
      "Building icons on the map". Päällä: ikonitaso näkyy, `cells-building` (ART-002:n
      yksi glyfi) piiloon. Pois: käänteinen. Ei kaksoismerkintää.
- [x] **`MapCanvas` jaettu**: ikonitason elinkaari (`ensure` / `setData` / näkyvyys /
      teardown) omaan hookkiin `useBuildingIcons.ts` — `MapCanvas` oli 399/400.
- [x] **Testit** (`buildingSprites.test.ts`): jokaisella rakennuksella `svg` +
      vakaa `spriteId`; `buildingIconFeatures` antaa piste/Työ, slotit 0..n, rypään koko,
      vastustaja `mine:false`. Rasterointi vaatii oikean canvasin → Playwright, ei yksikkö.
- [x] `pnpm test` (990) `&& typecheck && lint:lines && build` vihreät; e2e
      `hearth-tour` + `standards` (a11y — uusi asetusrivi) vihreät.

## Vaikutus

- `cells-building` (tekstiglyfi) jää — se on nyt kevyt fallback jonka toggle näyttää.
- Ikonitaso lisätään `useBuildingIcons`in omassa effektissä, joten se laskeutuu z-akselilla
  viimeiseksi (myös awakening-välähdyksen päälle 2 s ajaksi). Siedettävä; `beforeId`
  jos häiritsee.

## Ei tässä

- Muut karttafiltterit (maasto, rappio, omistus). Tämä on **ensimmäinen** filtteri, ei
  filtterivalikko — se on oma tikettinsä kun niitä on kolme.
- Animoidut / valaistut ikonit. Litteä kahden pinnan sprite riittää 20 px:ssä.
- Ikonien z-järjestyksen hienosäätö (`beforeId`).
