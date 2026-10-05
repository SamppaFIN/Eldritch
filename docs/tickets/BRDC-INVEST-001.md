# BRDC-INVEST-001 — Tutkija valitaan: muotokuva, tarina, arvot, kyky

| | |
|---|---|
| **Alue** | `content/investigators.json`, `rules/investigator.ts`, `features/keep/` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | L |
| **Riippuvuudet** | DOOM-002 |
| **Lähde** | Infiniten handoff 2026-10-05, F-40, F-41 |
| **Status** | `todo` |

## 🔴 RED

Tutkija on kaikilla sama (lore 3, will 2, fight 2, observe 2). Taitokoe on jo olemassa (`rollTest`, noppapooli) — sitä käytetään, ei toista moottoria (Infinite 2026-10-05).

## 🟢 GREEN

- [ ] 4 arkkityyppiä (Kirjastonhoitaja, Maanmittari, Satamatyöläinen, Meedio), omat nimet, ei Arkham Horrorin hahmoja
- [ ] Näytössä Will / Lore / Vigor (= fight) / Wit (= observe), Health (= stamina), Sanity
- [ ] Kyvyt core-sääntöinä testeineen: wisdom +20 % (YIELD-001-osuus), vartiotornin näkö +1, työt −10 %, anomaliat rengas kauempaa
- [ ] Olemassa oleva valtakunta valitsee kerran; valittu arvo nostetaan 4:ään, ei koskaan lasketa; lukittu valtakunnaksi (D2)
- [ ] `resolveCheck(inv, check, rng)` = nimetty kääre `rollTest`ille
- [ ] Sanity 0 = nykyinen 12 h kotona (D3)
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Uusi noppamekaniikka.
