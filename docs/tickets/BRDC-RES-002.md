# BRDC-RES-002 — Resurssien ja rakennelmien kuvat designin symboleista

| | |
|---|---|
| **Alue** | `worldseedBountySprites.ts`, `bountySprites.ts`, `territoryImages.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `[~]` osittain valmis 2026-09-16 — 28 bonusresurssin kuvat kartalla; maamerkki/ihme/"?" toisten tikettien omia päätöksiä |
| **Riippuvuudet** | `BRDC-RES-001`, `BRDC-TERRAIN-005` |
| **Lähde** | `Eldritch-Worldseed.html` (21 `<symbol>`), `Eldritch-Sigil.html` §03 (47 `<symbol>`), Sigil §03 *Bonus resources* |

## 🔴 RED — todennettu, kaksi kohtaa korjattu

Infinite: *"katso että kaikki resurssit on toteutettu"*.

**Tarkistettu tässä istunnossa, koodista käsin, ei arvattu:**

- Kartalla ei ennen tätä tikettiä näkynyt **yhtään** 28 Worldseed-löydöstä — `bounty.ts`in
  oma kommentti kertoi suoraan: yhteinen ✦-merkki vain, koska "this ticket has no art
  direction for" niitä. `territoryMarks.ts`in `icon-image` on jo `concat('bounty-',
  get('bounty'))` — poolia riippumaton — joten puuttui vain kuvat itse, ei putki
- **Maasto oli jo korjattu:** `marsh` ja `settlement` -laatat ovat olleet pelissä
  `BRDC-TERRAIN-005`:stä asti (`terrainSprites.ts`), tehty tämän saman istunnon aikana
  ennen tätä tikettiä. Tämän RED:n alkuperäinen väite ("settlementille ei ole mallia
  missään") ei enää pidä paikkaansa — korjattu tähän
- **"?"-kiekko ei ole tämän tiketin työ.** `HexSeed.confidence`in oma dokumentaatio
  (`types/hexSeed.ts:29`) osoittaa sen suoraan `BRDC-CARD-001`:lle, joka vasta rakentaa
  HERE-kortin lopullisen ulkoasun Infiniten hyväksynnällä — sama tieto kahdessa
  tiketissä olisi kaksi eri toteutusta samasta säännöstä
- **Maamerkin ja ihmeen kuva eivät ole vielä mahdollisia tehdä.** `BRDC-LANDMARK-001`in
  oma "Auki"-kohta sanoo: kartan `SLOT`-taulussa ei ole vapaata paikkaa maamerkin omalle
  merkille, ja ratkaisu (kahdeksas slotti vai jaettu slotti) on nimenomaan Infiniten
  päätös, jota tämä istunto ei voi arvata. `BRDC-WONDER-002`in yhdeksän uutta ihmettä
  eivät ole vielä edes löydettävissä pelissä (`findWonderAt`-integraatio on sen oma
  auki jäänyt jatkotyö) — halo tarvitsee jonkin näkyvän ihmeen jonka päällä olla, eikä
  sellaista vielä ole

## 🟢 GREEN

- [x] **28/28 bonusresurssia kartalla**, todelliset kuvat dokumentin omasta
      `<symbol>`-polkudatasta (`Eldritch-Sigil.html` §03), ei uudelleenkeksittynä:
  - 6 (`fish`, `deer`, `wheat`, `granite`, `marble`, `gems`) käyttävät jo olemassa olevaa
    legacy-kuvaa — sama nimi, sama `bounty-<id>`-spriteid, ja dokumentin oma piirros on
    näillä kuudella lähes pikselintarkasti sama kuin peliin jo vuonna BOUNTY-001
    piirretty versio (todennettu vertaamalla polkudataa suoraan). Toinen, lähes
    identtinen kuva samalla nimellä ei koskaan piirtyisi — `bountySprites.ts` rekisteröi
    sen ensin — joten se olisi kuollutta koodia
  - 22 uutta (`worldseedBountySprites.ts`, uusi tiedosto): väri `oklch(...)`/`var(--x)`
    muunnettu kirjaimelliseksi hexiksi pelin oman värilain mukaan (`MAP_RESOURCE_COLOUR`,
    `claude.md` §13:n tokenit) — ei `Image`in ulkopuolella toimimatonta CSS:ää. Kolmesta
    kuvasta (`leycrystal`, `wisp`, `goldvein`) poistettu elävän dokumentin oma
    hehku-filtteri ja CSS-animaatio, koska yksittäiseen still-kuvaan rasteroituna
    kumpikaan ei koskaan suoriutuisi
  - `territoryImages.ts`in `addBountySprites` rasteroi nyt molemmat taulut peräkkäin
    (ei `Promise.all` — kaksi samanaikaista canvasta on juuri se pullonkaula
    `spriteRaster.ts`in oma dokumentaatio kuvaa) ja rekisteröi kummankin kuvat samaan
    atlakseen. Kartan taso ei muuttunut — se piirsi jo poolista riippumatta
- [x] Kuva-id:t `worldseed.ts`:n/`BONUS_RESOURCES`:n omista id:istä, ei mistään
      väliaikaisesta viittaustaulusta
- [x] Testit: `worldseedBountySprites.test.ts` (7 uutta — kattavuus ydintä vasten,
      koko, ei kahta samaa kuvaa, ei `var`/`oklch`-jäänteitä, `null` ilman canvasta).
      Sama rakenne kuin `bountySprites.test.ts`, yksi ero: ei yhtä jaettua
      varjoellipsiä, koska lähdedokumentti antaa jokaiselle oman (vesilöydöillä
      sävytetty lampi, muilla tavallinen maavarjo) — todellista signaalia, ei kohinaa
      tasoitettavaksi
- [x] Portti: 1548 testiä, `tsc -b`, `lint:lines`, tuotantobuild — kaikki vihreät

## Ei tässä — toisten tikettien päätöksiä, ei arvattu

- **"?"-kiekko tutkimattomalle heksalle** — `BRDC-CARD-001`, `types/hexSeed.ts:29`in oma
  osoitin
- **Maamerkin oma merkki kartalla** — `BRDC-LANDMARK-001` odottaa Infiniten päätöstä
  kahdeksannesta slotista vai jaetusta slotista (`cellMarks.ts`in `SLOT`-taulu on täynnä)
- **Ihmeen halo maamerkin päällä** — riippuu edellisestä, ja lisäksi `BRDC-WONDER-002`in
  yhdeksän uutta ihmettä eivät ole vielä löydettävissä ollenkaan (`findWonderAt`
  -integraatio auki siellä)
- `forge` — tehty jo `BRDC-BUILD-013`:ssa, oma kuvakkeensa
- `tower` (Watchtower) ja `tavern` — ei rakennettavissa vielä (`BRDC-BUILD-013` jätti
  Watchtowerin pois; `BRDC-TAVERN-001` on `todo`), joten kuvalle ei ole vielä heksaa
  jonka päälle piirtyä. Kuva ilman toimivaa rakennusta olisi näyttänyt valmiilta
  ollematta — sama periaate kuin `BRDC-BUILD-013`in Watchtower-päätöksessä
- Resurssien data ja tuotot — `BRDC-RES-001`
