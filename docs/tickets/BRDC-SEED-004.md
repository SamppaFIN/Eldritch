# BRDC-SEED-004 — HexSeed: Härmälänrannan heksojen esiarvot

| | |
|---|---|
| **Alue** | `types/hexSeed.ts`, `data/hexSeedStore.ts`, `rules/terrain.ts` (lukupolku), `scripts/build-hexseed.mjs`, `apps/game/src/data/createRepository.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `done` — ajettu ja todennettu 2026-09-16 |
| **Riippuvuudet** | `BRDC-SEED-001`, `BRDC-SEED-002`, `BRDC-SEED-003` |
| **Lähde** | Infinite 2026-09-16: *"mut ensin se heksojen esiarvot härmälänrantaan"* |

## 🔴 RED

Kolme edellistä tiketti tuottivat kukin oman osansa dataa erillisinä tiedostoina
(`harmala.registered.json`, `harmala.landmarks.osm.json`, `harmala.terrain.json`). Mikään ei
koonnut niitä yhdeksi heksakohtaiseksi esiarvoksi jota peli lukisi, eikä maasto- tai
resurssilogiikka tiennyt niistä mitään.

## 🟢 GREEN

- [x] `HexSeed { h3, terrain, confidence, resource?, landmark?, structure?, quest? }`
      (`types/hexSeed.ts`). `structure`/`quest` ovat mukana tyypissä (samat kentät kuin
      `worldseed.ts`:n omassa `HexSeed`:ssä) mutta **ei täytetä vielä** — ihmeen sijoitus on
      `BRDC-WONDER-002`, ja seikkailuilla on jo omat vahvistetut paikkansa (`questSites.ts`)
- [x] `scripts/build-hexseed.mjs harmala`: yhdistää `SEED-003`:n maaston+löydöt ja
      `SEED-002`:n maamerkkitäsmäytyksen (ajettu tuoreena rekisteröityä dokumenttia ja
      jäädytettyä OSM-fixturea vasten) yhdeksi tiedostoksi. Ajettu: **2447 heksaa, 137 löytöä,
      14 maamerkkiä** → `packages/core/src/data/seed/harmala.json` (137 KB)
- [x] `hexSeedOf(h3)` (`data/hexSeedStore.ts`): sama moduulitason päällä/pois-malli kuin
      `enableTerrainSurvey`illa — oletuksena pois, sovellus kytkee päälle käynnistyksessä
      (`createRepository.ts`), ydin-testisarja ei koske siihen ellei erikseen pyydä
- [x] `terrainOf`/`terrainForCell` (`rules/terrain.ts`): Worldseed-data lukee samalta
      tasolta kuin vanha käsinsurveyta (`BRDC-TERRAIN-003`) ja **voittaa sen** alueella jota
      molemmat kattavat — vanhan surveyn oma laatikko vastaa aina jotain, joten Worldseedin
      on tultava ensin tullakseen ikinä luetuksi siinä. Kumpikin voittaa tallennetun
      `tiles`-luvun, samasta syystä kuin vanha survey jo teki (`terrainSeed.test.ts`in oma
      testi) — `Cell.terrain` on kartan tiililukun välimuisti, ei pelaajan muokkaus
      (BRDC-HEX-001:n historia, jota `terrainForCell` ei koskaan koske, koska se ei
      kirjoita mitään, vain laskee vastauksen)
- [x] Testit: `hexSeedStore.test.ts` (4) — pois-päältä-tila, alueen ulkopuolinen solu,
      patsaan oma heksa tiedostosta luettuna, löydön id välittyy. `worldseedTerrain.repo.test.ts`
      (7) — Worldseed voittaa vanhan surveyn, häviää alueen ulkopuolella, syöttää
      `resourceOf`:n läpi saman polun. **11 uutta testiä, 0 rikki vanhaa**
      (`terrainSeed.test.ts` läpäisee muuttumattomana — regressio todennettu)
- [x] `MockRepository`iin ei koskettu — puhdas lisäys `terrainOf`in sisällä, ei
      IndexedDB-migraatiota tarvita (siemen ei ole pelaajan tallennusta, se on koodin mukana
      tuleva data)
- [x] Portti: 1512 testiä, `tsc -b`, `lint:lines`, tuotantobuild — kaikki vihreät

## Havaittu, ei korjattu tässä

- **Muutama maamerkki päätyi `lake`-maastolle** (esim. leirintäalueen vastaanotto,
  Rantaperkiön tekonurmikenttä) — dokumentin `bboxNorthOf`-rantaviiva on tarkoituksella
  karkea yksinkertaistus ("everything north of this line is water"), eikä seuraa oikeaa
  rantaviivaa tarkasti niillä kohdin. Ei koodivirhe: luokittelu tekee juuri mitä data
  käskee. Korjaantuisi oikealla OSM-vesipolygonilla, joka on täyden surveyn takana
  (`BRDC-SEED-000`:n tulevaisuus, ei tämän tiketin piirissä)
- **Kimppuvaikutus 137 KB pääbundleen** (gzip +13 KB): `hexSeedOf` importoituu
  `rules/terrain.ts`:n kautta, joka on ydin-koodipolulla, joten `harmala.json` päätyy
  pääasiakaskimppuun eikä lazy-latautuvaan sivupolkuun. Hyväksytty nyt — koodinjako on oma,
  isompi suorituskykytehtävänsä, ei kytketty tähän

## Ei tässä

- Kortin ulkoasu (`BRDC-CARD-001`) — tämä tiketti tuo datan, ei UI:ta
- **Löydön tuotto ei virtaa `bounty.ts`:n talouteen.** `HexSeed.resource` on tallessa ja
  luettavissa (`hexSeedOf(h3).resource`), mutta `bountyOn`/`bountyYield`/`trickle` eivät
  vielä tiedä siitä — id:n resolvointi `BONUS_RESOURCES`:sta monituotoksi
  (`RES-001`:n oma "bountyYield/bountyBonus/cellIncome summaavat usean resurssin")
  on tarkoituksella `BRDC-RES-001`:n työtä, ei tämän
- Muiden alueiden (koko Suomi) siemennys — tarkoituksella rajattu Härmälänrantaan ensin
- Kenttäkoe (kävele viidelle heksalle puhelimella) — Infiniten oma todennus laitteella
