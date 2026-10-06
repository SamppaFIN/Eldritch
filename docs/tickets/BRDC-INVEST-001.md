# BRDC-INVEST-001 — Tutkija valitaan: muotokuva, tarina, arvot, kyky

| | |
|---|---|
| **Alue** | `content/investigators.json`, `rules/investigator.ts`, `features/keep/` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | L |
| **Riippuvuudet** | DOOM-002 |
| **Lähde** | Infiniten handoff 2026-10-05, F-40, F-41 |
| **Status** | `done` — 2026-10-06 |

## 🔴 RED

Tutkija on kaikilla sama (lore 3, will 2, fight 2, observe 2). Taitokoe on jo olemassa (`rollTest`, noppapooli) — sitä käytetään, ei toista moottoria (Infinite 2026-10-05).

## 🟢 GREEN

- [x] 4 arkkityyppiä (Kirjastonhoitaja, Maanmittari, Satamatyöläinen, Meedio), omat nimet, ei Arkham Horrorin hahmoja — Agnes Lowe, Tobias Wren, Mara Quill, Elias Dunmore; `rules/investigators.json` (core pitää JSONin koodin vieressä, kuten `adventures.json`), viivapiirretyt muotokuvat `InvestigatorPortrait.tsx`
- [x] Näytössä Will / Lore / Vigor (= fight) / Wit (= observe), Health (= stamina), Sanity — `SKILL_NAME`; "Stamina" → "Health" kaikissa kolmessa kohdassa (Keep, portti, huhu)
- [x] Kyvyt core-sääntöinä testeineen: wisdom +20 % (YIELD-001-osuus, kortilla oma "Librarian"-rivi, summa = settle), vartiotornin näkö +1, työt −10 % (sama hinta listassa, tarkistuksessa ja maksussa), anomaliat rengas kauempaa (oma karttakerros + kortti, tutkiminen vasta kun heksa on oma) — `archetype.test.ts`, `hexYield.test.ts`, `investigator.repo.test.ts`. `canBuild` siirtyi omaan tiedostoonsa `build.ts`:n 400 rivin rajalla
- [x] Olemassa oleva valtakunta valitsee kerran; valittu arvo nostetaan 4:ään, ei koskaan lasketa; lukittu valtakunnaksi (D2) — Keepissä, valinta + nimetty "Begin as …" -nappi; `e2e/investigator.spec.ts` (säilyy reloadin yli). Season 1 -tallennuksella ei tutkijaa, ei valintaa
- [x] `resolveCheck(inv, check, rng)` = nimetty kääre `rollTest`ille — testi: sama tulos kuin `rollTest` samalla siemenellä
- [x] Sanity 0 = nykyinen 12 h kotona (D3) — ennallaan, `afterTest`; `investigator.test.ts` rivit 53–55
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 1986 testiä, tsc, rivit OK, build OK; `keep-citizens.spec.ts` 16/16 yhdellä workerilla

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Uusi noppamekaniikka.
