# BRDC-LEDGER-003 — Temppelit-välilehti ja kierros

| | |
|---|---|
| **Alue** | `features/lands/TemplesTab.tsx` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | S |
| **Riippuvuudet** | LEDGER-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-22 |
| **Status** | `done` — 2026-10-05 (kierros `[~]`) |

## 🔴 RED

Temppeleitä ei voi käydä läpi listana.

## 🟢 GREEN

- [x] Lista: tila, löytäjä, bonus, viimeisin käynti (paikat + Temple Groves) — tyhjä tila ajettu `ledger.spec.ts`:ssä
- [~] Kierros: ‹ / › lentää ja avaa kortin (`TempleTour.tsx`) — toteutettu ja tyypitetty, mutta e2e ei aja sitä: tuoreessa valtakunnassa ei ole temppeliä. Testataan kun paikkojen siemen on olemassa
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 223 tiedostoa / 1963 testiä, tsc, rivit OK, build OK

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

—
