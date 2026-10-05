# BRDC-CARD-006 — Kortti näyttää, mistä tuotto tulee

| | |
|---|---|
| **Alue** | `apps/game/src/features/territory/CellYield.tsx`, `CellWorth.tsx` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | YIELD-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-02 |
| **Status** | `done` — 2026-10-05 |

## 🔴 RED

Kortin Yields-rivi näyttää vakiot `CLAIM_YIELD` ja `TRICKLE_PER_HOUR` — ei heksan oikeaa tuottoa. Väärä luku on pahempi kuin ei lukua.

## 🟢 GREEN

- [x] Resurssi kerrallaan: `Food +6 → Terrain: Forest +1 · Farmstead +2 · Worker +2 · Lore +1`
- [x] Negatiiviset (Forgen puun ylläpito) punaisella
- [x] Kortin summa = heksan osuus siitä mitä pouch maksaa: luvut `repository.yields`istä (sama malli kuin tikki); summan vastaavuus testattu `hexYield.test.ts`:ssä, kortti `yield-card.spec.ts`:ssä. Ground gives -rivi näyttää enää maan oman tipan, ei poistettua valtausmaksua
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Valtakunnan kokonaisennusteen uudistus.
