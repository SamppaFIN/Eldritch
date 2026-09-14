# BRDC-DETAIL-001 — Detail-ruudut: tieto nätissä paketissa

| | |
|---|---|
| **Vaihe** | 3 — Sivilisaatio (2.6:n pinnan viimeistely) |
| **Effort** | M (päivä) |
| **Riippuvuudet** | BRDC-WIKI-003, BRDC-WIKI-004 (tehty), BRDC-MOBILE-001 (portti) |
| **Status** | `done` — solupaneeli, 2026-09-14 (v0.5.88) |
| **Valmius** | Solupaneeli 100 %. Rakennus, Wager-rivaali ja hahmo eivät kuulu tähän tikettiin (ks. Rajaus) |
| **Lähde** | Infinite 2026-09-06: *"eri detail ruudut vaativat hiomista, että tieto on nätissä paketissa ja parhaiten saatavissa."* |

## 🔴 RED

Detail-ruudut kasvoivat ominaisuus kerrallaan. Solupaneeliin tuli maan arvo, vahvuuspalkki,
rappioennuste, omistusdonitsi, rakennuslista, käyntilaskuri, maasto ja historiarivi — kukin
sovitettuna siihen kohtaan mihin se mahtui, ei sävellettynä. `cell-panel.css` on osunut
400 rivin rajaan kahdesti ja jaettu paineen alla (`spell-panel.css`, `CellWorth.tsx`), ei
suunnitellusti. Sama koskee rakennusten Guide-sivuja, Wager-rivaalin paneelia ja You-näkymää.

Tieto on **läsnä mutta ei järjestyksessä**: tärkein rivi (kenen tämä on, kuinka vahva, mitä
päällä) kilpailee samasta tilasta vähäisimmän kanssa (ennusteen desimaalit). Ruudusta
toiseen rakenne vaihtuu, joten käyttäjä opettelee jokaisen erikseen — kävellessä, yhdellä
peukalolla, kirkkaassa valossa.

Kaksi konkreettista löydöstä tästä RED:istä, kumpikin jo aiemmin nähty muualla tiketeissä:

- `CellWorth.tsx`in `<dl>` sanoi saman tuoton ja naapuribonuksen kahdesti peräkkäin —
  ensin taulukkona, sitten identtisenä proosana suoraan sen alla.
- `OwnershipNote` piirsi omistusdonitsin **jokaiselle** omalle solulle, myös yksin
  omistetulle ("Yours 100% · Theirs 0%") — täsmälleen sama teksti kuin
  `cell-panel__owner`in oma "Yours"-rivi jo sanoi. Merkitty tietoiseksi mutta mahdolliseksi
  kohinaksi jo `BRDC-HEX-004`:ssä, siirrettynä nimenomaan tähän tikettiin.

## 🟢 GREEN

Toteutettu Infiniten päätöksellä (AskUserQuestion 2026-09-14): edetään suoraan Sigil-
designdokumentin ohjeiden mukaan, samalla vapaudella kuin päivän muu Sigil-työ — ei erillistä
läpikäyntiä ennen toteutusta.

- [x] **Sama tietohierarkia**: maan nimi ja lähde ensin, sitten kuka omistaa / oletko
      paikalla omina merkkeinään, sitten resurssibanneri, sitten yksityiskohta
      (`CellWorth`, historia, mekaniikat)
- [x] **Resurssit merkkeineen ja väreineen** — tuoton kuvausrivi ja `CellWorth`in "Yields"
      saavat saman värin kuin kartan oma maastoglyfi (`Sigil §01`:n väälaki, ei uusia värejä)
- [x] **Mitään ei tarvitse arvata** — omistus- ja "täällä"-merkit ovat tekstiä, väri on
      toinen kanava eikä ainoa (AI-Koulu ch.4: väri ei koskaan kanna tietoa yksin)
- [x] **Ei kaksinkertaista lukua**: `CellWorth`in proosakappale poistettu (sama teksti kuin
      `<dl>`); `OwnershipNote` näkyy enää vain aidosti jaetulla solulla (`cell.shared`)
- [x] **Ei uutta CSS-tiedostoa hätäjaolla** — `CellPanel.tsx` osui 404 riviin tämän työn
      seurauksena; jako oli suunniteltu (`CellHeader.tsx`, identtinen kuvio kuin `CellWorth`in
      oma aiempi erottaminen), ei hätäratkaisu
- [x] **Ei uutta tekstiä** — `costLine` ja `CellWorth` käyttävät nyt samaa `RESOURCE_WORD`-
      taulua kuin Guide (`catalogue.tsx`) sen sijaan että jokainen paneeli piti omaa
      identtistä kopiotaan sanasta
- [x] 360 px, yksi peukalo, footerin yläpuolella — rakenne ei muuttunut, vain järjestys
- [x] Portti: `lint:lines`, `tsc -b`, 1363 vitest, `pnpm build` — kaikki vihreää

## Toteutus

**Ei uutta dataa, ei uusia paneeleja — järjestys ja typografia.** Sama sisältö,
luettavampi paketti.

- `CellHeader.tsx` (uusi): maan nimi+lähde, omistus/täällä-merkit, resurssibanneri —
  eriytetty `CellPanel.tsx`:stä, joka putosi 404 riviin täsmälleen tämän työn myötä
- `cell-panel.css`: `.cell-panel__tags`/`__tag`/`__tag--mine`/`__tag--rival`/`__tag--here`/
  `__visits` — pieninä pilleinä, ei plain-tekstirivinä. `--cosmic-purple` ja `--danger`
  taustasävynä (`color-mix`), koskaan tekstinä sellaisenaan — `tokens.css`in oma huomautus:
  cosmic-purple on kontrastiltaan pintaväri, ei koskaan teksti
- `CellWorth.tsx`: proosakappale pois; "Yields"-rivi värjätty `RESOURCE_COLOUR`illa
- `OwnershipNote.tsx`: uusi `isSharedGround(cell)` — `CellPanel` kutsuu tätä ehtona
  komponentin renderöinnille sen vanhan `cell.ownerId !== null`-ehdon sijaan
- `OwnershipNote.test.ts`: kaksi uutta testiä lukitsevat `isSharedGround`in — todennettu
  myös rikkomalla ehto väliaikaisesti tarkoituksella ja katsomalla testin punaistuvan,
  ennen palautusta

## Rajaus (mitä tämä tiketti kattaa)

RED:in oma esimerkkilista mainitsi solun lisäksi rakennuksen, Wager-rivaalin ja hahmon.
Tämä tiketti rajattiin **solupaneeliin** — se, jonka Infinite nimesi ("aloitetaan
solupaneelista"), ja eniten kentällä nähty. Sama hierarkia muille kolmelle ruudulle on
omissa, vielä kirjoittamattomissa tiketeissään (`BRDC-KEEP-008` rakennukselle,
`BRDC-CHAR-002` hahmolle) — ei osittainen valmius tässä tiketissä, vaan tietoinen rajaus,
koska rakenteen toistuminen ruudusta toiseen vaatii että jokainen ruutu ensin saa oman
läpikäyntinsä eikä yhden mallin väkisin sovittamista kolmeen erilaiseen sisältöön.

## Ei tässä

- Uudet tiedot detail-ruutuihin. Jos jokin puuttuu, se on oma tikettinsä
- Karttafiltterit ja -tasot (`BRDC-ART-003` jatkoineen)
- Wager-rivaalin näkyvyysmoodit — ne ovat jo `BRDC-WAGER-JSON-007`
- Rakennuksen, Wager-rivaalin ja hahmon oma rakenneuudistus — ks. Rajaus yllä
