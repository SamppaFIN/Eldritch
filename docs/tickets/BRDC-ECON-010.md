# BRDC-ECON-010 — Pussin kirjoitukset laskettava lukon sisällä

| | |
|---|---|
| **Alue** | `packages/core/src/data/pouch.ts` (`writePouch`, `grantBonus`) ja sen 23 kutsujaa |
| **Vaihe** | Tekninen velka (lokakuu 2026) |
| **Effort** | M |
| **Riippuvuudet** | — |
| **Lähde** | keep-citizens:138:n juurisyy 2026-10-13 (v0.11.4): Keepin kirjoitukset kirjoittivat vanhan kopion takaisin |
| **Status** | `todo` |

## 🔴 RED

`commit` (BRDC-ECON-006) sarjallistaa pussin kirjoitukset, mutta `writePouch(store, pool, now)`
kirjoittaa poolin, joka on laskettu **ennen** lukkoa: kutsuja settlee, vähentää hinnan tai
lisää palkinnon ja kirjoittaa tuloksen. Jos kaksi tällaista osuu päällekkäin (esim. palkinto
ja ostos samalla hetkellä), jälkimmäinen kirjoittaa ensimmäisen muutoksen yli — resursseja
katoaa tai syntyy tyhjästä.

Keepin kirjoitukset (`citizenStore`) kärsivät samasta ja korjattiin v0.11.4:ssä
(`changeKeep`): sama kansalainen lähti kahteen paikkaan, ja tithe palautti lähetetyn kotiin.

## 🟢 GREEN

- [ ] `writePouch` korvataan muutoksella tuoreeseen tilaan (`commit(store, now, (cur) => …)`)
      kaikissa 23 kutsujassa; hinta tarkistetaan lukon sisällä tuoretta poolia vasten
- [ ] Testi: kaksi päällekkäistä kirjoitusta (palkinto + ostos) — molemmat näkyvät lopussa
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines`

## Ei tässä

Pussin rakenteen muutokset.
