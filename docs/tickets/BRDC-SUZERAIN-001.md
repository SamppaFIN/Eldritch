# BRDC-SUZERAIN-001 — Kylän suojelus

| | |
|---|---|
| **Alue** | `rules/cityState.ts`, diplomacy, Tavern-tehtävät |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | DIPLO-001, QUEST-009 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A8; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Kaupunkivaltiot ovat olemassa (diplomacy), mutta niihin ei rakenneta suhdetta ajan yli. Civin suzerain-malli antaa syyn palata.

## 🟢 GREEN

- [ ] Kylällä on omat tehtävät (QUEST-009-moottorilla); jokainen antaa envoy-pisteitä tuolle kylälle
- [ ] Suojelija = eniten envoy-pisteitä (oletus vähintään 3); suojelija saa kylän erikoisuuden (esim. kalastuskylä +food)
- [ ] Jaetussa maailmassa vertailu tehdään Workerin kautta; paikallisesti toimii yksin
- [ ] Kylän kortti näyttää suojelijan ja oman pisteen
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Kylän valloitus (kylät ovat valloittamattomia).
