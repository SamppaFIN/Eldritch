# BRDC-ART-006 — Works Codexin rakennukset kartalle atlaksen kautta

| | |
|---|---|
| **Alue** | `scripts/build-sprites.mjs`, `files/design/`, `features/territory/{buildingSprites,placeSprites,CastleMarker,BuildingIconLayer,spriteRaster}`, `features/map/useSpriteResolver` |
| **Vaihe** | Läpileikkaava — uusi grafiikka |
| **Effort** | L |
| **Riippuvuudet** | BRDC-PERF-004 (zoomitasot), BRDC-SIGIL-006 (slottitaulukko) |
| **Status** | `[~]` — kuusi rakennusta, Keep ja Temple kartalla 2026-09-29 (v0.6.65); piirretty PDF:stä, suunnittelijan SVG:t puuttuvat |
| **Valmius** | 70 % |
| **Lähde** | Claude Design: *Eldritch Buildings.html* ja *Eldritch-pelin uusi design systeemi.pdf* (Works Codex), 2026-09-23/24; Infinite 2026-09-28 |

## 🔴 RED

Uusi rakennusgrafiikka on olemassa suunnittelijan tiedostoissa, mutta sitä ei voi viedä
kartalle sellaisenaan:

- Symbolit (`bdPl`, `bdKeep`, `bdTemple`, `bdFarm`, `bdSawmill`, `bdQuarry`, `bdForge`,
  `bdMarket`, `bdTower`, `bdTavern`, viewBox 64×56) käyttävät `oklch()`-värejä,
  `var(--…)`-tokeneita, `currentColor`ia `<use color>`-kautta, `bdGlow`-blur-filtteriä ja
  `bdBob`/`bdPulse`-animaatioita. Nykyinen rasterointi (`spriteRaster.ts`) hyväksyy vain
  hex-literaaleja, koska `Image` purkaa SVG:n dokumentin ulkopuolella
- Sigil-speksin ohje *"the sprite, gem and arc are one SVG overlay per visible cell"* ja
  *"5s bob"* jokaiselle rakennukselle kaataisi kartan: 1 000 heksaa tarkoittaisi tuhansia
  DOM-elementtejä ja animaatioita (`BRDC-CLAIM-006:45`: *"DOM:issa mahdoton"*)
- Kaikki spritet rasteroidaan nyt kartan käynnistyessä peräkkäin (`BRDC-MOBILE-004`
  mittasi rinnakkaisena 20–22 s 360 px:llä)
- Rakennus × maasto -yhdistelmiä olisi 17 × 9 = 153 kuvaa, noin 147 kt kukin

## 🟢 GREEN

**Poikkeama suunnitelmasta:** `Eldritch Buildings.html` ei ollut saatavilla (ei repossa, ei
design-zipissä, ei latauksissa). Siksi rakennukset **piirrettiin Works Codex -PDF:n omista
renderöinneistä** samalla iso-säännöllä, suoraan hex-väreillä. `build-sprites.mjs`-muunninta
(oklch → hex, `var()`, `<use>`) ei tarvittu, koska lähde ei käytä niitä. Kun suunnittelijan
symbolit tulevat, ne korvaavat `designSprites.ts`:n sisällön, eikä mikään muu muutu.

- [~] Lähde: `features/territory/designSprites.ts`, pieni iso-generaattori (jalusta,
      laatikko, pyramidikatto, pallo) ja kahdeksan kuvaa. Ei `files/design/buildings.svg`iä
- [x] Testi (`designSprites.test.ts`): ei `var(`, `oklch(`, `currentColor`, filttereitä,
      animaatioita eikä `<use>`a. Temple hehkuu sacred-gold `#ffd700` ja Keep
      awareness-green `#00ff88` (§03)
- [x] Laiska rasterointi: `styleimagemissing` → kuva piirretään vasta, kun kartta pyytää sitä,
      kerran per kartta, `watchRemoval`-suoja. Vanha kaikkien 16 spriten rasterointi
      käynnistyksessä poistui (`rasteriseSprites`)
- [~] Jalusta on piirretty rakennukseen (tumma timantti). Vanha pyöreä maastojalusta
      piirtyy enää vain rakennuksille, joilla ei ole uutta kuvaa. Maaston sävy ei siis näy
      uusien rakennusten alla. Kuvia on kahdeksan, ei 153
- [x] Kytkentä: farm, sawmill, quarry, forge, market ja tavern → `spriteSvg`. Temple →
      `placeSprites`. Keep → Anchor-paikan kuva (Anchor on Hearth, joka on Keep, §10);
      Hearthin lippu jäi pois jo ennestään (`placeHere`). Muut rakennukset: vanha kuva
- [x] Mitoitus: jalusta 52/64 levyinen → puolileveys noin 0,45 r zoomilla 16
- [x] `sigil.spec` ja `nation.spec`: ei uusia kaatumisia (`sigil:31` ja `nation:105` ovat
      punaisia jo `main`issa)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines`; e2e `works`, `place-tap` vihreät
- [ ] Infinite hyväksyy ulkoasun puhelimella

## Avoimet kysymykset (suunnittelijalle)

- Mikä pelin rakennus on **Tower** (`bdTower`)? Watchtoweria ei ole koodissa (`BRDC-BUILD-013`)
- Puuttuvien rakennusten kuvat (granary, monument, storehouse, lumbermill, mine, fishery,
  vineyard, library, lighthouse, fortress) myöhemmin samalla iso-säännöllä

## Todennus

_Kirjataan toteutuksen jälkeen._

## Ei tässä

- Works Codexin detail-sivut ja tutkimuspuut (PDF:n yläpuoli). Ne ovat paneeleja, eivät karttaa
- Animaatiot → `BRDC-FX-003`
- Lasi → `BRDC-SIGIL-001`
