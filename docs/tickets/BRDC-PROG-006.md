# BRDC-PROG-006 — Masterworkit: monesta tulee yksi

| | |
|---|---|
| **Alue** | `packages/core/src/rules/masterwork.ts, apps/game features, designSprites.ts` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | L |
| **Riippuvuudet** | PROG-005, PROG-007 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (P3, "What Many Ordinary Works Become", LAW III)` |
| **Status** | `done` — 2026-09-29, Exchange/Cathedral-efektit ja kaksi ehtoa [~] |

## 🔴 RED

Fortress on tänään BUILD-013:n erillinen rakennus/taika. Dokumentti: viisi masterworkia (Fortress, Manor, Foundry, Exchange, Sunken Cathedral), jokainen = määrä tavallisia + yksi tasolla + yksi tekniikka, nostetaan yhden ainesosan päälle, lepää jos määrä putoaa.

**Päätös Infiniteltä:** "Rivals cannot claim inside ring 1" vs CLAIM-017 (viimeinen kävijä omistaa). Fortress-poikkeus on jo olemassa; ehdotus: laajennetaan ring 1:een.

## 🟢 GREEN

- [x] (`rules/masterwork.ts` `MASTERWORKS`, `ladder` n/m met, isäntä valitaan automaattisesti; `repository.masterworks` view/raise) `MASTERWORKS` + `canRaise(realm, id)` needs-listana (P3: n / m MET)
- [x] Dormant-sääntö (`isDormant`, masterwork lasketaan isäntänsä lajiin; lepäävä ei anna efektiä): ei tuottoa, vahvuus säilyy
- [~] Efektit: Manor housing +3 (`KeepState.extraHousing`) ✓; Foundry iron+stone ×1.5 ja Cathedral mana ×1.5 miehitetystä tuotosta ✓; Fortress = olemassa oleva `fortress`-rakennus auroineen (BUILD-012, CLAIM-017-poikkeus) ✓ — dokumentin "+200 strength 2 ringissä" ei vielä (nykyinen aura 30 / 1 rengas). **Ei vielä:** Exchangen 3:1-vaihto (toiminto), Cathedralin tier V -avaus. **Ehdot approksimoitu:** Exchangen "rival border" ei tarkisteta, Cathedral = 3 Temple Grovea + opittu tier III -riitti puuttuu (temppelit ovat paikkoja). Alkuperäinen: Viiden efektit (Fortress +200 strength 2 ringissä, Manor housing +3, Foundry +50 %, Exchange 3:1, Cathedral tier V + mana +50 %)
- [x] 5 iso-spriteä `designSprites.ts`iin (Fortress, Manor, Foundry, Exchange, Sunken Cathedral), tarkistettu renderöintinä
- [x] Fortress: Season 2:lla ei rakennettavissa suoraan (`buildStore`), nousee viidennestä Watchtowerista; Season 1 ennallaan
- [x] Vitest (`masterwork.test.ts` 4, `masterwork.repo.test.ts` 2: Fortress nousee tornista) + e2e Masterworks-ladder Keep-paneelissa; P3-ruutu `KeepMasterworks.tsx`
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build (1864; `build.ts` 400/400 — masterwork-rivit omaan `masterworkBuildings.ts`iin, `copyPrice` → `balance.ts`)

## Todennus

Vitest + e2e + kuvakaappaus vs P3.

## Ei tässä

Exchangen reitti rivaalin markkinaan (trade routet poistettiin 0.6.66 — päätetään tässä).
