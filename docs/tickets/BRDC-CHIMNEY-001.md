# BRDC-CHIMNEY-001 — Finlaysonin piiput merkkitulina

| | |
|---|---|
| **Alue** | wonders/landmarks, tower sight |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | S–M |
| **Riippuvuudet** | LANDMARK-001, BUILD-013 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus C6; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-08, haara `season-3`) |

## 🔴 RED

Tampereen tunnistettavimmat maamerkit puuttuvat pelistä. Tehdaspiiput merkkitulina antavat kaupungille oman ihmeen.

## 🟢 GREEN

- [x] 3 piippua maamerkki-ihmeinä (sijainnit oletus, Infinite tarkistaa) — **Infinite 2026-10-08: Härmälään patsaan ympärille**, ei keskustaan (testaajat kävelevät siellä). `rules/chimney.ts`: Finlayson 20° 450 m, Tampella 140° 550 m, Frenckell 265° 400 m patsaalta; kukin on maamerkki (`landmarkOn`) → +2 culture/h
- [x] Kun omistat kaikki 3, saat vartiotornin kaltaisen näön koko kaupunginosaan (towerSight-malli, säde oletus 1 km) — `chimneyApi.view` sytyttää kerran: `sightRings` 23 rengasta (~1 km) kolmen keskipisteestä, jää näkyviin
- [x] Maamerkin karttamerkki (LANDMARK-001:n avoin slotti-kysymys ratkaistaan tässä) — **Infinite: jaettu slotti.** Piippu-sprite heksan keskelle (season-merkkien lähde), nimi pohjoiseen tekstipaikkaan, joka väistyy MapLibren törmäystarkistuksella; sytytettynä "· lit"
- [x] Testit: näkö vain kolmella — `chimney.test.ts`, `chimney.repo.test.ts`
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2092/2092, e2e `chimney.spec.ts` 360 px vihreä

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Muiden kaupunkien maamerkit.
