# BRDC-PROG-005 — Rakennusten tasot aikakauden katon alla

| | |
|---|---|
| **Alue** | `packages/core/src/rules/works/` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | PROG-004, PROG-002 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (LAW II, "Slots grow with level")` |
| **Status** | `todo` |

## 🔴 RED

`rules/works`-puut ovat olemassa, mutta niiden taso ei riipu muusta kuin resursseista. LAW II: aikakaudessa N jokainen rakennus voi oppia tierit I–N.

## 🟢 GREEN

- [ ] Puun tier ≤ nykyinen Age; lukittu node kertoo mikä aikakausi avaa
- [ ] Taso = opittujen nodejen määrä → `slots` (PROG-002)
- [ ] Watchtower saa puun (Lookouts, sight + 40 strength ring 1, löytää vihjeitä)
- [ ] Vitest
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + works.spec.

## Ei tässä

Masterworkit.
