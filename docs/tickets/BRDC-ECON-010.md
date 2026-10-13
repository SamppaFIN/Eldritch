# BRDC-ECON-010 — Pussin kirjoitukset laskettava lukon sisällä

| | |
|---|---|
| **Alue** | `packages/core/src/data/pouch.ts` (`writePouch`, `grantBonus`) ja sen 23 kutsujaa |
| **Vaihe** | Tekninen velka (lokakuu 2026) |
| **Effort** | M |
| **Riippuvuudet** | — |
| **Lähde** | keep-citizens:138:n juurisyy 2026-10-13 (v0.11.4): Keepin kirjoitukset kirjoittivat vanhan kopion takaisin |
| **Status** | `done` |

## 🔴 RED

`commit` (BRDC-ECON-006) sarjallistaa pussin kirjoitukset, mutta `writePouch(store, pool, now)`
kirjoittaa poolin, joka on laskettu **ennen** lukkoa: kutsuja settlee, vähentää hinnan tai
lisää palkinnon ja kirjoittaa tuloksen. Jos kaksi tällaista osuu päällekkäin (esim. palkinto
ja ostos samalla hetkellä), jälkimmäinen kirjoittaa ensimmäisen muutoksen yli — resursseja
katoaa tai syntyy tyhjästä.

Keepin kirjoitukset (`citizenStore`) kärsivät samasta ja korjattiin v0.11.4:ssä
(`changeKeep`): sama kansalainen lähti kahteen paikkaan, ja tithe palautti lähetetyn kotiin.

## 🟢 GREEN

- [~] `writePouch(store, before, after, now)` kirjoittaa **muutoksen** (`after − before`) tuoreeseen
      pooliin lukon sisällä, ei koskaan alle nollan — kaikki 22 kutsujaa päivitetty, perustamislahja
      tarkistaa tyhjän pussin lukon sisällä. Hinnan tarkistus tapahtuu yhä ennen lukkoa: kaksi
      samanaikaista ostoa voi viedä resurssin nollaan (ei miinukselle). Täysi tarkistus lukon
      sisällä vaatisi jokaisen säännön ajamisen siellä — ei tehty
- [x] Testi: kaksi päällekkäistä kirjoitusta (palkinto + Ward) — molemmat näkyvät lopussa
      (`pouchRace.repo.test.ts`; todennettu punaiseksi vanhalla `writePouch`illa: kulta 0, ei 30)
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` (`pouch.ts` jaettu: `pouchSpend.ts`)

## Ei tässä

Pussin rakenteen muutokset.
