# BRDC-PROG-007 — Kolme koulua: Ward, Tide, Whisper

| | |
|---|---|
| **Alue** | `packages/core/src/rules/spell.ts, mana.ts, temple/spell panels` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | L |
| **Riippuvuudet** | PROG-004 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (P4, "What the Temples Teach")` |
| **Status** | `todo` |

## 🔴 RED

Temppeleillä on kuusi koulua (earth/air/fire/water/spirit/nature) ja litteä loitsulista. Dokumentti: kolme koulua, viisi tieriä (III ja V valinta), loitsu syvenee rankeilla I–III manalla, rank ≤ min(Age,3).

**Päätös Infiniteltä (2026-09-29):** faktiot parkissa → "faction-wide"-efektit koskevat omaa valtakuntaa.

## 🟢 GREEN

- [ ] Uusi `SPELLS` dokumentin 21 loitsulla, `Spell {school,tier,ranks[3],mana,cooldownH}`
- [ ] Temppeli omistautuu koululle ensimmäisellä miehityksellä (Kindling)
- [ ] Rank-syvennys, Age-katto, cooldown
- [ ] P4-ruutu
- [ ] Vanhat koulut pois (kausi nollaa)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest jokaiselle efektille + spell.spec.

## Ei tässä

Faktiot; Lamp Under the Lake -bossivahinko kytketään DOOM-004:ssä.
