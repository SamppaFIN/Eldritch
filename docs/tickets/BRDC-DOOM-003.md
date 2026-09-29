# BRDC-DOOM-003 — Maaston kohtaamispakat

| | |
|---|---|
| **Alue** | `packages/core/src/data/encounters/, rules/encounter.ts, chain.ts` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | DOOM-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (Encounters, Drowned Man quest board)` |
| **Status** | `done` — 2026-09-29; ketjut ja hulluuskohtaamiset [~] |

## 🔴 RED

Kohtaamiset eivät riipu maastosta. Dokumentti: forest/lake/settlement/hill-pakat, jokainen kortti yksi testi pass/fail; quest-ketjut ovat kohtaamisketjuja; tavernan questit nostavat taitoja.

## 🟢 GREEN

- [x] Neljä pakkaa × 6 korttia (`rules/deck.ts`, TS-datana tyypityksen vuoksi, ei JSON); maastot kuvattu pakkoihin (plain → settlement, marsh → forest, mountain → hill…); huhu = hash(siemen, heksa), 1/8 heksoista, kerran per heksa; `repository.rumours` at/face/reroll/accept; solukortin `CellRumour.tsx` (jaettu `DiceRow` porttien kanssa). Alkuperäinen: Neljä pakkaa JSONina (chains.json-malli), ≥ 6 korttia/pakka
- [~] Ketjut: anomalioiden `chain.ts`-ketjut eivät vielä käytä noppia (Season 1:n sisältöä; tehdään kun Season 1 päättyy) — ja PROG-008:n hulluuskohtaamiset (sanity < 0) eivät vielä vedä omaa pakkaansa
- [x] Tavernan quest board: 4 settlement-korttia nostaa taitoa (+1, katto 5)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build (1892)

## Todennus

Vitest pakkojen eheydelle.

## Ei tässä

—
