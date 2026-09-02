# BRDC-WAGER-JSON-004 — Vastaanotettu kartta päivittää omistajuudet, ja näkyy tiedoissa

| | |
|---|---|
| **Vaihe** | 2.6 — Mobiilikokemus |
| **Effort** | S (puoli päivää) |
| **Riippuvuudet** | BRDC-WAGER-JSON-001, BRDC-WAGER-JSON-002, BRDC-INSPECT-001 |
| **Status** | `done` (v0.5.23), kenttätodennus `[~]` |
| **Valmius** | 90 % |
| **Lähde** | Infinite, kenttätesti 2026-09-02 |

## 🔴 RED

Kentällä: *"Tee silleen, että kun pelaaja ottaa kartan vastaan, niin joka ruutu päivittyy
omistajuuksilla ja toisen lääneillä. Laita details dialogi näyttään kans tiedot."* ja
*"päivitä json että kun import exporttaa, niin ruudut jaetaan uusilla tiedoilla. tarvitaan
siis soluille lisää metadataa jsoniin myös."*

Wager tuo vastustajan maan mukanaan, mutta kartta ei kerro sitä kunnolla: vastaanotettu
alue jää puolittain näkymättömäksi, eikä solun tiedoista näe **kenen** se on tai **milloin
tieto on saatu**. Ja nykyinen `exportChallenge`-JSON kantaa solusta vain h3:n, omistajan
ja vahvuuden — ei maastoa, ei rakennuksia, ei lääniä, ei valtion nimeä eikä lippua.
Vastaanotettu kartta näyttää siis harmailta laatikoilta, ei toisen pelaajan
sivilisaatiolta.

Tämä on ainoa moninpeliin liittyvä kohta jonka Infinite piti mukana nyt — kaikki muu
backend ja moninpeli odottaa: *"Kaikki backend ja multiplayer asiat tehdään sit, kun
saadaan lokaali versio toimiin."* Tämä toimii ilman palvelinta, joten se kuuluu tähän.

## Laajennettu solun metadata JSONissa

`challenge.ts`:n solu­sarjallistus (ja sama `world.ts`:ssä) kasvaa. Uudet kentät ovat
**kaikki valinnaisia** — vanha viesti ilman niitä luetaan yhä (`CHALLENGE_VERSION` nousee
vain jos vanha ei ole luettavissa). Taulukkomuoto pysyy tiiviinä (SHARE-001: 39 tavua/solu).

| Kenttä | Mistä | Miksi jaetaan |
|---|---|---|
| `terrain` | `Cell.terrain` / hash | vastaanotettu kartta näyttää metsän metsänä, ei laatikkona |
| `building` | `Cell.building` | rakennusmerkki piirtyy rajalle — intel (`BRDC-ART-002`) |
| `region` (lääni) | `regionOf(h3)` | "toisen läänit" — Infiniten sanoin |
| `nation` | `es3:nation.name` (`BRDC-NATION-001`) | kenen sivilisaatio tämä on |
| `banner` | `es3:nation.bannerId` (`BRDC-BANNER-001`) | lippu detail-dialogissa |
| `seenAt` | vientihetki | "as they saw it, 3 days ago" — ei esitä nykyhetkeä |
| `castle` | `getCastle()` | julkinen sijainti, **ei koskaan Hearth** (`BRDC-CASTLE-001`) |

Ei mukana: XP, pouch, tekniikkapuu, dwell — ne ovat pelaajan omaa tilaa, eivät kartan.

## 🟢 GREEN

- [x] **Vienti kirjoittaa laajennetun metadatan.** `WireCell` (`challenge.ts`): `h3`,
      `strength`, `t?: TerrainKind`, `b?: BuildingId`. `toWireCell(cell)` on jaettu
      serialisoija — `buildChallenge` ja `world.ts`n `buildSubmission` / `buildShards`
      (`trimWire`) käyttävät sitä. Ylätaso: `Challenge.nation?` / `banner?`,
      `WorldPlayer` / `WorldSubmission` samoin. Kaikki valinnaisia.
- [x] **Tuonti lukee sen takaisin.** `challengeToCells` / `worldToCells` täyttävät
      `imported: true`, `terrain: { kind, source: 'hash' }`, `building`, ja uuden
      `Cell.importedFrom?: { name, banner?, seenAt }` (`name` = `nation ?? name`,
      `seenAt` = `sentAt` / `generatedAt`). Puuttuva kenttä → undefined, ei kaatumista.
- [x] **Vastaanotto merkitsee jokaisen solun `imported`iksi.** `challengeToCells` asetti
      ennen vain omistajan ja vahvuuden — nyt myös `imported` (kuten `worldToCells` jo).
      Sumu ei koske näihin (ne piirtyvät `imported`ina).
- [x] Vastaanotettu maa erottuu: `Cell.imported` + `Cell.importedFrom`. `imported` oli jo
      olemassa; wager-polku vain alkoi käyttää sitä.
- [x] **Detail-dialogi kertoo lähteen.** `ImportedNote.tsx` (`CellPanel`in `!mine`-haaran
      alku): `<Banner>` + valtion nimi + *"as they saw it, {relativeTime(seenAt)}"*.
- [x] Yhteenveto vastaanotettaessa: `WagerDialog`n accepted-note kertoo nyt valtion nimen
      ja *"across M provinces"* (`new Set(cells.map(regionOf)).size`).
- [x] Vastaanotettu maa **ei rappeudu** — `projectCell` palauttaa `imported`-solun
      muuttumattomana. Todennettu `challenge.test.ts`:llä (kuukausi ilman käyntiä ⇒
      identtinen).
- [x] Checksum kattaa uudet kentät ilman koodimuutosta — `checksum` = `JSON.stringify`.
      `challenge.test.ts`: muokattu `"forest"` → `"market"` ⇒ `damaged`.
- [x] Testit (+9): round-trip säilyttää `t` / `b` / `nation` / `banner` (challenge & world)
      · vanha metadataton viesti luetaan yhä · `importedFrom` nimi + aika · nimipaluu
      pelaajaan kun ei nationia · `imported`-lippu + ei-rappeudu. 913 yht.

## Ei tässä

- Palvelin, tilit, realtime. Vaihe 5.
- **`region` (lääni) johdetaan tuonnissa `regionOf(h3)`:lla, ei lähetetä** — puhdas ja
  paikallinen, turhat tavut pois. Poikkeama tiketin metadatataulukosta, tietoinen.
  Yhteenvedon "M provinces" lasketaan tästä.
- **`world.json`-cron-skripti (`scripts/build-world.mjs`) ei muuttunut.** `world.ts`n
  puhtaat funktiot kantavat kentät nyt; `es3:nation`in syöttäminen submissioniin on
  `BRDC-SHARE-001`n kirjoituspolku. `WorldSource.cells` on nyt `WireCell[]` — live-
  klientti muuntaa `toWireCell`illa kun SHARE-001 kytkee sen.
- **Keep/Hearth-julkaisu ei muuttunut** — `Challenge.home` matkaa jo; §10-kiista erikseen.
- Väestön / XP:n / tekniikan jakaminen — pelaajan omaa tilaa, ei karttaa.
