# BRDC-TAVERN-001 — Taverna ja tehtävätaulu

| | |
|---|---|
| **Alue** | `rules/build.ts`, `types/domain.ts` (`BuildingId`), `data/buildStore.ts`, `quest/questBoard.ts`, `quest/useFumingLake.ts`, `CellPanel.tsx` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Status** | `[~]` osittain valmis 2026-09-16 — rakennettavissa, tehtävätaulu toimii; Ale Cellar -synergia auki |
| **Riippuvuudet** | `BRDC-TERRAIN-005` (settlement/trade), `BRDC-QUEST-006`, `BRDC-RES-001` (Ale Cellar) |
| **Lähde** | `worldseed.ts` (`STRUCTURES.tavern`), Worldseed §05 |

## 🔴 RED

Seikkailu alkaa nyt seisomalla sen ensimmäisellä paikalla. **Mikään paikka pelissä ei kerro
että tehtäviä on olemassa.**

Worldseed: **Tavern** on pelaajan rakentama, settlementille tai tradelle, +2 gold +1 culture.
*"The quest board. Every active chain in the province is listed here and nowhere else — so the
Tavern is not decoration, it is how the player finds out there is anything to do."*
Yksi per provinssi. Viereinen Ale Cellar tuplaa sen kullan.

Dokumentti sanoo myös: *"Also the respawn point for the Wager and the only place a rival can
leave a message."* — **Infinite on päättänyt poistaa Wagerin** (`BRDC-WAGER-008`).

## 🟢 GREEN

- [x] `BuildingId 'tavern'`: maasto `['settlement','market']` (Worldseedin "trade" =
      pelin "market", `worldseedTerrain.ts`in oma muunnos), tuotto +2 gold +1 culture.
      Tech `null` — sama kuin Marketilla, dokumentti ei anna kumpaakaan. **Hinta on tämän
      tiketin oma päätös** (dokumentti ei anna): `{wood:40, gold:30}`, askel Marketin
      `{wood:30, gold:20}`in yläpuolella koska se maksaa toisenkin resurssin
- [x] **Yksi per provinssi, todella tarkistettu:** uusi `Building.uniquePerProvince` +
      `BuildContext.tavernInProvince`, sama malli kuin Forgen `needsIronAdjacent`.
      `tavernInProvince(h3, owned)` (`data/buildStore.ts`, puhdas, oma testinsä) käyttää
      `regionOf`ia — samaa res-6-ryhmittelyä jota `BRDC-NATION-001` jo kutsuu provinssiksi,
      ei uutta käsitettä. Kieltäytyminen `'one-per-province'` sanoo miksi
- [x] **Tehtävätaulu, oikeasti toimiva:** uusi `questBoardEntries` (`quest/questBoard.ts`,
      puhdas, oma testinsä) listaa jokaisen käynnissä olevan tarinan ja sen seuraavan
      askeleen heksan nimen. Näkyy `CellPanel`issa **vain Tavernan omalla heksalla**
      (`useFumingLake`in uusi `board`-kenttä, portattu `hasWork(cell,'tavern')`illa).
      Peli tuntee tänään yhden tarinan (Fuming Lake) — funktio on kirjoitettu yleiseksi
      koko `adventures.json`-listan yli, joten toinen tarina ilmestyisi taululle itsestään
- [x] Kuva (`buildingSprites.ts`): harjakattoinen talo + valaistu ikkuna + pieni koriste —
      oma siluetti, ei sekoitu Marketin katokseen tai Granaryn siiloon. Rooli `produce`
      (`buildingGlyphs.ts`, kultaa enemmän kuin kulttuuria), nimi ja kuvaus mukana
- [x] Testit: `build.test.ts` (kova este toiselle Tavernalle samassa provinssissa),
      `buildStore.test.ts` (3 uutta, oikeilla H3-heksoilla — Härmälänranta on kokonaan
      yhtä provinssia, Helsinki toista, mitattu `cellToParent`illa eikä oletettu),
      `questBoard.test.ts` (4 uutta). Portti: 1556 testiä, `tsc -b`, `lint:lines`,
      tuotantobuild — kaikki vihreät

## Ei tehty — Ale Cellar -synergia

**"Viereinen Ale Cellar tuplaa kullan" ei ole kytketty.** Tämä vaatisi ensimmäistä kertaa
rakennusten tuoton (`buildingBonus`, `build.ts`) ja bonusresurssien paljastustilan
(`bounty.ts`/`reveal.ts`) yhdistämistä — kaksi järjestelmää jotka eivät tänään tiedä
toisistaan mitään. `settleResources`in tuntiputki lukee rakennukset ja maaston erikseen;
"onko naapurissa paljastettu Ale Cellar juuri nyt" vaatisi uuden parametrin koko putkeen,
ei vain rakennushetken tarkistuksen kuten `ironAdjacentTo`. Oma, rajattu jatkotyönsä.

## Päätös Infiniteltä — auki, ei arvattu

- **"Listed here and nowhere else"** vs. Fuming Lake, joka alkaa patsaalta: tämä toteutus
  **lisää** taulun ottamatta patsaan aloitusta pois — kumpaakaan reittiä ei suljettu. Onko
  taulun tarkoitus lopulta korvata paikan päällä aloittaminen, on Infiniten päätös
- Tavernan hinta — oma päätös yllä, ei Infiniten vahvistama

## Ei tässä

- Pelaajien väliset viestit
