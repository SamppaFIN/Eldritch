# BRDC-LEDGER-001 — Yhteinen kokoelmalista (Ledger)

| | |
|---|---|
| **Alue** | `features/lands/` → `CollectionList` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | LANDS-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-20 |
| **Status** | `done` — 2026-10-05 |

## 🔴 RED

Ainoa lista on Your lands; muut kokoelmat (työt, temppelit, anomaliat, rauniot) eivät ole listana missään. Handoffin olemassa olevat Events/Ruins-välilehdet eivät ole olemassa.

## 🟢 GREEN

- [x] `CollectionList`: rivit, suodatinsirut lukumäärineen, lajittelu, tap → `onShowCell` (sama kuin ennen: lentää ja avaa kortin) — `ledger.spec.ts`
- [x] Your lands siirretään ensin sen päälle (ei rinnakkaista listaa) — `HexesTab.tsx`; `lands.spec.ts` vihreä paitsi :113, joka kaatuu samoin HEADissä (ensimmäinen paljastettava heksa on nyt ihme, jonka hetki peittää paneelin)
- [x] Yksi Ledger-arkki välilehdillä: Hexes · Works · Temples · Anomalies; 360 px:ssä välilehdet ja sirut pyyhkäistään sivuttain
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 223 tiedostoa / 1963 testiä, tsc, rivit OK, build OK

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Uusia tietolähteitä.
