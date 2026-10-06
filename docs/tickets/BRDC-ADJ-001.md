# BRDC-ADJ-001 — Naapuribonukset Worksille

| | |
|---|---|
| **Alue** | `rules/adjacency.ts`, `rules/hexYield.ts` |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | S |
| **Riippuvuudet** | YIELD-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus A2; Infinite hyväksyi kaikki |
| **Status** | `done` — 2026-10-06 (haara `season-3`) |

## 🔴 RED

Works tuottavat saman minne tahansa ne rakentaa (aura ja reach poislukien). Civ VI:n district-naapuribonus tekee sijoittelusta päätöksen — meillä sijoittelu ei merkitse.

## 🟢 GREEN

- [x] Puhdas `adjacencyFor(h3, id, world)` (`rules/adjacency.ts`): Farm veden vieressä +1 food, sama Work vieressä +1 tuotettaan per naapuri (max +2), Library temppelin vieressä +2 wisdom; Market+Market kuuluu "sama Work" -sääntöön. **Kylän vieressä ei vielä**: `getOwnedCells` ei näe kylien soluja → SUZERAIN-001. Nukkuvan heksan Work lasketaan naapuriksi (se seisoo yhä). `adjacency.test.ts`
- [x] Uusi `YieldSource` `adjacency`; hex-kortti näyttää rivin "Sawmill beside 1 of its kind" ja settle maksaa saman (`hexYield.test.ts`: kortti = settle). Golden-luvut siirtyivät tarkoituksella food +1 (S1 11→12, S2 18→19) — selitetty testissä
- [x] Season 2: bonus vain miehitetyllä Workilla (staff > 0), nukkuva heksa ei tuota
- [x] Rakennuslista kertoo ennen rakentamista: "+1 food beside water" vihreällä (`useAdjacencyHint`); e2e `adjacency.spec.ts` (kortti)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Uudet rakennukset; naapuribonus rivaalien heksoista.
