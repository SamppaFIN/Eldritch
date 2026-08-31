# BRDC-BUILD-001 — Rakennusjärjestelmän ydin ja perusrakennukset

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | L (2–3 päivää) |
| **Riippuvuudet** | BRDC-ECON-001, BRDC-TERRAIN-002, BRDC-TECH-001 |
| **Status** | `in_progress` — puhdas ydin (`rules/build.ts`) tehty; repo (`build`/`demolish`) ja UI jäljellä |
| **Valmius** | 55 % |
| **Lähde** | Infiniten kehityssuunnitelma 2026-08-31 · §1.1, §6 (R1), §8.2 |

## 🔴 RED

Resursseilla voi tehdä **yhden asian**: vahvistaa solua 25 puulla (`BRDC-WARD-001`).
`BRDC-INSPECT-001` päättyy riviin *"Rakennukset. Paneeli kertoo mitä maa antaa; mitä
sillä rakennetaan on oma tikettinsä."*

Tämä on se tiketti.

## 🟢 GREEN

- [x] **`BUILDINGS`-taulukko** (`rules/build.ts`): `cost`, `terrain`, `tech`, `requires`,
      `produces`, `storageCapBonus`, `buildingCapacity`. Neljä riviä nyt; `BUILD-002` lisää
      seitsemän ilman koodia
- [x] `canBuild(ctx, id, cell)` **puhdas**, vastaa *miksi ei* nimettynä arvona:
      `not-yours → occupied → wrong-terrain → locked → at-capacity → cannot-afford`,
      tarkistettu siinä järjestyksessä (fundamentaalisin ensin)
- [~] `build()` veloittaa + kirjoittaa soluun — puhdas puoli (`buildCost`, `canBuild`) tehty;
      veloitus + solun kirjoitus on **repo-committi 2** (`data/buildStore.ts`), `wardWith`:n mallilla
- [x] Solu kantaa rakennuksensa (`Cell.building?`, additiivinen); yksi solu, yksi rakennus
      (`canBuild` → `occupied`)
- [x] **Neljä perusrakennusta**: Aitta (granary), Monumentti (monument), Varasto (storehouse), Tori (market)
- [x] **Varasto nostaa kattoa** — `storageCap(buildings)`, `settleResources` sai valinnaisen
      `cap`-parametrin; olemassa olevat kutsujat ennallaan
- [~] Purku **palauttaa puolet** — `refund(id)` (lattioitu per resurssi) tehty; repo-`demolish`
      on committi 2
- [x] Jokainen sääntöfunktio testattu (`build.test.ts` 15 + `terrain.test.ts` +2); ei
      satunnaisuutta, `canBuild` ei ota `now`:ta (`ward.ts`:n tapaan)

## Toteutettu 2026-08-31 — committi 1/3 (puhdas ydin)

- **Asumiskapasiteetti: vaihtoehto 2.** `buildingCapacity(buildings)` = `BASE_BUILDING_CAP +
  aitat × GRANARY_CAPACITY`; **globaali** katto, per-lääni-tarkkuus → `BUILD-003`.
- `Cell.building?: { id, builtAt }`. `BuildingId` `types/domain.ts`:ssä (`Cell` kantaa sitä),
  `build.ts` re-exporttaa — sama kuvio kuin `TerrainKind`/`OwnershipChange`.
- **Rakennustuotanto ei mene `trickle`:en** (se aiheuttaisi syklin `terrain.ts` ↔ `build.ts`).
  Sen sijaan `settleResources(state, owned, now, cap?, bonusPerHour?)` — `pouch.ts` (committi 2)
  laskee `buildingBonus(owned, now)`:n (lepotilasuodatettu) ja syöttää sen. `terrain.ts` ei
  tunne rakennuksia.
- `DORMANT_AFTER_MS` exportattu `terrain.ts`:stä (jaettu käsite nyt).
- **Committi 2:** `data/buildStore.ts` (`buildOn`/`demolishOn`), `GameRepository.build`/
  `demolish`, `settlePouch` syöttää katon+bonuksen. **Committi 3:** `CellPanel` rakenna-osio
  (kytkee myös `TECH-001` GREEN 8 — lukittu rakennus nimeää teknologiansa), `[~]` selaimessa.

## Toteutus

Suunnitelman §8.2 esittää `class BuildingSystem`in. Golden rule 3 sanoo, että
`packages/core` on puhtaita funktioita ilman Reactia, DOMia ja verkkoa. **Semantiikka
otetaan, luokka ei**: `BUILDINGS` on vakiotaulukko ja säännöt ovat funktioita sen yli.
Sama sisältö, testattavissa ilman instansointia ja siirrettävissä SQL:ksi Vaiheessa 3.

`ward()` on jo tämän muotoinen — kieltäytymiset ovat arvoja, eivät poikkeuksia:

> *"Refusals are values, not exceptions: 'not yours', 'already full' and 'cannot afford'
> are all things the interface has to be able to say out loud to the player."*

Rakentaminen noudattaa samaa mallia. Se on myös syy, miksi `WARD_COST` ei katoa:
**vahvistaminen on rakentamisen erikoistapaus**, ei kilpailija sille.

## 🔴 Ratkaistava: asumiskapasiteetti

Suunnitelman Aitta antaa *"+1 ruokaa, +2 asumiskapasiteettia"*. Pelissä ei ole väestöä
eikä mitään, mitä kapasiteetti rajoittaisi. Kolme vaihtoehtoa:

1. **Pudota kapasiteetti.** Aitta antaa ruokaa. Yksinkertaisin, eikä mitään menetetä
2. **Kapasiteetti rajoittaa rakennusten määrää** läänissä — kevyt, ja antaa Aitalle roolin
3. **Oikea väestö**, joka kasvaa ruoasta ja kuluttaa sitä. Oma järjestelmänsä, iso

Suositus: **2**. Se maksaa yhden luvun ja tekee suunnitelman omasta rivistä toden ilman,
että peliin syntyy simulaatiota, jota kukaan ei pyytänyt.

## Ei tässä

- Aluekohtaiset parannukset ja ketjut → `BRDC-BUILD-002`
- Vaikutusalueen rakennukset ja uskollisuus → `BRDC-BUILD-003`
- Teknologiapuu, joka avaa nämä → `BRDC-TECH-001`. Ilman sitä kaikki on auki alusta,
  mikä on kelvollinen välitila mutta ei lopullinen
- 3D-näkymä rakennuksista. Suunnittelumuistiinpanojen Three.js-huomio pätee yhä:
  ei ennen kuin peli on hyvä 2D:nä
