# BRDC-MONSTER-001 — Hirviöt liikkuvat

| | |
|---|---|
| **Alue** | `rules/monster.ts`, gate-store, kartan symbolikerros |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | L |
| **Riippuvuudet** | DOOM-002, ALLY-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus B8; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Uhka on staattinen: portti on paikallaan. Arkham Horrorin liikkuvat hirviöt tekevät kartasta elävän.

## 🟢 GREEN

- [ ] Portti voi päästää olennon, joka liikkuu yhden renkaan päivässä kohti Keepiä (deterministinen polku)
- [ ] Jos se saavuttaa oman heksan, heksan voima laskee (oletus −50); astu sen heksalle → Vigor-koe pysäyttää sen
- [ ] Olento näkyy kartalla omana spritenä ja on sumun alla kunnes nähty
- [ ] Puhtaat säännöt (liike, kohtaaminen) + testit
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Monen olennon laumat; olentojen jakaminen muille pelaajille.
