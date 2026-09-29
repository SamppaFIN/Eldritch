# BRDC-SEASON-003 — Legacy-tilinpäätös

| | |
|---|---|
| **Alue** | `packages/core/src/rules/legacy.ts, features/season` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf (S4, LEGACY SCORE)` |
| **Status** | `todo` |

## 🔴 RED

Kauden päättyessä ei ole lukua joka kertoo mitä jäi jälkeen. Dokumentti: rivi riviltä pisteet (cells 2, citizens 5, masterworks 40 / dormant 20, lore 6, spell ranks 4, gates 25, quests 15, wonders 30, damage ½, sane +50, Keep +1 %/taso) × lopputulos.

## 🟢 GREEN

- [ ] `legacyOf(realm, outcome)` → `{parts, subtotal, mult, total}` + Vitest
- [ ] Season 1:lle toimii olemassa olevilla osilla (muut 0)
- [ ] S4-ruutu 'What You Leave Behind' + paras kausi -vertailu
- [ ] Legacy kulkee Workeriin `/submit`in mukana
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + kuvakaappaus vs S4.

## Ei tässä

Tulostaulut (SEASON-005).
