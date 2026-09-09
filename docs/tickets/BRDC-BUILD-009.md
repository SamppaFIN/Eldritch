# BRDC-BUILD-009 — Heksa kantaa yhden Workin, ja valtaaja perii sen

| | |
|---|---|
| **Vaihe** | 2.6 → PIVOT-2026-09-09 kohta 6 |
| **Effort** | M (puoli päivää) |
| **Riippuvuudet** | BRDC-BUILD-007 (`Cell.buildings`-lista), BRDC-PERSIST-003 (migraatiopolku) |
| **Status** | `done` — 2026-09-10 (v0.5.54) |
| **Valmius** | 100 % koodin osalta; kenttätesti Infinitellä |
| **Lähde** | Infinite 2026-09-09 (PIVOT §6) + päätökset **P1** *"Valtaaja perii rakennuksen"* ja **P5** *"Pidä vahvin, muut puretaan"* |

## 🔴 RED

**Kolme vikaa, jotka kaikki tulivat samasta oletuksesta: että ruutu on säilö.**

1. **Rakentaminen oli pinoamista.** `CELL_BUILDING_CAP` oli 3. Paras solu kannatti täyttää,
   ja loput kartasta oli lavastetta. Peli jonka koko idea on kävellä lisää maata palkitsi
   siitä, ettei kävele minnekään.
2. **Piiritys poltti rakennuksen.** `capture.ts`:n `'taken'`-haara rakensi uuden solun
   kentistä joita se listasi käsin — `buildings` ja `terrain` eivät olleet listalla, joten
   ne katosivat sillä hetkellä kun maa vaihtoi omistajaa. Vuoren kaivos oli aina yhden
   valtauksen päässä olemattomasta.
3. **Globaali kuuden Workin katto valehteli syyn.** `BASE_BUILDING_CAP = 6` laskettiin
   koko valtakunnan yli, ei ruudun. Infinitellä on 340 solua; kuudennen Workin jälkeen
   *joka ikinen* rakennus torjuttiin, ja `BuildPanel` tulosti sluggin *"cell full"* —
   sana joka osoittaa ruutuun vaikka vika oli valtakunnassa. Se on `BRDC-BUILD-008`:n
   avoin kysymys, ja se ratkeaa tässä.

## 🟢 GREEN

- [x] **`CELL_BUILDING_CAP = 1`.** Yksi Work per heksa. Päivitys (`lumbermill` sahan
      päälle) ottaa edeltäjänsä paikan eikä törmää kattoon — sama sääntö kuin ennen.
- [x] **Globaali katto poistettu.** `BASE_BUILDING_CAP`, `GRANARY_CAPACITY`,
      `buildingCapacity()`, `'at-capacity'`-torjunta ja Granaryn `buildingCapacity`-kenttä
      ovat poissa. Maa on ainoa raja.
- [x] **Valtaaja perii (P1).** `capture.ts` kuljettaa nyt `buildings`in ja `terrain`in
      `'taken'`-haaran läpi. **Ei uutta omistajakenttää:** piiritys päättää jo kuka maan
      omistaa, ja kaivos jonka tuotto kuuluu jollekulle joka ei enää omista vuorta vaatisi
      toisen omistajamallin selittämään itsensä. Rakenna sinne minkä pystyt puolustamaan.
- [x] **Migraatio 3 → 4 (P5).** `keepOne(works)` — puhdas funktio — jättää kalleimman
      Workin pystyyn. Kalleus on "vahvin" siksi että päivitys maksaa aina enemmän kuin se
      minkä se korvaa; tasapelin ratkaisee vanhempi rakennus.
- [x] **Purku kerrotaan, ja se maksetaan takaisin.** Migraatio kirjoittaa purkamansa
      `K.razed`iin. `takeRazed` maksaa **täyden rakennushinnan** takaisin pussiin — ei
      puolikasta jonka *valittu* purku palauttaa, koska tätä ei valinnut kukaan — kirjaa
      jokaisesta `demolish`-rivin lokiin ja tyhjentää avaimen. Kertaluonteinen.
- [x] **Ilmoitus ei vanhene itsestään.** `Notice.sticky` — `MapNotices` ei anna sille
      ajastinta. Se on ainoa ilmoitus joka kertoo jotain minkä peli teki pelaajan maalle
      pyytämättä, ja seitsemän sekunnin ohi lipuminen olisi juuri se hiljainen katoaminen
      jonka estämiseksi ilmoitus on olemassa.
- [x] **Sama lause molemmissa reiteissä.** `razedLine(count)` on viety, koska
      `App.tsx`:n `openWager` luo myös repositoryn: ilman tätä Wagerin avaaminen
      otsikkoruudusta olisi kuluttanut raportin ennen kuin kartta ehtii näyttää sen.
- [x] **`BuildPanel` sanoo mitä tehdä** (BRDC-BUILD-008 jatkuu): *"A hex holds one Work.
      Demolish this one, or build on ground you have not used."*

## Todennus

- [x] `check-line-limit` + `tsc -b` + `vitest run` (**1055**) + `pnpm build` vihreä.
- [x] `capture.test.ts` +3 (P1): valtaaja perii Workin · perii myös ratkaistun maaston ·
      **pelkkä vahingoittaminen ei siirrä mitään** — omistaja, Work ja maasto jäävät.
- [x] `build.test.ts` +5 (`keepOne`): yksin jäävä Work ei liiku · kalliimpi voittaa
      **rakennusjärjestyksestä riippumatta** · tasapeli menee vanhemmalle · kaikki muu
      puretaan eikä mitään kahdesti · tyhjä maa on tyhjä.
- [x] `schema.test.ts` +4: vahvin jää · yhden Workin ruutuun ja paljaaseen maahan ei
      kosketa · **jokainen purettu kirjataan** · eikä mitään kirjata kun ei ollut purettavaa.
- [x] `build.repo.test.ts` +2: täysi hinta takaisin, loki nimeää jokaisen, **toisella
      avauksella ei makseta uudestaan** · koskematon tallennus on hiljainen.
- [x] `notices.test.ts` +2: yksikkö ja monikko, `sticky`, ja nolla ei sano mitään.
- [x] Viisi vanhaa testiä kirjoitettiin uusiksi (`build.test.ts`, `build.repo.test.ts`,
      `catalogue.test.ts`, `BuildPanel.test.ts`) — ne pitivät kiinni monen Workin
      säännöstä, jonka PIVOT §6 kumoaa. `buildRefusal.test.ts` poistettiin: se testasi
      pelkästään `'at-capacity'`-torjuntaa, jota ei enää ole.
- [x] e2e `guide.spec.ts` + `step-claim.spec.ts` desktopilla 8/8.
- [ ] Kenttä: päivitä puhelimen 340 solua → ilmoitus kertoo montako purettiin, pussissa on
      niiden hinta, History nimeää ne. *(Infinite ajaa.)*

## Mitä tämä maksoi, sanottuna suoraan

Tämä on ensimmäinen migraatio joka **ottaa pelaajalta pois**. Aiemmat nimesivät kentän
uudestaan. Valinta oli joko jättää vanhat pinot rauhaan (jolloin sääntö on kahdenlainen ja
vanhat tallennukset ovat pysyvästi edullisemmassa asemassa) tai purkaa ne. Purku voitti,
mutta vain koska hinta maksetaan takaisin täytenä ja pelaajalle kerrotaan. Jos jompikumpi
puuttuisi, oikea vastaus olisi ollut jättää pinot rauhaan.

## Ei tässä

- **Watchtowerin paljastussäde 3** — PIVOT §6:n loppuosa, oma tikettinsä. Tämä kattoi
  omistuksen ja katon, ei uusia rakennuksia.
- **Rakennustuoton jako käyntipäivien mukaan.** `BRDC-HEX-004` teki `localShare`sta
  päiväpohjaisen ja jätti tämän tänne — mutta huomio sen lopusta pätee yhä: `localShare`
  puhuu **kävijöistä**, P1 puhuu **valtaajista**. Ne eivät ole ristiriidassa, mutta ne
  eivät ole sama luku, eikä niitä saa yhdistää huomaamatta. Jos tuotto jaetaan, se on
  oma tikettinsä jossa ero kirjoitetaan auki.
- **Purettujen palauttaminen takaisin pystyyn.** Pussissa on hinta; uudelleenrakentaminen
  on pelaajan valinta, ja se on nyt valinta siitä mille maalle.
