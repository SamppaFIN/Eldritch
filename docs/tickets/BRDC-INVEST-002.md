# BRDC-INVEST-002 — Tutkijan oma tarina ja heikkous

| | |
|---|---|
| **Alue** | `rules/taskContent.ts`-malli, `investigators.json` |
| **Vaihe** | 3 — Season 3: 4X + Arkham (haara `season-3`, julkaistaan kauden 3 avautuessa) |
| **Effort** | M |
| **Riippuvuudet** | INVEST-001, QUEST-009, CONDITION-001 |
| **Lähde** | Ideointi 2026-10-06 (4X- ja Arkham Horror -tutkimus), ehdotus B2; Infinite hyväksyi kaikki |
| **Status** | `todo` |

## 🔴 RED

Arkkityypeillä on tausta mutta ei tarinaa. Arkham LCG:n henkilökohtainen tehtävä ja heikkous tekevät tutkijasta hahmon.

## 🟢 GREEN

- [ ] Jokaisella arkkityypillä 3-vaiheinen henkilökohtainen tehtävä (QUEST-009-moottorilla), esim. Agnesin kadonnut sivu, Tobiaksen leveä järvi
- [ ] Jokaisella yksi heikkous, joka nousee kun sanity putoaa alle 3 (oletus) — CONDITION-001:n tila
- [ ] Tehtävän loppu antaa arkkityypille toisen kyvyn (pieni) ja Hall of Fame -merkinnän
- [ ] Sisältö Fuming Laken äänellä; ei Arkham Horrorin hahmoja
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest jokaiselle sääntöfunktiolle; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Tallennusmuutokset lisääviä (uusi avain tai valinnainen kenttä); Season 2 -tallennus aukeaa.

## Ei tässä

Useamman tutkijan joukkue.
