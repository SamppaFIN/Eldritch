# BRDC-LEDGER-002 — Työt-välilehti ja miehitys listalta

| | |
|---|---|
| **Alue** | `features/lands/WorksTab.tsx` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | LEDGER-001, YIELD-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-21 |
| **Status** | `done` — 2026-10-05 |

## 🔴 RED

Omia rakennuksia ei näe yhdeltä sivulta; miehitys onnistuu vain heksa kerrallaan.

## 🟢 GREEN

- [x] Tyyppi, heksa, tuotto, työntekijät / paikat; ryhmittely tyypin mukaan, lajittelu tuotto / etäisyys — etäisyys mitataan Hearthista renkaina (paneeli ei tiedä missä seisot)
- [x] `+ / −` samalla `repository.keep.staff`-kutsulla kuin kortilla; vapaat asukkaat otsikossa — `ledger.spec.ts` "a hand sent from the Works tab"
- [x] Muutos päivittää MAP-008:n ja MAP-009:n heti (`onChanged` → kartan uudelleenluku) — sama spec näkee `hex-citizens`-piirteen
- [x] `pnpm test && pnpm typecheck && pnpm lint:lines` + build — 223 tiedostoa / 1963 testiä, tsc, rivit OK, build OK

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

—
