# BRDC-SEASON-007 — Uusi kausi: maa vapautuu, Fortressit raunioiksi

| | |
|---|---|
| **Alue** | `packages/core/src/rules/ruins.ts, apps/worker (season reset), map layers` |
| **Vaihe** | 2.7 — Season 2: Progression + Season Codex |
| **Effort** | M |
| **Riippuvuudet** | SEASON-004, SEASON-002 |
| **Lähde** | Infinite 2026-09-29 (chat); `Eldritch-pelin uusi design systeemi/Eldritch-season.pdf` |
| **Status** | `todo` |

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

- [ ] Kauden vaihdossa kaikki `cells` nollautuvat (paikallinen tallennus `seasonal`-avaimina SEASON-002:n mukaan, Workerin `player:*` SEASON-004:ssä); kaikki maa on vallattavissa
- [ ] Workerin `GET /ruins` (tai `world.json`in kenttä): Season 1:n Fortress-solut, pysyvä kausikohtainen lista
- [ ] `rules/ruins.ts`: `ruinRewardAt(h3, seasonSeed)` — seedattu, deterministinen: resursseja, tokeni, XP, harvinainen vihje tai lore-rivi (Civ goody hut). Kerran per pelaaja per raunio
- [ ] Rauniot piirtyvät kartalle omana spritenään (ART-006-tapa: sortunut torni, ei hehkua) ja avautuvat kävelemällä päälle
- [ ] Vitest palkinnoille (determinismi, kertakäyttö) + e2e: raunio avautuu kerran
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + `MSYS_NO_PATHCONV=1 pnpm build`

## Todennus

Vitest + e2e + `wrangler dev`: kauden vaihto tyhjentää maan ja Fortressit näkyvät raunioina.

## Ei tässä

Rauniot rivaalin kaudelta, jolla ei ollut Fortressia; raunioiden uudelleenrakentaminen.
