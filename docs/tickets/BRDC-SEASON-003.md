# BRDC-SEASON-003 — Legacy-tilinpäätös

| | |
|---|---|
| **Alue** | `packages/core/src/rules/legacy.ts, features/season` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf (S4, LEGACY SCORE)` |
| **Status** | `done` — 2026-09-29; Legacyn julkaisu Workeriin siirtyy SEASON-005:een |

## 🔴 RED

Kauden päättyessä ei ole lukua joka kertoo mitä jäi jälkeen. Dokumentti: rivi riviltä pisteet (cells 2, citizens 5, masterworks 40 / dormant 20, lore 6, spell ranks 4, gates 25, quests 15, wonders 30, damage ½, sane +50, Keep +1 %/taso) × lopputulos.

## 🟢 GREEN

- [x] (`rules/legacy.ts` `legacyOf(counts, outcome)` → rivit, subtotal, kerroin, total; testi toistaa dokumentin S4-esimerkin; Risen + avoin portti 2 renkaan sisällä kodista = Keep kaatunut) `legacyOf(realm, outcome)` → `{parts, subtotal, mult, total}` + Vitest
- [x] Season 1:lle toimii: solut, ihmeet (`wonderFinds` jotka yhä omia), questit (valmiit anomaliat + kohdatut huhut); muut 0 (`data/legacyTally.ts`, `repository.legacy.tally`)
- [~] S4-taulukko `LegacyTable` (uudelleenkäytettävä SEASON-004:n sinetöintiruudussa) + Keepin "What you would leave behind" -elävä tilinpäätös; e2e. **Ei vielä:** paras kausi -vertailu (tarvitsee edellisen kauden Legacyn — SEASON-005 Hall of Ages)
- [~] → **siirretty SEASON-005:een** (tulostaulut lukevat sen; julkaisu tehdään yhdessä)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build (1902)

## Todennus

Vitest + kuvakaappaus vs S4.

## Ei tässä

Tulostaulut (SEASON-005).
