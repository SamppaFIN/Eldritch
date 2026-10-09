# BRDC-SIM-003 — Reitti joka pelaa: seikkailu läpi ja rakennuksia matkalla

| | |
|---|---|
| **Alue** | `packages/core/src/sim/routeActions.ts`, `sim/playback.ts` (`detour`), `sim/routes/fuming-lake.gpx`, `scripts/gen-routes.mjs`, `apps/game/src/features/playback/`, `useTrail` |
| **Vaihe** | 3 — Season 3 (haara `season-3`) |
| **Effort** | M |
| **Riippuvuudet** | BRDC-SIM-002 |
| **Lähde** | Infinite 2026-10-09: *"nyt generoi routeplayback .gpx, mikä pelaa seikkailun läpi ja rakentaa muutamia rakennuksia"* |
| **Status** | `done` — 2026-10-09 |

## 🔴 RED

GPX kantaa vain sijainteja. Seikkailun valinnat ja rakentaminen ovat napautuksia, eikä
toisto osaa niitä. Lisäksi Fuming Laken sillan läpi pääsee vain pitämällä salaista paikkaa
(kivi, sauva, rihkama), ja ne siirtyvät joka viikko — kiinteä reitti ei tiedä minne mennä.

## 🟢 GREEN

- [x] Toimintoja GPX:n sisällä: `<extensions><es3:do>…</es3:do>` reittipisteessä; muu GPX-työkalu
      lukee tiedoston tavallisena kävelynä. Verbit: `grant`, `collect`, `build <id>`,
      `research <id>`, `adventure start <id>`, `adventure choose <n>`, `go <site>`
- [x] Toiminto ajetaan samoilla repositoryn verbeillä kuin napautus, ja samalla paikkasäännöllä:
      tarinaa edetään vain vaiheen omalla heksalla. Jokainen tulos lokiin, myös kieltäytymiset
- [x] `go <site>`: peli kertoo missä paikka on tänään, toisto kävelee sinne ja takaisin samaa
      putkea pitkin — tarpeen, koska kivi, sauva ja rihkama ovat salaisia paikkoja jotka siirtyvät viikoittain (`pinWeeklySecrets`); ensimmäinen versio käveli kivelle kiinteällä reitillä ja silta sanoi `gate`
- [x] Toiminto odottaa, että polku on kirjoitettu (maa vallattu) ennen kuin se ajetaan — `link.settle()`: puskuri kirjoitetaan ja jonon annetaan tyhjentyä
- [x] `fuming-lake.gpx` generoituna (`node scripts/gen-routes.mjs`): tarina alusta loppuun, kaksi
      Monumenttia ja Market. Valmiina reittinä paneelissa ja `playRoute(page, { fixture: 'fuming-lake' })`
- [x] e2e: reitti ajaa tarinan loppuun, jokainen toiminto onnistuu, kolme rakennusta — loki: grant, Monument, tarinan alku, statue → lake → hermit, kävely kivelle, toinen Monument, peikko kiven tietä, deep, servitude "The Fuming Lake ends", Market 14 heksan päässä
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2169 testiä; playback.spec 4/4, step-claim 7/7, mythos 1/1; tuotantobuildissa ei paneelia, reittejä eikä fixtureja

## Ei tässä

Skyward Runway -reitti (sama verbistö riittää, kun sitä tarvitaan). Toimintojen ajo pelaajan
GPX-tuonnissa.

## Matkalla löytyneet ja korjatut

- **Polun kirjoitus kilpaili itsensä kanssa** (`useTrail`): kaksi flushia yhtä aikaa — myöhempi
  luki saman radan, viimeinen kirjoitus voitti ja pisteitä katosi, ja toisen erän ensimmäinen
  heksa ei vielä rajannut ensimmäisen valtauksia, joten valtausnauha katkesi. Nyt kirjoitukset
  jonossa. Sama kilpa oli mahdollinen livepelissä, kun kirjoitus isolla tallennuksella kestää yli
  kymmenen sekuntia.
- **Uusi run avattiin efektissä renderöinnin jälkeen**: jos se myöhästyi, toiston ensimmäiset
  pisteet menivät vanhaan runiin ja hylättiin. Nyt `link.newRun()` odotetaan ennen ensimmäistä pistettä.
- **Toisto hidastui pääsäikeen mukana**: ketjutetut ajastimet kertasivat jokaisen viiveen. Nyt
  reittikello — jokainen tikki syöttää kaikki erääntyneet pisteet.
- **Kartta ei kuullut valtauksista**: pelin oma päivitys seuraa heksaa jolla seisot, ja
  nopeassa toistossa se jäi jälkeen. Toiston aikana kartta luetaan uudelleen jokaisen erän jälkeen.
- **mythos.spec**: Eureka-kortti saattoi ehtiä jonossa Mythoksen edelle (UX-002) — spec lukee ne pois.
