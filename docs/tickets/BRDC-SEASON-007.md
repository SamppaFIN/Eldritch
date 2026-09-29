# BRDC-SEASON-007 — Uusi kausi: maa vapautuu, Fortressit raunioiksi

| | |
|---|---|
| **Alue** | `packages/core/src/rules/ruins.ts, apps/worker (season reset), map layers` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-004, SEASON-002 |
| **Lähde** | Infinite 2026-09-29 (chat); `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf` |
| **Status** | `done` — 2026-09-29; raunioiden karttasprite [~] |

## 🔴 RED

Infinite 2026-09-29: *"uudelle kaudelle kaikki maaomistus katoaa ja olemassa olevista
fortresseista tulee ruinsejja, mistä voi löytää kivoja yllätyksiä civilisationin tapaan. Ja
kaikki vanha maa on taas otettavissa haltuun."*

Tänään kauden vaihtoa ei ole: maa pysyy omistajallaan ikuisesti (tai kunnes rappio vie
sen). Uuden kauden pitää alkaa tyhjältä kartalta, jolle edellinen kausi jättää jälkiä:
jokainen Season 1:n Fortress on Season 2:ssa raunio, kuten Civilizationin goody hut.

**Tarkistettava ensin:** kulkeeko Fortress `world.json`in / `player:*`-tiedoston mukana
Workeriin? Jos ei, raunioiden lähde on arkistointihetken (SEASON-004) tilannekuva, johon
Fortress-solut lisätään.

## 🟢 GREEN

- [x] (`rules/seasonSalt.ts`: tyhjä suola = Season 1 ennallaan, testattu; Season n ≥ 2 → `bountyOn`, `revealOf` (anomaliapaikat), `anomalyAt`/`anomalySignOf` siirtyvät; portit ja huhut ottavat siemenen suoraan; maasto pysyy) Kauden siemen (`Season.seed`, SEASON-002) syöttää esiintymät, anomaliat ja porttipaikat (`terrainSeed`, `anomalySignOf`, …); ihmeet eivät (SEASON-008)
- [x] (retire → `resetForSeason`; Worker `POST /season/archive` `wipe:true`) Kauden vaihdossa kaikki `cells` nollautuvat (paikallinen tallennus `seasonal`-avaimina SEASON-002:n mukaan, Workerin `player:*` SEASON-004:ssä); kaikki maa on vallattavissa
- [x] (`GET /season/ruins`, kirjoitetaan arkistoinnissa SEASON-004) Workerin `GET /ruins` (tai `world.json`in kenttä): Season 1:n Fortress-solut, pysyvä kausikohtainen lista
- [x] (`ruinFindAt`, 8 löytöä: resurssit, vihjeet, XP, wisdom-kronikka; ei tokenia) `rules/ruins.ts`: `ruinRewardAt(h3, seasonSeed)` — seedattu, deterministinen: resursseja, tokeni, XP, harvinainen vihje tai lore-rivi (Civ goody hut). Kerran per pelaaja per raunio
- [~] Rauniot heksakortilla (`CellRuin.tsx`: "Ruins of a Fortress", Search kerran, jalan) ✓. **Karttasprite ei vielä:** MapView on 399/400 — vaatii jaon ensin. Alkuperäinen: Rauniot piirtyvät kartalle omana spritenään (ART-006-tapa: sortunut torni, ei hehkua) ja avautuvat kävelemällä päälle
- [x] Vitest (`ruin.repo.test.ts` 3) + e2e raunio etsitään kerran
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build (1912)

## Todennus

Vitest + e2e + `wrangler dev`: kauden vaihto tyhjentää maan ja Fortressit näkyvät raunioina.

## Ei tässä

Rauniot rivaalin kaudelta, jolla ei ollut Fortressia; raunioiden uudelleenrakentaminen.
