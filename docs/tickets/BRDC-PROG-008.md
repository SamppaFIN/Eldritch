# BRDC-PROG-008 — Sanity: valtakunnan mieliala

| | |
|---|---|
| **Alue** | `packages/core/src/rules/sanity.ts, HUD` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | S |
| **Riippuvuudet** | PROG-001, PROG-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf ("Sanity is the realm’s mood")` |
| **Status** | `done` — 2026-09-29, lähtö alle −10 ja hulluuskohtaamiset [~] |

## 🔴 RED

Valtakunnalla ei ole mielialaa; kasvu ei maksa mitään. Dokumentti: `10+2·temples+3·taverns−(citizens−6)−cells÷8−2·gatesNear`; alle 0 tuotot −20 % ja hulluuskohtaamiset, alle −10 kansalaiset lähtevät.

## 🟢 GREEN

- [x] `realmSanity(cells, staff, citizens, gatesNear)` + Vitest (`sanity.test.ts` 3, `staffing.test.ts` hullu valtakunta); temppeli = miehitetty Temple Grove, taverna = miehitetty Tavern, portit 0 kunnes DOOM-002
- [~] Alle 0: miehitetty tuotto × 0.8 (`staffedBonus`) ✓. **Ei vielä:** hulluuskohtaamiset (DOOM-003:n pakkoihin) ja kansalaisten lähtö alle −10 (tarvitsee oman kellon kuten nälkä — siirtyy DOOM-002:een, jossa portit laskevat sanityä)
- [x] Keep-paneeli: "Sanity N · calm/uneasy/mad/breaking" + ohje kun alle 0 (§14: sana, ei väri); e2e. HUD ei vielä (Hud.tsx täynnä)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build (1868)

## Todennus

Vitest.

## Ei tässä

Tutkijan oma sanity (DOOM-002).
