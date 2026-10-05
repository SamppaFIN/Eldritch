# BRDC-TERRAIN-006 — Maatyypin läpikuultava pinta

| | |
|---|---|
| **Alue** | `features/territory/terrainTextures.ts`, `CELL_TEXTURE_LAYER` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | — |
| **Lähde** | Infiniten handoff 2026-10-05, F-10 |
| **Status** | `done` — 2026-09-30 (v0.8.1) |

## 🔴 RED

—

## 🟢 GREEN

- [x] Tehty v0.8.1:ssä (2026-09-30): tekstuuri per maasto `fill-pattern`illa omistusvärin alla, läpinäkyvä; omistuksen reuna päällimmäisenä

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Värit tokeneista `match`-lausekkeella — korvattu tekstuureilla Infiniten pyynnöstä.
