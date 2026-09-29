# BRDC-PROG-001 — Kansalaiset syntyvät ruoasta

| | |
|---|---|
| **Alue** | `packages/core/src/rules/balance.ts, rules/citizens.ts, apps/game/src/features/keep/` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (P1 The Keep · Citizens, "Food Is the Clock", BALANCE)` |
| **Status** | `in-progress` — 4/5 (2026-09-29); jäljellä `found` kauden alussa (SEASON-006) ja kuvavertailu PDF:ään |

## 🔴 RED

Ruoalla ei ole kelloa. Väestö on tänään `population()` (`rules/nation.ts`): johdettu luku, ei ihmisiä. Dokumentti: ylijäämäruoka täyttää aitan, täysi aitta synnyttää kansalaisen, jokainen kansalainen syö 2 food/h, Keepin taso määrää asunnot.

## 🟢 GREEN

- [x] `rules/balance.ts` = dokumentin BALANCE-objekti (yksi lähde, kuten constants.ts)
- [x] (puhtaat säännöt: `rules/citizens.ts` `settleGranary`, 10 testiä; `claimCost` floorattu, koska dokumentin omat esimerkit 50/277 ovat floor-arvoja) `growBox(n)=20+8n+n²`, `housing=3+3·keepLv`, syönti 2/h, nälkä: aitta tyhjenee ensin, 6 h nollassa → vähiten hyödyllinen työläinen lähtee
- [~] Aitan täyttö `settlePouch`issa valmis: `feedGranary` (granary first — Infinite 2026-09-29 valitsi dokumentin säännön: ruoka menee pussiin vain kun Keep on täynnä). Toimii vain tallennuksella jolla on `ResourceState.keep` — Season 1 -tallennuksissa sitä ei ole, joten nykyinen peli ei muutu ennen v0.7.0:aa. Keepin taso: `raiseKeep` + `data/citizenStore.ts` `keepApi` (view / raise / found), hinta **oletus** 100 food + 50 stone, tuplautuu tasolta (dokumentissa ei hintaa — Infinite ei vielä asettanut), ilman Lorea katto taso 2 (Granaries, PROG-004, avaa 3). `repository.keep` kytketty. **Jäljellä:** `found` uuden kauden alussa (SEASON-006)
- [x] P1-ruutu `features/keep/KeepCitizens.tsx` Keep-paneelissa (ei renderöidy Season 1 -tallennuksella); visuaalinen vertailu PDF:n P1:een tekemättä. Alkuperäinen: P1-ruutu: CITIZENS x/y HOUSED, aitan palkki + ETA, FOOD LEDGER per hour
- [x] Vitest jokaiselle kaavalle (`citizens.test.ts` 13, `citizens.repo.test.ts` 3); e2e `keep-citizens.spec.ts` (Season 1 ei näe mitään, Season 2 näkee kansalaiset/aitan/napin) 4/4 vihreä. Syntymä todennettu Vitestillä, ei e2e:llä (vaatisi tuntien kellon)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + `e2e/citizens.spec.ts` + kuvakaappaus vs PDF P1.

## Ei tässä

Työpaikat (PROG-002), sanity (PROG-008).
