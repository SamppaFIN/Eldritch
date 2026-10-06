# BRDC-GREAT-001 — Suurhenkilöt

| | |
|---|---|
| **Alue** | `rules/greatPeople.ts`, `data/greatStore.ts`, `wonderActs` |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | WORKS-002, ALLY-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A6; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Civin suurhenkilöt antavat nimetyn hahmon ja kertaluonteisen suuren teon. Meillä NPC:t ovat vain tekstiä.

## 🟢 GREEN

- [ ] Tietyt Works keräävät pisteitä tunnissa (Library → Scholar, Market → Merchant, Temple Grove → Mystic) — puhdas kertymä + testit
- [ ] 100 pisteellä (oletus) syntyy nimetty hahmo (Fuming Laken ja Tampereen omista nimistä), jolla on yksi kertakyky: sulje lähin portti / paljasta 3 rengasta / kaksinkertainen sato 24 h
- [ ] Kyky käytetään kerran ja hahmo siirtyy Hall of Fameen; kyvyt käyttävät `wonderActs`-mallia
- [ ] Kortti kun hahmo syntyy (pinoutuu, ei ajastinta)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Suurhenkilöiden kilpailu muiden pelaajien kanssa.
