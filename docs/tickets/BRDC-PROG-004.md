# BRDC-PROG-004 — Lore: viisi aikakautta, neljä polkua

| | |
|---|---|
| **Alue** | `packages/core/src/rules/tech.ts (korvataan), apps/game/src/features/research/` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | L |
| **Riippuvuudet** | SEASON-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (P2, "Five Ages, Four Paths", LAW II)` |
| **Status** | `in-progress` — kaikki paitsi vanhan puun poisto (v0.7.0) ja kuvavertailu (2026-09-29) |

## 🔴 RED

`TECHS` (13 tekniikkaa, erat, `requires`) on lista joka ei kerro järjestystä (TECH-002). Dokumentti: 5 aikakautta × 4 polkua (Land, Craft, Faith, Sight), 3/4 aikakaudesta avaa seuraavan, hinnat 30/80/160/280/450 wisdomia, ja aikakausi on katto kaikelle.

## 🟢 GREEN

- [x] (erillisenä `rules/lore.ts` `LORE`, ei `TECHS`in korvaajana: Season 1 pelaa vanhaa puuta v0.7.0:aan asti; Age V nimetty mutta dokumentissa ei tekniikoita) Uusi `TECHS` = dokumentin puu (Husbandry … The Pale Accord + aikakaudet IV–V), `Unlock` (building / masterwork / rule)
- [x] `ageOf`, `canStudy`, `loreAllows` (Season 2: Lore päättää rakennukset, vanha tech-portti ohitetaan), `keepCeiling` (Granaries → taso 3); `repository.lore` view/study, `K.lore`. Alkuperäinen: `ageOf(researched)`, `ageAdvance=3`; Ages IV–V sinetöity kunnes Age III
- [x] P2-ruutu + koko kartta yhdessä: `features/research/LorePanel.tsx` Research-dialogissa Season 2:lla (Age I–IV lohkoina, avaukset, lore-rivit, sinetöidyt näkyvät); e2e `keep-citizens.spec.ts` Lore-testi. Visuaalinen vertailu PDF:ään tekemättä. Alkuperäinen: P2-ruutu (nykyinen + seuraava aikakausi) ja koko kartta lore-teksteineen
- [~] Vanhat tekniikat pois: Season 2 ohittaa ne jo (`buildStore`), itse `tech.ts` poistetaan v0.7.0-julkaisussa kun Season 1 päättyy. Alkuperäinen: Vanhat tekniikat pois (kausi nollaa, ei migraatiota); koulukytkös siirtyy PROG-007:ään
- [x] Vitest (`lore.test.ts` 6, `lore.repo.test.ts` 2). Alkuperäinen: Vitest puun eheydelle (jokainen unlock osuu olemassa olevaan)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + research.spec uusittu + kuvakaappaus vs P2.

## Ei tässä

Rakennustasot (PROG-005), masterworkit (PROG-006).
