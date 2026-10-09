# BRDC-MONSTER-001 — Hirviöt liikkuvat

| | |
|---|---|
| **Alue** | `rules/monster.ts`, gate-store, kartan symbolikerros |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | L |
| **Riippuvuudet** | DOOM-002, ALLY-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus B8; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-09, haara `season-3`) |

## 🔴 RED

Uhka on staattinen: portti on paikallaan. Arkham Horrorin liikkuvat hirviöt tekevät kartasta elävän.

## 🟢 GREEN

- [x] Portti voi päästää olennon, joka liikkuu yhden renkaan päivässä kohti Keepiä (deterministinen polku) — `rules/monster.ts`: noin joka toinen portti (hash), lyhin heksapolku (`hexPath`) Hearthiin, sijainti lasketaan portista ja kellosta; vaeltaa pois viikossa
- [x] Jos se saavuttaa oman heksan, heksan voima laskee (oletus −50); astu sen heksalle → Vigor-koe pysäyttää sen — purema kerran per heksa (`K.monsters.bitten`), koe heksakortilla (`CellCreature`), läpäisy pysäyttää + 1 vihje, epäonnistuminen −1 sanity; kumpikin maksaa 1 healthin
- [x] Olento näkyy kartalla omana spritenä ja on sumun alla kunnes nähty — oma sprite season-merkkien lähteessä, vain kun heksa on oma, rajanaapuri tai nähty/paljastettu
- [x] Puhtaat säännöt (liike, kohtaaminen) + testit — `monster.repo.test.ts`
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — e2e `monster.spec.ts` 360 px 4/4 (kohtaaminen todennetaan storesta: korttirivi voi kadota uudelleenrenderöinnissä)

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Monen olennon laumat; olentojen jakaminen muille pelaajille.
