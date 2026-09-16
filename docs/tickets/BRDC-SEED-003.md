# BRDC-SEED-003 — Vyöhykkeiden jako heksoiksi: maasto, bonusresurssit

| | |
|---|---|
| **Alue** | `packages/core/src/data/worldseedTerrain.ts`, `worldseedPartition.ts`, `worldseedAllocate.ts`, `scripts/build-worldseed.mjs` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L |
| **Status** | `done` — ajettu ja todennettu 2026-09-16 |
| **Riippuvuudet** | `BRDC-SEED-001`, `BRDC-TERRAIN-005` |
| **Lähde** | `worldseed.ts` (`classify`, `ZONE`/`depositCount`/`allocate`), Worldseed §03 |

## 🔴 RED

`worldseed.ts`in putki (`survey → classify → populate/partition+allocate → place → freeze`)
on kirjoitettu axial `q:r`-ruudukolle 25 m circumradiuksella. Peli käyttää H3 res-11:tä.
Kumpaakaan ruudukkoa ei ollut käännetty toisiksi missään.

**Korjattu oletus alkuperäisestä RED:stä.** Alkuperäinen suunnitelma oletti että
`seed.harmala.json` kantaisi axial-ruudukon ja per-heksa OSM-peittoprosentit
(`SurveyRecord.cover`), joista `classify()` päättelisi maaston. Kumpaakaan ei ole: dokumentti
antaa `grid.origin`+`circumradiusM` (koordinaatiston määrittely, ei materialisoitua
ruudukkoa) ja `zoneOverrides`-listan — 18 käsin piirrettyä, ihmisen jo luokittelemaa
vyöhykettä (laatikko tai yksi rantaviiva-sääntö), ei koko bbox:n kattava OSM-peitto.
`partition` ja `place` ovat `worldseed.ts`:ssä `declare function` -allekirjoituksia ilman
runkoa — algoritmia ei ollut annettu, vain sen kuvaus §03:ssa.

Tämä tiketti käyttää siis **oikeasti olemassa olevaa dataa** (`zoneOverrides`, ihmisen
tarkistama) sen sijaan että yrittäisi rakentaa puuttuvan OSM-peitto-putken uudelleen — se
olisi oma, ison luokan projektinsa.

## 🟢 GREEN

- [x] **Ruudukko:** `cellsCoveringBBox` (jo olemassa, `geo/cells.ts`) tuottaa oikean H3
      res-11 -ruudukon dokumentin käännetyn `bbox`:n yli. Ajettu Härmälälle: **2447 heksaa**
      (`expectedCounts.totalHexes [2400, 3400]`:n sisällä)
- [x] `classifyHex`/`classifyGrid` (`worldseedTerrain.ts`): jokainen heksa luokitellaan
      `zoneOverrides`ista — laatikko tai `bboxNorthOf`-rantaviivasääntö (liukuinterpolaatio
      pisteiden välillä), korkein `priority` voittaa päällekkäisyydessä (todennettu:
      Vähäjärven suo priority 2 voittaa Vähäjärvenpuiston priority 1:n niiden yhteisellä
      alueella). Ei mikään vyöhyke → `plain`, confidence 0.4 (< 0.5, `BRDC-CARD-001`in
      "?"-kiekko laukeaa oikein)
- [x] `water`→`lake`/`coast` ja `trade`→`market` (`BRDC-TERRAIN-005`:n päätös): rantaerottelu
      on oma jälkiajo naapuruuden yli — vesiheksa joka koskettaa ei-vesinaapuria on `coast`,
      muuten `lake`. Testattu erikseen puhtaalla, käsin rakennetulla luokittelulla
      (order-independent: molemmat lukevat alkuperäisestä kartasta, eivät muokatusta)
- [x] `hill` ei tule mistään vyöhykkeestä tässä datassa (yhtään hill-vyöhykettä ei ole
      piirretty) — `BRDC-SEED-000` D9:n "ei DEM:iä vielä" näkyy rehellisesti, ei peitelty
- [x] `partitionIntoAreas` (`worldseedPartition.ts`): H3-naapuruuden yli laskettu
      samanmaastoinen yhtenäisyys, ylikokoiset (>55) pilkotaan rajattuina BFS-lohkoina,
      alikokoiset (<7) sulautetaan suurimpaan koskettavaan naapuriin **maastosta
      riippumatta**. **Löydetty ja korjattu bugi ennen julkaisua:** pilkkomisen jättämä
      pieni jäännöslohko sulautui takaisin juuri siihen sisarlohkoon josta se pilkottiin,
      mitätöiden kokorajan — korjattu niin ettei sulautus koskaan ylitä `maxHexes`ää.
      Ajettu Härmälälle: **55 aluetta**
- [x] `allocateArea` (`worldseedAllocate.ts`): `worldseed.ts`in oma `BONUS_RESOURCES` (28),
      `depositCount`, `DEPOSIT_CAP` — lähes sanasta sanaan portattu (ainoa muutos: maaston
      affiniteettiavaimet pelin nimillä). Deterministinen (`prng`, jo olemassa
      `sim/walk.ts`:ssä), `require`-liput kunnioitettu. Ajettu: **137 löytöä**,
      tiheys 137/2447 ≈ 0,056 (`DEPOSIT_DENSITY [0.03, 0.12]`:n sisällä)
- [x] `scripts/build-worldseed.mjs harmala`: koko putki päästä päähän, `expectedCounts`in
      vasten. `totalHexes`, `depositDensity`, `depositsPerArea`, `areasWithZeroDeposits`
      ovat kovia esteitä (epäonnistuminen pysäyttää buildin). **`byTerrain` on lasku
      varoitukseksi**, ei esteeksi: se olettaa täyden OSM-peiton koko bbox:n yli, ja
      `zoneOverrides` kattaa vain nimetyt paikat — suurin osa bbox:sta jää oikeutetusti
      `plain`iksi. Ajossa kolme varoitusta (forest, plain, settlement matalat/korkeat
      osuudet); `water`/`trade` **täsmäsivät** odotettuun huolimatta korvaavasta datalähteestä
- [x] Tulos tallennettu `packages/core/src/data/seed/harmala.terrain.json`iin (heksat,
      alueet, löydöt) — välituote, ei lopullinen `HexSeed`
- [x] Yksikkötestit kolmessa tiedostossa oikealla, käännetyllä Härmälä-datalla ja oikeilla
      H3-soluilla (ei live-verkkoa): 9 + 6 + 12 = 27 testiä

## Päätös Infiniteltä

**Ihmeiden sijoitus siirretty `BRDC-WONDER-002`:een, ei tehty tässä.** Alkuperäinen
GREEN-kohta ("sama koneisto kuin allocate, eri syöte") osoittautui vaatimaan
survey-signaaleja joita ei ole (`elevation`, `adjacentWater`, `leyCrossings`,
`shorelineLength`…) — nämä tulisivat täydestä OSM-surveystä, ei `zoneOverrides`ista.
Keksimäni pisteytys olisi arvaus, ei data. `WONDER-002` käyttää sen sijaan dokumentin omaa
`harmalaHint`-koordinaattia + maastovaatimuksen tarkistusta kovana esteenä.

## Ei tässä

- Maastolajien nimet ja värit — `BRDC-TERRAIN-005` (valmis)
- Bonusresurssien kuvat — `BRDC-RES-002`
- Ihmeiden sijoitus — `BRDC-WONDER-002`
- Lopullinen `HexSeed`-kokoonpano (maamerkit + questit + tämä) ja tallennus — `BRDC-SEED-004`
