# BRDC-DOOM-002 — Portit, vihjeet ja tutkija

| | |
|---|---|
| **Alue** | `packages/core/src/rules/gate.ts, investigator.ts, dice.ts; encounter UI` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | L |
| **Riippuvuudet** | DOOM-001, PROG-008 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (P5, Gates, Clues, "You, the Investigator")` |
| **Status** | `done` — 2026-09-29; kartan portti-sprite ja jatkuva synkka [~] |

## 🔴 RED

Kohtaamisissa (`encounter.ts`) ei ole noppia eikä hintaa. Dokumentti: portti nimetyssä solussa syö vahvuutta ja sanityä 3 ringissä; suljetaan Lore-testillä (2 onnistumista) tai 5 vihjeellä. Tutkijalla stamina, sanity ja neljä taitoa 1–5.

## 🟢 GREEN

- [x] (`rules/investigator.ts`: nopat = 2 + taito, 5–6 onnistuu, blessed 4, cursed 6; seedattu rng testeissä) `rollTest(dice, need, blessed|cursed)`: 5–6 onnistuu, blessed 4, cursed 6; seedattu RNG testeille
- [x] Vihjeet: katto 8, 1 = uusintaheitto (`reroll`), 5 = sinetöinti (Elder Signs → 3, `sealClues`). Alkuperäinen: Vihjeet: katto 8, 1 = uusintaheitto, 5 = sinetöinti (Elder Signs → 3)
- [x] Stamina/sanity 0 → kotiin, puolet vihjeistä, 12 h (`afterTest`, `recover`); lepo palauttaa 1+1 / 2 h (**oletus**, dokumentissa ei). Testi maksaa 1 staminan, epäonnistuminen portilla −2 sanity. Alkuperäinen: Stamina/sanity 0 → kotiin, puolet vihjeistä, 12 h toipuminen
- [~] Portit (`rules/gate.ts`, `data/gateStore.ts`): aamunkoitossa 35 % todennäköisyys portille 1–3 renkaan päähän rajasta (hash: siemen, aamu, valtakunta); Horror syö viereisten omien solujen vahvuutta 20/vrk; `gatesNear` → sanity (PROG-008); sinetöinti −1 Doom, 48 h auki +1 Doom — molemmat Workerin `POST /season/doom`iin kerran per portti+suunta (outbox). **Ei vielä:** portti-sprite kartalla (MapView 397/400 — vaatii oman jaon) ja synkka kävelyn aikana (nyt Keepin avauksessa). Alkuperäinen: Portti + Horror kartalla (sprite), sinetöinti laskee Doomia
- [x] P5-ruutu: `CellGate.tsx` heksakortilla (stamina/sanity/vihjeet, Lore-testi, nopat 44 px -napit uusintaheittoon, Accept/Seal, sinetöinti vihjeillä) + Keepin "Open gates" -lista (`KeepGates.tsx`, lähin ensin, tunnit Doomiin); e2e Open gates. Alkuperäinen: P5-ruutu
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build (1886); `GameRepository.ts` jaettu: Season 2 -ovet `SeasonTwoApis.ts`iin

## Todennus

Vitest + e2e: portti suljettu.

## Ei tässä

Maastopakat (DOOM-003).
