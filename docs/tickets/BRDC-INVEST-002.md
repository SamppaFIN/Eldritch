# BRDC-INVEST-002 — Tutkijan oma tarina ja heikkous

| | |
|---|---|
| **Alue** | `rules/taskContent.ts`-malli, `investigators.json` |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | INVEST-001, QUEST-009, CONDITION-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus B2; Infinite hyväksyi kaikki |
| **Status** | `done` — 2026-10-06 (haara `season-3`) |

## 🔴 RED

Arkkityypeillä on tausta mutta ei tarinaa. Arkham LCG:n henkilökohtainen tehtävä ja heikkous tekevät tutkijasta hahmon.

## 🟢 GREEN

- [x] Jokaisella arkkityypillä 3-vaiheinen tarina QUEST-009-moottorilla (`rules/personalTasks.ts`): Agnesin palannut sivu, Tobiaksen leveä järvi, Maran vastaava laatikko, Eliaksen pöytä. Vaiheet avautuvat järjestyksessä (`after`), vain omalle arkkityypille; Keepin tutkija-osiossa "Your tale" — `personal.repo.test.ts`, e2e `tale.spec.ts`
- [x] Heikkous (`investigators.json`): Librarian → Amnesia, Surveyor → Paranoia, Dockworker → Debt, Medium → Cursed; tulee kun sanity < 3 (`WEAKNESS_BELOW`), kerran kerrallaan (`settleConditions`)
- [x] Tarinan loppu (`finale`) nostaa arkkityypin taitoa +1 (max 5) ja Hall of Fame -merkintä saa "The Dockworker · The Long Way Home" (`tale`). "Toinen kyky" toteutettiin taidon nostona — pienin selkeä vaikutus
- [x] Sisältö Fuming Laken äänellä; ei Arkham Horrorin hahmoja
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 2043 testiä

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Useamman tutkijan joukkue.
