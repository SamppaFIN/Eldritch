# BRDC-CARD-006 — Kortti näyttää, mistä tuotto tulee

| | |
|---|---|
| **Alue** | `apps/game/src/features/territory/CellYield.tsx`, `CellWorth.tsx` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | YIELD-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-02 |
| **Status** | `todo` |

## 🔴 RED

Kortin Yields-rivi näyttää vakiot `CLAIM_YIELD` ja `TRICKLE_PER_HOUR` — ei heksan oikeaa tuottoa. Väärä luku on pahempi kuin ei lukua.

## 🟢 GREEN

- [ ] Resurssi kerrallaan: `Food +6 → Terrain: Forest +1 · Farmstead +2 · Worker +2 · Lore +1`
- [ ] Negatiiviset (Forgen puun ylläpito) punaisella
- [ ] Kortin summa = `forecastRates`in heksakohtainen osuus (testi)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Valtakunnan kokonaisennusteen uudistus.
