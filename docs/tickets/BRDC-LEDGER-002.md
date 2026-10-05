# BRDC-LEDGER-002 — Työt-välilehti ja miehitys listalta

| | |
|---|---|
| **Alue** | `features/lands/WorksTab.tsx` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | LEDGER-001, YIELD-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-21 |
| **Status** | `todo` |

## 🔴 RED

Omia rakennuksia ei näe yhdeltä sivulta; miehitys onnistuu vain heksa kerrallaan.

## 🟢 GREEN

- [ ] Tyyppi, heksa, tuotto, työntekijät / paikat; ryhmittely tyypin mukaan, lajittelu tuotto / etäisyys
- [ ] `+ / −` samalla `repository.keep.staff`-kutsulla kuin kortilla; vapaat asukkaat otsikossa
- [ ] Muutos päivittää MAP-008:n ja MAP-009:n heti
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

—
