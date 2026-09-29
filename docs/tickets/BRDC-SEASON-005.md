# BRDC-SEASON-005 — Tulostaulut, Hall of Records ja Hall of Ages

| | |
|---|---|
| **Alue** | `packages/core/src/data/legacyBoards.ts, apps/worker, features/season` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-003 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf (S5, S6, LEADERBOARDS)` |
| **Status** | `todo` |

## 🔴 RED

Kauden Legacylle ei ole tulostaulua eikä titteleitä. Dokumentti: Global (live 1 h viiveellä), Friends, Hall of Records (7 titteliä, yksi per kategoria), Hall of Ages (paras 3 kautta).

## 🟢 GREEN

- [ ] Global + Friends (kuusi pelaajaa = kaikki); Region ja Faction parkissa
- [ ] Seitsemän titteliä, titteli jää sigiliin pysyvästi (`forever`-avain)
- [ ] Hall of Ages = paras 3 kautta
- [ ] S5 + S6 -ruudut, oma rivi aina kiinnitetty
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + e2e.

## Ei tässä

Faktiotaulu.
