# BRDC-DOOM-003 — Maaston kohtaamispakat

| | |
|---|---|
| **Alue** | `packages/core/src/data/encounters/, rules/encounter.ts, chain.ts` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | DOOM-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (Encounters, Drowned Man quest board)` |
| **Status** | `todo` |

## 🔴 RED

Kohtaamiset eivät riipu maastosta. Dokumentti: forest/lake/settlement/hill-pakat, jokainen kortti yksi testi pass/fail; quest-ketjut ovat kohtaamisketjuja; tavernan questit nostavat taitoja.

## 🟢 GREEN

- [ ] Neljä pakkaa JSONina (chains.json-malli), ≥ 6 korttia/pakka
- [ ] Ketjut (`chain.ts`) käyttävät testejä
- [ ] Tavernan quest board + taitojen nosto
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest pakkojen eheydelle.

## Ei tässä

—
