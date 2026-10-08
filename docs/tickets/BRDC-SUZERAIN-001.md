# BRDC-SUZERAIN-001 — Kylän suojelus

| | |
|---|---|
| **Alue** | `rules/cityState.ts`, diplomacy, Tavern-tehtävät |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | DIPLO-001, QUEST-009 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A8; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-08, haara `season-3`) — kylän kortti kirjoitettu mutta ei nähty ruudulla, ks. alla |

## 🔴 RED

Kaupunkivaltiot ovat olemassa (diplomacy), mutta niihin ei rakenneta suhdetta ajan yli. Civin suzerain-malli antaa syyn palata.

## 🟢 GREEN

- [x] Kylällä on omat tehtävät (QUEST-009-moottorilla); jokainen antaa envoy-pisteitä tuolle kylälle — `VILLAGE_TASKS` (4 Härmälänrannan tehtävää, 1–2 envoyta), `tasks.village(id)`; envoyt luetaan tehtävien lopuista (`envoysFrom`), ei erillistä laskuria
- [x] Suojelija = eniten envoy-pisteitä (oletus vähintään 3); suojelija saa kylän erikoisuuden (esim. kalastuskylä +food) — `suzerainOf` (tasapeli kärjessä = ei ketään); kalastuskylä +4 food/h YIELD-mallin kautta ("Suzerain: Härmälänranta")
- [x] Jaetussa maailmassa vertailu tehdään Workerin kautta; paikallisesti toimii yksin — Worker `POST/GET /envoys` (`apps/worker/src/envoys.ts`, rivi per pelaaja, 60 vrk TTL, testattu); **vaatii `wrangler deploy`:n** kun kausi 3 avataan. Ilman Workeria verrataan vain itseen
- [~] Kylän kortti näyttää suojelijan ja oman pisteen — `VillageFavour` laiturin Trade postin alla (tehtävät + suojelija + omat envoyt). **Ei nähty ruudulla:** laiturin heksan napautus ei osu luotettavasti tässä harnessissa (sama syy, jonka takia DIPLO-001:n kauppakaan ei ole e2e:ssä); kolme yritystä, kaikki ohi. Logiikka katettu `suzerain.repo.test.ts`:llä
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2113/2113

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Kylän valloitus (kylät ovat valloittamattomia).
