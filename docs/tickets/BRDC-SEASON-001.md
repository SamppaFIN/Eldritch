# BRDC-SEASON-001 — A week's competition, tracked day by day

| | |
|---|---|
| **Alue** | `apps/worker/src/season.ts`, `packages/core/src/data/seasonStats.ts`, `apps/game/src/features/season/` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Riippuvuudet** | `BRDC-HALL-003` (Chronicles — sama arkistokonsepti, `done`),
  `BRDC-ATLAS-001`in `history.ts` (sama snapshot-kaava, tiheämpi tahti) |
| **Status** | `done` — 2026-09-23 (v0.6.60) |

## 🔴 RED

Infinite 2026-09-23: *"siis viikon kilpailu, päivittäinen seuranta.. vanhoista
muodostetaan legacy 'historia' data... lähinnä meille 6 pelaajalle fresh haaste, ja
siihen hyvät tervetuliaistoivotukset."* Tarkennus samana päivänä, kun kysyttiin miten
kausi oikeasti alkaa: *"voit joo valita liity viikkoturnaukseen ja sen jälkeen saat
sen hetken tilanteen listoille.. päivittyy kerran päivässä."*

Tämä tarkennus ratkaisi tiketin alkuperäisen suurimman avoimen kysymyksen (milloin
"kausi" alkaa) täysin toisin kuin ensimmäinen luonnos oletti: ei yhtä globaalia
kalenteripäivää kaikille kuudelle, vaan **jokainen pelaaja liittyy erikseen, omana
hetkenään** — "Join the Weekly Tournament" julkaisee juuri sillä hetkellä vallitsevan
matkan ja heksamäärän tämän pelaajan omaksi lähtöviivaksi, ja tästä eteenpäin nähdään
mitä hän on *sen jälkeen* kerännyt.

## 🟢 GREEN

- [x] `packages/core/src/data/seasonStats.ts`: `seasonStandingsOf(sources)` — lukee
      `routeDistanceM`in (reittimoodi) tai `leyM`in (seikkailumoodi) + `cells.length`in
      jokaiselta live-lähteeltä. `seasonDayKey(now)` — sama kaava kuin `atlasWeekKey`,
      päivän tarkkuudella. Uusi `SeasonJoin`-tyyppi (`SeasonStanding` + `joinedAt`)
- [x] `apps/worker/src/season.ts`: `maybeSnapshotSeason` (yksi snapshot/päivä,
      `rebuild()`in yhteydessä, 60 päivän säilytys, `GET /season/history[/day]`) +
      **uusi `publishSeasonJoin`/`listSeasonJoins`** (`season:join:<playerId>`, yksi
      rivi per pelaaja, ylikirjoittuu jos liittyy uudelleen — tarkoituksellista,
      uudelleenliittyminen nollaa oman lähtöviivan). `POST /season/join`,
      `GET /season/joins`
- [x] `apps/game/src/data/worldSource.ts`: `fetchSeasonDays`/`fetchSeasonDay`/
      `publishSeasonJoin`/`fetchSeasonJoins`, sama kolmen-tuloksen kuvio kuin muualla
- [x] `useSeason.ts` kirjoitettu uusiksi liittymis-mallille: hakee kaikkien
      liittyneiden omat lähtöviivat (`/season/joins`) + uusimman päivä-snapshotin,
      laskee jokaiselle *oman* kasvun heidän *omasta* liittymishetkestään, järjestää
      eniten kasvaneen mukaan. `join()`-toiminto lukee pelaajan nykyisen tilanteen
      `repository.exportWorldSource`illa (sama polku kuin `/submit`) ja julkaisee sen
- [x] `SeasonPanel.tsx`: "Join the Weekly Tournament" -nappi näkyy kunnes pelaaja on
      listalla; sen jälkeen rivi näyttää "joined N days ago" jokaiselle. Auki
      ☰-valikosta, näkyy **molemmissa** moodeissa
- [x] Portti: `lint:lines`, `tsc -b`, **1711** vitest (+8 tätä osaa varten:
      4 `worldSource.test.ts`ssa liittymiselle), `pnpm build`. e2e: 6/6
      `season.spec.ts`ssa, oikeasti ajettu — järjestys kahdella eri liittymispäivällä,
      "ei vielä ketään" -tila, ja koko liittymis-POST tarkistettu asti (id/name/
      distanceM/hexes oikeaa tyyppiä)
- [x] **Sivulöydös aiemmasta:** `listSeasonDays`in lajittelu numeeriseksi, ei
      merkkijonoksi — jäi voimaan, katso alempi Sivulöydökset-kohta

## Sivulöydökset

- **`worker/src/index.ts` tarvitsi jaon tämän ja `/season/join`-reittien myötä.**
  Viisi `/clan*`-reittiä (382 riviä yhteensä) siirrettiin `clan.ts`iin uutena
  `handleClanRoute(request, url, kv, send, bare, liveSources)`-funktiona,
  `send`/`bare`/`liveSources` välitettynä parametreina kiertäen kehämäisen
  moduulituonnin `index.ts`in ja `clan.ts`in välillä. `index.ts` 417 → 342 riviä
- **Kauden alku ei enää ole tekninen "milloin joku Worker-avain nollataan"
  -kysymys** — jokainen pelaaja omistaa oman lähtöviivansa. Tämä myös ratkaisi
  `BRDC-MODE-003`in ja tämän tiketin päällekkäisyyden itsestään: ei tarvita mitään
  pakotettua "aloita alusta" -dialogia, koska liittyminen EI vaadi kuningaskunnan
  nollaamista — pelaaja jatkaa normaalisti, vain hänen kasvunsa mitataan liittymisestä
  eteenpäin. `BRDC-HALL-003`in retirointi (jos joku HALUAA puhtaan pöydän) on yhä
  oma, erillinen valintansa

## Ei tässä

- Playback/toistin-UI — data on aikaleimattu ja säilyy, mutta toistin on oma,
  tuleva tiketti
- Tervetuliaisviesti liittymisen yhteydessä — nappi ja sen välitön vaikutus
  (näkyy heti listalla) ovat oma, riittävä vahvistuksensa; erillinen
  toivotusruutu ei ollut enää tarpeen kun "kausi alkaa" muuttui henkilökohtaiseksi
- Muutokset elinikäisiin tauluihin (Codex, Route Ledger, Chronicles) — pysyvät
  ennallaan kausien rinnalla
- Muutokset decay/capture/siege-sääntöihin — tämä on näyttö päälle, ei uusi tapa
  omistaa maata (eri asia kuin `BRDC-CLAIM-017`)

## Jälkikorjaus v0.6.60 — julkaisu oli aina käsin

Infiniten testauksessa selvisi, että **peli ei koskaan julkaissut itsestään**: ainoa
`publish`-kutsu oli Keepin "Raise your banner" -nappi (ja vain kun "Share your realm"
on päällä). Reittimoodilla ei Keepiä ole, joten sen pelaaja ei voinut julkaista
lainkaan — Route Ledger (MODE-002) ja Season jäivät hänen osaltaan tyhjiksi.

- [x] `useSharedWorld` julkaisee itse kun jakaminen on päällä: ~3 s kartan avaamisen
      jälkeen, sen jälkeen 10 min välein, ja heti kun nimi/kansakunta/lippu/klaani
      vaihtuu (tarkistus 20 s välein). Workerin minuutin jäähdytyksen 429 yritetään
      uudelleen seuraavalla tarkistuksella
- [x] "Join the Weekly Tournament" laittaa "Share your realm" päälle (`onJoined` →
      `MapView`), ja paneeli sanoo sen ääneen. Reittimoodin valinta aloittaa
      jakaminen päällä — omat, tietoiset valintani, kirjattu tähän
- [x] `GET /season/joins` palauttaa jokaisen liittymisen rinnalla pelaajan
      *viimeksi julkaistut* luvut ja nimen (`joinsWithCurrent`, 3 Vitest-testiä) —
      Season ei enää odota päivän snapshotia, ja nimenvaihto näkyy listalla
      seuraavan julkaisun jälkeen. Päivä-snapshotit jäävät historiaksi
- [x] e2e: liittyminen → julkaisu ilman nappia → nimenvaihto lähtee Workerille;
      `**/submit` mockataan season- ja mode-select-spekeissä, ettei testi
      julkaise oikeaan maailmaan
