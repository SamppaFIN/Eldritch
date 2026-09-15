# BRDC-BUILD-014 — Retire the pre-Worldseed building catalogue

| | |
|---|---|
| **Alue** | `packages/core/src/data/schema.ts` (schema 4 → 5), `apps/game/src/features/hud/notices.ts` |
| **Vaihe** | 3 — Sivilisaatio |
| **Effort** | S |
| **Status** | `done` — ajettu ja todennettu 2026-09-16 |
| **Riippuvuudet** | — |
| **Lähde** | Infinite 2026-09-16: *"poistetaan kartalta ja pelaajilta vanhat rakennukset, jätä temppelit"* — päätetty Fortress mukaan lukien (AskUserQuestion, sama päivä) |

## 🔴 RED

Worldseed-integraatio (`BRDC-BUILD-013`, `BRDC-RES-001`, `BRDC-TERRAIN-005`) tuo oman
rakennuskatalogin. Infinite pyysi puhtaan pöydän: kaikki 14 nykyistä `BuildingId`-Workia
(granary, monument, storehouse, market, sawmill, lumbermill, mine, quarry, farm, fishery,
vineyard, library, temple-grove, lighthouse, **fortress mukaan lukien**) pois kartalta ja
pelaajien tallennuksista. Temple (`templeStore.ts`) ei ole `BuildingId` lainkaan — se on oma
paikkansa, eikä sitä siis ollut koskaan tarkoitus koskettaa.

## 🟢 GREEN

- [x] `SCHEMA_VERSION` 4 → 5. Migraatioaskel `4` tyhjentää jokaisen tallennetun solun
      `buildings`-kentän ja siihen liittyvän `breachedOn`-piiritysmerkin (merkityksetön ilman
      Linnoitusta) — kaikki muu solun tila (omistaja, maasto, vahvuus, historia) koskematta
- [x] Käytetään olemassa olevaa `K.razed`-putkea: puretut Workit kirjataan sinne ja
      `razedStore.takeRazed` maksaa täyden hinnan takaisin pussiin seuraavalla avauksella,
      sama mekanismi kuin schema 3 → 4:ssä
- [x] Ketjutus todennettu: kauppa kahdesta versiosta jäljessä oleva tallennus (3 → 5) yhdistää
      molempien askelten puretut Workit samaan listaan menettämättä yhtäkään
- [x] `razedLine`in teksti yleistetty syyriippumattomaksi ("The building system changed…"),
      koska sama ilmoitus palvelee nyt kahta eri migraatiosyytä
- [x] Testit: `schema.test.ts` — Fortress ja `breachedOn` purkautuvat yhdessä, tyhjä maa ja
      Temple-paikka koskematta, ketjutus 3→5, ei-mitään-purettavaa-tapaus. 19/19 vihreää
- [x] Portti: `pnpm test` (1128 + 325 vihreää), `pnpm typecheck`, `pnpm lint:lines`,
      `MSYS_NO_PATHCONV=1 VITE_BASE_PATH=/ pnpm build` — kaikki vihreät
- [x] Versio 0.6.26, changelog kirjoitettu pelaajan sanoin

## Ei tässä

- Uuden katalogin rakentaminen (Forge, Watchtower, Worldseedin muut) — `BRDC-BUILD-013`
