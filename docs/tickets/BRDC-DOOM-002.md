# BRDC-DOOM-002 — Portit, vihjeet ja tutkija

| | |
|---|---|
| **Alue** | `packages/core/src/rules/gate.ts, investigator.ts, dice.ts; encounter UI` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | L |
| **Riippuvuudet** | DOOM-001, PROG-008 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (P5, Gates, Clues, "You, the Investigator")` |
| **Status** | `todo` |

## 🔴 RED

Kohtaamisissa (`encounter.ts`) ei ole noppia eikä hintaa. Dokumentti: portti nimetyssä solussa syö vahvuutta ja sanityä 3 ringissä; suljetaan Lore-testillä (2 onnistumista) tai 5 vihjeellä. Tutkijalla stamina, sanity ja neljä taitoa 1–5.

## 🟢 GREEN

- [ ] `rollTest(dice, need, blessed|cursed)`: 5–6 onnistuu, blessed 4, cursed 6; seedattu RNG testeille
- [ ] Vihjeet: katto 8, 1 = uusintaheitto, 5 = sinetöinti (Elder Signs → 3)
- [ ] Stamina/sanity 0 → kotiin, puolet vihjeistä, 12 h toipuminen
- [ ] Portti + Horror kartalla (sprite), sinetöinti laskee Doomia
- [ ] P5-ruutu
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + e2e: portti suljettu.

## Ei tässä

Maastopakat (DOOM-003).
