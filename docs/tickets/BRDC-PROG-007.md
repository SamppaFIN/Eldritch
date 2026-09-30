# BRDC-PROG-007 — Kolme koulua: Ward, Tide, Whisper

| | |
|---|---|
| **Alue** | `packages/core/src/rules/spell.ts, mana.ts, temple/spell panels` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | L |
| **Riippuvuudet** | PROG-004 |
| **Lähde** | `Eldritch-pelin uusi design systeemi/Eldritch-Progression.pdf (P4, "What the Temples Teach")` |
| **Status** | `done` — 2026-09-29; vanhan `spell.ts`in poisto v0.7.0:ssa, 16 riittiä odottaa järjestelmäänsä |

## 🔴 RED

Temppeleillä on kuusi koulua (earth/air/fire/water/spirit/nature) ja litteä loitsulista. Dokumentti: kolme koulua, viisi tieriä (III ja V valinta), loitsu syvenee rankeilla I–III manalla, rank ≤ min(Age,3).

**Päätös Infiniteltä (2026-09-29):** faktiot parkissa → "faction-wide"-efektit koskevat omaa valtakuntaa.

## 🟢 GREEN

- [x] (erillisenä `rules/rites.ts` `RITES`, 21 riittiä; Season 1 pitää vanhat loitsut v0.7.0:aan) Uusi `SPELLS` dokumentin 21 loitsulla, `Spell {school,tier,ranks[3],mana,cooldownH}`
- [~] Koulun omistautuminen: `dedicate` — Kindling avaa 1 koulun, Ley Reading toisen. **Yksinkertaistettu:** omistautuminen on valtakunnan, ei yksittäisen temppelin (temppelit ovat paikkoja, eivät miehitettäviä rakennuksia). Alkuperäinen: Temppeli omistautuu koululle ensimmäisellä miehityksellä (Kindling)
- [x] Rank-syvennys (≤ min(Age,3)), tier-katto (I Kindling, II Ley Reading, sitten Age), III/V valinta sulkee parin, cooldown 24 h. **Oletushinnat** (dokumentissa ei): oppiminen 2 × castin mana, syventäminen castin mana × uusi rank. Efektit kytketty: Salt Circle, Unbroken Ring (vahvuus), Call the Shoal, High Water (ruoka-boon Keep-tietueessa), Drowned Harvest (aitta). **2026-09-30 (v0.7.6, Infinite: "not yet in the game" pois):** kaikki 21 kytketty, `waits` poistettu. Suoraan: Watcher's Calm (calm), Lamp (Reckoning lukee), Hollow Clue, Elder Sign (sinetöi lähimmän portin + vihjeet), Borrowed Voice (+noppia 12 h), Dream-Sight (paljastus heksasta). Kilpailijoihin tai näkymättömiin järjestelmiin osuneet saivat nimensä pitäen paikallisen efektin: Birch Ward (heksa + rengas vahvuutta), Stone Sleep (vahvuuden lattia), Brackish Blessing (manaa kävellyistä soluista), Undertow (+% kukkaroon), Tide Remembers (tutkija lepää + vihjeet), Second Lake (+% miehitetty tuotto 12 h), Madness Seed (testit siunattuja), Unseen Hand (vapaita reunaheksoja kävelemättä), Name Between Names (sinetöi v porttia), Mirror Keep (ei uusia portteja v h). Testit: `rites.repo.test.ts`, `gate.repo.test.ts`. Alkuperäinen: Rank-syvennys, Age-katto, cooldown
- [x] P4-ruutu: Keep-paneelin "Temple schools" (`RiteSchools.tsx`: omistautuminen, opi, syvennä, valtakuntaan kohdistuvat castit) + solukortin `CellRites.tsx` (Salt Circle, Call the Shoal kohdeheksalle); e2e `keep-citizens.spec.ts` 10/10. Kuvavertailu PDF:ään tekemättä. Alkuperäinen: P4-ruutu
- [~] Vanhat koulut pois: Season 2 käyttää vain `RITES`iä; `spell.ts` poistetaan v0.7.0:ssa
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build (1858)

## Todennus

Vitest jokaiselle efektille + spell.spec.

## Ei tässä

Faktiot; Lamp Under the Lake -bossivahinko kytketään DOOM-004:ssä.
