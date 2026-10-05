# BRDC-LEDGER-004 — Anomaliat ja rauniot -välilehdet

| | |
|---|---|
| **Alue** | `features/lands/AnomaliesTab.tsx` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | S |
| **Riippuvuudet** | LEDGER-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-23 |
| **Status** | `done` — 2026-10-05 |

## 🔴 RED

Anomalioita ei näe listana.

## 🟢 GREEN

- [~] Suodatin koskematon / tutkinnassa / valmis — *kadonnut* ei ole mahdollinen: anomaliaa ei kirjata mihinkään, kun maa viedään. Vaatisi oman tietueen
- [x] Rauniot samaan rakenteeseen — Anomalies-välilehden Ruins-suodatin (etsitty / etsimättä)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 223 tiedostoa / 1963 testiä, tsc, rivit OK, build OK

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

—
