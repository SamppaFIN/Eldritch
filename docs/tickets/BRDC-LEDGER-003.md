# BRDC-LEDGER-003 — Temppelit-välilehti ja kierros

| | |
|---|---|
| **Alue** | `features/lands/TemplesTab.tsx` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | S |
| **Riippuvuudet** | LEDGER-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-22 |
| **Status** | `todo` |

## 🔴 RED

Temppeleitä ei voi käydä läpi listana.

## 🟢 GREEN

- [ ] Lista: tila, löytäjä, bonus, viimeisin käynti (paikat + Temple Groves)
- [ ] Kierros: Edellinen / Seuraava lentää ja avaa kortin
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

—
