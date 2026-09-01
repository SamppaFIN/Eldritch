# BRDC-TERRAIN-003 — Käsin kartoitettu maasto testialueelle (Härmälä)

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus ja jaettu maailma |
| **Effort** | S (puoli päivää) + kartoitus |
| **Riippuvuudet** | BRDC-TERRAIN-002 |
| **Status** | `wip` — patsas lukittu, alueet siitä ±100–150 m 2026-09-01 |
| **Valmius** | 75 % |
| **Lähde** | Infinite 2026-09-01: *"mallinnan tän härmälän alueen sopimaan niin että karttaruudut vastaavat oikeaa maailmaa"* |

## 🔴 RED

`terrain.ts`:n hash on *muoto jonka oikea maasto täyttää*, ei oikea maasto. Vaiheen 2.6
ulkotesti on oikea kävely Härmälässä, ja Pyhäjärven rannan ohi kävelyn pitäisi maksaa
`food`, ei nopanheittoa. Tiiligridi ei kata aluetta tarpeeksi.

## 🟢 GREEN

- [x] `rules/terrainSeed.ts` (puhdas): `seededTerrainOf(h3): Terrain | null` — `null`
      laatikon ulkopuolella, muuten alueiden mukaan (ympyrä/laatikko, järjestys ratkaisee)
- [x] `source: 'seed'` lisätty `TerrainSource`iin; `CellPanel` näyttää "(surveyed)"
- [x] `terrainOf` ja `terrainForCell` kysyvät kartoituksen ensin — voittaa hashin JA
      tallennetun tiilimaastonkin laatikon sisällä (se on käsin tarkistettu)
- [x] `SEED_BOX` ja `seededTerrainOf` exportattu `@es3/core`sta
- [x] Alueet aseteltu Infiniten merkitystä karttakuvasta (2026-09-01): vesi pohjoiseen
      ja koilliseen, asuinruudukko etelään, "vuori"-kortteli, kauppa + baari patsaan
      vieressä, saaren ulkoilupuisto metsänä
- [x] `HARMALA_STATUE` (61.472913, 23.725988) — Infiniten pitkä painallus patsaan
      kohdalla. Seikkailun aloituspiste (`BRDC-QUEST-001` lukee tämän)
- [x] Alueet aseteltu patsaasta: se osoittautui olevan käytännössä testikorpuksen
      kanoninen ORIGIN. Kartoitus on siksi **oletuksena pois** (`enableTerrainSurvey`);
      sovellus kytkee sen päälle `createRepository`ssa, ydintestit jättävät pois
      (muuten jokainen talous- ja ennustetesti riippuisi Tampereen järvistä)
- [ ] **Alueet tarkistettu kävelyllä** — patsas on lukossa, ympyrät siitä ±100–150 m
- [ ] Vanhan pelin questilokaatiot (satama, veneenlaskupaikka, ulkoilupuisto, SE-ranta)
      merkitty `BRDC-QUEST-001`:een pistelistana

## Toteutus

Alueet testataan järjestyksessä, ensimmäinen osuma voittaa: rantaympyrät ennen
järveä, jotta rantasolu lukee `coast` eikä `lake`. Laatikon sisällä ilman osumaa =
`plain` (`source: 'seed'`). Ympyrä = keskipiste + säde metreinä (`haversine`), ei
polygonimatematiikkaa — helppo säätää kuvaa vasten.

**Ensiluonnoksen alueet (Härmälä, arvattu):** Pyhäjärvi (2 ympyrää), Härmälänrannan
ja Rantaperkiön rannat, Härmälän keskusta + Pirkkahalli (market), Härmälän puisto +
Rautaharkko + Nuoliala (forest). Loput plain.

## Testit

- [x] Laatikon ulkopuoli → `null` (Helsinki, Tampereen keskusta)
- [x] Pyhäjärvi → `lake`; keskusta → `market`; rantasolu → `coast` (ei `lake`) —
      järjestys todennettu; laatikossa ilman aluetta → `plain`
- [x] `terrainOf`/`resourceOf`/`terrainForCell` lukevat kartoituksen; kartoitus voittaa
      tallennetun tiilimaaston; laatikon ulkopuolella tiilimaasto säilyy
- [x] 697 testiä, `tsc -b`, `lint:lines` — puhtaat
- [~] Kanoninen testi-ORIGIN on laatikon pohjoisreunalla; suite meni läpi, mutta
      `claimFeedback.test.ts`:n oma `sample()` siirrettiin kauas laatikosta jotta kaikki
      resurssit löytyvät hashista

## Auki huomiselle

Google Maps -kuva Härmälästä + kävelyreitin lat/lng-rajat. Sitten `SEED_BOX` ja
`REGIONS` säädetään vastaamaan, ja kävellään reitti läpi tarkistaen että jokainen
ruutu antaa oikean resurssin.

## Lähde

Kenttätesti 2026-09-01 (Infinite) · `terrain.ts` §hash
