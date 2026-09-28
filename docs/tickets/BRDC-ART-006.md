# BRDC-ART-006 — Works Codexin rakennukset kartalle atlaksen kautta

| | |
|---|---|
| **Alue** | `scripts/build-sprites.mjs`, `files/design/`, `features/territory/{buildingSprites,placeSprites,CastleMarker,BuildingIconLayer,spriteRaster}`, `features/map/useSpriteResolver` |
| **Vaihe** | Läpileikkaava — uusi grafiikka |
| **Effort** | L |
| **Riippuvuudet** | BRDC-PERF-004 (zoomitasot), BRDC-SIGIL-006 (slottitaulukko) |
| **Status** | `todo` |
| **Valmius** | 0 % |
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

- [ ] Suunnittelijan symbolit purettu kerran tiedostoon `files/design/buildings.svg`
      (lähde, ei ajonaikainen)
- [ ] `scripts/build-sprites.mjs` ilman uusia riippuvuuksia: `oklch()` → hex (oma muunnin),
      `var()` → `tokens.css`, `currentColor` → `<use color>`, alfa → `fill-opacity`, `<use>`
      inlinattu, viewBox pehmustettu neliöksi alareuna tasattuna, glow-alueelle tilaa,
      `@keyframes` poistettu. `bdGlow` jää, joten se leivotaan kuvaan
- [ ] Tulos `features/territory/designSprites.gen.ts`. Testi: ei `var(`- eikä `oklch(`-merkkejä
- [ ] Laiska rasterointi: `map.setMissingStyleImageResolver` (`features/map/useSpriteResolver.ts`),
      samanaikaiset lupaukset deduplikoitu, `watchRemoval`-suoja, datassa olevat id:t
      esirasteroidaan idle-tilassa. Käynnistys ei odota spritejä
- [ ] Jalusta omana symbolitasonaan, yksi kuva per maasto (noin 9). Rakennus piirretään
      ilman jalustaa, joten kuvia on noin 26 eikä 153
- [ ] Kytkentä: farm, sawmill, quarry, forge, market ja tavern → `buildingSprites.ts`.
      Temple → `placeSprites.ts`. Keep → uusi sprite-taso `CastleMarker.ts`:ään, ja Hearth-solun
      lippu jätetään pois. Muut rakennukset käyttävät vanhaa spriteä
- [ ] Rakennuksen puolileveys enintään noin 0,45 r, jotta naapurikiekko jää näkyviin.
      Useamman rakennuksen viuhka (±28 px) sovitettu
- [ ] `sigil.spec.ts` ja `nation.spec.ts` päivitetty (`hasImage`, tasojen näkyvyys)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` vihreä, `pnpm e2e` vihreä
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
