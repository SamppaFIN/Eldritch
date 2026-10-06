# BRDC-QUEST-009 — Tehtävät ja mysteerit: moottori ja sisältö

| | |
|---|---|
| **Alue** | `rules/tasks.ts`, `rules/deck.ts`, `features/quest/` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | L |
| **Riippuvuudet** | QUEST-008, INVEST-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-42 |
| **Status** | `done` — 2026-10-06 |

## 🔴 RED

Sisältöä on yksi seikkailu, 24 huhukorttia ja 4 tavernakorttia; tavoitteellista tehtävämoottoria ei ole.

## 🟢 GREEN

- [x] Tavoitemoottori tilasta luettuna: käy N heksalla, rakenna X, tutki anomalia, temppeli N päivänä, taitokoe — `rules/tasks.ts` + `tasks.test.ts`. Solu muistaa vain eilisen ja tämän päivän, joten temppelipäivät kerää tehtäväkirja synkatessaan (kartta kutsuu `tasks.sync` jokaisella alueen päivityksellä eli kävellessä)
- [x] +10 tehtävää tavernan tauluun, +10 mysteeriä huhukortteina — `taskContent.ts` (Season 1 -tallennus näkee 7: taitokokeet vaativat tutkijan), `deck.ts` 24 → 34. Uudet kortit siirtävät tämän kauden vielä kohtaamattomien huhuheksojen korttia; jo kohdatut ja kesken olevat pysyvät (kortti-id tallessa)
- [x] Haarautuvat lopputulokset (onnistui / epäonnistui / sanity-hinta) QUEST-008:n tietueeseen — `QuestOutcome` `K.tasks`-avaimessa; `task.repo.test.ts`, `e2e/task-board.spec.ts` (sinetöity ja himmennetty reloadin yli)
- [x] Lore backlogista / EXTRACTIONista (sääntö 6: moottori ensin) — Fuming Laken ääni ja henkilöt (Cornelius, Grug, -Management, kyltit), EXTRACTION B2:n Aurora, Hevy, Wandering Merchant, Shadow Lurker, Void Spawn, Chaos Beast, Grove of Eternity, Sanity Shrine
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 1998 testiä, tsc, rivit OK, build OK. `GameRepository`:n lokakuun ovet siirtyivät `OctoberApis.ts`:ään rivirajalla

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

—
