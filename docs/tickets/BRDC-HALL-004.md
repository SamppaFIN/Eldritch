# BRDC-HALL-004 — Eläköityessä kuva Chroniclesiin

| | |
|---|---|
| **Alue** | `data/hallOfFameStore.ts`, `features/hall/` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | HALL-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-31 |
| **Status** | `todo` |

## 🔴 RED

Eläköitynyt valtakunta on lukuja ja tarina, ei kuvaa.

## 🟢 GREEN

- [ ] Retire-hetkellä kartan canvas `render`-callbackissa + `html-to-image` overlaylle (riippuvuus hyväksytty 2026-10-05), yhdistetty, ≤ 1280 px JPEG 0.8
- [ ] IndexedDB:hen omaan avaimeen, Hall-merkintä viittaa
- [ ] Chronicles: pikkukuva, tap → koko kuva
- [ ] Säilyy reloadin yli (e2e)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Kuvan jakaminen Workerille.
