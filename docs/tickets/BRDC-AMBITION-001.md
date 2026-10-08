# BRDC-AMBITION-001 — Kauden tavoite

| | |
|---|---|
| **Alue** | `rules/ambition.ts`, `data/ambitionStore.ts`, Keep |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | S–M |
| **Riippuvuudet** | SEASON-003 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A5; Infinite hyväksyi kaikki |
| **Status** | `done` (2026-10-08, haara `season-3`) |

## 🔴 RED

Legacy on yksi mittari. Old Worldin "ambitions" ja Civin voittotiet antavat pelaajan valita *miten* hän voittaa.

## 🟢 GREEN

- [x] Kauden alussa (tai ensimmäisellä Keepin avauksella) valitaan 1/3 tavoitetta (oletus: pidä 3 temppeliä, sulje 10 porttia, 200 heksaa) — luettu tilasta kuten QUEST-009:n tavoitteet — `rules/ambition.ts` (Keeper of Temples / Warden of the Gates / Lord of the Ground), valinta Keepissä kahdella napautuksella
- [x] Täytetty tavoite kertoo Legacyn kertoimella (oletus ×1,15) ja jää Hall of Fameen — `legacyOf(…, ambition)`, rivi Legacy-taulukossa; `HallOfFameEntry.ambition` ("… · met" / "· not met")
- [x] Edistyminen näkyy Keepissä ja NEXT-001-nauhassa — `KeepAmbition`, `useUpNext` (napautus → Keep)
- [x] Yksi tavoite per kausi, lukittu — `K.ambition`, `choose` palauttaa `locked`; nollautuu kauden mukana (ei `FOREVER_KEYS`issä)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2052/2052, e2e `ambition.spec.ts` + `up-next.spec.ts` 360 px vihreä

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Useampi tavoite samaan aikaan.
