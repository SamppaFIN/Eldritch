# BRDC-PROG-004 — Lore: viisi aikakautta, neljä polkua

| | |
|---|---|
| **Alue** | `packages/core/src/rules/tech.ts (korvataan), apps/game/src/features/research/` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | L |
| **Riippuvuudet** | SEASON-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (P2, "Five Ages, Four Paths", LAW II)` |
| **Status** | `todo` |

## 🔴 RED

`TECHS` (13 tekniikkaa, erat, `requires`) on lista joka ei kerro järjestystä (TECH-002). Dokumentti: 5 aikakautta × 4 polkua (Land, Craft, Faith, Sight), 3/4 aikakaudesta avaa seuraavan, hinnat 30/80/160/280/450 wisdomia, ja aikakausi on katto kaikelle.

## 🟢 GREEN

- [ ] Uusi `TECHS` = dokumentin puu (Husbandry … The Pale Accord + aikakaudet IV–V), `Unlock` (building / masterwork / rule)
- [ ] `ageOf(researched)`, `ageAdvance=3`; Ages IV–V sinetöity kunnes Age III
- [ ] P2-ruutu (nykyinen + seuraava aikakausi) ja koko kartta lore-teksteineen
- [ ] Vanhat tekniikat pois (kausi nollaa, ei migraatiota); koulukytkös siirtyy PROG-007:ään
- [ ] Vitest puun eheydelle (jokainen unlock osuu olemassa olevaan)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + research.spec uusittu + kuvakaappaus vs P2.

## Ei tässä

Rakennustasot (PROG-005), masterworkit (PROG-006).
