# BRDC-PROG-005 — Rakennusten tasot aikakauden katon alla

| | |
|---|---|
| **Alue** | `packages/core/src/rules/works/` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | PROG-004, PROG-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (LAW II, "Slots grow with level")` |
| **Status** | `done` — 2026-09-29, kaksi osaa [~] (bog iron -data, vihjeet DOOM-002:ssa) |

## 🔴 RED

`rules/works`-puut ovat olemassa, mutta niiden taso ei riipu muusta kuin resursseista. LAW II: aikakaudessa N jokainen rakennus voi oppia tierit I–N.

## 🟢 GREEN

- [~] (PROG-002:lta) Market ✓ (+1 gold per viereinen oma settlement-heksa, `staffedBonus`). **Bog iron: ei tehty** — pelissä ei ole bog-iron-esiintymädataa, ja works-puun `depositBonus`-efekti on kytkemättä (dormant); vaatii sisältöä, ei mekaniikkaa. Alkuperäinen: Forge: bog iron reachin sisällä sulatetaan ilman timber-ylläpitoa; Night Market: trade-solut reachissa +1 gold
- [x] (`tierNumberOf` + `researchWorkAt`: Season 2 -tallennuksella tier > Age → `refused: 'age'`, teksti "Your Age is the ceiling. Study the Lore to reach the next one."; solmun tila ei vielä näytä Agea etukäteen, vain yrityksen jälkeen) Puun tier ≤ nykyinen Age; lukittu node kertoo mikä aikakausi avaa
- [x] (oli jo: `worksLevel` → `slotsFor`, PROG-002) Taso = opittujen nodejen määrä → `slots` (PROG-002)
- [~] Watchtowerilla on puu (Lookout, reach, reveal, Signal Fire, Night Watch — WORKS-002). Dokumentin "+40 strength ring 1" ja vihjeiden löytö siirtyvät DOOM-002:een, jossa vihjeet syntyvät. Alkuperäinen: Watchtower saa puun (Lookouts, sight + 40 strength ring 1, löytää vihjeitä)
- [x] Vitest (`lore.repo.test.ts` Age-katto, `staffing.test.ts` Market)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` (1850)

## Todennus

Vitest + works.spec.

## Ei tässä

Masterworkit.
