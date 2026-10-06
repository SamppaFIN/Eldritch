# BRDC-AGE-001 — Viikon kultainen ja pimeä aika

| | |
|---|---|
| **Alue** | `rules/age.ts`, `data/ageStore.ts`, `realmBonus` |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | SEASON-003 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A3; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Hyvä viikko ei palkitse eikä huono anna paluureittiä. Civ VI:n kultainen/pimeä aikakausi tekee rytmistä pelin.

## 🟢 GREEN

- [ ] Viikon Legacy-tahti (oletus: ≥ 120 % edellisestä viikosta = kultainen, ≤ 60 % = pimeä) päätetään maanantain aamuna; puhdas `ageFor(lastWeek, weekBefore)` + testit
- [ ] Kultainen: +10 % kaikkeen tuotantoon ja yksi valittava etu (3 vaihtoehtoa); pimeä: −10 %, mutta yksi "paluulupaus" joka tekee seuraavasta kultaisesta helpomman
- [ ] Kerroin näkyy hex-kortilla omana rivinään (kuten Dark time) ja HUDissa viikon nimenä
- [ ] Ensimmäinen viikko kaudella on aina tavallinen
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Jaettu, kaikkien yhteinen aikakausi (vain oma valtakunta).
