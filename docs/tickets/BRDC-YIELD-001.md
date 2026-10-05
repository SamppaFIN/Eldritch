# BRDC-YIELD-001 — Heksan tuotto eriteltynä: yksi funktio, kolme kuluttajaa

| | |
|---|---|
| **Alue** | `packages/core/src/rules/hexYield.ts`, `data/pouch.ts` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | L |
| **Riippuvuudet** | — |
| **Lähde** | Infiniten handoff 2026-10-05, F-01 |
| **Status** | `done` — 2026-10-05 |

## 🔴 RED

Tuotto lasketaan kymmenessä valtakunnan tason summaimessa (`perHourBonus`: staffedBonus, placeBonus, domainSpellBonus, resourceAura, researchBonus, bountyBonus, landmarkBonus, worksBonus) ja heksan maastotippa erikseen (`settleResources`/`trickle`), sitten valtakunnan kertoimet (sanity, Foundry/Cathedral, Second Lake, pimeä aika). Mikään ei kerro, *mistä* yhden heksan tuotto tulee — kortti näyttää vakioita.

## 🟢 GREEN

- [x] `computeHexYield(cell, ctx): HexYield` — `totals` + `contributions[] {resource, amount, source: terrain|building|citizen|tech|temple|anomaly|other, label, sourceId?}`
- [x] `realmBonus(ctx)` (ent. `realmYield`) = Σ heksat + valtakunnan omat lähteet; kertoimet heksoille `other`-osuuksina; summat raakoina, pyöristys ja katto kuten nyt
- [x] Vastaavuustesti: `data/yield.golden.test.ts` lukitsi vanhan tuoton (S1: Works, tutkimus, bountyt, Works-puu, loitsu; S2: miehitys, boonit, calm, portit, sanity < 0) ENNEN vaihtoa; pysyi vihreänä koko refaktoroinnin läpi. Foundry/Cathedral eivät ole fixturessa (masterworkin rakentaminen fixtureen jäi) — niiden osuus testataan `hexYield.test.ts`:n summatestissä vain epäsuorasti
- [x] `perHourBonus` delegoi `realmBonus`iin; `staffedParts`/`boonParts`/`staffedModifiers` ja `worksBonusByCell` jakavat summaimet heksoittain, vanha summaus poistetaan (ei rinnakkaista laskua)
- [x] Repository: `repository.yields.at(h3, now)`, `.all(now)` (`data/yieldStore.ts`); MockRepository jaettu `MockRepositoryBase.ts` + `MockRepository.ts` rivirajan vuoksi
- [x] Olemassa olevat tuotantotestit vihreänä ilman lukujen muutosta
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Kaksi tuottomallia rinnakkain. Uusia resursseja tai tasapainomuutoksia.
