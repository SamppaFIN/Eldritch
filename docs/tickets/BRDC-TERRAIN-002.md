# BRDC-TERRAIN-002 — Maastokirjo: neljästä yhdeksään, ja oikea data tiilistä

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-TERRAIN-001, BRDC-ECON-001 |
| **Status** | `in_progress` — 7 tyyppiä + taulukko + tiilimäppäri tehty; MapLibre-kysely selaimessa todentamatta |
| **Valmius** | 75 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §1.2, §5 |

## 🔴 RED

`TerrainKind` on `water | forest | market | plain`. Kehityssuunnitelma sijoittaa
rakennuksia **vuorille, mäille, rannikolle, tasangolle ja järville**, ja ihmeitä
lisäksi **valtamerelle, tundralle ja aavikolle**. Kaivosta ei voi rakentaa vuorelle,
jota ei ole olemassa.

Ja `BRDC-TERRAIN-001` sanoi itsestään suoraan, ettei se ole oikeaa maastoa:

> *"The data source here is a placeholder and that is said out loud."*

Nyt maasto ratkaisee, mitä pelaaja voi rakentaa siihen paikkaan jossa hän oikeasti asuu.
Hash-arvonta kelpasi silloin, kun se päätti onko solu +10 puuta vai ei. Se ei kelpaa
enää, kun se päättää onko kotikadullasi vuori.

## 🟢 GREEN

- [x] `TerrainKind` kattaa fyysiset maastot: `plain, forest, hill, mountain, lake, coast,
      market` (7). Ihmeiden `valtameri/tundra/aavikko` **eivät ole omia tyyppejään** —
      `BRDC-WONDER-001` mäppää ne vastineisiin (iso järvi = valtameri jne.), Infiniten
      linjaus tässä tiketissä ("juu 1")
- [x] Jokaisella maastolla **resurssi ja rakennuspaikat yhdessä taulukossa** —
      `TERRAIN_TABLE` korvaa `RESOURCE_OF`:n; `BuildSite`-slugit odottavat `BRDC-BUILD-001`:tä
- [~] **Oikea maasto vektoritiilistä** — `terrainFromTiles(features)` (puhdas, testattu
      synteettisillä OSM-piirteillä) + `useTerrainResolver` joka kutsuu
      `map.queryRenderedFeatures`:ia solun keskipisteessä. Kysely itse vaatii elävän
      GL-kartan → **selaimessa todentamatta**
- [x] Solukohtainen ratkaisu **tehdään kerran ja tallennetaan** — `Cell.terrain?`,
      `setStoredTerrain` (no-op jos jo tallennettu), `useTerrainResolver` yrittää kerran
      per solu. Hash on itsessään deterministinen → "kerran ratkaistu" tyhjälle maalle
- [x] Hash **varajärjestelmänä** — `terrainForCell(cell) = cell.terrain ?? terrainOf(cell.h3)`
- [x] Ratkaistun ja arvatun ero **datassa** — `Terrain.source: 'tiles' | 'hash'`;
      `CellPanel` näyttää "(from the map)" / "(estimated)"
- [x] Klusterointi säilyy — kaksi arvontaa ennallaan, kynnysporras jaettu 7 tyypille;
      `terrain.test.ts` mittaa naapurien yksimielisyyden `> 0.55` ja reunan rispauksen

## Toteutettu 2026-08-31

**Puhdas perusta** (`packages/core`): `terrainOf(h3)` palauttaa nyt `Terrain = { kind,
source }` (TERRAIN-001:n ennakoima rajapintamuutos). `Terrain`/`TerrainKind`/`TerrainSource`
siirtyivät `types/domain.ts`:ään (`Cell` kantaa niitä), `terrain.ts` re-exporttaa.
`RESOURCE_OF` → `TERRAIN_TABLE`. `Cell.terrain?` additiivinen, **ei skeemanostoa** (sama
kuvio kuin `Cell.imported`). `trickle`/`settleResources` käyttävät `resourceForCell`:iä;
`addClaimYield` jää hashiin (sillä on vain h3). `terrainFromTiles` mäppää OSM-vektoritiilet
(vesi ennen maapeitettä, vuori/mäki tageista ei korkeudesta).

**Wiring** (`apps/game`): `useTerrainResolver` (`features/map`) — `MapCanvas` kutsuu,
`onCellTerrain`-propilla `MapView` → `repository.setCellTerrain` → `cellStore.setStoredTerrain`.
`GameRepository.setCellTerrain` lisätty. `geo/cells.ts` sai `cellCentre(h3)`.

**Testit:** `terrain.test.ts` kirjoitettu 7 tyypille + `terrainFromTiles`-lohko (33
testiä), `cellStore.test.ts` +3 (`setStoredTerrain`). **488 vihreää.**

**Jäljellä:** `queryRenderedFeatures`:n oikea ajo selaimessa (tiiliskeeman varmistus,
debounce-tuntuma), ja `MockRepository.ts` (396/400) + `MapView.tsx` (398/400) ovat
molemmat rajalla — **seuraava muutos kumpaankin vaatii jaon ensin.**

## Toteutus

Tämä on **`BRDC-TERRAIN-001`:n oma lupaus lunastettuna** — `PIVOT-2026-08-27.md` §3.1
kirjoitti sen jo auki: rajapinta `terrainOf(h3) → Terrain` pysyy, toteutus vaihtuu.
Vektoritiilet ovat oikeaa OSM-dataa ilman uutta rajapintaa, ilman avainta ja ilman
verkkopyyntöä — ne ovat jo ladattu, koska kartta piirretään niistä.

`queryRenderedFeatures` vastaa vain siitä, mikä on ruudulla juuri nyt. Siksi maasto
ratkaistaan **sitä mukaa kun pelaaja liikkuu** ja tallennetaan; ratkaisematon solu on
laillinen tila, ei virhe.

## 🔴 Ratkaistava: maastoa, jota ei ole missään lähellä

`BRDC-WARD-001` oppi tämän jo kerran, ja sen dokumentaatio kertoo miten:

> *"a test walked a real neighbourhood and found no lake within 750 m of it — and that
> is most neighbourhoods. A cost that demands terrain the player has no way to acquire
> is not a difficulty curve, it is a locked door."*

Suunnitelma toistaa saman virheen isompana. **Tampereella ei ole valtamerta, tundraa
eikä aavikkoa.** Ne ovat kolmen ihmeen ainoa sijainti (`R'lyeh`, `Hyperborea`,
`The Nameless City`) — eli kolme viidestä legendaarisesta ihmeestä olisi
saavuttamattomissa sille pelaajalle, jolle peli rakennetaan.

Kaksi kelvollista ratkaisua:

1. **Vastineet.** Iso järvi ajaa valtameren virkaa, suo tundran, sorakuoppa aavikon.
   Lovecraftilaisesti perusteltavissa: Fuming Lake on jo Tampereella
2. **Ihmeet eivät sido maastoa** vaan harvinaisuutta — maasto sävyttää nimen, ei estä

Suositus: **1**, ja kirjataan `BRDC-WONDER-001`:een.

- juu 1

## Ei tässä

- Overpass tai Google Places. Molemmat vaativat backendin tai avaimen; vektoritiilet
  eivät. Vasta jos tiilet eivät riitä (`PIVOT-2026-08-27.md` §3.1, kolmas rivi)
- Korkeusdata. "Vuori" ja "mäki" ratkaistaan OSM:n `natural`- ja `landuse`-tageista,
  ei korkeusmallista, jota ei ole tiilissä
