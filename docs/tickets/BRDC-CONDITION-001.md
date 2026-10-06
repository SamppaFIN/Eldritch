# BRDC-CONDITION-001 — Tilat: Velka, Vainoharha, Kirous…

| | |
|---|---|
| **Alue** | `rules/condition.ts`, investigator, deck |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | INVEST-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus B1; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Epäonnistuminen maksaa vain sanityä tai healthia. Eldritch Horrorin tilat (Conditions) tekevät seurauksista tarinoita, joilla on hinta ja purkutapa.

## 🟢 GREEN

- [ ] 4–6 tilaa (oletus: Velka, Vainoharha, Kirous, Muistinmenetys, Siunaus, Synkkä sopimus) — jokaisella vaikutus ja purkutapa (maksa, nuku kotona, kävele temppeliin, aika)
- [ ] Huhukortin tai tehtävän epäonnistuminen voi antaa tilan; tila näkyy Keepin tutkijan kohdalla ja vaikuttaa noppiin/tuotantoon
- [ ] Puhtaat säännöt + testit; tilat tutkijan tietueeseen (valinnainen kenttä)
- [ ] Tila ei koskaan vie peliä lukkoon: jokaisella on aikaraja
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Kortit fyysisenä pakkana; tilat muille pelaajille.
