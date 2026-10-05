# BRDC-LEDGER-004 — Anomaliat ja rauniot -välilehdet

| | |
|---|---|
| **Alue** | `features/lands/AnomaliesTab.tsx` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | S |
| **Riippuvuudet** | LEDGER-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-23 |
| **Status** | `todo` |

## 🔴 RED

Anomalioita ei näe listana.

## 🟢 GREEN

- [ ] Suodatin aktiivinen / tutkittu / kadonnut
- [ ] Rauniot samaan rakenteeseen
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

—
