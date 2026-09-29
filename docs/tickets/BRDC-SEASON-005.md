# BRDC-SEASON-005 — Tulostaulut, Hall of Records ja Hall of Ages

| | |
|---|---|
| **Alue** | `packages/core/src/data/legacyBoards.ts, apps/worker, features/season` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-003 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf (S5, S6, LEADERBOARDS)` |
| **Status** | `done` — 2026-09-29; Region/Faction parkissa, "first to Age V" korvattu [~] |

## 🔴 RED

Kauden Legacylle ei ole tulostaulua eikä titteleitä. Dokumentti: Global (live 1 h viiveellä), Friends, Hall of Records (7 titteliä, yksi per kategoria), Hall of Ages (paras 3 kautta).

## 🟢 GREEN

- [x] Global (= Friends kuudelle; Region ja Faction parkissa): Worker `apps/worker/src/boards.ts` — `POST /season/legacy` (1 / h / valtakunta = dokumentin "1 h viive"), `GET /season/boards?n`; Legacy julkaistaan Keepin avauksessa (SEASON-003:lta siirtynyt kohta)
- [~] Seitsemän titteliä (`rules/boards.ts` `hallOfRecords`) ✓; voitetut talteen sinetöinnissä `K.titles`iin, joka on `FOREVER_KEYS`issä ✓. **Korvattu:** "First to reach Age V" → "Most Lore learned" (kausi ei pidä aikaleimaa Age V:lle); tittelit näkyvät Keepissä, eivät vielä sigilissä kartalla
- [x] Hall of Ages = paras 3 kautta (`hallOfAges`, `GET /season/ages`)
- [x] S5 + S6: Keepin "Codex of the season" (`SeasonBoards.tsx`: top 10 + oma rivi kiinnitettynä, Hall of Records, Hall of Ages, omat tittelit); e2e
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build (1907)

## Todennus

Vitest + e2e.

## Ei tässä

Faktiotaulu.
