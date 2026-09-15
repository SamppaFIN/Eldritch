# BRDC-SEED-002 — Maamerkit ja pisteet OpenStreetMapista

| | |
|---|---|
| **Alue** | uusi `scripts/fetch-landmarks.mjs`, `packages/core/src/data/landmarkSeed.ts`, `packages/core/src/data/seed/harmala.landmarks.osm.json` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `done` — ajettu ja todennettu 2026-09-16 |
| **Riippuvuudet** | `BRDC-SEED-001` |
| **Lähde** | `worldseed.ts` (`STRUCTURES.landmark`), Worldseed §05 *"revealed from OpenStreetMap"* |

## 🔴 RED

Worldseedin kuusi kirjoitettua maamerkkiä ovat käsin tehtyä sisältöä (nimi + tarina), mutta
niiden **sijainti** on tässä yhteydessä epäluotettava (`BRDC-SEED-001`:n löydös) ja
dokumentti itse sanoo maamerkkijärjestelmän lähteeksi OSM:n (`tourism`, `historic`,
`artwork_type`, `memorial`, `place_of_worship`). Repossa ei ole yhtään OSM-hakua — vain
kaksi käsin kirjoitettua `.mjs`-skriptiä muihin tarkoituksiin.

Node 22:n sisäänrakennettu `fetch` riittää Overpass API:iin — **ei uutta riippuvuutta.**

## 🟢 GREEN

- [x] `scripts/fetch-landmarks.mjs harmala`: yksi Overpass-kysely dokumentin **käännetyn**
      bbox:n yli (`harmala.registered.json`in oma `bbox`, siis jo `BRDC-SEED-001`:n
      korjaama), Worldseedin omalla tagijoukolla (`tourism`, `historic`, `artwork_type`,
      `amenity=place_of_worship`, `memorial`). Tulos `harmala.landmarks.osm.json`
      (osm id, koordinaatti, tagit) — **tallessa versionhallinnassa**, jäädytetty fixture
- [x] Ajettu oikeasti: **13 elementtiä** Härmälänrannan alueelta — patsas (`artwork_type=sculpture`),
      kirkko, kaksi leirintäaluetta, kaksi näköalapaikkaa, opastuspiste, eväsretkipaikka,
      lentokonemuistomerkki ("Viima VI-1"), kaksi raunioita, yksi nimeämätön historiallinen
      rakennus. Overpass vaatii tunnistettavan `User-Agent`-otsikon — ilman sitä 406 (mitattu)
- [x] `matchLandmark` (`packages/core/src/data/landmarkSeed.ts`): **nimi ensin** (normalisoitu,
      täsmällinen), **etäisyys toisena** (< 50 m). Nimi voittaa etäisyyden — kirkko täsmää
      nimellä vaikka käännetty kirjoitettu koordinaatti on ~500 m päässä oikeasta, koska
      dokumentin yksittäisen maamerkin transkriptiovirhe on oma, `BRDC-SEED-001`:stä
      riippumaton virhelähteensä
- [x] Kuudesta kirjoitetusta maamerkistä **täsmäsi kaksi**: patsas (etäisyydellä, ~4,5 m) ja
      kirkko (nimellä). **Neljä jäi täsmäämättä** eikä sitä piiloteta:
      Villa Härmälänranta, Härmälän veneenlaskupaikka, Härmälän Pumptrack,
      Rantaperkiön tekonurmikenttä — nämä pitävät oman (käännetyn) kirjoitetun
      koordinaattinsa ja saavat synteettisen `authored:<slug>`-id:n
- [x] `seedLandmarks`: loput 11 OSM-löytöä joita mikään kirjoitettu maamerkki ei vaatinut
      saavat geneerisen nimen/tarinan tagityypin mukaan (`GENERIC`-taulu: viewpoint,
      picnic_site, camp_site, attraction, aircraft, ruins, historic…), `authored: false`.
      6 kirjoitettua + 11 generoitua = **17 maamerkkiä** Härmälänrannalle
- [x] Yksikkötesti (`landmarkSeed.test.ts`, 12 testiä) lukee suoraan tallennettua
      `harmala.landmarks.osm.json`ia — ei verkkokutsua testiajossa
- [x] Tulos (`LandmarkSeed { name, osmId, lore, kind, at, authored }`) on täsmälleen
      `HexSeed.landmark`in muoto plus `at`/`authored` — valmis `BRDC-SEED-004`:n ja
      `BRDC-LANDMARK-001`:n syötteeksi

## Ei tässä

- Verkkokutsu ajossa — vain build-ajan skripti, tulos on tiedosto
- Maamerkin kortti tai kartalle piirto — `BRDC-LANDMARK-001`
- Fuzzy-nimitäsmäytys ("Rantaperkiön tekonurmikenttä" ↔ OSM:n "Rantaperkiön kenttä" olisi
  ilmeinen osuma ihmiselle, ~870 m etäisyydellä) — tarkka nimi tai 50 m, ei muuta. Neljä
  täsmäämätöntä yllä ovat kandidaatteja käsin varmistettavaksi ennen `BRDC-SEED-004`:ää
