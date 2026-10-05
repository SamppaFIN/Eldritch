# BRDC-ART-007 — Ikonien ja korttien visuaalinen nosto

| | |
|---|---|
| **Alue** | `packages/ui`, `designSprites.ts`, `tokens.css` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | — |
| **Lähde** | Infiniten handoff 2026-10-05, F-50 |
| **Status** | `todo` |

## 🔴 RED

Ikonit ja kortit ovat eri aikoina piirrettyjä; viivat, hehku ja kehykset vaihtelevat.

## 🟢 GREEN

- [ ] Yksi ikonityyli (viiva, hehku, tokenipaletti)
- [ ] Korttikehykset (vesica-kulmat), hillitty kohina taustoissa
- [ ] Cinzel/Inter kuten nyt
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

—
