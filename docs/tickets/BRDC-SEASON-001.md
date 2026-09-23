# BRDC-SEASON-001 — A week's competition, tracked day by day

| | |
|---|---|
| **Alue** | `apps/worker/src/season.ts`, `packages/core/src/data/seasonStats.ts`, `apps/game/src/features/season/` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | M |
| **Riippuvuudet** | `BRDC-HALL-003` (Chronicles — sama arkistokonsepti, `done`),
  `BRDC-ATLAS-001`in `history.ts` (sama snapshot-kaava, tiheämpi tahti) |
| **Status** | `[~]` osittain — 2026-09-23 (v0.6.57). Päivittäinen seuranta koodattu,
  testattu ja pushattu. Kauden alku/loppu-rajaus, pakotettu legacy-arkistointi ja
  tervetuliaisviesti **eivät** — ks. alla miksi |

## 🔴 RED

Infinite 2026-09-23, jatkona edelliseen "päivittäiset highscore-taulut" -huomautukseen:
*"siis viikon kilpailu, päivittäinen seuranta.. vanhoista muodostetaan legacy
'historia' data, jota voi vaikka sit myöhemmin playbackata playerillä tms... lähinnä
meille 6 pelaajalle fresh haaste, ja siihen hyvät tervetuliaistoivotukset."*

Tämä ei ole "highscore joka nollautuu keskiyöllä" vaan oma kokonaisuus: **kausi on
viikko, seuranta on päivittäistä sen sisällä.**

## 🟢 GREEN — päivittäinen seuranta (tehty)

- [x] `packages/core/src/data/seasonStats.ts`: puhdas `seasonStandingsOf(sources)` —
      lukee `routeDistanceM`in (reittimoodi) tai `leyM`in (seikkailumoodi, jolla ei ole
      omaa matkalaskuria) + `cells.length`in jokaiselta live-lähteeltä, moodista
      riippumatta. `seasonDayKey(now)` — sama kaava kuin `atlasWeekKey`, päivän eikä
      viikon tarkkuudella. 7 Vitest-testiä
- [x] `apps/worker/src/season.ts`: `maybeSnapshotSeason` samalla kaavalla kuin
      Atlasin `maybeSnapshot` — yksi snapshot/päivä, ei cronia, kirjoitetaan
      `rebuild()`in yhteydessä. 60 päivän säilytys. `listSeasonDays`/`readSeasonDay`,
      `GET /season/history` + `GET /season/history/<day>`
- [x] **Sivulöydös: `listSeasonDays`in järjestys korjattu numeeriseksi**, ei
      merkkijonolajitteluksi — `seasonDayKey` ei nollatäytä, joten "day-100" olisi
      lajittunut ennen "day-99"ia. Sama piilevä bugi on jo `history.ts`in
      viikko-versiossa (~2900-luvun viikkonumerot ovat toistaiseksi saman
      pituisia, joten ei ole vielä oireillut) — ei korjattu siellä, liittymätön
      tähän tikettiin
- [x] `apps/game/src/data/worldSource.ts`: `fetchSeasonDays`/`fetchSeasonDay`, sama
      kuvio kuin `fetchAtlasHistoryWeeks`/`fetchAtlasSnapshot`
- [x] Uusi `SeasonPanel.tsx` + `useSeason.ts` — lukee vanhimman ja uusimman
      snapshotin, laskee "saatu sitten" -erotuksen matkalle ja heksoille, järjestää
      eniten kasvaneen mukaan. Auki ☰-valikosta ("The Season"), näkyy **molemmissa**
      moodeissa toisin kuin Codex/Route Ledger. e2e: 2/2 `season.spec.ts`ssa, oikeasti
      ajettu (mockatut kaksi päivä-snapshotia, tarkistettu "+4 km"/"+10 hexes" -rivi)
- [x] Portti: `lint:lines`, `tsc -b`, **1700** vitest, `pnpm build`

## 🔴 Ei tehty tässä — ja miksi

Kolme alkuperäisen RED:n osaa jäivät tarkoituksella auki, koska ne vaativat
Infiniten oman päätöksen jota ei vielä ole tehty (milloin kausi 1 oikeasti alkaa):

1. **Kauden alku/loppu-raja.** Rakennettu vain "vanhin tallennettu snapshot vs uusin"
   — ei mitään käsitettä "kausi alkoi tässä, päättyy tuossa". Kun Infinite on valmis
   aloittamaan Kauden 1:n oikeasti kuuden pelaajan kanssa, tämä on nopea lisäys päälle
2. **Pakotettu legacy-arkistointi kauden alkaessa.** `BRDC-HALL-003`in
   "Share to the Chronicles" -nappi ja era-kenttä ovat jo olemassa ja käytettävissä
   — Infinite voi jo tänään pyytää kaikkia kuutta retiroimaan kuningaskuntansa
   ennen kauden alkua, ilman uutta koodia. Ei siis este, vain ei-automatisoitu
3. **Tervetuliaisviesti.** Ei rakennettu, koska ilman kauden alku-käsitettä ei ole
   luotettavaa signaalia "uusi kausi alkoi juuri" vs "vain seuraava päivä" — sama
   syy kuin kohta 1

## Ei tässä

- Playback/toistin-UI — data on aikaleimattu ja säilyy, mutta toistin on oma,
  tuleva tiketti
- Muutokset elinikäisiin tauluihin (Codex, Route Ledger, Chronicles) — pysyvät
  ennallaan kausien rinnalla
- Muutokset decay/capture/siege-sääntöihin — tämä on näyttö päälle, ei uusi tapa
  omistaa maata (eri asia kuin `BRDC-CLAIM-017`)
