# BRDC-PROG-001 — Kansalaiset syntyvät ruoasta

| | |
|---|---|
| **Alue** | `packages/core/src/rules/balance.ts, rules/citizens.ts, apps/game/src/features/keep/` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (P1 The Keep · Citizens, "Food Is the Clock", BALANCE)` |
| **Status** | `todo` |

## 🔴 RED

Ruoalla ei ole kelloa. Väestö on tänään `population()` (`rules/nation.ts`): johdettu luku, ei ihmisiä. Dokumentti: ylijäämäruoka täyttää aitan, täysi aitta synnyttää kansalaisen, jokainen kansalainen syö 2 food/h, Keepin taso määrää asunnot.

## 🟢 GREEN

- [ ] `rules/balance.ts` = dokumentin BALANCE-objekti (yksi lähde, kuten constants.ts)
- [ ] `growBox(n)=20+8n+n²`, `housing=3+3·keepLv`, syönti 2/h, nälkä: aitta tyhjenee ensin, 6 h nollassa → vähiten hyödyllinen työläinen lähtee
- [ ] Keepin taso ja sen nosto; aitan täyttö `settlePouch`in rinnalla
- [ ] P1-ruutu: CITIZENS x/y HOUSED, aitan palkki + ETA, FOOD LEDGER per hour
- [ ] Vitest jokaiselle kaavalle; e2e: ruoka → kansalainen syntyy
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + `e2e/citizens.spec.ts` + kuvakaappaus vs PDF P1.

## Ei tässä

Työpaikat (PROG-002), sanity (PROG-008).
