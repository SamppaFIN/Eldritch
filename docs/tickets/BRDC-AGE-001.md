# BRDC-AGE-001 — Viikon kultainen ja pimeä aika

| | |
|---|---|
| **Alue** | `rules/age.ts`, `data/ageStore.ts`, `realmBonus` |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | SEASON-003 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A3; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-08, haara `season-3`) |

## 🔴 RED

Hyvä viikko ei palkitse eikä huono anna paluureittiä. Civ VI:n kultainen/pimeä aikakausi tekee rytmistä pelin.

## 🟢 GREEN

- [x] Viikon Legacy-tahti (oletus: ≥ 120 % edellisestä viikosta = kultainen, ≤ 60 % = pimeä) päätetään maanantain aamuna; puhdas `ageFor(lastWeek, weekBefore)` + testit — `rules/age.ts`; viikko vaihtuu ensimmäisellä katseella maanantaina (UTC), Legacy-välisumma merkitään viikon alkuun (`rollWeek`)
- [x] Kultainen: +10 % kaikkeen tuotantoon ja yksi valittava etu (3 vaihtoehtoa); pimeä: −10 %, mutta yksi "paluulupaus" joka tekee seuraavasta kultaisesta helpomman — edut Tithe of Coin +3 gold/h, Long Harvest +3 food/h, Clear Vision +2 wisdom/h; lupaus laskee kultaisen rajan 120 % → 100 % ja kuluu kultaisessa viikossa
- [x] Kerroin näkyy hex-kortilla omana rivinään (kuten Dark time) ja HUDissa viikon nimenä — rivi "Golden week"/"Dark week" (+ edun oma rivi); HUD-nauhan ensimmäinen kohta, napautus → Keep (`KeepWeek`); tavallinen viikko ei näy
- [x] Ensimmäinen viikko kaudella on aina tavallinen — ja toinenkin: tahti tarvitsee kolme peräkkäistä viikkomerkkiä; viikon tauko katkaisee sarjan
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2070/2070, e2e `week.spec.ts` + `up-next.spec.ts` 360 px vihreä

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Jaettu, kaikkien yhteinen aikakausi (vain oma valtakunta).
