# BRDC-PROG-007 — Kolme koulua: Ward, Tide, Whisper

| | |
|---|---|
| **Alue** | `packages/core/src/rules/spell.ts, mana.ts, temple/spell panels` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | L |
| **Riippuvuudet** | PROG-004 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (P4, "What the Temples Teach")` |
| **Status** | `in-progress` — säännöt + store valmiit, P4-ruutu kesken (2026-09-29) |

## 🔴 RED

Temppeleillä on kuusi koulua (earth/air/fire/water/spirit/nature) ja litteä loitsulista. Dokumentti: kolme koulua, viisi tieriä (III ja V valinta), loitsu syvenee rankeilla I–III manalla, rank ≤ min(Age,3).

**Päätös Infiniteltä (2026-09-29):** faktiot parkissa → "faction-wide"-efektit koskevat omaa valtakuntaa.

## 🟢 GREEN

- [x] (erillisenä `rules/rites.ts` `RITES`, 21 riittiä; Season 1 pitää vanhat loitsut v0.7.0:aan) Uusi `SPELLS` dokumentin 21 loitsulla, `Spell {school,tier,ranks[3],mana,cooldownH}`
- [~] Koulun omistautuminen: `dedicate` — Kindling avaa 1 koulun, Ley Reading toisen. **Yksinkertaistettu:** omistautuminen on valtakunnan, ei yksittäisen temppelin (temppelit ovat paikkoja, eivät miehitettäviä rakennuksia). Alkuperäinen: Temppeli omistautuu koululle ensimmäisellä miehityksellä (Kindling)
- [x] Rank-syvennys (≤ min(Age,3)), tier-katto (I Kindling, II Ley Reading, sitten Age), III/V valinta sulkee parin, cooldown 24 h. **Oletushinnat** (dokumentissa ei): oppiminen 2 × castin mana, syventäminen castin mana × uusi rank. Efektit kytketty: Salt Circle, Unbroken Ring (vahvuus), Call the Shoal, High Water (ruoka-boon Keep-tietueessa), Drowned Harvest (aitta); loput 16 odottavat järjestelmäänsä (portit, vihjeet, sanity, Reckoning…) ja kertovat sen `waits`-kentässä. Alkuperäinen: Rank-syvennys, Age-katto, cooldown
- [ ] P4-ruutu
- [~] Vanhat koulut pois: Season 2 käyttää vain `RITES`iä; `spell.ts` poistetaan v0.7.0:ssa
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest jokaiselle efektille + spell.spec.

## Ei tässä

Faktiot; Lamp Under the Lake -bossivahinko kytketään DOOM-004:ssä.
