# BRDC-LEDGER-001 — Yhteinen kokoelmalista (Ledger)

| | |
|---|---|
| **Alue** | `features/lands/` → `CollectionList` |
| **Vaihe** | 2.8 — Ominaisuuskierros lokakuu 2026 (v0.9.0, kautta katkaisematta) |
| **Effort** | M |
| **Riippuvuudet** | LANDS-001 |
| **Lähde** | Infiniten handoff 2026-10-05, F-20 |
| **Status** | `todo` |

## 🔴 RED

Ainoa lista on Your lands; muut kokoelmat (työt, temppelit, anomaliat, rauniot) eivät ole listana missään. Handoffin olemassa olevat Events/Ruins-välilehdet eivät ole olemassa.

## 🟢 GREEN

- [ ] `CollectionList`: rivit, suodatinsirut, lajittelu, tap → `MapHandle.focusCell` + kortti
- [ ] Your lands siirretään ensin sen päälle (ei rinnakkaista listaa)
- [ ] Yksi Ledger-arkki välilehdillä
- [ ] `pnpm test && pnpm typecheck && pnpm lint:lines` + build

## Todennus

Vitest säännöille; oma e2e-spec käyttäjän polulle; 360 px kuvakaappaus. Vanha tallennus (v0.8.1) aukeaa muuttumattomana — ei `SAVE_VERSION`-nostoa.

## Ei tässä

Uusia tietolähteitä.
